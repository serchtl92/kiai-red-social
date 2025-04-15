import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import './ProfilePage.css';

const ProfilePage = () => {
  const [nombre, setNombre] = useState('sergio');
  const [rol, setRol] = useState('estudiante');
  const [fotoPerfil, setFotoPerfil] = useState('/default-avatar.png');

  useEffect(() => {
    // Aquí puedes conectar con Supabase si lo deseas
  }, []);

  return (
    <div className="profile-container">
      <img src={fotoPerfil} alt="Avatar" className="profile-avatar" />
      <h2 className="profile-name">{nombre}</h2>
      <div className="profile-role">{rol.toUpperCase()}</div>

      <div className="profile-stats">
        <div><strong>104</strong><br />amigos</div>
        <div><strong>Rango 5to</strong><br />dan</div>
        <div><strong>12</strong><br />insignias</div>
      </div>

      <button className="add-friend-btn">Añadir amigo</button>

      <div className="insignias">
        <img src="/icons/insignia1.png" alt="Insignia 1" />
        <img src="/icons/insignia2.png" alt="Insignia 2" />
        <img src="/icons/insignia3.png" alt="Insignia 3" />
      </div>

      <div className="publicacion">
        <strong>{nombre} - hace 2 horas</strong>
        <p>
          Felicitaciones a <span style={{ color: 'blue' }}>@sakura</span> por obtener el cinturón negro.
        </p>
        <p>¡Gran seminario de katas este sábado en el dojo central!</p>
      </div>
    </div>
  );
};

export default ProfilePage;
