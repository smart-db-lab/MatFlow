FROM continuumio/miniconda3:latest

ENV PYTHONDONTWRITEBYTECODE=1 \
        PYTHONUNBUFFERED=1 \
        PATH="/opt/conda/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        build-essential \
        ca-certificates \
        && rm -rf /var/lib/apt/lists/*

COPY environment.yml requirements_docker.txt ./

RUN conda install -n base -c conda-forge mamba -y \
        && mamba env update -n base -f environment.yml \
        && conda clean -afy

RUN  pip install --no-cache-dir --use-deprecated=legacy-resolver -r requirements_docker.txt \
        && pip install --no-cache-dir --use-deprecated=legacy-resolver "jax==0.4.23" "jaxlib==0.4.23" "ml-dtypes==0.3.2" "numpy==1.26.4" "whitenoise>=6.0.0"

COPY . .

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

# Run the entrypoint through the shell so host-mounted files don't require executable bit
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
CMD ["uvicorn", "Matflow.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--reload"]
