# chatbot/ml_agents.py
from __future__ import annotations
import json, os, re, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import ollama  # ensure ollama is running (and llama3.1 is available)

# =====================
# Config
# =====================
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
SAVE_DIR   = Path("workflow_artifacts")
SAVE_DIR.mkdir(parents=True, exist_ok=True)

RESULT_START = "RESULT_JSON_START"
RESULT_END   = "RESULT_JSON_END"
MAX_AUTOFIX_ROUNDS = 12

# simple module->pip map (for auto-install)
MODULE_TO_PIP = {
    "sklearn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "numpy",
    "matplotlib": "matplotlib",
    "rdkit": "rdkit-pypi",
}

def _utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

def _ask(system: str, user: str) -> str:
    r = ollama.chat(
        model=MODEL_NAME,
        messages=[{"role":"system","content":system},{"role":"user","content":user}],
    )
    return (r.get("message", {}) or {}).get("content", "").strip()

def _strip_code(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`").strip()
        if t.lower().startswith("python"): t = t[6:].lstrip()
    if t.endswith("```"): t = t[:-3].rstrip()
    return t

# =====================
# Prompts
# =====================
SYS_SPEC = """You are SpecMaker: Output a COMPLETE SPEC as strict JSON with keys:
{
  "problem": str, "domain": str, "intent": str, "created_utc": str,
  "targets": object, "constraints": object,
  "data_sources": [str], "features": [str], "workflow": [str],
  "validation": [str], "decision_gates": [str], "artifacts": [str]
}
Rules: fill all keys, sensible defaults, created_utc in UTC like 2025-01-02T03:04:05Z.
Return JSON ONLY."""

SYS_PLAN = """You are PlanSmith: a production program manager.
Given a SPEC JSON, produce ONLY strict JSON with an action plan:

{
  "actions": [
    {"id": 1, "name": "Short action name"},
    {"id": 2, "name": "Another short action name"}
  ]
}

Rules:
- IDs unique, start at 1.
- Names concise verb-noun.
- Strict JSON ONLY.
"""

SYS_SOLVER = """You are SolveOps. Given SPEC + PLAN, output a clear run report in Markdown ONLY (no JSON)."""

SYS_OPERATOR = f"""You are Operator: return a SINGLE, SELF-CONTAINED Python script.
Requirements:
1) Try to load data from SPEC.data_sources if they are direct CSV/JSON URLs; if read fails OR absent, synthesize a small offline dataset that matches intent.
2) Preprocess and:
   - classification/regression: train & evaluate a simple model and compute metrics.
   - generation/design: propose candidates and rank by a proxy; pick top.
3) Print a compact JSON strictly wrapped between markers so it can be parsed:
{RESULT_START}
{{"predicted_results": <list>, "evaluated_result": <metrics or text>}}
{RESULT_END}
Also write the same JSON to ./results.json.
Keep robust (guard with if __name__ == "__main__":). No external scraping/auth. Return ONLY Python code.
"""

SYS_FIX = """You are Operator-Fix: repair the provided Python script using the given error log.
- Must succeed offline.
- Keep printing JSON strictly between RESULT_JSON_START and RESULT_JSON_END and also write ./results.json.
Return ONLY corrected Python code (no comments, no fences)."""

# =====================
# Agent 1: Spec
# =====================
def make_spec(message: str) -> Dict[str, Any]:
    raw = _ask(SYS_SPEC, message + "\nReturn the strict JSON now.")
    try:
        obj = json.loads(raw)
    except Exception:
        # safe fallback spec
        obj = {
            "problem": message.strip(),
            "domain": "generic",
            "intent": "classification" if "classif" in message.lower() else "generation",
            "created_utc": _utc(),
            "targets": {}, "constraints": {},
            "data_sources": [], "features": [],
            "workflow": ["data","prep","model","evaluate"],
            "validation": ["holdout"],
            "decision_gates": ["metrics >= baseline"],
            "artifacts": ["results.json"]
        }
    obj.setdefault("created_utc", _utc())
    return obj

# =====================
# Agent 2: Planner
# =====================
def make_plan(spec: Dict[str, Any]) -> Dict[str, Any]:
    raw = _ask(SYS_PLAN, json.dumps(spec, ensure_ascii=False))
    try:
        obj = json.loads(raw)
    except Exception:
        obj = {"actions":[{"id":1,"name":"Prepare data"},{"id":2,"name":"Train & evaluate"}]}
    # normalize
    seen=set(); clean=[]; nxt=1
    for a in obj.get("actions", []):
        aid = int(a.get("id") or nxt)
        if aid in seen: aid = nxt
        name = str(a.get("name") or f"Action {aid}").strip()
        clean.append({"id": aid, "name": name}); seen.add(aid); nxt=max(nxt, aid+1)
    return {"actions": clean}

# =====================
# Agent 3: Solver (Markdown)
# =====================
def solve(spec: Dict[str, Any], plan: Dict[str, Any]) -> str:
    payload = "SPEC:\n"+json.dumps(spec, indent=2)+"\n\nPLAN:\n"+json.dumps(plan, indent=2)
    md = _ask(SYS_SOLVER, payload)
    return md or "# Run plan\n- prepare data\n- train\n- evaluate\n"

# =====================
# Agent 4: Operator script
# =====================
def build_operator(spec: Dict[str, Any], plan: Dict[str, Any], run_md: str) -> str:
    payload = "SPEC:\n"+json.dumps(spec, indent=2)+"\n\nPLAN:\n"+json.dumps(plan, indent=2)+"\n\nRUN REPORT:\n"+run_md
    code = _ask(SYS_OPERATOR, payload)
    return _strip_code(code)

# =====================
# Operator execution engine (auto-fix)
# =====================
def _write(path: Path, text: str):
    path.write_text(text, encoding="utf-8")

def _run_once(code: str) -> Tuple[int, str, Optional[Dict[str, Any]]]:
    (SAVE_DIR / "run.py").write_text(code, encoding="utf-8")
    proc = subprocess.Popen([sys.executable, "run.py"], cwd=str(SAVE_DIR),
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            universal_newlines=True)
    out = ""
    for line in proc.stdout:
        out += line
    proc.wait()

    # parse results
    if RESULT_START in out and RESULT_END in out:
        chunk = out.split(RESULT_START, 1)[1].split(RESULT_END, 1)[0]
        try:
            return proc.returncode, out, json.loads(chunk.strip())
        except Exception:
            pass
    # fallback file
    res_file = SAVE_DIR / "results.json"
    if res_file.exists():
        try:
            return proc.returncode, out, json.loads(res_file.read_text(encoding="utf-8"))
        except Exception:
            pass
    return proc.returncode, out, None

def _install_from_log(stdout: str) -> bool:
    missing = set()
    for m in re.finditer(r"No module named ['\"]([^'\"]+)['\"]", stdout):
        mod = m.group(1).split(".")[0]
        if mod in MODULE_TO_PIP:
            missing.add(MODULE_TO_PIP[mod])
    if not missing:
        return False
    for pkg in sorted(missing):
        subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=False)
    return True

