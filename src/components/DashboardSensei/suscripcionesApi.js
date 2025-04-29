// src/components/DashboardSensei/suscripcionesApi.js
import { supabase } from '../../supabase/client';

export const listarSuscripciones = async () => {
  const { data, error } = await supabase
    .from('suscripciones_pv')
    .select('*');
  if (error) throw error;
  return data;
};

// Para activar/desactivar el módulo PV
export const actualizarSuscripcion = async ({ id, estado }) => {
  const { data, error } = await supabase
    .from('suscripciones_pv')
    .update({ estado })
    .eq('id', id);
  if (error) throw error;
  return data;
};
