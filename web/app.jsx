const API = "/api";
const { useState, useEffect } = React;
function App() {
  const [pacientes, setPacientes] = useState([]);
  const [form, setForm] = useState({ nombre:"", edad:"", nss:"", alergias:"" });
  const cargar = () => fetch(API + "/pacientes").then(r => r.json()).then(setPacientes);
  useEffect(() => { cargar(); }, []);
  const guardar = (e) => {
    e.preventDefault();
    fetch(API + "/pacientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    }).then(() => { setForm({ nombre:"", edad:"", nss:"", alergias:"" }); cargar(); });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div>
      <h1>MediTrack — Pacientes</h1>
      <form onSubmit={guardar}>
        <input placeholder="Nombre" value={form.nombre} onChange={set("nombre")} required />
        <input placeholder="Edad" value={form.edad} onChange={set("edad")} />
        <input placeholder="Numero de seguro social" value={form.nss} onChange={set("nss")} />
        <input placeholder="Alergias" value={form.alergias} onChange={set("alergias")} />
        <button type="submit">Dar de alta paciente</button>
      </form>
      <h2>Pacientes registrados</h2>
      <ul>
        {pacientes.map(p => (
          <li key={p.id}>{p.nombre} — {p.edad} anios — SS: {p.nss} — Alergias: {p.alergias}</li>
        ))}
      </ul>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
