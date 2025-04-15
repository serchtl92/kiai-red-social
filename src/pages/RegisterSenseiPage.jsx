import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./RegisterSenseiPage.css";

const RegisterSenseiPage = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizacionSeleccionada, setOrganizacionSeleccionada] = useState("");
  const [organizaciones, setOrganizaciones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizaciones = async () => {
      const { data, error } = await supabase.from("organizaciones").select("id, nombre");
      if (!error && data) {
        setOrganizaciones(data);
      }
    };
    fetchOrganizaciones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert("Error al registrar en Supabase Auth: " + authError.message);
      return;
    }

    const user = data?.user;

    if (!user || !user.email) {
      alert("No se pudo obtener el usuario después del registro.");
      return;
    }

    const esIndependiente = organizacionSeleccionada === "independiente";

    const nuevoSensei = {
      id: user.id,
      nombre,
      email: user.email,
      rol: esIndependiente ? "independiente" : "sensei",
      aprobado: false,
      estado: "pendiente",
      organizacion_id: esIndependiente ? null : organizacionSeleccionada,
      sensei_id_superior: null,
    };

    const { error: insertError } = await supabase.from("senseis").insert([nuevoSensei]);

    if (insertError) {
      alert("Error al registrar sensei en la base de datos: " + insertError.message);
      return;
    }

    await supabase.auth.signOut();

    localStorage.setItem("registroPendiente", JSON.stringify({
      tipo: "sensei",
      rol: esIndependiente ? "independiente" : "sensei",
    }));

    navigate("/espera-validacion");
  };

  return (
    <div className="register-container">
      <h2>Registro de Sensei</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          value={organizacionSeleccionada}
          onChange={(e) => setOrganizacionSeleccionada(e.target.value)}
          required
        >
          <option value="">Selecciona una organización</option>
          {organizaciones.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nombre}
            </option>
          ))}
          <option value="independiente">Independiente</option>
        </select>
        <button type="submit">Registrar Sensei</button>
      </form>
    </div>
  );
};

export default RegisterSenseiPage;
