from collections import deque

MEMORY = deque(maxlen=10)

def store(role, text):
    MEMORY.append(f"{role.upper()}: {text}")

def recall(limit=5):
    return list(MEMORY)[-limit:]
