import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './EditProfilePage.css';

export default function EditProfilePage() {
  const [perfil, setPerfil] = useState(null);
  const [rol, setRol] = useState('');
  const [apodo, setApodo] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dojoNombre, setDojoNombre] = useState('');
  const [senseiNombre, setSenseiNombre] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      // Detectar si es sensei o estudiante
      const { data: sensei } = await supabase
        .from('senseis')
        .select('*')
        .eq('user_id', user.id)
        .single();
      const { data: estudiante } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', user.id)
        .single();
      const usr = sensei || estudiante;
      setPerfil(usr);
      setRol(sensei ? 'sensei' : 'estudiante');
      setApodo(usr.apodo || '');

      // preview de foto actual
      setPreviewUrl(usr.foto_perfil || '');

      // dojo
      if (usr.dojo_id) {
        const { data: dojo } = await supabase
          .from('dojos')
          .select('nombre')
          .eq('id', usr.dojo_id)
          .single();
        setDojoNombre(dojo?.nombre || '');
      }

      // sensei (solo para estudiante)
      if (!sensei && usr.sensei_id) {
        const { data: s } = await supabase
          .from('senseis')
          .select('nombre')
          .eq('id', usr.sensei_id)
          .single();
        setSenseiNombre(s?.nombre || 'Pendiente de validación');
      }
    })();
  }, [navigate]);

  // Cuando cargan un nuevo archivo
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFotoFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  // Sube imagen a Storage y devuelve URL pública
  const subirFoto = async () => {
    if (!fotoFile) return perfil.foto_perfil;
    const nombre = `${perfil.id || perfil.user_id}-${fotoFile.name}`;
    const { error: errUp } = await supabase
      .storage
      .from('profile-photos')
      .upload(nombre, fotoFile, { upsert: true });
    if (errUp) throw errUp;
    const { data } = supabase
      .storage
      .from('profile-photos')
      .getPublicUrl(nombre);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1) subir foto si cambió
      const fotoUrl = await subirFoto();

      // 2) actualizar fila
      const tabla = rol === 'sensei' ? 'senseis' : 'estudiantes';
      const idCol = rol === 'sensei' ? 'user_id' : 'id';
      const filtro = rol === 'sensei'
        ? { user_id: perfil.user_id }
        : { id: perfil.id };

      await supabase
        .from(tabla)
        .update({ apodo: apodo.trim(), foto_perfil: fotoUrl })
        .match(filtro);

      alert('Perfil actualizado 🎉');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar: ' + err.message);
    }
  };

  if (!perfil) return <p>Cargando…</p>;

  return (
    <div className="edit-profile-page">
      <h2>Editar mi perfil</h2>
      <form onSubmit={handleSubmit} className="edit-form">

        <label>Nombre real</label>
        <input type="text" value={perfil.nombre} disabled />

        <label>Rol</label>
        <input type="text" value={rol.toUpperCase()} disabled />

        {dojoNombre && (
          <>
            <label>Dojo</label>
            <input type="text" value={dojoNombre} disabled />
          </>
        )}

        {rol === 'estudiante' && (
          <>
            <label>Sensei</label>
            <input type="text" value={senseiNombre || 'Pendiente'} disabled />
          </>
        )}

        <label>Apodo</label>
        <input
          type="text"
          value={apodo}
          onChange={(e) => setApodo(e.target.value)}
          placeholder="Tu apodo (ej: Dragon Kiai)"
        />

        <label>Foto de perfil</label>
        <div className="foto-preview">
          {previewUrl
            ? <img src={previewUrl} alt="preview" />
            : <div className="sin-foto">Sin foto</div>
          }
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}
