import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';
import './ProfilePage.css';
import { FiSettings, FiLogOut } from 'react-icons/fi'; // 👈 Importamos los iconos (Fi = Feather Icons)

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
  const [reaccionHover, setReaccionHover] = useState({});
  const [sugerencias, setSugerencias] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [respuestasTexto, setRespuestasTexto] = useState({});
  const [respuestasVisibles, setRespuestasVisibles] = useState({});

  const navigate = useNavigate();

  // -- FETCH PERFIL INICIAL --
  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      let perfilTemp = null;
      let tipo = '';

      // intenta sensei
      const { data: sensei } = await supabase
        .from('senseis').select('*').eq('user_id', user.id).single();
      if (sensei) {
        perfilTemp = sensei;
        tipo = sensei.rol;
        await fetchRelaciones(sensei.id, sensei.rol, sensei.dojo_id, sensei.organizacion_id);
      } else {
        // sino estudiante
        const { data: estudiante } = await supabase
          .from('estudiantes').select('*').eq('id', user.id).single();
        if (estudiante) {
          perfilTemp = estudiante;
          tipo = estudiante.rol;
          await fetchRelaciones(estudiante.id, estudiante.rol, estudiante.dojo_id, estudiante.organizacion_id);
        }
      }

      // carga foto activa de perfil
      if (perfilTemp) {
        const { data: fotoAct } = await supabase
          .from('profile_photos')
          .select('url')
          .eq('usuario_id', perfilTemp.user_id || perfilTemp.id)
          .eq('activo', true)
          .maybeSingle();
        perfilTemp.foto_perfil = fotoAct?.url || perfilTemp.foto_perfil || '/default-avatar.png';
      }

      // solicitudes de amistad pendientes
      const { count: sol } = await supabase
        .from('amigos')
        .select('*', { head: true, count: 'exact' })
        .eq('amigo_id', user.id)
        .eq('estado', 'pendiente');
      setSolicitudesPendientes(sol || 0);

      // notificaciones no leídas
      const { count: notiNL } = await supabase
        .from('notificaciones')
        .select('*', { head: true, count: 'exact' })
        .eq('usuario_id', perfilTemp.user_id || perfilTemp.id)
        .eq('leida', false);

      setPerfil({
        ...perfilTemp,
        notificaciones_no_leidas: notiNL || 0
      });
      setRol(tipo);

      await obtenerPublicaciones();
      await obtenerSugerencias(perfilTemp.user_id || perfilTemp.id);

      setLoading(false);
    };

    fetchPerfil();
  }, [navigate]);

  // refresco automático de publicaciones
  useEffect(() => {
    const iv = setInterval(() => {
      if (perfil) obtenerPublicaciones();
    }, 10000);
    return () => clearInterval(iv);
  }, [perfil]);

  // -- FUNCIONES AUXILIARES --
  const fetchRelaciones = async (id, tipo, dojo_id, org_id) => {
    const { count } = await supabase
      .from('amigos')
      .select('*', { head: true, count: 'exact' })
      .or(`usuario_id.eq.${id},amigo_id.eq.${id}`)
      .eq('estado', 'aceptado');
    setAmigos(count || 0);

    if (dojo_id) {
      const { data: dojo } = await supabase.from('dojos').select('nombre').eq('id', dojo_id).single();
      setDojoNombre(dojo?.nombre || '');
    }
    if (org_id) {
      const { data: org } = await supabase.from('organizaciones').select('nombre').eq('id', org_id).single();
      setOrgNombre(org?.nombre || '');
    }
  };

  const obtenerSugerencias = async (miId) => {
    const { data: lst } = await supabase
      .from('senseis')
      .select('user_id,nombre,foto_perfil,rol')
      .neq('user_id', miId)
      .limit(20);

    const arr = await Promise.all(lst.map(async (u) => {
      const { data: a } = await supabase
        .from('amigos')
        .select('estado')
        .or(`and(usuario_id.eq.${miId},amigo_id.eq.${u.user_id}),and(usuario_id.eq.${u.user_id},amigo_id.eq.${miId})`)
        .maybeSingle();
      return { ...u, estado: a?.estado || 'no_solicitado' };
    }));
    setSugerencias(arr);
  };

  const enviarSolicitudAmistad = async (amigoId) => {
    if (sugerencias.find(s => s.user_id === amigoId && s.estado!=='no_solicitado')) return;
    await supabase.from('amigos').insert({
      usuario_id: perfil.user_id||perfil.id,
      amigo_id: amigoId,
      usuario_tipo: rol,
      amigo_tipo: 'sensei',
      estado: 'pendiente'
    });
    obtenerSugerencias(perfil.user_id||perfil.id);
  };

  const subirImagen = async () => {
    if (!archivo) return null;
    const name = `${uuidv4()}-${archivo.name}`;
    const { error } = await supabase.storage.from('publicaciones').upload(name, archivo);
    if (error) return null;
    const { data } = supabase.storage.from('publicaciones').getPublicUrl(name);
    return data.publicUrl;
  };

  const publicarEstado = async () => {
    if (!nuevoEstado.trim() && !archivo) return;
    const imgUrl = await subirImagen();
    const { data: newPub } = await supabase
      .from('publicaciones')
      .insert({
        contenido: nuevoEstado,
        autor_id: perfil.user_id||perfil.id,
        autor_tipo: rol,
        imagen_url: imgUrl
      })
      .select().single();

    // notificar a amigos...
    const uid = perfil.user_id||perfil.id;
    const { data: rels } = await supabase
      .from('amigos')
      .select('*')
      .or(`usuario_id.eq.${uid},amigo_id.eq.${uid}`)
      .eq('estado','aceptado');
    const targets = rels.map(r => r.usuario_id===uid? r.amigo_id:r.usuario_id);
    const notis = targets.map(t => ({
      tipo:'publicacion',
      usuario_id:t,
      origen_id:uid,
      publicacion_id:newPub.id,
      leida:false
    }));
    if (notis.length) await supabase.from('notificaciones').insert(notis);

    setNuevoEstado(''); setArchivo(null);
    obtenerPublicaciones();
  };

  const manejarReaccion = async (pid,tipo) => {
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ex } = await supabase
      .from('reacciones')
      .select('*')
      .eq('usuario_id',user.id)
      .eq('publicacion_id',pid)
      .maybeSingle();
    if (ex){
      if (ex.tipo===tipo) return;
      await supabase.from('reacciones').update({ tipo }).eq('usuario_id',user.id).eq('publicacion_id',pid);
    } else {
      await supabase.from('reacciones').insert({ publicacion_id:pid, usuario_id:user.id, tipo });
    }
    obtenerPublicaciones();
  };

  const manejarComentario = async (pid,padre=null) => {
    const texto = padre? respuestasTexto[padre] : nuevoComentario[pid];
    const { data:{user} } = await supabase.auth.getUser();
    if (!user || !texto.trim()) return;
    const obj = { publicacion_id:pid, usuario_id:user.id, texto:texto.trim() };
    if (padre) obj.comentario_padre_id = padre;
    const { error } = await supabase.from('comentarios').insert(obj);
    if (!error){
      // notificar autor pub
      const { data:pub } = await supabase.from('publicaciones').select('autor_id').eq('id',pid).single();
      if (pub.autor_id!==user.id){
        await supabase.from('notificaciones').insert({
          tipo:'comentario',
          usuario_id:pub.autor_id,
          origen_id:user.id,
          publicacion_id:pid,
          leida:false
        });
      }
      if (padre){
        setRespuestasTexto(prev=>({...prev,[padre]:''}));
        setRespondiendoA(null);
      } else {
        setNuevoComentario(prev=>({...prev,[pid]:''}));
      }
      obtenerPublicaciones();
    }
  };

  const eliminarPublicacion = id => {
    supabase.from('publicaciones').delete().eq('id',id);
    obtenerPublicaciones();
  };
  const eliminarComentario = id => {
    supabase.from('comentarios').delete().eq('id',id);
    obtenerPublicaciones();
  };

  const renderComentarios = (lst,pid,padre=null, nivel=0) => {
    return lst.filter(c=>c.comentario_padre_id===padre)
      .map(c=>{
        const subs = lst.filter(r=>r.comentario_padre_id===c.id);
        const show = respuestasVisibles[c.id];
        return (
          <div key={c.id} style={{ marginLeft:`${nivel*30}px`, marginTop:'10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Link to={`/usuario/${c.usuario_id}`}>
                <img
                  src={c.autorFoto}
                  className="post-avatar"
                  style={{ width: '24px', height: '24px', marginRight: '6px' }}
                />
              </Link>
              <div style={{ flex: 1 }}>
                <Link to={`/usuario/${c.usuario_id}`}>
                 <strong>{c.autorNombre}</strong>
                </Link>
                <p className="post-tiempo" style={{ margin:0 }}>{new Date(c.creada_en).toLocaleString()}</p>
                <div className="comentario-burbuja">{c.texto}</div>
                <button onClick={()=>{
                  setRespondiendoA(null);
                  setTimeout(()=>setRespondiendoA(c.id),10);
                }}>Responder</button>
                {respondiendoA===c.id && (
                  <div style={{ marginTop:5 }}>
                    <input
                      value={respuestasTexto[c.id]||''}
                      onChange={e=>setRespuestasTexto(prev=>({...prev,[c.id]:e.target.value}))}
                      placeholder="Escribe una respuesta..."
                    />
                    <button style={{ marginLeft:5 }} onClick={()=>manejarComentario(pid,c.id)}>Enviar</button>
                  </div>
                )}
                {subs.length>0 && (
                  <button
                    style={{ fontSize:'0.85rem', marginTop:4 }}
                    onClick={()=>setRespuestasVisibles(prev=>({...prev,[c.id]:!prev[c.id]}))}
                  >
                    {show
                      ? `Ocultar respuestas (${subs.length})`
                      : `Ver respuestas (${subs.length})`}
                  </button>
                )}
                {show && renderComentarios(lst,pid,c.id,nivel+1)}
              </div>
              {((perfil.user_id||perfil.id)===c.usuario_id) && (
                <button className="btn-delete" onClick={()=>eliminarComentario(c.id)}>❌</button>
              )}
            </div>
          </div>
        );
      });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // -- CARGA Y MAPEO DE PUBLICACIONES --
  const obtenerPublicaciones = async () => {
    const { data: pubs } = await supabase
      .from('publicaciones').select('*').order('creada_en',{ ascending:false });
    if (!pubs) return;

    const arr = await Promise.all(pubs.map(async pub=>{
      // REACCIONES
      const { data: reacs } = await supabase.from('reacciones')
        .select('tipo,usuario_id')
        .eq('publicacion_id',pub.id);
      const resumen = { like:0,love:0,fire:0 }, detalles={like:[],love:[],fire:[]};
      for(const r of reacs||[]){
        if(!['like','love','fire'].includes(r.tipo)) continue;
        resumen[r.tipo]++;
        // quién reaccionó
        let u = null;
        const { data:s } = await supabase.from('senseis')
          .select('nombre,foto_perfil').eq('user_id',r.usuario_id).maybeSingle();
        if(s) u=s;
        else {
          const { data:e } = await supabase.from('estudiantes')
            .select('nombre,foto_perfil').eq('id',r.usuario_id).maybeSingle();
          u=e;
        }
        detalles[r.tipo].push(u||{ nombre:'Desconocido', foto_perfil:'/default-avatar.png' });
      }

      // AUTOR PUBLICACIÓN
      let autor=null;
      const { data: as } = await supabase.from('senseis')
        .select('nombre,foto_perfil').eq('user_id',pub.autor_id).maybeSingle();
      if(as) autor=as;
      else {
        const { data: ae } = await supabase.from('estudiantes')
          .select('nombre,foto_perfil').eq('id',pub.autor_id).maybeSingle();
        autor=ae;
      }
      autor = autor||{ nombre:'Desconocido', foto_perfil:null };
      // foto activa autor
      const { data: fa } = await supabase.from('profile_photos')
        .select('url').eq('usuario_id',pub.autor_id).eq('activo',true).maybeSingle();
      const autorFoto = fa?.url||autor.foto_perfil||'/default-avatar.png';

      // COMENTARIOS
      const { data: comms } = await supabase.from('comentarios')
        .select('id, texto, usuario_id, creada_en, comentario_padre_id')
        .eq('publicacion_id',pub.id).order('creada_en',{ ascending:true });
      const comms2 = await Promise.all((comms||[]).map(async c=>{
        let au=null;
        const { data:ss } = await supabase.from('senseis')
          .select('nombre,foto_perfil').eq('user_id',c.usuario_id).maybeSingle();
        if(ss) au=ss;
        else {
          const { data:ee } = await supabase.from('estudiantes')
            .select('nombre,foto_perfil').eq('id',c.usuario_id).maybeSingle();
          au=ee;
        }
        au=au||{ nombre:'Usuario desconocido', foto_perfil:null };
        const { data:af } = await supabase.from('profile_photos')
          .select('url').eq('usuario_id',c.usuario_id).eq('activo',true).maybeSingle();
        return {
          ...c,
          autorNombre: au.nombre,
          autorFoto: af?.url||au.foto_perfil||'/default-avatar.png'
        };
      }));

      return {
        ...pub,
        reacciones: resumen,
        quienesReaccionaron: detalles,
        autor: { ...autor, foto_perfil: autorFoto },
        comentarios: comms2
      };
    }));

    setPublicaciones(arr);
  };

  if (loading || !perfil) {
    return <div className="loading">Cargando perfil...</div>;
  }

  return (
    <div className="profile-mobile">
      {/* Top bar */}
      <div className="top-bar">
        <span onClick={()=>navigate('/solicitudes')} className="icono-perfil-notificacion">
          👤{solicitudesPendientes>0 && <span className="notificacion-contador">{solicitudesPendientes}</span>}
        </span>
        <span onClick={()=>navigate('/notificaciones')} className="icono-perfil-notificacion">
          🔔{perfil.notificaciones_no_leidas>0 && <span className="notificacion-contador">{perfil.notificaciones_no_leidas}</span>}
        </span>
        <span onClick={()=>setMostrarMenu(!mostrarMenu)}>☰</span>
      </div>
      {mostrarMenu && (
  <div className="menu">
    {rol === 'sensei' || rol === 'sensei_lider' ? (
      <div className="menu-item">
        <button onClick={() => navigate('/dashboard-sensei')}>
          <FiSettings className="icon" />
          Administración
        </button>
      </div>
    ) : null}
    <div className="menu-item">
      <button onClick={handleLogout}>
        <FiLogOut className="icon" />
        Cerrar sesión
      </button>
    </div>
  </div>
)}


      {/* Cabecera de perfil */}
      <img src={perfil.foto_perfil} alt="avatar" className="profile-avatar" />
      <h2 className="profile-nombre">{perfil.nombre}</h2>
      <p className="profile-rol">{rol.includes('sensei') ? 'SENSEI' : 'ESTUDIANTE'}</p>
      <Link to="/mis-fotos" className="btn">🖼️ Mis fotos</Link>
      <Link to="/editar-perfil" className="btn-editar-perfil">✏️</Link>
      {orgNombre && <p className="info-secundaria">{orgNombre}</p>}
      {dojoNombre && <p className="info-secundaria">Dojo: {dojoNombre}</p>}

      {/* Estadísticas */}
      <div className="profile-stats">
        <div><strong>{amigos}</strong><br/>amigos</div>
        <div><strong>{perfil.grado||'Sin grado'}</strong><br/>grado</div>
        <div><strong>{perfil.insignias?.length||0}</strong><br/>insignias</div>
      </div>

      {/* Publicar estado */}
      <div className="estado-input">
        <input
          value={nuevoEstado}
          onChange={e=>setNuevoEstado(e.target.value)}
          placeholder="¿Qué estás pensando?"
        />
        <input type="file" onChange={e=>setArchivo(e.target.files[0])}/>
        <button onClick={publicarEstado}>Publicar</button>
      </div>

      {/* Sugerencias */}
      {sugerencias.length>0 && (
        <div className="sugerencias-horizontal">
          <h3 className="sugerencias-titulo">Personas que quizá conozcas</h3>
          <div className="sugerencias-scroll">
            {sugerencias.map(u=>(
              <div key={u.user_id} className="sugerencia-card">
                <img src={u.foto_perfil||'/default-avatar.png'} className="sugerencia-avatar"/>
                <p className="sugerencia-nombre">{u.nombre}</p>
                {u.estado==='aceptado'
                  ? <p className="estado-amistad">Ya son amigos</p>
                  : u.estado==='pendiente'
                    ? <p className="estado-amistad">Solicitud enviada</p>
                    : <button className="btn-amigo" onClick={()=>enviarSolicitudAmistad(u.user_id)}>Añadir amigo</button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de publicaciones */}
      {publicaciones.map(pub=>(
        <div key={pub.id} className="post">
          <div className="post-header">
            <Link to={`/usuario/${pub.autor_id}`}>
              <img src={pub.autor.foto_perfil} className="post-avatar"/>
            </Link>
            <div>
              <Link to={`/usuario/${pub.autor_id}`}><strong>{pub.autor.nombre}</strong></Link>
              <p className="post-tiempo">{new Date(pub.creada_en).toLocaleString()}</p>
            </div>
            {(perfil.user_id===pub.autor_id||perfil.id===pub.autor_id) && (
              <button className="btn-delete" onClick={()=>eliminarPublicacion(pub.id)}>🗑️</button>
            )}
          </div>
          <div className="post-body">
            <p>{pub.contenido}</p>
            {pub.imagen_url && <img src={pub.imagen_url} className="post-img" />}
          </div>
          <div className="reacciones">
    {['like', 'love', 'fire'].map((tipo) => (
      <button
        key={tipo}
        type="button"
        className="reaccion-icono"
        onClick={async () => {
          console.log('➡️ click reacción:', pub.id, tipo);

          // Obtener usuario actual
          const {
            data: { user },
            error: userErr
          } = await supabase.auth.getUser();
          if (userErr || !user) {
            console.warn('No hay usuario logueado');
            return;
          }

          // ¿Ya existe reacción?
          const { data: existente } = await supabase
            .from('reacciones')
            .select('*')
            .eq('usuario_id', user.id)
            .eq('publicacion_id', pub.id)
            .maybeSingle();
          console.log('   ya existía reacción:', existente);

          let resp;
          if (existente) {
            if (existente.tipo === tipo) {
              console.log('    mismo tipo, nada que hacer');
              return;
            }
            // Actualizar tipo
            resp = await supabase
              .from('reacciones')
              .update({ tipo })
              .eq('usuario_id', user.id)
              .eq('publicacion_id', pub.id)
              .select();
          } else {
            // Insertar nueva reacción (fíjate en los corchetes)
            resp = await supabase
              .from('reacciones')
              .insert([{
                publicacion_id: pub.id,
                usuario_id: user.id,
                tipo
              }])
              .select();
          }
          console.log('   respuesta inserción/actualización:', resp);

          // Refrescar conteos en pantalla
          obtenerPublicaciones();
        }}
        onMouseEnter={() => setReaccionHover({ [`${pub.id}_${tipo}`]: true })}
        onMouseLeave={() => setReaccionHover({ [`${pub.id}_${tipo}`]: false })}
      >
        {/* Emoji + contador */}
        {tipo === 'like' ? '👍' : tipo === 'love' ? '❤️' : '🔥'}{' '}
        {pub.reacciones[tipo] || 0}

        {/* Tooltip con quién reaccionó */}
        {reaccionHover[`${pub.id}_${tipo}`] && (
          <div className="tooltip-reacciones">
            {(pub.quienesReaccionaron?.[tipo] || []).map((u, i) => (
              <div key={i} className="usuario-reaccion">
                <img
                  src={u.foto_perfil || '/default-avatar.png'}
                  alt={u.nombre}
                  className="reaccion-avatar"
                />
                <span>{u.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </button>
    ))}
  </div>

          <div className="comentarios">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={nuevoComentario[pub.id]||''}
              onChange={e=>setNuevoComentario(prev=>({...prev,[pub.id]:e.target.value}))}
            />
            <button onClick={()=>manejarComentario(pub.id)}>Comentar</button>
            <p className="comentarios-count">💬 {pub.comentarios.length} comentarios</p>
            {renderComentarios(pub.comentarios,pub.id)}
          </div>
        </div>
      ))}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <Link to="/profile">🏠</Link>
        <Link to="/publicaciones">🧾</Link>
        <Link to="/insignias">⭐</Link>
        <Link to="/notificaciones">🔔</Link>
        <Link to="#">☰</Link>
      </div>
    </div>
  );
};

export default ProfilePage;
