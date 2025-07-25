const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const db = require("./firebase");

const app = express();

// Permitir solo el frontend de Vercel
app.use(cors({
  origin: 'https://landing-contacto-omega.vercel.app',
  methods: ['POST'],
}));

app.use(bodyParser.json());

// Ruta para manejar el formulario de contacto
app.post("/api/contacto", async (req, res) => {
  const { nombre, correo, telefono, mensaje, captchaToken } = req.body;

  if (!nombre || !correo || !telefono || !mensaje || !captchaToken) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const captchaSecret = process.env.RECAPTCHA_SECRET;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecret}&response=${captchaToken}`
    );

    const data = response.data;

    if (!data.success) {
      return res.status(400).json({ error: "Captcha inválido" });
    }

    await db.collection("contactos").add({
      nombre,
      correo,
      telefono,
      mensaje,
      fecha: new Date(),
      captcha: {
        success: data.success,
        score: data.score || null,
        hostname: data.hostname || null,
        challenge_ts: data.challenge_ts || null,
      },
    });

    res.status(200).json({ mensaje: "Formulario enviado correctamente" });
  } catch (err) {
    console.error("Error en /api/contacto:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

const PORT = process.env.PORT || 4334;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
