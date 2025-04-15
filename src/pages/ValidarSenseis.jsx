import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/client";

const ValidarSenseis = () => {
  const [senseisPendientes, setSenseisPendientes] = useState([]);

  useEffect(() => {
    // Obtener todos los senseis con estado pendiente
    const fetchSenseisPendientes = async () => {
      const { data, error } = await supabase
        .from("senseis")
        .select("*")
        .eq("estado", "pendiente");

      if (error) {
        alert("Error al obtener los senseis pendientes: " + error.message);
      } else {
        setSenseisPendientes(data);
      }
    };

    fetchSenseisPendientes();
  }, []);

  const aprobarSensei = async (senseiId) => {
    const { error } = await supabase
      .from("senseis")
      .update({ estado: "aprobado" })
      .eq("id", senseiId);

    if (error) {
      alert("Error al aprobar el sensei: " + error.message);
    } else {
      alert("Sensei aprobado exitosamente.");
      setSenseisPendientes(
        senseisPendientes.filter((sensei) => sensei.id !== senseiId)
      );
    }
  };

  const rechazarSensei = async (senseiId) => {
    const { error } = await supabase
      .from("senseis")
      .delete()
      .eq("id", senseiId);

    if (error) {
      alert("Error al rechazar el sensei: " + error.message);
    } else {
      alert("Sensei rechazado.");
      setSenseisPendientes(
        senseisPendientes.filter((sensei) => sensei.id !== senseiId)
      );
    }
  };

  return (
    <div>
      <h1>Validar Senseis</h1>
      <ul>
        {senseisPendientes.map((sensei) => (
          <li key={sensei.id}>
            <p>{sensei.nombre}</p>
            <button onClick={() => aprobarSensei(sensei.id)}>Aprobar</button>
            <button onClick={() => rechazarSensei(sensei.id)}>Rechazar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidarSenseis;
