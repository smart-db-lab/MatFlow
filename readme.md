# MLFlow

A full-stack ML workflow platform — React frontend + Django REST backend.

---

## Prerequisites

- [Conda](https://docs.conda.io/en/latest/miniconda.html) (Miniconda or Anaconda)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- [Redis](https://redis.io/) (for background tasks via Celery)
- [Docker](https://www.docker.com/) (optional, easiest way to run Redis on Windows)

---

## Setup
#### Using Docker : 
Open terminal & change directory to MLFlow 
        ```  cd MLFlow ```
       
 Run this command 
        ``` docker compose up  --build  ``` 
### Or
#### Manual setup:

### 1. Clone the repo

### 2. Backend (Django)

> **Important:** Follow these steps in exact order. psi4 and numpy/scipy must be
> installed via conda (not pip) to avoid binary incompatibilities.

**Step 1 — Create conda environment**

```bash
conda create -n venv python=3.10 -y
conda activate venv
```

**Step 2 — Install psi4 via conda-forge (must be first)**

```bash
conda install -c conda-forge psi4=1.9.1 -y
```

> psi4 brings its own numpy 2.x and scipy via conda. We fix versions after pip install.

**Step 3 — Install pip dependencies**

```bash
cd server
pip install -r requirements.txt
```

**Step 4 — Fix numpy and scipy (via conda, not pip)**

```bash
conda install -c conda-forge numpy=1.26.4 scipy=1.13.1 -y
```

> Using conda here ensures the binaries match. Installing numpy/scipy via pip
> will cause `TypeError` crashes due to binary mismatches with conda packages.

**Step 5 — Verify dependency health**

```bash
pip check
```

> `requirements.txt` already pins a TensorFlow/MLflow-compatible set
> (`jax==0.4.23`, `jaxlib==0.4.23`, `ml_dtypes==0.2.0`, `packaging==25.0`).

**Step 6 — Run migrations and create admin user**

```bash
python manage.py migrate
python create_superuser.py
```

### 3. Frontend (React)

```bash
cd client
npm install
```

### 4. Redis

**Windows (Docker — recommended):**

```bash
docker run -d -p 6379:6379 redis:latest
```

**Windows (WSL2):**

```bash
wsl
sudo apt-get install redis-server
redis-server
```

**Linux / macOS:**

```bash
# Ubuntu/Debian
sudo apt-get install redis-server && redis-server

# macOS
brew install redis && redis-server
```

Verify: `redis-cli ping` should return `PONG`.

---

## Running

Open **4 terminals** and run one command in each:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | — | `redis-server` (skip if using Docker) |
| 2 | `server/` | `conda activate venv` then `python manage.py runserver` |
| 3 | `server/` | `conda activate venv` then `celery -A Matflow worker -l info --pool=solo` |
| 4 | `client/` | `npm run dev` |

> **Windows PowerShell note:** Use `;` instead of `&&` to chain commands. Always use `--pool=solo` for Celery on Windows.

### Celery (start / stop)

**Start Celery worker (PowerShell):**

```bash
cd server
conda activate venv
celery -A Matflow worker -l info --pool=solo
python -m celery -A Matflow worker -l info --pool=solo
```

**Stop Celery worker:**

- In the same terminal, press `Ctrl + C` (once or twice) to stop gracefully.
- If it was started in another terminal and you want to force stop:

```bash
Get-Process -Name celery | Stop-Process -Force
```

---

## Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
---

## Troubleshooting

**Database errors or missing tables:**

```bash
cd server
conda activate venv
python manage.py makemigrations
python manage.py migrate
```

**Frontend can't reach API:**

- Confirm Django is running on port 8000.
- Check `ALLOWED_HOSTS` and CORS settings in `server/Matflow/settings.py`.
- If using a non-default API URL, update it in `client/.env.local`.

**PowerShell note:** Always use `conda activate venv; python manage.py ...` to ensure the correct environment on Windows.