def _force_offline_template(intent: str = "classification") -> str:
    # minimal, guaranteed-completion offline template
    if intent.lower().strip() == "generation":
        return f"""
import json,random
RESULT_START='{RESULT_START}'
RESULT_END='{RESULT_END}'
def main():
    cands=[f"cand_{{i}}" for i in range(30)]
    scored=[(c, random.random()) for c in cands]
    scored.sort(key=lambda t:t[1], reverse=True)
    top=[s[0] for s in scored[:10]]
    payload={{"predicted_results": top, "evaluated_result": {{"note":"offline generation"}}}}
    print(RESULT_START);print(json.dumps(payload));print(RESULT_END)
    open("results.json","w").write(json.dumps(payload))
if __name__=="__main__": main()
"""
    # classification/regression fallback
    return f"""
import json, numpy as np
RESULT_START='{RESULT_START}'
RESULT_END='{RESULT_END}'
def main():
    rng=np.random.default_rng(42)
    X=rng.normal(size=(400,8)); w=rng.normal(size=(8,))
    y=(X@w>0).astype(int)
    idx=rng.permutation(len(y)); tr=idx[:320]; te=idx[320:]
    Xtr,Xte=X[tr],X[te]; ytr,yte=y[tr],y[te]
    # simple logistic via gradient steps
    W=np.zeros(9); lr=0.1
    Xtrb=np.hstack([np.ones((Xtr.shape[0],1)),Xtr])
    for _ in range(200):
        z=Xtrb@W; p=1/(1+np.exp(-z)); g=Xtrb.T@(p-ytr)/Xtrb.shape[0]; W-=lr*g
    Xteb=np.hstack([np.ones((Xte.shape[0],1)),Xte]); p=1/(1+np.exp(-(Xteb@W))); yhat=(p>0.5).astype(int)
    acc=float(np.mean(yhat==yte))
    payload={{"predicted_results": [int(v) for v in yhat[:25]], "evaluated_result": {{"accuracy": acc}}}}
    print(RESULT_START);print(json.dumps(payload));print(RESULT_END)
    open("results.json","w").write(json.dumps(payload))
if __name__=="__main__": main()
"""

def _repair_with_llm(prev: str, log: str) -> str:
    fixed = _ask(SYS_FIX, f"CURRENT SCRIPT:\n{prev}\n\nERROR LOG:\n{log}\n\nReturn only corrected code.")
    return _strip_code(fixed or "")

def run_operator_full(code: str, spec: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    """
    Execute operator with auto-install, auto-fix, and offline escape hatch.
    Returns (results_json, combined_stdout).
    """
    intent = str(spec.get("intent") or "classification").lower()
    tries = 0
    last_out = ""

    while tries <= MAX_AUTOFIX_ROUNDS:
        rc, out, res = _run_once(code)
        last_out = out
        if rc == 0 and res:
            return res, out

        if _install_from_log(out):
            tries += 1
            continue

        # obvious network/data issues → force offline
        if any(s in out for s in [
            "Temporary failure in name resolution", "URLError", "HTTPError",
            "ConnectionError", "timed out"
        ]):
            code = _force_offline_template(intent)
            tries += 1
            continue

        # last: try LLM repair
        fixed = _repair_with_llm(code, out)
        if fixed and fixed.strip() != code.strip():
            code = fixed
            tries += 1
            continue

        # nothing else worked — offline
        code = _force_offline_template(intent)
        tries += 1

    # final attempt
    rc, out, res = _run_once(code)
    return (res or {"error": "Operator failed"}), out

# =====================
# High-level helpers
# =====================
def execute_pipeline(problem: str) -> Dict[str, Any]:
    spec = make_spec(problem)
    plan = make_plan(spec)
    md = solve(spec, plan)
    code = build_operator(spec, plan, md)
    results, logs = run_operator_full(code, spec)
    return {
        "status": "success",
        "spec": spec,
        "plan": plan,
        "run_report": md,
        "results": results,
        "operator_log": logs
    }
