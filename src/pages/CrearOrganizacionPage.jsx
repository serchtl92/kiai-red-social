import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import "./CrearOrganizacionPage.css";

const CrearOrganizacionPage = () => {
  const [nombreOrganizacion, setNombreOrganizacion] = useState("");
  const [nombreDojoPrincipal, setNombreDojoPrincipal] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;

    if (!userId) {
      console.error("No se encontró el ID del usuario");
      return;
    }

    const { data: organizacionData, error: organizacionError } = await supabase
      .from("organizaciones")
      .insert([
        {
          nombre: nombreOrganizacion,
          telefono,
          direccion: ubicacion,
          sensei_id: userId,
        },
      ])
      .select()
      .single();

    if (organizacionError) {
      console.error("Error al crear la organización:", organizacionError);
      return;
    }

    const { data: dojoData, error: dojoError } = await supabase
      .from("dojos")
      .insert([
        {
          nombre: nombreDojoPrincipal,
          telefono,
          ubicacion,
          organizacion_id: organizacionData.id,
        },
      ]);

    if (dojoError) {
      console.error("Error al crear el dojo principal:", dojoError);
      return;
    }

    const { error: updateError } = await supabase
      .from("senseis")
      .update({ organizacion_id: organizacionData.id })
      .eq("id", userId);

    if (updateError) {
      console.error("Error al actualizar sensei:", updateError);
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="crear-organizacion-container">
      <form className="crear-organizacion-form" onSubmit={handleSubmit}>
        <h2>Registrar Organización</h2>
        <input
          type="text"
          placeholder="Nombre de la organización"
          value={nombreOrganizacion}
          onChange={(e) => setNombreOrganizacion(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nombre del dojo principal"
          value={nombreDojoPrincipal}
          onChange={(e) => setNombreDojoPrincipal(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <input
          type="text"
          placeholder="Ubicación"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default CrearOrganizacionPage;
