# ────────────────── server/utils/smiles_generation.py ──────────────────
"""
Utility helpers for the SMILES-generation endpoint.
Call `generate_smiles(**request_dict)` with the exact payload received
from the POST body and get back a list of dicts ready for JSON response.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict, Any, Sequence

import numpy as np
import pandas as pd
import tensorflow as tf
import keras
from rdkit import Chem
from rdkit.Chem import rdMolDescriptors
from sklearn.model_selection import train_test_split


# ─── Dataclasses for strongly-typed configs ────────────────────────────
@dataclass
class VAEConfig:
    latent_dim: int = 64
    epochs: int = 50
    batch_size: int = 64
    learning_rate: float = 1e-3
    embedding_dim: int = 128
    lstm_units: int = 128


@dataclass
class TrainCfg:
    test_size: float = 0.2
    random_state: int = 42


# ─── Tokenisation / vocab helpers ──────────────────────────────────────
def tokenize(smiles: str) -> list[str]: return list(smiles)


def build_vocab(tokenised: Sequence[Sequence[str]]):
    uniq = sorted({t for s in tokenised for t in s})
    tok2i = {t: i + 1 for i, t in enumerate(uniq)}  # 0 = PAD
    i2tok = {i: t for t, i in tok2i.items()}
    return tok2i, i2tok


def encode(batch: Sequence[Sequence[str]], tok2i, pad_len: int) -> np.ndarray:
    enc = [[tok2i.get(t, 0) for t in seq] for seq in batch]
    return np.array([seq + [0] * (pad_len - len(seq)) for seq in enc], dtype=np.int32)


# ─── VAE layers & model builders ───────────────────────────────────────
class Sampling(keras.layers.Layer):
    def call(self, inputs, **kwargs):
        m, lv = inputs
        eps = tf.random.normal(shape=tf.shape(m))
        return m + tf.exp(0.5 * lv) * eps


def build_encoder(max_len, vocab_sz, cfg: VAEConfig):
    inp = keras.layers.Input(shape=(max_len,))
    x = keras.layers.Embedding(vocab_sz, cfg.embedding_dim, mask_zero=True)(inp)
    x = keras.layers.LSTM(cfg.lstm_units)(x)
    z_mean = keras.layers.Dense(cfg.latent_dim)(x)
    z_log_var = keras.layers.Dense(cfg.latent_dim)(x)
    z = Sampling()([z_mean, z_log_var])
    return keras.models.Model(inp, [z_mean, z_log_var, z])


def build_decoder(max_len, vocab_sz, cfg: VAEConfig):
    inp = keras.layers.Input(shape=(cfg.latent_dim,))
    x = keras.layers.Dense(max_len * cfg.embedding_dim, activation="relu")(inp)
    x = keras.layers.Reshape((max_len, cfg.embedding_dim))(x)
    x = keras.layers.LSTM(cfg.lstm_units, return_sequences=True)(x)
    out = keras.layers.Dense(vocab_sz, activation="softmax")(x)
    return keras.models.Model(inp, out)


class VAE(keras.models.Model):
    """Minimal Keras subclassed VAE with custom train/test step."""

    def __init__(self, enc, dec):
        super().__init__()
        self.enc, self.dec = enc, dec
        self.loss_tracker = keras.metrics.Mean(name="loss")

    def compile(self, optimizer):
        super().compile()
        self.optimizer = optimizer

    def call(self, x, training=False):
        z_m, z_lv, z = self.enc(x, training=training)
        recon = self.dec(z, training=training)
        return recon, z_m, z_lv

    def _loss(self, x, recon, z_m, z_lv):
        rl = tf.reduce_sum(keras.losses.sparse_categorical_crossentropy(x, recon), axis=1)
        kl = -0.5 * tf.reduce_sum(1 + z_lv - tf.square(z_m) - tf.exp(z_lv), axis=1)
        return tf.reduce_mean(rl + kl)

    def train_step(self, data):
        x = data[0] if isinstance(data, tuple) else data
        with tf.GradientTape() as t:
            recon, m, lv = self(x, training=True)
            loss = self._loss(x, recon, m, lv)
        grads = t.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}

    def test_step(self, data):
        x = data[0] if isinstance(data, tuple) else data
        recon, m, lv = self(x, training=False)
        loss = self._loss(x, recon, m, lv)
        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}


# ─── High-level public helper -----------------------------------------
from celery.utils.log import get_task_logger
logger = get_task_logger(__name__)

# ─── High-level public helper -----------------------------------------
def generate_smiles(
        *,
        dataset: List[Dict[str, Any]] = None,
        train_dataset: List[Dict[str, Any]] = None,
        test_dataset: List[Dict[str, Any]] = None,
        training_mode: str,
        smiles_column: str,
        epsilon_column: str | None,
        vae_config: Dict[str, Any],
        training_config: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Main entry point called by the DRF view.
    Returns a list of dicts, each serialisable to JSON.
    """

    logger.info("==== [generate_smiles] starting ====")
    logger.debug(f"training_mode={training_mode}, smiles_column={smiles_column}, epsilon_column={epsilon_column}")
    logger.debug(f"vae_config={vae_config}, training_config={training_config}")

    # ---- prepare configs ------------------------------------------------
    vcfg = VAEConfig(**vae_config)
    tcfg = TrainCfg(**training_config)

    # Handle separate datasets or original single dataset
    if train_dataset is not None and test_dataset is not None:
        logger.info(f"Using train/test datasets: train={len(train_dataset)}, test={len(test_dataset)}")
        df_train = pd.DataFrame(train_dataset)
        df_test = pd.DataFrame(test_dataset)

        if smiles_column not in df_train.columns:
            raise ValueError(f"smiles_column '{smiles_column}' not in train dataset")

        smiles_train = df_train[smiles_column].dropna().tolist()
        logger.info(f"Loaded {len(smiles_train)} SMILES from train dataset")

        # Build vocab only from training data
        toks_train = [tokenize(s) for s in smiles_train]
        tok2i, i2tok = build_vocab(toks_train)
        max_len = max(map(len, toks_train))
        logger.info(f"Vocab size={len(tok2i)}, max_len={max_len}")

        X_train = encode(toks_train, tok2i, max_len)
        logger.info(f"Encoded training set shape={X_train.shape}")

        # Create validation set by splitting training data
        X_train_split, X_val = train_test_split(
            X_train, test_size=tcfg.test_size, random_state=tcfg.random_state
        )
        logger.info(f"Train split={X_train_split.shape}, Val split={X_val.shape}")

        # Use test dataset for epsilon values
        eps_series = df_test[epsilon_column] if epsilon_column and epsilon_column in df_test else pd.Series()
        logger.info(f"Epsilon series length={len(eps_series)}")

    else:
        logger.info("Using single dataset mode")
        if dataset is None:
            raise ValueError("Either provide 'dataset' or both 'train_dataset' and 'test_dataset'")

        df = pd.DataFrame(dataset)
        if smiles_column not in df.columns:
            raise ValueError(f"smiles_column '{smiles_column}' not in payload")

        smiles_list = df[smiles_column].dropna().tolist()
        logger.info(f"Loaded {len(smiles_list)} SMILES from dataset")

        toks = [tokenize(s) for s in smiles_list]
        tok2i, i2tok = build_vocab(toks)
        max_len = max(map(len, toks))
        logger.info(f"Vocab size={len(tok2i)}, max_len={max_len}")

        enc_all = encode(toks, tok2i, max_len)
        logger.info(f"Encoded dataset shape={enc_all.shape}")

        X_train_split, X_val = train_test_split(
            enc_all, test_size=tcfg.test_size, random_state=tcfg.random_state
        )
        logger.info(f"Train split={X_train_split.shape}, Val split={X_val.shape}")

        eps_series = df[epsilon_column] if epsilon_column and epsilon_column in df else pd.Series()
        logger.info(f"Epsilon series length={len(eps_series)}")

    # ---- model build ----------------------------------------------------
    encoder = build_encoder(max_len, len(tok2i) + 1, vcfg)
    decoder = build_decoder(max_len, len(tok2i) + 1, vcfg)
    vae = VAE(encoder, decoder)
    vae.compile(keras.optimizers.Adam(vcfg.learning_rate))
    logger.info("Model compiled. Starting training...")

    vae.fit(
        X_train_split,
        epochs=vcfg.epochs,
        batch_size=vcfg.batch_size,
        validation_data=(X_val,),
        verbose=0,
    )
    logger.info("Training finished")

    # ---- sample latent --------------------------------------------------
    z_m, z_lv, _ = encoder.predict(X_val, verbose=0)
    logger.debug(f"Latent mean shape={z_m.shape}, logvar shape={z_lv.shape}")
    z = z_m + tf.exp(0.5 * z_lv) * tf.random.normal(tf.shape(z_m))
    logits = decoder.predict(z, verbose=0)
    logger.info(f"Generated logits shape={logits.shape}")

    smi_out = ["".join(i2tok.get(i, "") for i in row.argmax(1) if i) for row in logits]
    logger.info(f"Decoded {len(smi_out)} candidate SMILES")

    # ---- ring filter ----------------------------------------------------
    result: list[dict[str, Any]] = []
    valid_count = 0
    ring_count = 0
    total_generated = len(smi_out)

    for i, s in enumerate(smi_out):
        mol = Chem.MolFromSmiles(s)
        logger.debug(f"{i}: raw='{s}' -> mol={mol}")
        if mol:
            valid_count += 1
            rings = mol.GetRingInfo().NumRings()
            if rings > 0:
                ring_count += 1
                logger.info(f"{i}: VALID with {rings} ring(s): {s}")
                result.append({
                    "Generated_SMILES": s,
                    "Formula": rdMolDescriptors.CalcMolFormula(mol),
                    "Epsilon": eps_series.iloc[i % len(eps_series)] if not eps_series.empty else None,
                    "Validity": 1,
                })
            else:
                logger.debug(f"{i}: valid molecule but no rings: {s}")

    logger.info(f"Generated: {total_generated}, Valid: {valid_count}, With rings: {ring_count}")
    logger.info("==== [generate_smiles] finished ====")

    return result