const express = require("express");
const { pool, initDb } = require("./db");
const app = express();
app.use(require("cors")());
app.use(express.json());
const PORT = process.env.PORT || 3000;
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: "Error interno" });
});
app.get("/health", (req, res) => res.json({ status: "ok", service: "meditrack-api" }));
app.get("/pacientes", wrap(async (req, res) => {
  const { nombre } = req.query;
  if (nombre) {
    const { rows } = await pool.query(
      "SELECT * FROM pacientes WHERE nombre ILIKE $1 ORDER BY id",
      [`%${nombre}%`]
    );
    return res.json(rows);
  }
  const { rows } = await pool.query("SELECT * FROM pacientes ORDER BY id");
  res.json(rows);
}));
app.post("/pacientes", wrap(async (req, res) => {
  const { nombre, edad, nss, alergias } = req.body || {};
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
  const { rows } = await pool.query(
    "INSERT INTO pacientes (nombre, edad, nss, alergias) VALUES ($1,$2,$3,$4) RETURNING *",
    [nombre, edad, nss, alergias]
  );
  res.status(201).json(rows[0]);
}));
app.get("/pacientes/:id/registros", wrap(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM registros_medicos WHERE paciente_id = $1 ORDER BY fecha DESC",
    [req.params.id]
  );
  res.json(rows);
}));
app.post("/pacientes/:id/registros", wrap(async (req, res) => {
  const { diagnostico, receta, doctor, consultorio } = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO registros_medicos (paciente_id, diagnostico, receta, doctor, consultorio)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.params.id, diagnostico, receta, doctor, consultorio]
  );
  res.status(201).json(rows[0]);
}));
if (require.main === module) {
  initDb()
    .then(() => app.listen(PORT, () => console.log(`meditrack-api escuchando en el puerto ${PORT}`)))
    .catch((e) => { console.error("No se pudo iniciar la BD:", e); process.exit(1); });
}
module.exports = app;
