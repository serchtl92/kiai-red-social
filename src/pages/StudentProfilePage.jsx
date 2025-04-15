import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client'; // Ruta correcta a tu cliente de Supabase
import { useNavigate } from 'react-router-dom';
import './StudentProfilePage.css'; // Aquí va el archivo de estilos que vamos a crear

const StudentProfilePage = () => {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Obtener el estudiante logueado
  const getStudentData = async () => {
    const user = supabase.auth.user();
    if (!user) {
      navigate('/'); // Redirigir al login si no está autenticado
      return;
    }

    try {
      // Obtener datos del estudiante desde Supabase usando el email
      const { data, error } = await supabase
        .from('estudiantes')  // Aquí usamos 'estudiantes'
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      setError('Hubo un problema al obtener los datos.');
    }
  };

  useEffect(() => {
    getStudentData(); // Llamamos a la función cuando se monta el componente
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-profile-container">
      {student ? (
        <div className="student-profile">
          <h2>Perfil de Estudiante</h2>
          <p><strong>Nombre:</strong> {student.name}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Sensei:</strong> {student.sensei}</p>
          <p><strong>Estado:</strong> {student.status}</p>
        </div>
      ) : (
        <p>Cargando datos del estudiante...</p>
      )}
    </div>
  );
};

export default StudentProfilePage;
