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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Buscar en senseis
      const { data: sensei } = await supabase
        .from('senseis')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sensei) {
        setPerfil(sensei);
        setRol(sensei.rol);
        await fetchRelaciones(sensei.id, sensei.rol, sensei.dojo_id, sensei.organizacion_id);
        setLoading(false);
        return;
      }

      // Buscar en estudiantes
      const { data: estudiante } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', user.id)
        .single();

      if (estudiante) {
        setPerfil(estudiante);
        setRol(estudiante.rol);
        await fetchRelaciones(estudiante.id, estudiante.rol, estudiante.dojo_id, estudiante.organizacion_id);
      }

      setLoading(false);
    };

    const fetchRelaciones = async (id, tipo, dojo_id, organizacion_id) => {
      // Amigos confirmados
      const { count } = await supabase
        .from('amigos')
        .select('*', { count: 'exact', head: true })
        .or(`usuario_id.eq.${id},amigo_id.eq.${id}`)
        .eq('estado', 'aceptado');

      setAmigos(count || 0);

      // Dojo
      if (dojo_id) {
        console.log('Dojo ID recibido:', dojo_id);
        const { data: dojo, error } = await supabase
          .from('dojos')
          .select('nombre')
          .eq('id', dojo_id)
          .single();
      
        if (error) console.error('Error al obtener dojo:', error.message);
        console.log('Nombre dojo:', dojo?.nombre);
      
        setDojoNombre(dojo?.nombre || '');
      }
      
      // Organización
      if (organizacion_id) {
        const { data: org } = await supabase
          .from('organizaciones')
          .select('nombre')
          .eq('id', organizacion_id)
          .single();
        setOrgNombre(org?.nombre || '');
      }
    };

    fetchPerfil();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !perfil) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="profile-mobile">
      {/* Barra superior */}
      <div className="top-bar">
        <span>👤</span>
        <span>🔔</span>
        <span onClick={() => setMostrarMenu(!mostrarMenu)}>☰</span>
      </div>

      {/* Menú */}
      {mostrarMenu && (
        <div className="menu-dropdown">
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}

      {/* Foto de perfil */}
      <img
        src={perfil.foto_perfil || '/default-avatar.png'}
        alt="Avatar"
        className="profile-avatar"
      />

      {/* Nombre y rol general */}
      <h2 className="profile-nombre">{perfil.nombre}</h2>
      <p className="profile-rol">{rol.includes('sensei') ? 'SENSEI' : 'ESTUDIANTE'}</p>

      {/* Dojo y organización */}
      {orgNombre && <p className="info-secundaria">{orgNombre}</p>}
      {dojoNombre && <p className="info-secundaria">Dojo: {dojoNombre}</p>}

      {/* Estadísticas */}
      <div className="profile-stats">
        <div><strong>{amigos}</strong><br />amigos</div>
        <div><strong>{perfil.grado || 'Sin grado'}</strong><br />grado</div>
        <div><strong>{perfil.insignias?.length || 0}</strong><br />insignias</div>
      </div>

      {/* Botón añadir amigo */}
      <button className="btn-amigo">Añadir amigo</button>

      {/* Insignias */}
      <div className="insignias-row">
        {(perfil.insignias || []).map((badge, i) => (
          <img key={i} src={`/icons/${badge}`} alt={`Insignia ${i}`} className="insignia-img" />
        ))}
      </div>

      {/* Publicar estado */}
      <div className="estado-input">
        <input type="text" placeholder="¿Qué estás pensando?" disabled />
      </div>

      {/* Publicación ficticia */}
      <div className="post">
        <div className="post-header">
          <img
            src={perfil.foto_perfil || '/default-avatar.png'}
            alt="foto"
            className="post-avatar"
          />
          <div>
            <strong>{perfil.nombre}</strong>
            <p className="post-tiempo">hace 2 horas</p>
          </div>
        </div>
        <div className="post-body">
          <p>Felicitaciones a <span className="tag">@sakura</span> por obtener el cinturón negro.</p>
          <p>¡Gran seminario de katas este sábado en el dojo central!</p>
        </div>
      </div>

      {/* Navegación inferior */}
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
