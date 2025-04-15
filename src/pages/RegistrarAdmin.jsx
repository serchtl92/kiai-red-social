import React, { useState } from 'react';
import { supabase } from '../supabase/client';

const RegistrarAdmin = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    // Paso 1: Crear el usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    });

    if (authError) {
      setError('Error al crear el usuario: ' + authError.message);
      return;
    }

    const user = data?.user;
    if (!user) {
      setError('No se pudo obtener el usuario recién creado.');
      return;
    }

    // Paso 2: Insertar en la tabla administradores
    const { error: dbError } = await supabase.from('administradores').insert([
      {
        nombre: formData.nombre,
        email: formData.email,
        auth_id: user.id
      }
    ]);

    if (dbError) {
      setError('Error al guardar en la tabla administradores: ' + dbError.message);
      return;
    }

    setMensaje('✅ Administrador registrado correctamente. Revisa tu correo para confirmar.');
    setFormData({ nombre: '', email: '', password: '' });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>Registrar Administrador</h2>

      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default RegistrarAdmin;
