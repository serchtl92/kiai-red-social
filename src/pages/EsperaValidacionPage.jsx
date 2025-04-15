import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

const EsperaValidacion = () => {
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const datos = localStorage.getItem("registroPendiente");
    if (datos) {
      const { tipo, rol } = JSON.parse(datos);

      if (tipo === "sensei") {
        if (rol === "independiente") {
          setMensaje(
            "Tu cuenta ha sido registrada como sensei independiente. Un administrador validará tu perfil en las próximas horas."
          );
        } else {
          setMensaje(
            "Tu cuenta ha sido registrada como sensei. El sensei líder de tu organización deberá aprobar tu solicitud."
          );
        }
      } else if (tipo === "estudiante") {
        setMensaje(
          "Tu cuenta ha sido registrada como estudiante. Tu sensei deberá aprobar tu solicitud para completar el acceso."
        );
      } else {
        setMensaje("Tu cuenta ha sido registrada y está en espera de validación.");
      }
    } else {
      setMensaje("No se encontró información de registro pendiente.");
    }
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>Espera de Validación</h2>
      <p>{mensaje}</p>
      <button onClick={handleCerrarSesion}>Volver al inicio</button>
    </div>
  );
};

export default EsperaValidacion;
