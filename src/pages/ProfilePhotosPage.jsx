// src/pages/ProfilePhotosPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './ProfilePhotosPage.css';

export default function ProfilePhotosPage() {
  const [userId, setUserId] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  // 1) Al montar, obtenemos el user.id y cargamos las fotos
  useEffect(() => {
    (async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('No hay usuario logueado:', error);
        navigate('/login');
        return;
      }

      setUserId(user.id);
      cargarFotos(user.id);
    })();
  }, [navigate]);

  // 2) Fetch de fotos del usuario
  const cargarFotos = async (uid) => {
    const { data, error } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('usuario_id', uid)
      .order('subida_en', { ascending: false });

    if (error) {
      console.error('Error cargando fotos:', error);
      return;
    }
    setFotos(data || []);
  };

  // 3) Manejo de input file
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 4) Subir nueva foto y registrar en la tabla
  const handleUpload = async () => {
    if (!file || !userId) return;

    try {
      // Generamos una clave única
      const key = `${userId}/${crypto.randomUUID()}-${file.name}`;

      console.log('==> Iniciando upload de foto');
      console.log('   usuario_id:', userId);
      console.log('   file:', file);

      // 4.1) Subir al bucket "profile-photos"
      const { error: upErr } = await supabase
        .storage
        .from('profile-photos')
        .upload(key, file, { upsert: false });
      if (upErr) throw upErr;

      // 4.2) Obtener URL pública
      const { data: urlData } = supabase
        .storage
        .from('profile-photos')
        .getPublicUrl(key);

      console.log('   publicUrl:', urlData.publicUrl);

      // 4.3) Insertar registro en la tabla
      const payload = {
        usuario_id: userId,
        url: urlData.publicUrl
      };
      console.log('   Insert payload:', payload);

      const { error: dbErr } = await supabase
        .from('profile_photos')
        .insert(payload);
      if (dbErr) throw dbErr;

      console.log('✅ Foto insertada en tabla profile_photos');
      setFile(null);
      cargarFotos(userId);

    } catch (err) {
      console.error('Error al subir foto:', err);
      alert('Error al subir la foto: ' + err.message);
    }
  };

  // 5) Marcar foto como activa
  const marcarActivo = async (fotoId) => {
    if (!userId) return;

    try {
      await supabase
        .from('profile_photos')
        .update({ activo: false })
        .eq('usuario_id', userId)
        .eq('activo', true);

      await supabase
        .from('profile_photos')
        .update({ activo: true })
        .eq('id', fotoId);

      cargarFotos(userId);
    } catch (err) {
      console.error('Error al marcar activo:', err);
      alert('Error al seleccionar foto: ' + err.message);
    }
  };

  // 6) Eliminar foto
  const eliminar = async (fotoId) => {
    if (!userId) return;
    if (!window.confirm('¿Eliminar esta foto?')) return;

    try {
      await supabase
        .from('profile_photos')
        .delete()
        .eq('id', fotoId)
        .eq('usuario_id', userId);

      cargarFotos(userId);
    } catch (err) {
      console.error('Error al eliminar foto:', err);
      alert('Error al eliminar la foto: ' + err.message);
    }
  };

  return (
    <div className="photos-page">
      <h2>Mis fotos de perfil</h2>

      <div className="upload-form">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <button
          onClick={handleUpload}
          disabled={!file}
        >
          Subir nueva
        </button>
      </div>

      <div className="gallery">
        {fotos.map(f => (
          <div
            key={f.id}
            className={`thumb ${f.activo ? 'activo' : ''}`}
          >
            <img src={f.url} alt="perfil" />
            <div className="actions">
              {!f.activo && (
                <button onClick={() => marcarActivo(f.id)}>
                  Usar como foto de perfil
                </button>
              )}
              <button
                className="del"
                onClick={() => eliminar(f.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="volver"
        onClick={() => navigate('/profile')}
      >
        🔙 Volver a mi perfil
      </button>
    </div>
  );
}
