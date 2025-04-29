// src/components/DashboardSensei/EstudiantesTab.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase/client";
import "./EstudiantesTab.css";

export default function EstudiantesTab({ perfil }) {
  const [estudiantesPendientes, setEstudiantesPendientes] = useState([]);
  const [senseisPendientes, setSenseisPendientes] = useState([]);
  const [modalSensei, setModalSensei] = useState(null);
  const [dojoNombre, setDojoNombre] = useState("");
  const [dojoDireccion, setDojoDireccion] = useState("");
  const [dojoTelefono, setDojoTelefono] = useState("");

  useEffect(() => {
    if (!perfil) return;

    const fetchDatos = async () => {
      try {
        // ✅ Mostrar estudiantes pendientes asignados a este sensei
        const { data: estudiantes } = await supabase
          .from("estudiantes")
          .select("*")
          .eq("aprobado", false)
          .eq("sensei_id", perfil.id); // 🔥 cambio clave

        setEstudiantesPendientes(estudiantes || []);

        // ✅ Solo sensei líder puede ver senseis pendientes sin dojo
        if (perfil.rol === "sensei_lider") {
          const { data: senseis } = await supabase
            .from("senseis")
            .select("*")
            .eq("aprobado", false)
            .eq("organizacion_id", perfil.organizacion_id)
            .is("dojo_id", null);

          setSenseisPendientes(senseis || []);
        } else {
          setSenseisPendientes([]);
        }
      } catch (error) {
        console.error("Error al cargar estudiantes o senseis", error);
      }
    };

    fetchDatos();
  }, [perfil]);

  const aprobarEstudiante = async (id) => {
    const { error } = await supabase
      .from("estudiantes")
      .update({ 
        aprobado: true,
        dojo_id: perfil.dojo_id // ✅ también asignamos el dojo
      })
      .eq("id", id);
  
    if (error) {
      alert("Error al aprobar estudiante");
      return;
    }
    setEstudiantesPendientes(estudiantesPendientes.filter(e => e.id !== id));
  };
  

  const aprobarSenseiConDojo = async () => {
    if (!modalSensei || !dojoNombre || !dojoDireccion || !dojoTelefono) {
      alert("Completa todos los campos del dojo");
      return;
    }

    const { data: nuevoDojo, error: errorDojo } = await supabase
      .from("dojos")
      .insert([{
        nombre: dojoNombre,
        ubicacion: dojoDireccion,
        telefono: dojoTelefono,
        organizacion_id: perfil.organizacion_id,
      }])
      .select()
      .single();

    if (errorDojo) {
      alert("Error al crear dojo");
      return;
    }

    const { error: errorSensei } = await supabase
      .from("senseis")
      .update({
        dojo_id: nuevoDojo.id,
        aprobado: true,
        estado: "activo"
      })
      .eq("id", modalSensei.id);

    if (errorSensei) {
      alert("Error al actualizar sensei");
      return;
    }

    setSenseisPendientes(senseisPendientes.filter(s => s.id !== modalSensei.id));
    setModalSensei(null);
    setDojoNombre("");
    setDojoDireccion("");
    setDojoTelefono("");
  };

  return (
    <div className="estudiantes-tab">
      <h2>Estudiantes pendientes</h2>
      {estudiantesPendientes.length === 0 ? (
        <p className="sin-datos">No hay estudiantes pendientes.</p>
      ) : (
        estudiantesPendientes.map(est => (
          <div key={est.id} className="tarjeta">
            <span>{est.nombre}</span>
            <button className="btn-aprobar" onClick={() => aprobarEstudiante(est.id)}>
              Aprobar
            </button>
          </div>
        ))
      )}

      {perfil.rol === "sensei_lider" && (
        <>
          <h2>Senseis pendientes</h2>
          {senseisPendientes.length === 0 ? (
            <p className="sin-datos">No hay senseis pendientes.</p>
          ) : (
            senseisPendientes.map(sen => (
              <div key={sen.id} className="tarjeta">
                <span>{sen.nombre}</span>
                <button className="btn-aprobar" onClick={() => setModalSensei(sen)}>
                  Aprobar y asignar dojo
                </button>
              </div>
            ))
          )}
        </>
      )}

      {modalSensei && (
        <div className="modal-fondo">
          <div className="modal">
            <h3 className="modal-titulo">Asignar dojo a {modalSensei.nombre}</h3>

            <input
              type="text"
              placeholder="Nombre del dojo"
              className="modal-input"
              value={dojoNombre}
              onChange={(e) => setDojoNombre(e.target.value)}
            />
            <input
              type="text"
              placeholder="Dirección del dojo"
              className="modal-input"
              value={dojoDireccion}
              onChange={(e) => setDojoDireccion(e.target.value)}
            />
            <input
              type="text"
              placeholder="Teléfono del dojo"
              className="modal-input"
              value={dojoTelefono}
              onChange={(e) => setDojoTelefono(e.target.value)}
            />

            <div className="modal-botones">
              <button className="btn-cancelar" onClick={() => setModalSensei(null)}>
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={aprobarSenseiConDojo}>
                Registrar y aprobar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
