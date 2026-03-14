import json
from collections import OrderedDict

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats
from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from eda.graph.violinplot import violinplot


COLORS = ["#2563eb", "#7c3aed", "#db2777", "#0f766e", "#c2410c", "#0891b2"]

_MAX_HUE_SERIES = 20    # cap distinct hue groups to avoid hundreds of series
_MAX_LEGEND_SERIES = 15  # hide legend when series count exceeds this
# Axis-label formatter: visual truncation only; full name stays in axis data for tooltips.
_AXIS_LABEL_FMT = {
    "type": "function",
    "source": "function(v){ var s=String(v); return s.length>22 ? s.slice(0,21)+'…' : s; }",
}


def _safe_num(value):
    try:
        out = float(value)
        if pd.isna(out):
            return None
        return out
    except Exception:
        return None


def _title_text(layout_title):
    if isinstance(layout_title, str):
        return layout_title
    if isinstance(layout_title, dict):
        return layout_title.get("text", "")
    return ""


def _base_option(title=""):
    return {
        "backgroundColor": "#ffffff",
        "color": COLORS,
        "height": "auto",
        "width": "auto",
        "title": {
            "text": title or "",
            "left": "center",
            "top": 8,
            "textStyle": {"color": "#0f172a", "fontSize": 18, "fontWeight": 600},
        },
        "tooltip": {
            "trigger": "item",
            "backgroundColor": "rgba(15, 23, 42, 0.92)",
            "textStyle": {"color": "#f8fafc"},
            "borderWidth": 0,
            "confine": True,
        },
        "legend": {
            "type": "scroll",
            "orient": "horizontal",
            "bottom": 0,
            "left": "center",
            "pageButtonPosition": "end",
            "pageIconSize": 12,
            "pageTextStyle": {"color": "#334155"},
            "itemGap": 8,
            "textStyle": {"color": "#334155", "fontSize": 12},
            "tooltip": {"show": True},
        },
        "grid": {"left": 56, "right": 20, "top": 60, "bottom": 90, "containLabel": True},
        "xAxis": {"type": "category", "axisLabel": {"color": "#1f2937"}},
        "yAxis": {"type": "value", "axisLabel": {"color": "#1f2937"}},
        "series": [],
        "responsive": True,
    }


def _series_name(hue_value, fallback):
    if hue_value is None:
        return fallback
    return str(hue_value)


def _apply_data_zoom(option, n_items, horizontal=False, threshold=25, visible_count=25):
    """Attach ECharts dataZoom (slider + inside) when n_items > threshold."""
    if n_items <= threshold:
        return
    end_pct = min(100, round(visible_count / n_items * 100, 1))
    if horizontal:
        option["dataZoom"] = [
            {"type": "inside", "yAxisIndex": 0, "start": 0, "end": end_pct},
            {
                "type": "slider", "yAxisIndex": 0,
                "start": 0, "end": end_pct,
                "width": 18, "right": 4,
                "borderColor": "#e2e8f0",
                "fillerColor": "rgba(37,99,235,0.15)",
                "handleStyle": {"color": "#2563eb"},
            },
        ]
        if "grid" in option:
            option["grid"]["right"] = max(option["grid"].get("right", 20), 50)
    else:
        option["dataZoom"] = [
            {"type": "inside", "xAxisIndex": 0, "start": 0, "end": end_pct},
            {
                "type": "slider", "xAxisIndex": 0,
                "start": 0, "end": end_pct,
                "height": 18, "bottom": 4,
                "borderColor": "#e2e8f0",
                "fillerColor": "rgba(37,99,235,0.15)",
                "handleStyle": {"color": "#2563eb"},
            },
        ]
        if "grid" in option:
            option["grid"]["bottom"] = max(option["grid"].get("bottom", 74), 95)


