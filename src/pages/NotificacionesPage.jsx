import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './NotificacionesPage.css';

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarNotificaciones = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data: sensei } = await supabase.from('senseis').select('*').eq('user_id', user.id).single();
      const { data: estudiante } = await supabase.from('estudiantes').select('*').eq('id', user.id).single();
      const usuario = sensei || estudiante;
      if (!usuario) return;

      setPerfil(usuario);

      const { data: notis } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('creada_en', { ascending: false });

      const notificacionesConDatos = await Promise.all(
        (notis || []).map(async (n) => {
          let origen = null;
          let foto = '/default-avatar.png';

          const { data: origenSensei } = await supabase
            .from('senseis')
            .select('nombre, foto_perfil')
            .eq('user_id', n.origen_id)
            .single();

          const { data: origenEstudiante } = await supabase
            .from('estudiantes')
            .select('nombre, foto_perfil')
            .eq('id', n.origen_id)
            .single();

          origen = origenSensei?.nombre || origenEstudiante?.nombre || n.origen_id.slice(0, 6);
          foto = origenSensei?.foto_perfil || origenEstudiante?.foto_perfil || '/default-avatar.png';

          let comentarioTexto = '';
          if (n.tipo === 'comentario') {
            const { data: comentario } = await supabase
              .from('comentarios')
              .select('texto')
              .eq('usuario_id', n.origen_id)
              .eq('publicacion_id', n.publicacion_id)
              .order('creada_en', { ascending: false })
              .limit(1)
              .single();

            comentarioTexto = comentario?.texto || '';
          }

          return {
            ...n,
            origen,
            comentarioTexto,
            foto,
          };
        })
      );

      setNotificaciones(notificacionesConDatos);

      await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('usuario_id', user.id)
        .eq('leida', false);
    };

    cargarNotificaciones();
  }, [navigate]);

  const renderTexto = (noti) => {
    if (noti.tipo === 'comentario') {
      return (
        <>
          comentó en tu publicación: <em>“{noti.comentarioTexto}”</em>
        </>
      );
    }
    if (noti.tipo === 'reaccion') return 'reaccionó a tu publicación';
    return 'tienes una nueva notificación';
  };

  const irAPublicacion = (id) => {
    navigate(`/publicaciones/${id}`);
  };

  return (
    <div className="notificaciones-page">
      <div className="notificaciones-header">
        <button onClick={() => navigate('/profile')}>🔙 Volver</button>
        <h2>Notificaciones</h2>
      </div>

      {notificaciones.length === 0 ? (
        <p className="noti-vacia">No tienes notificaciones aún.</p>
      ) : (
        <ul className="noti-lista">
          {notificaciones.map((n) => (
            <li
              key={n.id}
              className="noti-item"
              onClick={() => irAPublicacion(n.publicacion_id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`noti-contenido ${n.leida ? 'leida' : 'nueva'}`}>
                <div className="noti-perfil">
                  <img src={n.foto} alt="avatar" className="noti-avatar" />
                  <div>
                    <p><strong>{n.origen}</strong> {renderTexto(n)}</p>
                    <p className="noti-fecha">{new Date(n.creada_en).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificacionesPage;
