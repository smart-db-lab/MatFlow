# Matflow Backend

This is a Django project that receives API requests with/without Celery, and sends responses.

## Matflow Environment Setup Guide

This guide documents the exact steps and package versions that work successfully for the Matflow project.

### Installation Sequence (Critical Order)

#### Step 1: Create Conda Environment

```bash
conda create -n venv python=3.10 -y
conda activate venv
```

#### Step 2: Install psi4 from conda-forge (FIRST!)

```bash
conda install -c conda-forge psi4=1.9.1 -y
```

**Note:** psi4 must be installed first as it upgrades NumPy to 2.x, which we need to downgrade later.

#### Step 3: Install packages from requirements.txt

```bash
pip install -r requirements.txt
```

#### Step 4: Fix NumPy compatibility (CRITICAL!)

```bash
pip install "numpy<2.0" --force-reinstall
```

**Important:** RDKit requires NumPy 1.x, but psi4 installs NumPy 2.x. This step downgrades to NumPy 1.26.4 for compatibility.

#### Step 5: Install Missing Packages Only (Avoid Resolution Errors)

If `pip install -r requirements.txt` fails with "resolution-too-deep" error, install only missing packages:

```bash
# Check what's missing first, then install only those
pip install aiohappyeyeballs==2.6.1 aiohttp==3.13.2 aiosignal==1.4.0 argon2-cffi==25.1.0 argon2-cffi-bindings==25.1.0 bleach==6.3.0 datasets==4.4.1 dill==0.4.0 drf-spectacular==0.29.0 drf-spectacular-sidecar==2025.10.1 drf-yasg==1.21.11 et-xmlfile==2.0.0 frozenlist==1.8.0 google-auth-oauthlib==1.0.0 google-generativeai gunicorn==23.0.0 hf-xet==1.2.0 huggingface_hub==1.2.1 inflection==0.5.1 isodate==0.7.2 jax==0.4.30 jaxlib==0.4.30 kaggle==1.7.4.5 lazy-object-proxy==1.12.0 liac-arff==2.5.0 minio==7.2.20 multidict==6.7.0 multiprocess==0.70.18 oauthlib==3.3.1 openapi-core==0.19.5 openapi-schema-validator==0.6.3 openapi-spec-validator==0.7.2 openml==0.15.1 openpyxl==3.1.5 parse==1.20.2 propcache==0.4.1 pycryptodome==3.23.0 python-slugify==8.0.4 qcmanybody requests-oauthlib==2.0.0 rfc3339-validator==0.1.4 shellingham==1.5.4 tensorflow-estimator==2.15.0 tensorflow-io-gcs-filesystem==0.31.0 text-unidecode==1.3 typer-slim==0.20.0 uritemplate==4.2.0 webencodings==0.5.1 whitenoise==6.11.0 xmltodict==1.0.2 xxhash==3.6.0 yarl==1.22.0
```

#### Step 6: Fix Dependency Conflicts

```bash
# Fix protobuf version conflicts
pip install "protobuf>=4.25.0,<5.0.0" "opentelemetry-proto>=1.9.0,<1.30.0" "grpcio-status<1.60.0,>=1.33.2"
```

#### Step 7: Reinstall PyTorch (Windows DLL Issues)

```bash
pip install torch==2.0.1 torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### Step 8: Fix TensorFlow/Keras and NumPy (Windows)

```bash
# Reinstall TensorFlow
pip uninstall tensorflow tensorflow-intel -y
pip install tensorflow==2.15.0

# Fix NumPy DLL issues using conda
conda install -y numpy=1.26.4 -c conda-forge
```

#### Step 9: Setup Ollama for AI Chat (Optional)

For the chatbot to work with AI responses:

```bash
# Download and install Ollama from https://ollama.ai/download

# Then pull the required model:
ollama run llama3.1:8b

