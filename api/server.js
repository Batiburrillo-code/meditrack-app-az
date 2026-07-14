const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const alergias = []; // en memoria por ahora; luego será PostgreSQL

// health check para las probes de Kubernetes
app.get("/health", (req, res) => res.json({ status: "ok", service: "meditrack-api" }));

// listar alergias
app.get("/alergias", (req, res) => res.json(alergias));

// registrar una alergia
app.post("/alergias", (req, res) => {
  const { paciente, alergia } = req.body || {};
  if (!paciente || !alergia)
    return res.status(400).json({ error: "Se requiere 'paciente' y 'alergia'" });
  const registro = { id: alergias.length + 1, paciente, alergia };
  alergias.push(registro);
  res.status(201).json(registro);
});

app.get("/", (req, res) => res.send("MediTrack API - registrar alergias en Azure - v1.4"));

app.listen(PORT, () => console.log(`meditrack-api escuchando en puerto ${PORT}`));
