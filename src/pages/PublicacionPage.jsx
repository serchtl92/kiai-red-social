import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './PublicacionPage.css';

export default function PublicacionPage() {
  const { id } = useParams();           // ID de la publicación
  const navigate = useNavigate();

  // Estados principales
  const [publicacion, setPublicacion] = useState(null);
  const [autorPub, setAutorPub] = useState({ nombre: '', foto_perfil: '' });
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [respuestasTexto, setRespuestasTexto] = useState({});
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [usuario, setUsuario] = useState(null);

  // Reacciones
  const [reacciones, setReacciones] = useState({ like: 0, love: 0, fire: 0 });
  const [quienesReaccionaron, setQuienesReaccionaron] = useState({
    like: [],
    love: [],
    fire: [],
  });

  // Al cargar la página...
  useEffect(() => {
    const cargarTodo = async () => {
      // 1) Usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');
      setUsuario(user);

      // 2) Publicación
      const { data: pub } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('id', id)
        .single();
      setPublicacion(pub);

      // 3) Autor
      const { data: s } = await supabase
        .from('senseis')
        .select('nombre, foto_perfil')
        .eq('user_id', pub.autor_id)
        .single();
      const { data: e } = await supabase
        .from('estudiantes')
        .select('nombre, foto_perfil')
        .eq('id', pub.autor_id)
        .single();
      setAutorPub(s || e || { nombre: 'Desconocido', foto_perfil: '' });

      // 4) Reacciones de la publicación
      await fetchReacciones();

      // 5) Comentarios
      await fetchComentarios();
    };

    cargarTodo();
  }, [id, navigate]);

  // ——— Fetch de reacciones ———
  const fetchReacciones = async () => {
    const { data: reactDB } = await supabase
      .from('reacciones')
      .select('tipo, usuario_id')
      .eq('publicacion_id', id);

    const resumen = { like: 0, love: 0, fire: 0 };
    const detalles = { like: [], love: [], fire: [] };

    for (const r of reactDB || []) {
      if (!['like','love','fire'].includes(r.tipo)) continue;
      resumen[r.tipo] += 1;
      // Traer nombre/foto de quien reaccionó
      const { data: sensei } = await supabase
        .from('senseis')
        .select('nombre, foto_perfil')
        .eq('user_id', r.usuario_id)
        .single();
      const { data: estudiante } = await supabase
        .from('estudiantes')
        .select('nombre, foto_perfil')
        .eq('id', r.usuario_id)
        .single();
      detalles[r.tipo].push(sensei || estudiante || { nombre: 'Desconocido', foto_perfil: '' });
    }

    setReacciones(resumen);
    setQuienesReaccionaron(detalles);
  };

  // ——— Manejador de click en reacción ———
  const manejarReaccion = async (tipo) => {
    if (!usuario) return;
    // Checa si ya hay reacción
    const { data: existente } = await supabase
      .from('reacciones')
      .select('*')
      .eq('usuario_id', usuario.id)
      .eq('publicacion_id', id)
      .single();

    if (existente) {
      if (existente.tipo === tipo) return;
      await supabase
        .from('reacciones')
        .update({ tipo })
        .eq('usuario_id', usuario.id)
        .eq('publicacion_id', id);
    } else {
      await supabase
        .from('reacciones')
        .insert({ publicacion_id: id, usuario_id: usuario.id, tipo });
    }
    await fetchReacciones();
  };

  // ——— Fetch de comentarios jerárquicos ———
  const fetchComentarios = async () => {
    const { data: comDB } = await supabase
      .from('comentarios')
      .select('id, texto, usuario_id, creada_en, comentario_padre_id')
      .eq('publicacion_id', id)
      .order('creada_en', { ascending: true });

    const tmp = await Promise.all(
      (comDB || []).map(async (c) => {
        const { data: s } = await supabase
          .from('senseis')
          .select('nombre, foto_perfil')
          .eq('user_id', c.usuario_id)
          .single();
        const { data: e } = await supabase
          .from('estudiantes')
          .select('nombre, foto_perfil')
          .eq('id', c.usuario_id)
          .single();
        return {
          ...c,
          autor: s || e || { nombre: 'Desconocido', foto_perfil: '' },
          respuestas: [],
        };
      })
    );

    const mapa = {};
    tmp.forEach(c => (mapa[c.id] = c));
    const jer = [];
    tmp.forEach(c => {
      if (c.comentario_padre_id) {
        mapa[c.comentario_padre_id]?.respuestas.push(c);
      } else {
        jer.push(c);
      }
    });

    setComentarios(jer);
  };

  // ——— Comentar / responder ———
  const manejarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    await supabase
      .from('comentarios')
      .insert({ publicacion_id: id, usuario_id: usuario.id, texto: nuevoComentario.trim() });
    setNuevoComentario('');
    await fetchComentarios();
  };

  const manejarRespuesta = async (padre) => {
    const texto = respuestasTexto[padre];
    if (!texto?.trim()) return;
    await supabase
      .from('comentarios')
      .insert({
        publicacion_id: id,
        usuario_id: usuario.id,
        texto: texto.trim(),
        comentario_padre_id: padre,
      });
    setRespuestasTexto(prev => ({ ...prev, [padre]: '' }));
    setRespondiendoA(null);
    await fetchComentarios();
  };

  // ——— Render de respuestas anidadas ———
  const renderRespuestas = (resps, nivel = 1) => {
    return resps.map(r => (
      <div key={r.id} className="comentario respuesta" style={{ marginLeft: `${nivel*20}px` }}>
        <img
          src={r.autor.foto_perfil || '/default-avatar.png'}
          alt=""
          className="comentario-avatar clickable-perfil"
          onClick={() => navigate(`/usuario/${r.usuario_id}`)}
        />
        <div>
          <strong
            className="clickable-perfil"
            onClick={() => navigate(`/usuario/${r.usuario_id}`)}
          >{r.autor.nombre}</strong>
          <p className="comentario-fecha">{new Date(r.creada_en).toLocaleString()}</p>
          <p className="comentario-texto">{r.texto}</p>
          <button onClick={() => setRespondiendoA(r.id)}>Responder</button>
          {respondiendoA === r.id && (
            <div className="comentario-form respuesta-form">
              <input
                type="text"
                placeholder="Tu respuesta…"
                value={respuestasTexto[r.id] || ''}
                onChange={e => setRespuestasTexto(prev => ({ ...prev, [r.id]: e.target.value }))}
              />
              <button onClick={() => manejarRespuesta(r.id)}>Responder</button>
            </div>
          )}
          {r.respuestas && renderRespuestas(r.respuestas, nivel+1)}
        </div>
      </div>
    ));
  };

  if (!publicacion) return <p>Cargando…</p>;

  return (
    <div className="profile-mobile">
      {/* header con botón home */}
      <div className="page-header">
        <button onClick={() => navigate('/profile')}>🏠 Mi perfil</button>
      </div>

      <div className="profile-card">
        {/* bloque publicación */}
        <div className="publicacion-box">
          <h3>🧾 Publicación</h3>
          <div className="pub-meta">
            <img
              src={autorPub.foto_perfil || '/default-avatar.png'}
              alt=""
              className="publicacion-avatar clickable-perfil"
              onClick={() => navigate(`/usuario/${publicacion.autor_id}`)}
            />
            <strong
              className="clickable-perfil"
              onClick={() => navigate(`/usuario/${publicacion.autor_id}`)}
            >{autorPub.nombre}</strong>
            <span className="publicacion-tiempo">
              {new Date(publicacion.creada_en).toLocaleString()}
            </span>
          </div>
          <p>{publicacion.contenido}</p>
          {publicacion.imagen_url && (
            <img src={publicacion.imagen_url} alt="" className="publicacion-img" />
          )}
        </div>

        {/* bloque reacciones */}
        <div className="reacciones">
          {['like','love','fire'].map(tipo => (
            <div
              key={tipo}
              className="reaccion-icono"
              onClick={() => manejarReaccion(tipo)}
            >
              {tipo==='like' ? '👍' : tipo==='love' ? '❤️' : '🔥'} {reacciones[tipo]}
            </div>
          ))}
        </div>

        {/* comentarios */}
        <div className="comentarios-box">
          <h4>💬 Comentarios</h4>
          {comentarios.map(c => (
            <div key={c.id} className="comentario">
              <img
                src={c.autor.foto_perfil || '/default-avatar.png'}
                alt=""
                className="comentario-avatar clickable-perfil"
                onClick={() => navigate(`/usuario/${c.usuario_id}`)}
              />
              <div>
                <strong
                  className="clickable-perfil"
                  onClick={() => navigate(`/usuario/${c.usuario_id}`)}
                >{c.autor.nombre}</strong>
                <p className="comentario-fecha">{new Date(c.creada_en).toLocaleString()}</p>
                <p className="comentario-texto">{c.texto}</p>
                <button onClick={() => setRespondiendoA(c.id)}>Responder</button>
                {respondiendoA === c.id && (
                  <div className="comentario-form respuesta-form">
                    <input
                      type="text"
                      placeholder="Tu respuesta…"
                      value={respuestasTexto[c.id] || ''}
                      onChange={e =>
                        setRespuestasTexto(prev => ({ ...prev, [c.id]: e.target.value }))
                      }
                    />
                    <button onClick={() => manejarRespuesta(c.id)}>Responder</button>
                  </div>
                )}
                {c.respuestas && renderRespuestas(c.respuestas)}
              </div>
            </div>
          ))}

          <div className="comentario-form">
            <input
              type="text"
              placeholder="Escribe un comentario…"
              value={nuevoComentario}
              onChange={e => setNuevoComentario(e.target.value)}
            />
            <button onClick={manejarComentario}>Comentar</button>
          </div>
        </div>
      </div>

      {/* bottom nav idéntico al perfil */}
      <div className="bottom-nav">
        <Link to="/profile">🏠</Link>
        <Link to="/publicaciones">🧾</Link>
        <Link to="/insignias">⭐</Link>
        <Link to="/notificaciones">🔔</Link>
        <Link to="#">☰</Link>
      </div>
    </div>
  );
}
