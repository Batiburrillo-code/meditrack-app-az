const API = "/api";
const { useState, useEffect, useCallback } = React;

function api(path, opts) {
  return fetch(API + path, opts).then(async (r) => {
    if (r.status === 204) return null;
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Error en el servidor");
    return d;
  });
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 640 } : null} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}>×</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function PacienteForm({ initial, onSubmit, onCancel }) {
  const [f, setF] = useState(initial || { nombre: "", edad: "", nss: "", alergias: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      nombre: f.nombre.trim(),
      edad: f.edad === "" || f.edad == null ? null : Number(f.edad),
      nss: f.nss ? String(f.nss).trim() : null,
      alergias: f.alergias ? f.alergias.trim() : null,
    });
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>Nombre *<input value={f.nombre} onChange={set("nombre")} required placeholder="Nombre del paciente" /></label>
      <label>Edad<input type="number" min="0" max="120" value={f.edad} onChange={set("edad")} placeholder="0 - 120" /></label>
      <label>Número de seguro social<input value={f.nss} onChange={set("nss")} placeholder="NSS (único)" /></label>
      <label>Alergias<input value={f.alergias} onChange={set("alergias")} placeholder="Ej. penicilina" /></label>
      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn primary">Guardar</button>
      </div>
    </form>
  );
}

