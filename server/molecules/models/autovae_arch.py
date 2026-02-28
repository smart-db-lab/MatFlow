import tensorflow as tf

class VAE(tf.keras.models.Model):
    def __init__(self, encoder: tf.keras.models.Model, decoder: tf.keras.models.Model):
        super().__init__()
        self.encoder, self.decoder = encoder, decoder
        self.loss_tracker = tf.keras.metrics.Mean(name="loss")

    def compile(self, optimizer):
        super().compile()
        self.optimizer = optimizer

    def call(self, x, training=None):
        z_mean, z_log_var, z = self.encoder(x, training=training)
        recon = self.decoder(z, training=training)
        return recon, z_mean, z_log_var

    def _compute_loss(self, x, recon, z_mean, z_log_var):
        recon_loss = tf.reduce_sum(
            tf.keras.losses.sparse_categorical_crossentropy(x, recon), axis=1
        )
        kl = -0.5 * tf.reduce_sum(1 + z_log_var - tf.square(z_mean) - tf.exp(z_log_var), axis=1)
        return tf.reduce_mean(recon_loss + kl)

    def train_step(self, data):
        x = data[0] if isinstance(data, tuple) else data
        with tf.GradientTape() as tape:
            recon, z_mean, z_log_var = self(x, training=True)
            loss = self._compute_loss(x, recon, z_mean, z_log_var)
        grads = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}

    def test_step(self, data):
        x = data[0] if isinstance(data, tuple) else data
        recon, z_mean, z_log_var = self(x, training=False)
        loss = self._compute_loss(x, recon, z_mean, z_log_var)
        self.loss_tracker.update_state(loss)
        return {"loss": self.loss_tracker.result()}
