import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const RegistrarSenseiLider = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Crear usuario en Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError('Error al registrar usuario: ' + signUpError.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setError('No se pudo obtener el usuario registrado.');
      return;
    }

    // 2. Insertar en la tabla `senseis`
    const { error: insertError } = await supabase.from('senseis').insert({
      id: user.id,
      nombre,
      email,
      rol: 'sensei_lider',
      estado: 'pendiente',
      aprobado: false,
      foto_perfil: null,
      progreso: 0,
      insignias: [],
    });

    if (insertError) {
      setError('Error al guardar en tabla senseis: ' + insertError.message);
      return;
    }

    // 3. Cerrar sesión después del registro
    await supabase.auth.signOut();

    alert('✅ Registro exitoso. Espera validación del administrador.');
    navigate('/');
  };

  return (
    <div className="profile-container">
      <h2>Registro de Sensei Líder</h2>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Registrar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default RegistrarSenseiLider;
