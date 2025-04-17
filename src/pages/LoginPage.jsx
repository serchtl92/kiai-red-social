import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './LoginPage.css';
import logo from '../assets/logo-kiai.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;

      if (email) {
        const { data: adminData } = await supabase
          .from('administradores')
          .select('id')
          .eq('email', email)
          .single();

        if (adminData) {
          navigate('/dashboard');
        } else {
          navigate('/profile');
        }
      }
    };

    checkSession();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      const user = data?.user;
      const userEmail = user?.email;

      if (!user) return;

      console.log("ID del usuario autenticado:", user.id);

      // ✅ Administrador
      const { data: adminData } = await supabase
        .from('administradores')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (adminData) {
        navigate('/dashboard');
        return;
      }

      // ✅ Sensei (buscado por email para actualizar user_id si hace falta)
      const { data: senseiData, error: senseiError } = await supabase
        .from('senseis')
        .select('id, rol, aprobado, user_id')
        .eq('email', userEmail)
        .single();

      if (senseiError) {
        console.log("Error al consultar sensei:", senseiError.message);
      }

      if (senseiData) {
        const { rol, aprobado, user_id, id: senseiRowId } = senseiData;

        // 🛠️ Asignar user_id si está vacío
        if (!user_id) {
          const { error: updateError } = await supabase
            .from('senseis')
            .update({ user_id: user.id })
            .eq('id', senseiRowId);

          if (updateError) {
            console.log('Error actualizando user_id del sensei:', updateError.message);
          } else {
            console.log('✅ user_id del sensei actualizado correctamente.');
          }
        }

        // 🔒 Redirección según rol y estado
        if (!aprobado) {
          navigate('/espera-validacion');
          return;
        }

        if (rol === 'sensei_lider') {
          const { data: organizacion } = await supabase
            .from('organizaciones')
            .select('id')
            .eq('sensei_id', user.id)
            .single();

          if (!organizacion) {
            navigate('/crear-organizacion');
            return;
          }
        }

        navigate('/profile');
        return;
      }

      // ✅ Estudiante
      const { data: estudianteData } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('id', user.id)
        .single();

      if (estudianteData) {
        navigate('/profile');
        return;
      }

      // ❌ No pertenece a ningún rol reconocido
      setError('Tu cuenta no está registrada.');
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
      setError('Hubo un error al iniciar sesión.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <img src={logo} alt="Kiai Logo" className="logo" />
        <h1>Iniciar sesión</h1>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLoginSubmit}>
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
          <button type="submit">Iniciar sesión</button>
        </form>

        <div className="register-options">
          <button onClick={() => navigate('/registrar-estudiante')}>Registrar Estudiante</button>
          <button onClick={() => navigate('/registrar-sensei')}>Registrar Sensei</button>
        </div>

        <div className="admin-register-link">
          <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
            ¿Eres una organización nueva?{' '}
            <a href="/registrar-sensei-lider">Registrar tu organización</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
