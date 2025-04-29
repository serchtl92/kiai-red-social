// src/pages/CrearOrganizacionPage.jsx
import React, { useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./CrearOrganizacionPage.css";

const CrearOrganizacionPage = () => {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("No se pudo obtener el usuario.");
      return;
    }

    try {
      // Buscar al sensei actual
      const { data: senseiData, error: senseiError } = await supabase
        .from("senseis")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (senseiError || !senseiData) {
        setError("No se encontró el sensei actual.");
        return;
      }

      // 1. Crear organización asignando sensei_id
      const { data: organizacion, error: organizacionError } = await supabase
        .from("organizaciones")
        .insert([{ 
          nombre,
          sensei_id: senseiData.id
        }])
        .select()
        .single();

      if (organizacionError) {
        setError("Error al crear organización: " + organizacionError.message);
        return;
      }

      // 2. Crear dojo principal
      const { data: dojo, error: dojoError } = await supabase
        .from("dojos")
        .insert([{
          nombre: `Dojo Central - ${nombre}`,
          ubicacion: ubicacion || "Sin ubicación",
          telefono: telefono || "Sin teléfono",
          organizacion_id: organizacion.id,
        }])
        .select()
        .single();

      if (dojoError) {
        setError("Error al crear dojo central: " + dojoError.message);
        return;
      }

      // 3. Actualizar sensei líder con organizacion_id y dojo_id
      const { error: senseiUpdateError } = await supabase
        .from("senseis")
        .update({
          organizacion_id: organizacion.id,
          dojo_id: dojo.id,
        })
        .eq("user_id", user.id);

      if (senseiUpdateError) {
        setError("Error al actualizar datos del sensei: " + senseiUpdateError.message);
        return;
      }

      navigate("/profile");
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    }
  };

  return (
    <div className="crear-organizacion-container">
      <form onSubmit={handleSubmit} className="crear-organizacion-form">
        <h2>Registrar Organización</h2>

        {error && <div className="error">{error}</div>}

        <input
          type="text"
          placeholder="Nombre de la organización"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Ubicación del dojo central"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        />
        <input
          type="text"
          placeholder="Teléfono del dojo central"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <button type="submit">Registrar Organización</button>
      </form>
    </div>
  );
};

export default CrearOrganizacionPage;
