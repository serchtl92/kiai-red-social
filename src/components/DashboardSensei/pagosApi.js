// src/components/DashboardSensei/pagosApi.js
import { supabase } from '../../supabase/client';

export const listarPagos = async () => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha_pago', { ascending: false });
  if (error) throw error;
  return data;
};

export const crearPago = async ({ estudiante_id, monto, tipo_pago, metodo_pago }) => {
  const { data, error } = await supabase
    .from('pagos')
    .insert([{ estudiante_id, monto, tipo_pago, metodo_pago }]);
  if (error) throw error;
  return data;
};
