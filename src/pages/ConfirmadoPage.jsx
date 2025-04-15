import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

const ConfirmadoPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(async ({ error }) => {
        if (error) {
          console.error('Error al establecer sesión:', error);
        } else {
          console.log('✅ Sesión establecida');
          navigate('/crear-organizacion');
        }
      });
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>✅ ¡Cuenta confirmada!</h2>
      <p>Redirigiendo a la app...</p>
    </div>
  );
};

export default ConfirmadoPage;
