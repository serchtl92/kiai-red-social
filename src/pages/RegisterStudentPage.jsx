import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import "./RegisterStudentPage.css";
import Lottie from "lottie-react";
import successAnimation from "../animations/success.json";

const RegisterStudentPage = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizacionId, setOrganizacionId] = useState("");
  const [senseiId, setSenseiId] = useState("");
  const [organizaciones, setOrganizaciones] = useState([]);
  const [senseis, setSenseis] = useState([]);
  const [dojoId, setDojoId] = useState(null); // NUEVO ESTADO
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizaciones = async () => {
      const { data, error } = await supabase.from("organizaciones").select("id, nombre");
      if (error) {
        console.error("Error al cargar organizaciones:", error);
      } else {
        setOrganizaciones(data);
      }
    };

    fetchOrganizaciones();
  }, []);

  useEffect(() => {
    const fetchSenseis = async () => {
      if (organizacionId && organizacionId !== "independiente") {
        const { data, error } = await supabase
          .from("senseis")
          .select("id, nombre, dojo_id") // TRAEMOS TAMBIÉN dojo_id
          .eq("organizacion_id", organizacionId);

        if (error) {
          console.error("Error al obtener senseis:", error);
        } else {
          setSenseis(data);
        }
      } else {
        setSenseis([]);
        setSenseiId(null);
        setDojoId(null);
      }
    };

    fetchSenseis();
  }, [organizacionId]);

  const handleSenseiChange = (e) => {
    const selectedSenseiId = e.target.value;
    setSenseiId(selectedSenseiId);

    // Buscamos el dojo_id del sensei seleccionado
    const senseiSeleccionado = senseis.find(s => s.id === selectedSenseiId);
    if (senseiSeleccionado) {
      setDojoId(senseiSeleccionado.dojo_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSuccess(false);

    if (!nombre || !email || !password || !organizacionId || (organizacionId !== "independiente" && !senseiId)) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError("Error al crear cuenta: " + authError.message);
        return;
      }

      const userId = authData.user.id;

      const { error: insertError } = await supabase.from("estudiantes").insert([{
        id: userId,
        nombre,
        email,
        password,
        aprobado: false,
        estado: "pendiente",
        organizacion_id: organizacionId === "independiente" ? null : organizacionId,
        sensei_id: organizacionId === "independiente" ? null : senseiId,
        dojo_id: organizacionId === "independiente" ? null : dojoId, // GUARDAMOS EL dojo_id TAMBIÉN
      }]);

      if (insertError) {
        setError("Error al guardar estudiante: " + insertError.message);
        return;
      }

      setSuccess(true);
      setMessage("Registro exitoso. Puedes iniciar sesión.");

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError("Hubo un problema al registrar al estudiante.");
    }
  };

  return (
    <div className="register-student-container">
      <form onSubmit={handleSubmit} className="register-student-form">
        <h2>Registro de Estudiante</h2>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
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
          value={organizacionId}
          onChange={(e) => setOrganizacionId(e.target.value)}
          required
        >
          <option value="">Selecciona una organización</option>
          <option value="independiente">Independiente</option>
          {organizaciones.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nombre}
            </option>
          ))}
        </select>

        {organizacionId !== "independiente" && (
          <select
            value={senseiId}
            onChange={handleSenseiChange}
            required
          >
            <option value="">Selecciona un sensei</option>
            {senseis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        {success ? (
          <div style={{ width: 200, margin: "auto" }}>
            <Lottie animationData={successAnimation} loop={false} />
            <p style={{ textAlign: "center" }}>¡Registro exitoso! Redirigiendo...</p>
          </div>
        ) : (
          <button type="submit">Registrar Estudiante</button>
        )}
      </form>
    </div>
  );
};

export default RegisterStudentPage;