# Start Ollama service:
ollama serve
```

**Note:** Without Ollama, the chatbot will still work for navigation and dataset queries, but won't provide AI-powered responses.

### Troubleshooting Common Issues

#### Issue: "resolution-too-deep" Error
**Solution:** Install missing packages individually or in small batches instead of `pip install -r requirements.txt`

#### Issue: PyTorch "TensorBase" AttributeError
**Solution:** Reinstall PyTorch from official repository: `pip install torch==2.0.1 torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu`

#### Issue: TensorFlow "No module named 'tensorflow.compat'"
**Solution:** Reinstall TensorFlow: `pip uninstall tensorflow tensorflow-intel -y && pip install tensorflow==2.15.0`

#### Issue: NumPy DLL Load Failed (Windows)
**Solution:** Use conda to reinstall: `conda install -y numpy=1.26.4 -c conda-forge`

#### Issue: Protobuf Version Conflicts
**Solution:** Install compatible versions: `pip install "protobuf>=4.25.0,<5.0.0" "opentelemetry-proto>=1.9.0,<1.30.0" "grpcio-status<1.60.0,>=1.33.2"`

### Key Package Versions That Work

#### Core Scientific Stack

- Python: 3.10.18
- NumPy: 1.26.4 (CRITICAL: Must be < 2.0)
- SciPy: 1.13.1
- Pandas: 2.2.3
- Matplotlib: 3.9.4

#### Machine Learning

- TensorFlow: 2.15.0 (with tensorflow-intel)
- PyTorch: 2.0.1+cpu
- Keras: 2.15.0
- Scikit-learn: 1.5.2
- XGBoost: 2.1.4

#### Chemistry

- psi4: 1.9.1 (conda-forge)
- RDKit: 2022.9.5
- qcelemental: 0.29.0
- qcengine: 0.33.0

#### Web Framework

- Django: 5.1.13
- DjangoRestFramework: 3.14.0
- Celery: 5.4.0

---

## SCScore Model (Required Folder Layout)

Clone the SCScore repository into the `server` folder and name it `scs`:

```bash
cd server
git clone https://github.com/connorcoley/scscore.git scs
```

Reference: [SCScore repository](https://github.com/connorcoley/scscore.git)

Notes:
- The standalone NumPy model is at `server/scs/scscore/standalone_model_numpy.py`.
- SCScore depends on RDKit and NumPy, which are already covered by this guide.

## Getting Started
To run this project with **Python 3.10** and **Celery**, follow these steps:

---

## 1. Prerequisites
Ensure the following are installed on your system:
- **Python 3.10**
- **Redis** (as the Celery broker)
- **Django**
- **Celery**

---

## 2. Verify Python Installation
Ensure Python 3.10 is installed:

```bash
python3 --version
```
If not installed, download and install it from the [official Python website](https://www.python.org/).

---

## 3. Setup Virtual Environment
Create a virtual environment using Python 3.10:

```bash
python3.10 -m venv env
```
Activate the virtual environment:

- On macOS/Linux:
  ```bash
  source env/bin/activate
  ```
- On Windows:
  ```bash
  .\env\Scripts\activate
  ```

---

## 4. Clone the Repository
Clone the project repository:

```bash
git clone https://github.com/ml-cou/Matflow-nodebased-backend.git
```
Navigate into the project directory:

```bash
cd Matflow-nodebased-backend
```

---

## 5. Install Required Packages
Install dependencies from the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

---

## 6. Start Redis
Make sure Redis is running on the default port **localhost:6379**.

- To start Redis (Linux/Mac):
  ```bash
  redis-server
  ```
- For Windows, download Redis from [Redis for Windows](https://github.com/microsoftarchive/redis) and run the server.

---

## 7. Apply Database Migrations
Run the Django database migrations:

```bash
python manage.py migrate
```

---

## 8. Start Django Development Server
Run the Django development server:

```bash
python manage.py runserver 9000
```

asgi server run 
uvicorn Matflow.asgi:application --host 0.0.0.0 --port 9000 --reload


The server will now be available at:

```
http://localhost:9000/
```

---

## 9. Start Celery Worker
Run the Celery worker to handle background tasks:

```bash
celery -A Matflow worker -l info --pool=solo
```

```bash
celery -A Matflow control shutdown
```

```bash
celery -A Matflow purge
```
---

## 🎉 Ready to Go!
