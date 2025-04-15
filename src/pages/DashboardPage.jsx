import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [senseisLideres, setSenseisLideres] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSenseisLideresPendientes();
  }, []);

  const fetchSenseisLideresPendientes = async () => {
    const { data, error } = await supabase
      .from('senseis')
      .select('*')
      .eq('rol', 'sensei_lider')
      .eq('aprobado', false);

    if (error) {
      console.error('Error al obtener senseis líderes:', error);
    } else {
      setSenseisLideres(data);
    }
  };

  const aprobarSenseiLider = async (id) => {
    const { error } = await supabase
      .from('senseis')
      .update({ aprobado: true })
      .eq('id', id);

    if (error) {
      alert('❌ Error al aprobar sensei líder');
    } else {
      alert('✅ Sensei líder aprobado');
      fetchSenseisLideresPendientes();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Redirige a la página de inicio o login
  };

  return (
    <div className="p-4">
      {/* Encabezado con botón de logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Panel del Administrador</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Lista de senseis líderes pendientes */}
      <h2 className="text-xl font-semibold mb-3">Senseis Líderes Pendientes</h2>
      {senseisLideres.length === 0 ? (
        <p>No hay senseis líderes pendientes por aprobar.</p>
      ) : (
        <ul>
          {senseisLideres.map((sensei) => (
            <li key={sensei.id} className="mb-2">
              <strong>{sensei.nombre}</strong> ({sensei.email}){' '}
              <button
                onClick={() => aprobarSenseiLider(sensei.id)}
                className="ml-2 px-2 py-1 bg-green-600 text-white rounded"
              >
                Aprobar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminDashboard;
