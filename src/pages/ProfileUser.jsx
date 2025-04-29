// src/pages/ProfileUser.jsx

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './ProfilePage.css';

const ProfileUser = () => {
  const { id } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [rol, setRol] = useState('');
  const [dojoNombre, setDojoNombre] = useState('');
  const [orgNombre, setOrgNombre] = useState('');
  const [publicaciones, setPublicaciones] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState({});
  const [reaccionHover, setReaccionHover] = useState({});
  const [estadoAmistad, setEstadoAmistad] = useState('');
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: trae la URL de la foto activa del usuario
  const fetchActivePhoto = async (userId) => {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('url')
      .eq('usuario_id', userId)
      .eq('activo', true)
      .single();
    return !error && data?.url ? data.url : null;
  };

  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);

      // 1) usuario autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUsuarioLogueado(user);

      // 2) datos de sensei o estudiante
      let { data: perfilData, error } = await supabase
        .from('senseis')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error || !perfilData) {
        ({ data: perfilData } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('id', id)
          .single());
      }
      if (!perfilData) {
        setLoading(false);
        return;
      }

      // 3) sobrescribe foto_perfil con la URL activa si existe
      const activeUrl = await fetchActivePhoto(perfilData.user_id || perfilData.id);
      perfilData.foto_perfil = activeUrl || perfilData.foto_perfil || '/default-avatar.png';

      setPerfil(perfilData);
      setRol(perfilData.rol || '');

      // 4) dojo y organización
      if (perfilData.dojo_id) {
        const { data: dojo } = await supabase
          .from('dojos')
          .select('nombre')
          .eq('id', perfilData.dojo_id)
          .single();
        setDojoNombre(dojo?.nombre || '');
      }
      if (perfilData.organizacion_id) {
        const { data: org } = await supabase
          .from('organizaciones')
          .select('nombre')
          .eq('id', perfilData.organizacion_id)
          .single();
        setOrgNombre(org?.nombre || '');
      }

      // 5) estado de amistad
      await verificarAmistad(user.id);

      // 6) cargar publicaciones
      await cargarPublicaciones();

      setLoading(false);
    };

    cargarPerfil();
  }, [id]);

  const verificarAmistad = async (miId) => {
    const { data: amistad } = await supabase
      .from('amigos')
      .select('estado')
      .or(
        `and(usuario_id.eq.${miId},amigo_id.eq.${id}),and(usuario_id.eq.${id},amigo_id.eq.${miId})`
      )
      .maybeSingle();
    setEstadoAmistad(amistad?.estado || '');
  };

  const enviarSolicitudAmistad = async () => {
    if (!usuarioLogueado) return;
    await supabase.from('amigos').insert({
      usuario_id: usuarioLogueado.id,
      amigo_id: id,
      usuario_tipo: 'sensei',
      amigo_tipo: rol,
      estado: 'pendiente',
    });
    setEstadoAmistad('pendiente');
  };

  const cargarPublicaciones = async () => {
    const { data: publicacionesDB } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('autor_id', id)
      .order('creada_en', { ascending: false });
    if (!publicacionesDB) return;

    const pubs = await Promise.all(
      publicacionesDB.map(async (pub) => {
        // reacciones
        const { data: reacciones } = await supabase
          .from('reacciones')
          .select('tipo, usuario_id')
          .eq('publicacion_id', pub.id);
        const resumen = { like: 0, love: 0, fire: 0 };
        const detalles = { like: [], love: [], fire: [] };
        for (const r of reacciones || []) {
          resumen[r.tipo] = (resumen[r.tipo] || 0) + 1;
          const { data: s } = await supabase
            .from('senseis')
            .select('nombre, foto_perfil')
            .eq('user_id', r.usuario_id)
            .maybeSingle();
          const usuario = s || (await supabase
            .from('estudiantes')
            .select('nombre, foto_perfil')
            .eq('id', r.usuario_id)
            .maybeSingle()).data;
          detalles[r.tipo].push(usuario);
        }

        // comentarios
        const { data: comentariosDB } = await supabase
          .from('comentarios')
          .select('id, texto, usuario_id, creada_en')
          .eq('publicacion_id', pub.id)
          .order('creada_en', { ascending: true });
        const comentarios = await Promise.all(
          (comentariosDB || []).map(async (c) => {
            const { data: s } = await supabase
              .from('senseis')
              .select('nombre, foto_perfil')
              .eq('user_id', c.usuario_id)
              .maybeSingle();
            const autor = s || (await supabase
              .from('estudiantes')
              .select('nombre, foto_perfil')
              .eq('id', c.usuario_id)
              .maybeSingle()).data;

            // foto activa del autor del comentario
            const activeUrl = await fetchActivePhoto(c.usuario_id);
            return {
              ...c,
              autorNombre: autor?.nombre || 'Usuario desconocido',
              autorFoto: activeUrl || autor?.foto_perfil || '/default-avatar.png',
            };
          })
        );

        return {
          ...pub,
          reacciones: resumen,
          quienesReaccionaron: detalles,
          comentarios,
        };
      })
    );

    setPublicaciones(pubs);
  };

  const manejarReaccion = async (pubId, tipo) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existente } = await supabase
      .from('reacciones')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('publicacion_id', pubId)
      .maybeSingle();

    if (existente) {
      if (existente.tipo !== tipo) {
        await supabase
          .from('reacciones')
          .update({ tipo })
          .eq('usuario_id', user.id)
          .eq('publicacion_id', pubId);
      }
    } else {
      await supabase
        .from('reacciones')
        .insert({ publicacion_id: pubId, usuario_id: user.id, tipo });
    }
    cargarPublicaciones();
  };

  const manejarComentario = async (pubId) => {
    const texto = nuevoComentario[pubId];
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!texto || !user) return;

    await supabase
      .from('comentarios')
      .insert({ publicacion_id: pubId, usuario_id: user.id, texto });
    setNuevoComentario((p) => ({ ...p, [pubId]: '' }));
    cargarPublicaciones();
  };

  if (loading || !perfil) {
    return <div className="loading">Cargando perfil…</div>;
  }

  return (
    <div className="profile-mobile">
      {/* cabecera */}
      <div className="top-bar">
        <span onClick={() => window.history.back()}>🔙</span>
        <span>Perfil</span>
      </div>

      <img
        src={perfil.foto_perfil}
        alt="avatar"
        className="profile-avatar"
      />
      <h2 className="profile-nombre">{perfil.nombre}</h2>  
      <p className="profile-rol">
        {rol.includes('sensei') ? 'SENSEI' : 'ESTUDIANTE'}
      </p>
      {orgNombre && <p className="info-secundaria">{orgNombre}</p>}
      {dojoNombre && <p className="info-secundaria">Dojo: {dojoNombre}</p>}

      {/* estado de amistad */}
      {estadoAmistad === 'aceptado' ? (
        <p className="estado-amistad">✅ Ya son amigos</p>
      ) : estadoAmistad === 'pendiente' ? (
        <p className="estado-amistad">⏳ Solicitud enviada</p>
      ) : (
        <button onClick={enviarSolicitudAmistad} className="btn-amigo">
          Añadir amigo
        </button>
      )}

      <h3 className="titulo-publicaciones">Publicaciones</h3>

      {publicaciones.map((pub) => (
        <div key={pub.id} className="post">
          {/* header publicación */}
          <div className="post-header">
            <Link to={`/usuario/${id}`}>
              <img
                src={perfil.foto_perfil}
                alt="avatar"
                className="post-avatar"
              />
            </Link>
            <div>
              <Link to={`/usuario/${id}`}>
                <strong>{perfil.nombre}</strong>
              </Link>
              <p className="post-tiempo">
                {new Date(pub.creada_en).toLocaleString()}
              </p>
            </div>
          </div>

          {/* cuerpo publicación */}
          <div className="post-body">
            <p>{pub.contenido}</p>
          </div>

          {/* reacciones */}
          <div className="reacciones">
            {['like', 'love', 'fire'].map((tipo) => (
              <button
                key={tipo}
                type="button"
                className="reaccion-icono"
                onClick={() => manejarReaccion(pub.id, tipo)}
                onMouseEnter={() =>
                  setReaccionHover({ [`${pub.id}_${tipo}`]: true })
                }
                onMouseLeave={() =>
                  setReaccionHover({ [`${pub.id}_${tipo}`]: false })
                }
              >
                {tipo === 'like' ? '👍' : tipo === 'love' ? '❤️' : '🔥'}{' '}
                {pub.reacciones[tipo] || 0}
              </button>
            ))}
          </div>

          {/* comentarios */}
          <div className="comentarios">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={nuevoComentario[pub.id] || ''}
              onChange={(e) =>
                setNuevoComentario({
                  ...nuevoComentario,
                  [pub.id]: e.target.value,
                })
              }
            />
            <button onClick={() => manejarComentario(pub.id)}>
              Comentar
            </button>
            {pub.comentarios.map((c) => (
              <div key={c.id} className="comentario">
                <Link to={`/usuario/${c.usuario_id}`}>
                  <img
                    src={c.autorFoto}
                    alt="avatar"
                    className="post-avatar"
                    style={{ width: 28, height: 28, marginRight: 8 }}
                  />
                </Link>
                <div style={{ flex: 1 }}>
                  <Link to={`/usuario/${c.usuario_id}`}>
                    <strong>{c.autorNombre}</strong>
                  </Link>
                  <p className="post-tiempo" style={{ margin: 0 }}>
                    {new Date(c.creada_en).toLocaleString()}
                  </p>
                  <div className="comentario-burbuja">{c.texto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileUser;