function Expediente({ paciente, toast }) {
  const [regs, setRegs] = useState(null);
  const [f, setF] = useState({ diagnostico: "", receta: "", doctor: "", consultorio: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const load = useCallback(() => {
    api(`/pacientes/${paciente.id}/registros`).then(setRegs).catch((e) => toast(e.message, "error"));
  }, [paciente.id]);
  useEffect(load, [load]);
  const add = (e) => {
    e.preventDefault();
    api(`/pacientes/${paciente.id}/registros`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
      .then(() => { setF({ diagnostico: "", receta: "", doctor: "", consultorio: "" }); load(); toast("Consulta registrada", "success"); })
      .catch((e) => toast(e.message, "error"));
  };
  const del = (id) => {
    if (!window.confirm("¿Eliminar esta consulta?")) return;
    api(`/registros/${id}`, { method: "DELETE" }).then(() => { load(); toast("Consulta eliminada", "success"); }).catch((e) => toast(e.message, "error"));
  };
  return (
    <div>
      <div className="muted">Paciente</div>
      <h3 style={{ margin: "2px 0 12px" }}>{paciente.nombre}</h3>
      <form className="form" onSubmit={add}>
        <label>Diagnóstico<input value={f.diagnostico} onChange={set("diagnostico")} placeholder="Diagnóstico" /></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>Receta<input value={f.receta} onChange={set("receta")} placeholder="Medicamento" /></label>
          <label>Doctor<input value={f.doctor} onChange={set("doctor")} placeholder="Doctor" /></label>
        </div>
        <label>Consultorio<input value={f.consultorio} onChange={set("consultorio")} placeholder="Consultorio" /></label>
        <div className="form-actions"><button type="submit" className="btn primary sm">Agregar consulta</button></div>
      </form>
      <hr className="divider" />
      <div className="muted" style={{ marginBottom: 8 }}>Historial de consultas</div>
      {regs === null && <div className="muted">Cargando…</div>}
      {regs && regs.length === 0 && <div className="muted">Sin consultas registradas.</div>}
      {regs && regs.map((r) => (
        <div className="reg" key={r.id}>
          <div className="top">
            <span className="dx">{r.diagnostico || "Sin diagnóstico"}</span>
            <button className="btn danger sm" onClick={() => del(r.id)}>Eliminar</button>
          </div>
          <div className="fecha">{r.fecha ? new Date(r.fecha).toLocaleString() : ""}</div>
          {r.receta && <div className="row">Receta: {r.receta}</div>}
          {(r.doctor || r.consultorio) && <div className="row">Dr. {r.doctor || "—"} · Consultorio {r.consultorio || "—"}</div>}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [pacientes, setPacientes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [toastState, setToastState] = useState(null);
  const [form, setForm] = useState(null);
  const [exp, setExp] = useState(null);

  const toast = (msg, type) => { setToastState({ msg, type }); setTimeout(() => setToastState(null), 3000); };
  const load = useCallback((q) => {
    setLoading(true);
    api("/pacientes" + (q ? "?nombre=" + encodeURIComponent(q) : ""))
      .then((d) => { setPacientes(d); setLoading(false); })
      .catch((e) => { toast(e.message, "error"); setLoading(false); });
  }, []);
  useEffect(() => { load(""); api("/health").then(() => setHealth(true)).catch(() => setHealth(false)); }, [load]);

  const onSearch = (e) => { const q = e.target.value; setSearch(q); load(q); };
  const save = (data) => {
    const editing = form && form.paciente;
    const req = editing
      ? api(`/pacientes/${form.paciente.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      : api("/pacientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    req.then(() => { setForm(null); load(search); toast(editing ? "Paciente actualizado" : "Paciente creado", "success"); })
       .catch((e) => toast(e.message, "error"));
  };
  const del = (p) => {
    if (!window.confirm(`¿Eliminar a ${p.nombre}? Se borrará también su historial.`)) return;
    api(`/pacientes/${p.id}`, { method: "DELETE" }).then(() => { load(search); toast("Paciente eliminado", "success"); }).catch((e) => toast(e.message, "error"));
  };

  return (
    <div>
      <div className="header">
        <div className="brand">MediTrack <small>· Gestión de pacientes</small></div>
        <span className="count">{pacientes.length} paciente{pacientes.length === 1 ? "" : "s"}</span>
        <div className="health">
          <span className={"dot " + (health === true ? "ok" : health === false ? "bad" : "")}></span>
          API {health === true ? "en línea" : health === false ? "sin conexión" : "…"}
        </div>
      </div>
      <div className="wrap">
        <div className="toolbar">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={onSearch} placeholder="Buscar paciente por nombre…" />
          </div>
          <button className="btn primary" onClick={() => setForm({ paciente: null })}>+ Nuevo paciente</button>
        </div>
        {loading && <div className="muted">Cargando pacientes…</div>}
        {!loading && pacientes.length === 0 && (
          <div className="empty">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No hay pacientes</div>
            <div>Registra el primero con “+ Nuevo paciente”.</div>
          </div>
        )}
        {!loading && pacientes.length > 0 && (
          <div className="grid">
            {pacientes.map((p) => (
              <div className="card" key={p.id}>
                <h3>{p.nombre}</h3>
                <div className="meta">{p.edad != null ? p.edad + " años" : "Edad N/D"} · NSS {p.nss || "—"}</div>
                {p.alergias
                  ? <span className="badge alergia">Alergias: {p.alergias}</span>
                  : <span className="badge ok">Sin alergias</span>}
                <div className="card-actions">
                  <button className="btn ghost sm" onClick={() => setExp(p)}>Expediente</button>
                  <button className="btn ghost sm" onClick={() => setForm({ paciente: p })}>Editar</button>
                  <button className="btn danger sm" onClick={() => del(p)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {form && (
        <Modal title={form.paciente ? "Editar paciente" : "Nuevo paciente"} onClose={() => setForm(null)}>
          <PacienteForm
            initial={form.paciente ? { nombre: form.paciente.nombre, edad: form.paciente.edad ?? "", nss: form.paciente.nss ?? "", alergias: form.paciente.alergias ?? "" } : null}
            onSubmit={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
      {exp && (
        <Modal title="Expediente médico" wide onClose={() => setExp(null)}>
          <Expediente paciente={exp} toast={toast} />
        </Modal>
      )}
      {toastState && <div className={"toast " + toastState.type}>{toastState.msg}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
