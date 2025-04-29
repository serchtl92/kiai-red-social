import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MiOrganizacionTab.css";

export default function MiOrganizacionTab({ perfil }) {
  const [dojos, setDojos] = useState([]);
  const [senseis, setSenseis] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [dojoSeleccionado, setDojoSeleccionado] = useState("todos");
  const [eliminando, setEliminando] = useState({});
  const [cargando, setCargando] = useState(true); // 🔥 Nuevo estado de carga

  // 🔥 Ahora cargarDatos está afuera del useEffect para poder reutilizarlo
  const cargarDatos = async () => {
    if (!perfil) return;

    setCargando(true); // 🔥 Mostrar cargando antes de la consulta

    const { data: dojosData } = await supabase
      .from("dojos")
      .select("*")
      .eq("organizacion_id", perfil.organizacion_id);

    const { data: senseisData } = await supabase
      .from("senseis")
      .select("id, nombre, foto_perfil, dojo_id, organizacion_id, dojos(nombre)")
      .eq("organizacion_id", perfil.organizacion_id)
      .eq("aprobado", true);

    const { data: estudiantesData } = await supabase
      .from("estudiantes")
      .select("id, nombre, foto_perfil, sensei_id, dojo_id, organizacion_id")
      .eq("organizacion_id", perfil.organizacion_id)
      .eq("aprobado", true);

    setDojos(dojosData || []);
    setSenseis(senseisData || []);
    setEstudiantes(estudiantesData || []);

    setCargando(false); // 🔥 Ocultar cargando después de obtener datos
  };

  useEffect(() => {
    cargarDatos();
  }, [perfil]);

  const senseisFiltrados = dojoSeleccionado === "todos"
    ? senseis
    : senseis.filter((s) => s.dojo_id === dojoSeleccionado);

  const estudiantesFiltrados = dojoSeleccionado === "todos"
    ? estudiantes
    : estudiantes.filter((e) => e.dojo_id === dojoSeleccionado);

  const obtenerNombreDojo = (dojoId) => {
    if (!dojoId) return "Independiente";
    const dojo = dojos.find((d) => d.id === dojoId);
    return dojo ? dojo.nombre : "Independiente";
  };

  const obtenerDojoDelEstudiante = (dojoId) => {
    const dojo = dojos.find((d) => d.id === dojoId);
    return dojo ? dojo.nombre : "Independiente";
  };

  const darDeBajaUsuario = async (id, tipo) => {
    const confirmacion = window.confirm(`¿Estás seguro de dar de baja este ${tipo}?`);
    if (!confirmacion) return;

    setEliminando((prev) => ({ ...prev, [id]: true }));

    setTimeout(async () => {
      if (tipo === "sensei") {
        const { error } = await supabase
          .from("senseis")
          .update({ organizacion_id: null, dojo_id: null })
          .eq("id", id);

        if (error) {
          alert("Error al dar de baja al sensei.");
        } else {
          toast.success("Sensei dado de baja exitosamente ✅");
          cargarDatos(); // 🔥 Volver a cargar datos
        }
      }

      if (tipo === "estudiante") {
        const { error } = await supabase
          .from("estudiantes")
          .update({ organizacion_id: null, sensei_id: null, dojo_id: null })
          .eq("id", id);

        if (error) {
          alert("Error al dar de baja al estudiante.");
        } else {
          toast.success("Estudiante dado de baja exitosamente ✅");
          cargarDatos(); // 🔥 Volver a cargar datos
        }
      }
    }, 300);
  };

  return (
    <div className="mi-organizacion-tab">
      <h2>Mi Organización</h2>

      <select
        className="select-dojo"
        value={dojoSeleccionado}
        onChange={(e) => setDojoSeleccionado(e.target.value)}
      >
        <option value="todos">Todos los dojos</option>
        {dojos.map((dojo) => (
          <option key={dojo.id} value={dojo.id}>
            {dojo.nombre}
          </option>
        ))}
      </select>

      {cargando ? (
        <p className="cargando">Cargando datos...</p> // 🔥 Mostrar mensaje mientras carga
      ) : (
        <>
          <h3>Senseis</h3>
          {senseisFiltrados.length === 0 ? (
            <p className="sin-datos">No hay senseis en este dojo.</p>
          ) : (
            senseisFiltrados.map((sen) => (
              <div
                key={sen.id}
                className={`tarjeta-usuario ${eliminando[sen.id] ? "desaparecer" : ""}`}
              >
                <img
                  src={sen.foto_perfil || "/default-avatar.png"}
                  alt="Foto de perfil"
                  className="avatar-mini"
                />
                <div className="info-usuario">
                  <p className="nombre-usuario">{sen.nombre}</p>
                  <p className="dojo-usuario">{obtenerNombreDojo(sen.dojo_id)}</p>
                </div>
                {perfil.rol === "sensei_lider" && (
                  <button className="btn-dar-baja" onClick={() => darDeBajaUsuario(sen.id, "sensei")}>
                    Dar de baja
                  </button>
                )}
              </div>
            ))
          )}

          <h3>Estudiantes</h3>
          {estudiantesFiltrados.length === 0 ? (
            <p className="sin-datos">No hay estudiantes en este dojo.</p>
          ) : (
            estudiantesFiltrados.map((est) => (
              <div
                key={est.id}
                className={`tarjeta-usuario ${eliminando[est.id] ? "desaparecer" : ""}`}
              >
                <img
                  src={est.foto_perfil || "/default-avatar.png"}
                  alt="Foto de perfil"
                  className="avatar-mini"
                />
                <div className="info-usuario">
                  <p className="nombre-usuario">{est.nombre}</p>
                  <p className="dojo-usuario">{obtenerDojoDelEstudiante(est.dojo_id)}</p>
                </div>
                {perfil.id === est.sensei_id && (
                  <>
                    <Link to={`/finanzas/${est.id}`} className="btn-finanzas">
                      Finanzas
                    </Link>
                    <button className="btn-dar-baja" onClick={() => darDeBajaUsuario(est.id, "estudiante")}>
                      Dar de baja
                    </button>
                  </>
                )}
                {perfil.rol === "sensei_lider" && perfil.id !== est.sensei_id && (
                  <button className="btn-dar-baja" onClick={() => darDeBajaUsuario(est.id, "estudiante")}>
                    Dar de baja
                  </button>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
