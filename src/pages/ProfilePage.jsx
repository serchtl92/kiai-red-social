import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './ProfilePage.css';

const ProfilePage = () => {
  const [perfil, setPerfil] = useState(null);
  const [rol, setRol] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [amigos, setAmigos] = useState(0);
  const [dojoNombre, setDojoNombre] = useState('');
  const [orgNombre, setOrgNombre] = useState('');
  const [publicaciones, setPublicaciones] = useState([]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState({});
  const [archivo, setArchivo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data: sensei } = await supabase.from('senseis').select('*').eq('user_id', user.id).single();
      if (sensei) {
        setPerfil(sensei);
        setRol(sensei.rol);
        await fetchRelaciones(sensei.id, sensei.rol, sensei.dojo_id, sensei.organizacion_id);
        obtenerPublicaciones();
        return setLoading(false);
      }

      const { data: estudiante } = await supabase.from('estudiantes').select('*').eq('id', user.id).single();
      if (estudiante) {
        setPerfil(estudiante);
        setRol(estudiante.rol);
        await fetchRelaciones(estudiante.id, estudiante.rol, estudiante.dojo_id, estudiante.organizacion_id);
        obtenerPublicaciones();
      }

      setLoading(false);
    };

    const fetchRelaciones = async (id, tipo, dojo_id, organizacion_id) => {
      const { count } = await supabase
        .from('amigos')
        .select('*', { count: 'exact', head: true })
        .or(`usuario_id.eq.${id},amigo_id.eq.${id}`)
        .eq('estado', 'aceptado');
      setAmigos(count || 0);

      if (dojo_id) {
        const { data: dojo } = await supabase.from('dojos').select('nombre').eq('id', dojo_id).single();
        setDojoNombre(dojo?.nombre || '');
      }

      if (organizacion_id) {
        const { data: org } = await supabase.from('organizaciones').select('nombre').eq('id', organizacion_id).single();
        setOrgNombre(org?.nombre || '');
      }
    };

    fetchPerfil();
  }, [navigate]);

  const obtenerPublicaciones = async () => {
    const { data: publicacionesDB } = await supabase
      .from('publicaciones')
      .select('*')
      .order('creada_en', { ascending: false });

    if (!publicacionesDB) return;

    const publicacionesConTodo = await Promise.all(
      publicacionesDB.map(async (pub) => {
        const { data: reacciones } = await supabase
          .from('reacciones')
          .select('tipo, usuario_id')
          .eq('publicacion_id', pub.id);

        const resumen = { like: 0, love: 0, fire: 0 };
        reacciones?.forEach(r => { resumen[r.tipo] = (resumen[r.tipo] || 0) + 1; });

        const { data: autor } = pub.autor_tipo === 'sensei'
          ? await supabase.from('senseis').select('nombre, foto_perfil').eq('user_id', pub.autor_id).single()
          : await supabase.from('estudiantes').select('nombre, foto_perfil').eq('id', pub.autor_id).single();

        const { data: comentariosPub } = await supabase
          .from('comentarios')
          .select('id, texto, usuario_id, creada_en')
          .eq('publicacion_id', pub.id)
          .order('creada_en', { ascending: true });

        const comentariosConAutor = await Promise.all((comentariosPub || []).map(async (comentario) => {
          const { data: autorComentario } = await supabase
            .from('senseis')
            .select('nombre, foto_perfil')
            .eq('user_id', comentario.usuario_id)
            .single();
          if (!autorComentario) {
            const { data: estudianteComentario } = await supabase
              .from('estudiantes')
              .select('nombre, foto_perfil')
              .eq('id', comentario.usuario_id)
              .single();
            return {
              ...comentario,
              autorNombre: estudianteComentario?.nombre || 'Usuario desconocido',
              autorFoto: estudianteComentario?.foto_perfil || null
            };
          }
          return {
            ...comentario,
            autorNombre: autorComentario.nombre,
            autorFoto: autorComentario.foto_perfil || null
          };
        }));

        return {
          ...pub,
          reacciones: resumen,
          autor: autor || { nombre: 'Usuario desconocido', foto_perfil: null },
          comentarios: comentariosConAutor
        };
      })
    );

    setPublicaciones(publicacionesConTodo);
  };

  const manejarReaccion = async (publicacion_id, tipo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existente } = await supabase
      .from('reacciones')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('publicacion_id', publicacion_id)
      .single();

    if (existente) {
      if (existente.tipo === tipo) return;
      await supabase.from('reacciones')
        .update({ tipo })
        .eq('usuario_id', user.id)
        .eq('publicacion_id', publicacion_id);
    } else {
      await supabase.from('reacciones').insert({ publicacion_id, usuario_id: user.id, tipo });
    }

    obtenerPublicaciones();
  };

  const publicarEstado = async () => {
    if (!nuevoEstado.trim()) return;
    await supabase.from('publicaciones').insert({
      contenido: nuevoEstado,
      autor_id: perfil.id || perfil.user_id,
      autor_tipo: rol
    });
    setNuevoEstado('');
    setArchivo(null);
    obtenerPublicaciones();
  };

  const manejarComentario = async (publicacion_id) => {
    const texto = nuevoComentario[publicacion_id];
    const { data: { user } } = await supabase.auth.getUser();
    if (!texto || !user) return;
    await supabase.from('comentarios').insert({ publicacion_id, usuario_id: user.id, texto });
    setNuevoComentario((prev) => ({ ...prev, [publicacion_id]: '' }));
    obtenerPublicaciones();
  };

  const eliminarPublicacion = async (id) => {
    await supabase.from('publicaciones').delete().eq('id', id);
    obtenerPublicaciones();
  };

  const eliminarComentario = async (comentario_id) => {
    await supabase.from('comentarios').delete().eq('id', comentario_id);
    obtenerPublicaciones();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !perfil) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="profile-mobile">
      <div className="top-bar">
        <span>👤</span>
        <span>🔔</span>
        <span onClick={() => setMostrarMenu(!mostrarMenu)}>☰</span>
      </div>

      {mostrarMenu && (
        <div className="menu-dropdown">
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}

      <img src={perfil.foto_perfil || '/default-avatar.png'} alt="avatar" className="profile-avatar" />
      <h2 className="profile-nombre">{perfil.nombre}</h2>
      <p className="profile-rol">{rol.includes('sensei') ? 'SENSEI' : 'ESTUDIANTE'}</p>
      {orgNombre && <p className="info-secundaria">{orgNombre}</p>}
      {dojoNombre && <p className="info-secundaria">Dojo: {dojoNombre}</p>}

      <div className="profile-stats">
        <div><strong>{amigos}</strong><br />amigos</div>
        <div><strong>{perfil.grado || 'Sin grado'}</strong><br />grado</div>
        <div><strong>{perfil.insignias?.length || 0}</strong><br />insignias</div>
      </div>

      <button className="btn-amigo">Añadir amigo</button>

      <div className="estado-input">
        <input value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} type="text" placeholder="¿Qué estás pensando?" />
        <input type="file" onChange={(e) => setArchivo(e.target.files[0])} />
        <button onClick={publicarEstado}>Publicar</button>
      </div>

      {publicaciones.map((pub) => (
        <div key={pub.id} className="post">
          <div className="post-header">
            <img src={pub.autor.foto_perfil || '/default-avatar.png'} alt="avatar" className="post-avatar" />
            <div>
              <strong>{pub.autor.nombre}</strong>
              <p className="post-tiempo">{new Date(pub.creada_en).toLocaleString()}</p>
            </div>
            {(perfil.id === pub.autor_id || perfil.user_id === pub.autor_id) && (
              <button onClick={() => eliminarPublicacion(pub.id)} className="btn-delete">🗑️</button>
            )}
          </div>
          <div className="post-body">
            <p>{pub.contenido}</p>
          </div>
          <div className="reacciones">
            <button onClick={() => manejarReaccion(pub.id, 'like')}>👍 {pub.reacciones.like || 0}</button>
            <button onClick={() => manejarReaccion(pub.id, 'love')}>❤️ {pub.reacciones.love || 0}</button>
            <button onClick={() => manejarReaccion(pub.id, 'fire')}>🔥 {pub.reacciones.fire || 0}</button>
          </div>

          <div className="comentarios">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={nuevoComentario[pub.id] || ''}
              onChange={(e) => setNuevoComentario({ ...nuevoComentario, [pub.id]: e.target.value })}
            />
            <button onClick={() => manejarComentario(pub.id)}>Comentar</button>
            <p className="comentarios-count">💬 {pub.comentarios.length} comentarios</p>
            {pub.comentarios.map((c) => (
              <div key={c.id} className="comentario">
                <img src={c.autorFoto || '/default-avatar.png'} alt="avatar" className="post-avatar" style={{ width: '28px', height: '28px', marginRight: '8px' }} />
                <div style={{ flex: 1 }}>
                  <strong>{c.autorNombre}</strong>
                  <p className="post-tiempo" style={{ margin: 0 }}>{new Date(c.creada_en).toLocaleString()}</p>
                  <div className="comentario-burbuja">{c.texto}</div>
                </div>
                {(perfil.id === c.usuario_id || perfil.user_id === c.usuario_id) && (
                  <button onClick={() => eliminarComentario(c.id)} className="btn-delete">❌</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bottom-nav">
        <Link to="/profile">🏠</Link>
        <Link to="/publicaciones">🧾</Link>
        <Link to="/insignias">⭐</Link>
        <Link to="#">🔔</Link>
        <Link to="#">☰</Link>
      </div>
    </div>
  );
};

export default ProfilePage;
