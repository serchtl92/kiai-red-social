// src/components/DashboardSensei/creditosApi.js
import { supabase } from '../../supabase/client';

export const listarCreditos = async () => {
  const { data, error } = await supabase
    .from('creditos')
    .select('*')
    .order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
};

export const crearCredito = async ({ monto, motivo }) => {
  const { data, error } = await supabase
    .from('creditos')
    .insert([{ monto, motivo }]);
  if (error) throw error;
  return data;
};
