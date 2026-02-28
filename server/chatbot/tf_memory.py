import numpy as np
import tensorflow_hub as hub

embedder = hub.load(
    "https://tfhub.dev/google/universal-sentence-encoder/4"
)

MEMORY = []  # global memory

def embed(text: str):
    return embedder([text]).numpy()[0]

def store(text: str):
    MEMORY.append({
        "text": text,
        "vec": embed(text)
    })

def recall(query: str, top_k=3):
    if not MEMORY:
        return []

    qv = embed(query)
    scored = []

    for m in MEMORY:
        sim = np.dot(qv, m["vec"]) / (
            np.linalg.norm(qv) * np.linalg.norm(m["vec"])
        )
        scored.append((sim, m["text"]))

    scored.sort(reverse=True)
    return [t for _, t in scored[:top_k]]
