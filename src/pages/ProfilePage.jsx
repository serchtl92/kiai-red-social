import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './ProfilePage.css';

const ProfilePage = () => {
  const [perfil, setPerfil] = useState(null);
  const [rol, setRol] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: sensei } = await supabase
        .from('senseis')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sensei) {
        setPerfil(sensei);
        setRol(sensei.rol);
        setLoading(false);
        return;
      }

      const { data: estudiante } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', user.id)
        .single();

      if (estudiante) {
        setPerfil(estudiante);
        setRol(estudiante.rol);
      }

      setLoading(false);
    };

    fetchPerfil();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading || !perfil) return <div className="loading">Cargando perfil...</div>;

  return (
    <div className="profile-mobile">

      {/* Barra superior con íconos */}
      <div className="top-bar">
        <span>👤</span>
        <span>🔔</span>
        <span onClick={() => setMostrarMenu(!mostrarMenu)}>☰</span>
      </div>

      {/* Menú desplegable */}
      {mostrarMenu && (
        <div className="menu-dropdown">
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      )}

      <div className="profile-header">
        <img
          src={perfil.foto_perfil || '/default-avatar.png'}
          alt="Foto de perfil"
          className="profile-img"
        />
        <h2 className="profile-nombre">{perfil.nombre}</h2>
        <p className="profile-rol">{rol.toUpperCase()}</p>

        <div className="profile-stats">
          <div><strong>104</strong><br />amigos</div>
          <div><strong>Rango 5to</strong><br />dan</div>
          <div><strong>{perfil.insignias?.length || 12}</strong><br />insignias</div>
        </div>

        <button className="btn-amigo">Añadir amigo</button>

        <div className="insignias-destacadas">
          <img src="/icons/insignia1.png" alt="insignia" />
          <img src="/icons/insignia2.png" alt="insignia" />
          <img src="/icons/insignia3.png" alt="insignia" />
        </div>

        <div className="estado-input">
          <input type="text" placeholder="¿Qué estás pensando?" disabled />
        </div>
      </div>

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