def _bar_options(df, data):
    cat_cols = data.get("cat") or []
    if not isinstance(cat_cols, list):
        cat_cols = [cat_cols]
    y_col = data.get("num")
    hue_col = data.get("hue")
    horizontal = (data.get("orient") or "Vertical") == "Horizontal"
    title = data.get("title", "")

    options = []
    for cat in [c for c in cat_cols if c in df.columns]:
        dfg = df[[cat, y_col] + ([hue_col] if hue_col and hue_col in df.columns and hue_col != "-" else [])].copy()
        dfg = dfg.dropna(subset=[cat, y_col])
        if dfg.empty:
            options.append(_base_option(title or f"Bar Plot of {y_col} by {cat}"))
            continue

        categories = list(OrderedDict.fromkeys(dfg[cat].astype(str).tolist()))
        option = _base_option(title or f"Bar Plot of {y_col} by {cat}")
        idx_map = {c: i for i, c in enumerate(categories)}
        series = []

        if hue_col and hue_col in dfg.columns and hue_col != "-":
            # Match old behavior: estimator='count' on y_col.
            grouped = dfg.groupby([cat, hue_col], dropna=False)[y_col].count().reset_index()
            hue_values = list(OrderedDict.fromkeys(grouped[hue_col].astype(str).tolist()))[:_MAX_HUE_SERIES]
            for hv in hue_values:
                vals = [0.0] * len(categories)
                for _, row in grouped[grouped[hue_col].astype(str) == hv].iterrows():
                    pos = idx_map.get(str(row[cat]))
                    if pos is not None:
                        vals[pos] = _safe_num(row[y_col]) or 0.0
                series.append({"name": str(hv), "type": "bar", "data": vals, "barMaxWidth": 38})
        else:
            grouped = dfg.groupby(cat, dropna=False)[y_col].count().reset_index()
            vals = [0.0] * len(categories)
            for _, row in grouped.iterrows():
                pos = idx_map.get(str(row[cat]))
                if pos is not None:
                    vals[pos] = _safe_num(row[y_col]) or 0.0
            series.append({"name": str(y_col), "type": "bar", "data": vals, "barMaxWidth": 38})

        if len(series) > _MAX_LEGEND_SERIES:
            option["legend"] = {"show": False}
        option["tooltip"]["trigger"] = "axis"
        # Full names go into axis data (tooltip reads from here); formatter truncates visually only.
        ax_label = {"color": "#1f2937", "formatter": _AXIS_LABEL_FMT}
        if horizontal:
            option["xAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
            option["yAxis"] = {"type": "category", "data": categories, "axisLabel": ax_label}
        else:
            option["xAxis"] = {"type": "category", "data": categories, "axisLabel": {**ax_label, "rotate": 25}}
            option["yAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
        option["series"] = series
        _apply_data_zoom(option, len(categories), horizontal=horizontal)
        options.append(option)
    return options


def _count_options(df, data):
    cat_cols = data.get("cat") or []
    if not isinstance(cat_cols, list):
        cat_cols = [cat_cols]
    hue_col = data.get("hue")
    horizontal = (data.get("orient") or "Vertical") == "Horizontal"
    title = data.get("title", "")
    out = []
    for cat in [c for c in cat_cols if c in df.columns]:
        tmp = df[[cat] + ([hue_col] if hue_col and hue_col in df.columns and hue_col != "-" else [])].dropna(subset=[cat]).copy()
        cats = list(OrderedDict.fromkeys(tmp[cat].astype(str).tolist()))
        idx = {c: i for i, c in enumerate(cats)}
        option = _base_option(title or f"Count Plot of {cat}")
        series = []
        if hue_col and hue_col in tmp.columns and hue_col != "-":
            grouped = tmp.groupby([cat, hue_col], dropna=False).size().reset_index(name="count")
            for hv in list(OrderedDict.fromkeys(grouped[hue_col].astype(str).tolist()))[:_MAX_HUE_SERIES]:
                vals = [0] * len(cats)
                for _, row in grouped[grouped[hue_col].astype(str) == hv].iterrows():
                    pos = idx.get(str(row[cat]))
                    if pos is not None:
                        vals[pos] = int(row["count"])
                series.append({"name": str(hv), "type": "bar", "data": vals, "barMaxWidth": 38})
        else:
            grouped = tmp.groupby(cat, dropna=False).size().reset_index(name="count")
            vals = [0] * len(cats)
            for _, row in grouped.iterrows():
                pos = idx.get(str(row[cat]))
                if pos is not None:
                    vals[pos] = int(row["count"])
            series.append({"name": "count", "type": "bar", "data": vals, "barMaxWidth": 38})
        if len(series) > _MAX_LEGEND_SERIES:
            option["legend"] = {"show": False}
        option["tooltip"]["trigger"] = "axis"
        ax_label = {"color": "#1f2937", "formatter": _AXIS_LABEL_FMT}
        if horizontal:
            option["xAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
            option["yAxis"] = {"type": "category", "data": cats, "axisLabel": ax_label}
        else:
            option["xAxis"] = {"type": "category", "data": cats, "axisLabel": {**ax_label, "rotate": 25}}
            option["yAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
        option["series"] = series
        _apply_data_zoom(option, len(cats), horizontal=horizontal)
        out.append(option)
    return out


def _pie_options(df, data):
    cat_cols = data.get("cat") or []
    if not isinstance(cat_cols, list):
        cat_cols = [cat_cols]
    title = data.get("title", "")
    out = []
    for cat in [c for c in cat_cols if c in df.columns]:
        counts = df[cat].astype(str).value_counts(dropna=True)
        option = _base_option(title or f"Pie Chart of {cat}")
        option.pop("xAxis", None)
        option.pop("yAxis", None)
        option["series"] = [{
            "type": "pie",
            "radius": "62%",
            "center": ["50%", "50%"],
            "label": {"color": "#0f172a", "formatter": "{b}: {d}%"},
            "itemStyle": {"borderColor": "#ffffff", "borderWidth": 2},
            "data": [{"name": str(k), "value": int(v)} for k, v in counts.items()],
        }]
        out.append(option)
    return out


def _hist_options(df, data):
    num_cols = data.get("var") or []
    if not isinstance(num_cols, list):
        num_cols = [num_cols]
    bins = data.get("autoBin") or data.get("bins") or 20
    try:
        bins = max(1, int(bins))
    except Exception:
        bins = 20
    title = data.get("title", "")
    orient = data.get("orient", "Vertical")
    kde = data.get("kde", False)
    if isinstance(kde, str):
        kde = kde.lower() == "true"
    out = []
    for col in [c for c in num_cols if c in df.columns]:
        vals = [v for v in (_safe_num(x) for x in df[col].tolist()) if v is not None]
        option = _base_option(title or f"Histogram of {col}")
        if not vals:
            out.append(option)
            continue

        counts, edges = np.histogram(vals, bins=bins, density=bool(kde))
        centers = ((edges[:-1] + edges[1:]) / 2.0).tolist()
        bar_vals = counts.tolist()
        labels = [round(v, 4) for v in centers]

        option["tooltip"]["trigger"] = "axis"
        option["xAxis"] = {"type": "category", "data": labels, "axisLabel": {"color": "#1f2937", "rotate": 25}}
        option["yAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
        option["series"] = [{"name": col, "type": "bar", "data": bar_vals, "barMaxWidth": 32, "itemStyle": {"opacity": 0.8}}]

        if kde and len(vals) > 1:
            try:
                kde_fn = scipy_stats.gaussian_kde(vals)
                x_dense = np.linspace(min(vals), max(vals), 160)
                y_dense = kde_fn(x_dense)
                option["series"].append({
                    "name": f"{col} KDE",
                    "type": "line",
                    "data": [float(v) for v in y_dense.tolist()],
                    "smooth": True,
                    "symbol": "none",
                    "lineStyle": {"width": 2.2},
                })
                option["xAxis"]["data"] = [round(v, 4) for v in x_dense.tolist()]
            except Exception:
                pass

        if orient == "Horizontal" and not kde:
            # Swap axes for horizontal parity.
            option["xAxis"], option["yAxis"] = option["yAxis"], option["xAxis"] 
        _apply_data_zoom(option, len(labels))
        out.append(option)
    return out


def _scatter_like_options(df, data, mode="scatter", with_reg=False):
    x_cols = data.get("x_var") or []
    if not isinstance(x_cols, list):
        x_cols = [x_cols]
    y_col = data.get("y_var")
    hue_col = data.get("hue")
    title = data.get("title", "")
    out = []
    for x_col in [c for c in x_cols if c in df.columns]:
        cols = list(dict.fromkeys([x_col, y_col] + ([hue_col] if hue_col and hue_col in df.columns and hue_col not in ("-", "None") else [])))
        tmp = df[cols].dropna(subset=[x_col, y_col]).copy()
        option = _base_option(title or f"{'Line' if mode == 'line' else 'Scatter'} Plot of {y_col} vs {x_col}")
        option["xAxis"] = {"type": "value", "name": str(x_col), "axisLabel": {"color": "#1f2937"}}
        option["yAxis"] = {"type": "value", "name": str(y_col), "axisLabel": {"color": "#1f2937"}}
        series = []

        def _trace(df_slice, name):
            pts = []
            for _, row in df_slice.iterrows():
                xv = _safe_num(row[x_col])
                yv = _safe_num(row[y_col])
                if xv is not None and yv is not None:
                    pts.append([xv, yv])
            return {
                "name": name,
                "type": "line" if mode == "line" else "scatter",
                "data": pts,
                "smooth": mode == "line",
                "symbolSize": 8 if mode == "scatter" else 5,
                "lineStyle": {"width": 2.2},
            }

        has_hue = hue_col and hue_col in tmp.columns and hue_col not in ("-", "None")

        if mode == "line":
            # Match old lineplot math: mean + CI over grouped x (optionally by hue).
            ci_percent = data.get("ci_percent", 95)
            try:
                ci_percent = float(ci_percent)
            except Exception:
                ci_percent = 95.0
            show_ci = ci_percent != 0

            def compute_ci(group_df):
                y_vals = pd.to_numeric(group_df[y_col], errors="coerce").dropna()
                n = y_vals.count()
                mean = float(y_vals.mean()) if n else 0.0
                if n > 1 and show_ci:
                    sem = float(scipy_stats.sem(y_vals, nan_policy="omit"))
                    h = float(sem * scipy_stats.t.ppf((1 + (ci_percent / 100.0)) / 2.0, n - 1))
                else:
                    h = 0.0
                return mean, mean - h, mean + h

            if has_hue:
                hue_values = list(OrderedDict.fromkeys(tmp[hue_col].astype(str).tolist()))[:_MAX_HUE_SERIES]
                for hv in hue_values:
                    part = tmp[tmp[hue_col].astype(str) == hv].copy()
                    grouped = part.groupby(x_col, dropna=False)
                    xs = []
                    means = []
                    lowers = []
                    uppers = []
                    for x_val, g in grouped:
                        x_num = _safe_num(x_val)
                        if x_num is None:
                            continue
                        m, lo, up = compute_ci(g)
                        xs.append(x_num)
                        means.append(m)
                        lowers.append(lo)
                        uppers.append(up)
                    if not xs:
                        continue
                    order = np.argsort(xs)
                    xs = [xs[i] for i in order]
                    means = [means[i] for i in order]
                    lowers = [lowers[i] for i in order]
                    uppers = [uppers[i] for i in order]
                    _hv_label = str(hv)
                    series.append({"name": _hv_label, "type": "line", "data": [[xs[i], means[i]] for i in range(len(xs))], "smooth": False, "symbolSize": 5, "lineStyle": {"width": 2.2}})
                    if show_ci:
                        series.append({"name": f"{_hv_label} CI\u2212", "type": "line", "data": [[xs[i], lowers[i]] for i in range(len(xs))], "symbol": "none", "lineStyle": {"width": 1.2, "type": "dashed"}, "showSymbol": False, "emphasis": {"disabled": True}})
                        series.append({"name": f"{_hv_label} CI+", "type": "line", "data": [[xs[i], uppers[i]] for i in range(len(xs))], "symbol": "none", "lineStyle": {"width": 1.2, "type": "dashed"}, "showSymbol": False, "emphasis": {"disabled": True}})
            else:
                grouped = tmp.groupby(x_col, dropna=False)
                xs = []
                means = []
                lowers = []
                uppers = []
                for x_val, g in grouped:
                    x_num = _safe_num(x_val)
                    if x_num is None:
                        continue
                    m, lo, up = compute_ci(g)
                    xs.append(x_num)
                    means.append(m)
                    lowers.append(lo)
                    uppers.append(up)
                if xs:
                    order = np.argsort(xs)
                    xs = [xs[i] for i in order]
                    means = [means[i] for i in order]
                    lowers = [lowers[i] for i in order]
                    uppers = [uppers[i] for i in order]
                    series.append({"name": str(y_col), "type": "line", "data": [[xs[i], means[i]] for i in range(len(xs))], "smooth": False, "symbolSize": 5, "lineStyle": {"width": 2.2}})
                    if show_ci:
                        series.append({"name": "CI lower", "type": "line", "data": [[xs[i], lowers[i]] for i in range(len(xs))], "symbol": "none", "lineStyle": {"width": 1.2, "type": "dashed"}, "showSymbol": False, "emphasis": {"disabled": True}})
                        series.append({"name": "CI upper", "type": "line", "data": [[xs[i], uppers[i]] for i in range(len(xs))], "symbol": "none", "lineStyle": {"width": 1.2, "type": "dashed"}, "showSymbol": False, "emphasis": {"disabled": True}})
        else:
            # Scatter mode: raw points
            if has_hue:
                for hv in list(OrderedDict.fromkeys(tmp[hue_col].astype(str).tolist()))[:_MAX_HUE_SERIES]:
                    part = tmp[tmp[hue_col].astype(str) == hv]
                    series.append(_trace(part, str(hv)))
            else:
                series.append(_trace(tmp, str(y_col)))

        if with_reg:
            # Match old regplot intent with per-hue trend lines.
            reg_groups = []
            if has_hue:
                reg_groups = [(str(hv), tmp[tmp[hue_col].astype(str) == str(hv)]) for hv in list(OrderedDict.fromkeys(tmp[hue_col].astype(str).tolist()))]
            else:
                reg_groups = [("Trend", tmp)]

            for reg_name, reg_df in reg_groups:
                pts = []
                for _, row in reg_df.iterrows():
                    xv = _safe_num(row[x_col])
                    yv = _safe_num(row[y_col])
                    if xv is not None and yv is not None:
                        pts.append((xv, yv))
                if len(pts) < 2:
                    continue
                x_vals = np.array([p[0] for p in pts], dtype=float)
                y_vals = np.array([p[1] for p in pts], dtype=float)
                slope, intercept = np.polyfit(x_vals, y_vals, 1)
                x_sorted = sorted(x_vals.tolist())
                reg = [[v, (slope * v) + intercept] for v in x_sorted]
                series.append({
                    "name": f"{reg_name} Trend" if has_hue else "Trend",
                    "type": "line",
                    "data": reg,
                    "symbol": "none",
                    "lineStyle": {"width": 2, "color": "#ef4444"},
                    "showSymbol": False,
                })

        option["series"] = series
        # Hide legend when there are too many series (avoids overflow into chart)
        if len(series) > _MAX_LEGEND_SERIES:
            option["legend"] = {"show": False}
        # Always allow pan/zoom on scatter and line charts
        option["dataZoom"] = [
            {"type": "inside", "xAxisIndex": 0},
            {"type": "inside", "yAxisIndex": 0},
        ]
        out.append(option)
    return out


def _box_like_options(df, data, chart_type="boxplot"):
    cat_cols = data.get("cat") or []
    if not isinstance(cat_cols, list):
        cat_cols = [cat_cols]
    y_col = data.get("num")
    hue_col = data.get("hue")
    orient = data.get("orient", "Vertical")
    title = data.get("title", "")
    out = []
    for cat in [c for c in cat_cols if c in df.columns]:
        cols = list(dict.fromkeys([cat, y_col] + ([hue_col] if hue_col and hue_col in df.columns and hue_col not in ("-", "None") else [])))
        tmp = df[cols].dropna(subset=[cat, y_col]).copy()
        cats = list(OrderedDict.fromkeys(tmp[cat].astype(str).tolist()))
        has_hue = hue_col and hue_col in tmp.columns and hue_col not in ("-", "None")
        option = _base_option(title or f"{'Violin' if chart_type == 'violin' else 'Box'} Plot of {y_col} by {cat}")
        ax_label = {"color": "#1f2937", "formatter": _AXIS_LABEL_FMT}
        if orient == "Horizontal":
            option["xAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
            option["yAxis"] = {"type": "category", "data": cats, "axisLabel": ax_label}
        else:
            option["xAxis"] = {"type": "category", "data": cats, "axisLabel": {**ax_label, "rotate": 25}}
            option["yAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}

        def _calc_box(arr):
            s = sorted([v for v in (_safe_num(x) for x in arr) if v is not None])
            if not s:
                return [0, 0, 0, 0, 0]
            q1 = float(pd.Series(s).quantile(0.25))
            q2 = float(pd.Series(s).quantile(0.50))
            q3 = float(pd.Series(s).quantile(0.75))
            return [s[0], q1, q2, q3, s[-1]]

        if chart_type == "violin":
            # Violin in ECharts is emulated via KDE-based mirrored density points.
            option["xAxis"] = {
                "type": "value",
                "min": -0.6,
                "max": max(len(cats) - 0.4, 0.6),
                "interval": 1,
                "axisLabel": {
                    "color": "#1f2937",
                    "formatter": {
                        "type": "function",
                        "source": "function (v) { const i=Math.round(v); return i>=0 && i<__CATS__.length ? __CATS__[i] : ''; }",
                    },
                },
                "splitLine": {"show": False},
            }
            option["yAxis"] = {"type": "value", "axisLabel": {"color": "#1f2937"}}
            option["tooltip"]["trigger"] = "item"

            # Since ECharts option is pure JSON, convert formatter function placeholder in frontend if needed.
            # We keep a metadata field with categories to avoid losing labels.
            option["__categories__"] = cats

            series = []
            hue_vals = list(OrderedDict.fromkeys(tmp[hue_col].astype(str).tolist())) if has_hue else []
            hue_count = len(hue_vals) if has_hue else 1

            for ci, c in enumerate(cats):
                if has_hue:
                    for hi, hv in enumerate(hue_vals):
                        part = tmp[(tmp[cat].astype(str) == c) & (tmp[hue_col].astype(str) == hv)]
                        nums = np.array([v for v in (_safe_num(x) for x in part[y_col].tolist()) if v is not None], dtype=float)
                        if nums.size < 2:
                            continue
                        y_grid = np.linspace(nums.min(), nums.max(), 80)
                        kde = scipy_stats.gaussian_kde(nums)
                        dens = kde(y_grid)
                        dens_max = float(np.max(dens)) if np.max(dens) > 0 else 1.0

                        center = ci + ((hi - ((hue_count - 1) / 2.0)) * 0.22)
                        base_width = 0.16
                        pts = []
                        for yi, di in zip(y_grid, dens):
                            width = (float(di) / dens_max) * base_width
                            steps = max(3, int(np.ceil(width / 0.03)))
                            offs = np.linspace(-width, width, (steps * 2) + 1)
                            for off in offs:
                                pts.append([float(center + off), float(yi)])
                        series.append({
                            "name": str(hv),
                            "type": "scatter",
                            "data": pts,
                            "symbolSize": 3,
                            "itemStyle": {"opacity": 0.22},
                            "large": True,
                        })
                else:
                    part = tmp[tmp[cat].astype(str) == c]
                    nums = np.array([v for v in (_safe_num(x) for x in part[y_col].tolist()) if v is not None], dtype=float)
                    if nums.size < 2:
                        continue
                    y_grid = np.linspace(nums.min(), nums.max(), 90)
                    kde = scipy_stats.gaussian_kde(nums)
                    dens = kde(y_grid)
                    dens_max = float(np.max(dens)) if np.max(dens) > 0 else 1.0
                    pts = []
                    for yi, di in zip(y_grid, dens):
                        width = (float(di) / dens_max) * 0.38
                        steps = max(4, int(np.ceil(width / 0.03)))
                        offs = np.linspace(-width, width, (steps * 2) + 1)
                        for off in offs:
                            pts.append([float(ci + off), float(yi)])
                    series.append({
                        "name": str(c),
                        "type": "scatter",
                        "data": pts,
                        "symbolSize": 3,
                        "itemStyle": {"opacity": 0.2},
                        "large": True,
                    })

            option["series"] = series
        elif has_hue:
            series = []
            hue_vals_box = list(OrderedDict.fromkeys(tmp[hue_col].astype(str).tolist()))[:_MAX_HUE_SERIES]
            for hv in hue_vals_box:
                box_data = []
                part = tmp[tmp[hue_col].astype(str) == hv]
                for c in cats:
                    arr = part[part[cat].astype(str) == c][y_col].tolist()
                    box_data.append(_calc_box(arr))
                series.append({"name": str(hv), "type": "boxplot", "data": box_data})
            if len(series) > _MAX_LEGEND_SERIES:
                option["legend"] = {"show": False}
            option["series"] = series
        else:
            box_data = []
            for c in cats:
                arr = tmp[tmp[cat].astype(str) == c][y_col].tolist()
                box_data.append(_calc_box(arr))
            option["series"] = [{"name": str(y_col), "type": "boxplot", "data": box_data}]
        if chart_type != "violin":
            _apply_data_zoom(option, len(cats), horizontal=(orient == "Horizontal"))
        out.append(option)
    return out


def _venn_option(df, data):
    groups = data.get("feature_groups") or []
    if len(groups) < 3:
        groups = [
            {"pattern": "Bond Chain-", "short_name": "C", "display_name": "Bond Chain Related Features", "method": "starts_with"},
            {"pattern": "Rdkit Descriptor", "short_name": "G", "display_name": "RDKit Global Descriptors", "method": "starts_with"},
            {"pattern": "Rdkit Descriptor Fr", "short_name": "F", "display_name": "RDKit Functional Group Descriptors", "method": "starts_with"},
        ]

    def match(col, pattern, method):
        if method == "starts_with":
            return col.startswith(pattern)
        if method == "ends_with":
            return col.endswith(pattern)
        if method == "exact_match":
            return col == pattern
        return pattern in col

    labels = [g.get("display_name", f"Group {i+1}") for i, g in enumerate(groups[:3])]
    shorts = [g.get("short_name", f"G{i+1}") for i, g in enumerate(groups[:3])]
    g1, g2, g3 = groups[:3]
    pattern_1, method_1 = g1.get("pattern", ""), g1.get("method", "starts_with")
    pattern_2, method_2 = g2.get("pattern", ""), g2.get("method", "starts_with")
    pattern_3, method_3 = g3.get("pattern", ""), g3.get("method", "starts_with")

    # Match legacy notebook assignment logic used by previous implementation.
    set_1, set_2, set_3 = set(), set(), set()
    for col in df.columns:
        if match(col, pattern_1, method_1):
            set_1.add(col)
            if pattern_3 in col:
                set_3.add(col)
            elif pattern_2 in col:
                set_2.add(col)

        if match(col, pattern_3, method_3):
            set_3.add(col)

        if match(col, pattern_2, method_2) and pattern_3 not in col:
            set_2.add(col)

    a, b, c = set_1, set_2, set_3

    overlap_12 = len(a & b)
    overlap_13 = len(a & c)
    overlap_23 = len(b & c)
    overlap_all = len(a & b & c)
    set_1_only = len(a - b - c)
    set_2_only = len(b - a - c)
    set_3_only = len(c - a - b)
    overlap_12_only = len((a & b) - c)
    overlap_13_only = len((a & c) - b)
    overlap_23_only = len((b & c) - a)

    stats = {
        "total_features": len(df.columns),
        "feature_counts": {
            f"{labels[0]} ({shorts[0]})": len(a),
            f"{labels[1]} ({shorts[1]})": len(b),
            f"{labels[2]} ({shorts[2]})": len(c),
        },
        "overlaps": {
            f"{shorts[0]} ∩ {shorts[1]}": overlap_12,
            f"{shorts[0]} ∩ {shorts[2]}": overlap_13,
            f"{shorts[1]} ∩ {shorts[2]}": overlap_23,
            f"{shorts[0]} ∩ {shorts[1]} ∩ {shorts[2]} (All three)": overlap_all,
        },
        "exclusive_regions": {
            f"{shorts[0]} only": set_1_only,
            f"{shorts[1]} only": set_2_only,
            f"{shorts[2]} only": set_3_only,
            f"{shorts[0]} ∩ {shorts[1]} only": overlap_12_only,
            f"{shorts[0]} ∩ {shorts[2]} only": overlap_13_only,
            f"{shorts[1]} ∩ {shorts[2]} only": overlap_23_only,
        },
    }

    option = _base_option("Venn Diagram")
    option["legend"]["show"] = False
    option["tooltip"]["show"] = False
    option["xAxis"] = {"show": False, "min": 0, "max": 600}
    option["yAxis"] = {"show": False, "min": 0, "max": 500}
    option["series"] = []
    option["graphic"] = [
        {"type": "circle", "shape": {"cx": 220, "cy": 210, "r": 140}, "style": {"fill": "rgba(37,99,235,0.35)", "stroke": "#2563eb", "lineWidth": 2}},
        {"type": "circle", "shape": {"cx": 360, "cy": 210, "r": 140}, "style": {"fill": "rgba(219,39,119,0.35)", "stroke": "#db2777", "lineWidth": 2}},
        {"type": "circle", "shape": {"cx": 290, "cy": 320, "r": 140}, "style": {"fill": "rgba(15,118,110,0.35)", "stroke": "#0f766e", "lineWidth": 2}},
        {"type": "text", "style": {"x": 180, "y": 115, "text": shorts[0], "fill": "#1f2937", "font": "700 14px sans-serif"}},
        {"type": "text", "style": {"x": 390, "y": 115, "text": shorts[1], "fill": "#1f2937", "font": "700 14px sans-serif"}},
        {"type": "text", "style": {"x": 290, "y": 455, "text": shorts[2], "fill": "#1f2937", "font": "700 14px sans-serif"}},
        {"type": "text", "style": {"x": 150, "y": 230, "text": str(set_1_only), "fill": "#111827", "font": "600 13px sans-serif"}},
        {"type": "text", "style": {"x": 430, "y": 230, "text": str(set_2_only), "fill": "#111827", "font": "600 13px sans-serif"}},
        {"type": "text", "style": {"x": 290, "y": 390, "text": str(set_3_only), "fill": "#111827", "font": "600 13px sans-serif"}},
        {"type": "text", "style": {"x": 290, "y": 250, "text": str(overlap_all), "fill": "#111827", "font": "700 13px sans-serif"}},
    ]
    return option, stats


class EDA(APIView):
    permission_classes = [AllowAny]

    def post(self, request, plot_type):
        data = json.loads(request.body)
        # Load DataFrame from workspace when workspace_id is provided;
        # fall back to the legacy 'file' list-of-records payload.
        ws_id = data.get('workspace_id')
        if ws_id:
            from matflow_test.services import workspace_service
            fn = data.get('filename') or None
            df = workspace_service.load_dataframe(ws_id, fn)
        else:
            file = data.get('file')
            df = pd.DataFrame(file)
        if plot_type == 'barplot':
            options = _bar_options(df, data)
        elif plot_type == 'countplot':
            options = _count_options(df, data)
        elif plot_type == 'pieplot':
            options = _pie_options(df, data)
        elif plot_type == 'histogram':
            options = _hist_options(df, data)
        elif plot_type == 'scatterplot':
            options = _scatter_like_options(df, data, mode="scatter", with_reg=False)
        elif plot_type == 'lineplot':
            options = _scatter_like_options(df, data, mode="line", with_reg=False)
        elif plot_type == 'regplot':
            options = _scatter_like_options(df, data, mode="scatter", with_reg=True)
        elif plot_type == 'boxplot':
            options = _box_like_options(df, data, chart_type="boxplot")
        elif plot_type == 'violinplot':
            return violinplot(df, data)
        elif plot_type == 'customplot':
            line_opts = _scatter_like_options(df, data, mode="line", with_reg=False)
            scatter_opts = _scatter_like_options(df, data, mode="scatter", with_reg=False)
            options = line_opts + scatter_opts
        elif plot_type == 'venn-diagram':
            option, stats = _venn_option(df, data)
            return JsonResponse({"echarts": [option], "statistics": stats, "png": [], "svg": []})
        else:
            return JsonResponse({'error': 'Invalid plot type'}, status=400)

        return JsonResponse({"echarts": options, "png": [], "svg": []})
