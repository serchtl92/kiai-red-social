import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import './ProfilePage.css';
import { useNavigate } from 'react-router-dom';

const SolicitudesAmistad = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarSolicitudes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      setUsuario(user);

      const { data: pendientes } = await supabase
        .from('amigos')
        .select('id, usuario_id, usuario_tipo')
        .eq('amigo_id', user.id)
        .eq('estado', 'pendiente');

      const detalladas = await Promise.all(
        (pendientes || []).map(async (sol) => {
          let data = null;
          if (sol.usuario_tipo.includes('sensei')) {
            const res = await supabase.from('senseis').select('nombre, foto_perfil').eq('user_id', sol.usuario_id).single();
            data = res.data;
          } else {
            const res = await supabase.from('estudiantes').select('nombre, foto_perfil').eq('id', sol.usuario_id).single();
            data = res.data;
          }

          return {
            id: sol.id,
            usuario_id: sol.usuario_id,
            tipo: sol.usuario_tipo,
            nombre: data?.nombre || 'Usuario',
            foto: data?.foto_perfil || '/default-avatar.png'
          };
        })
      );

      setSolicitudes(detalladas);
    };

    cargarSolicitudes();
  }, [navigate]);

  const aceptarSolicitud = async (id) => {
    await supabase.from('amigos').update({ estado: 'aceptado' }).eq('id', id);
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  const rechazarSolicitud = async (id) => {
    await supabase.from('amigos').delete().eq('id', id);
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="profile-mobile">
      <div className="top-bar">
        <span onClick={() => navigate(-1)}>🔙</span>
        <span>Solicitudes de Amistad</span>
        <span>👥</span>
      </div>

      {solicitudes.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>No tienes solicitudes pendientes.</p>
      ) : (
        <div className="sugerencias-scroll" style={{ flexDirection: 'column', gap: '12px', padding: '1rem' }}>
          {solicitudes.map((s) => (
            <div key={s.id} className="sugerencia-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={s.foto} alt="avatar" className="sugerencia-avatar" />
                <div style={{ marginLeft: '10px' }}>
                  <p className="sugerencia-nombre" style={{ marginBottom: '0' }}>{s.nombre}</p>
                  <span className="profile-rol">{s.tipo.includes('sensei') ? 'SENSEI' : 'ESTUDIANTE'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => aceptarSolicitud(s.id)} className="btn-amigo">Aceptar</button>
                <button onClick={() => rechazarSolicitud(s.id)} className="btn-delete">✖</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolicitudesAmistad;
