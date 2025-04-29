import React, { useEffect, useState } from 'react';
import {
  Table, Thead, Tbody, Tr, Th, Td,
  Input, Select
} from '@chakra-ui/react';
import { listarPagos, crearPago } from './pagosApi';
import { listarCreditos, crearCredito } from './creditosApi';
import { listarSuscripciones, actualizarSuscripcion } from './suscripcionesApi';
import { supabase } from '../../supabase/client';
import './FinanzasTab.css'; // 👈 CSS de finanzas

export default function FinanzasTab() {
  const [pagos, setPagos] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [nuevoPago, setNuevoPago] = useState({
    estudiante_id: '',
    monto: '',
    tipo_pago: 'mensualidad',
    metodo_pago: 'efectivo',
  });
  const [nuevoCredito, setNuevoCredito] = useState({ monto: '', motivo: '' });
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: senseiData } = await supabase
        .from('senseis')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setPerfil(senseiData);

      if (senseiData?.dojo_id) {
        setPagos(await listarPagos(senseiData.dojo_id));
        setCreditos(await listarCreditos(senseiData.dojo_id));
        setSuscripciones(await listarSuscripciones(senseiData.dojo_id));
      }
    };

    cargarDatos();
  }, []);

  const handlePago = async () => {
    if (!nuevoPago.estudiante_id || !nuevoPago.monto || !perfil?.dojo_id) return;
    await crearPago({ ...nuevoPago, dojo_id: perfil.dojo_id });
    setNuevoPago({ ...nuevoPago, estudiante_id: '', monto: '' });
    setPagos(await listarPagos(perfil.dojo_id));
  };

  const handleCredito = async () => {
    if (!nuevoCredito.monto || !perfil?.dojo_id) return;
    await crearCredito({ ...nuevoCredito, dojo_id: perfil.dojo_id });
    setNuevoCredito({ monto: '', motivo: '' });
    setCreditos(await listarCreditos(perfil.dojo_id));
  };

  const togglePV = async (id, estado) => {
    await actualizarSuscripcion({ id, estado });
    setSuscripciones(await listarSuscripciones(perfil.dojo_id));
  };

  return (
    <div className="finanzas-container">

      {/* Registro de Pagos */}
      <div className="form-section">
        <h2 className="section-title">Registrar Pago</h2>
        <div className="form-row">
          <Input
            placeholder="ID Estudiante"
            size="sm"
            value={nuevoPago.estudiante_id}
            onChange={e => setNuevoPago({ ...nuevoPago, estudiante_id: e.target.value })}
          />
          <Input
            placeholder="Monto"
            size="sm"
            value={nuevoPago.monto}
            onChange={e => setNuevoPago({ ...nuevoPago, monto: e.target.value })}
          />
          <Select
            size="sm"
            value={nuevoPago.tipo_pago}
            onChange={e => setNuevoPago({ ...nuevoPago, tipo_pago: e.target.value })}
          >
            <option value="mensualidad">Mensualidad</option>
            <option value="torneo">Torneo</option>
            <option value="material">Material</option>
          </Select>
          <Select
            size="sm"
            value={nuevoPago.metodo_pago}
            onChange={e => setNuevoPago({ ...nuevoPago, metodo_pago: e.target.value })}
          >
            <option value="efectivo">Efectivo</option>
          </Select>
          <button className="boton-registrar" onClick={handlePago}>
            Registrar Pago
          </button>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="table-section">
        <h2 className="section-title">Pagos Registrados</h2>
        <Table size="sm" className="finanzas-table">
          <Thead>
            <Tr>
              <Th>Estudiante</Th>
              <Th>Monto</Th>
              <Th>Tipo</Th>
              <Th>Fecha</Th>
              <Th>Estado</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pagos.map(p => (
              <Tr key={p.id}>
                <Td>{p.estudiante_id}</Td>
                <Td>{p.monto}</Td>
                <Td>{p.tipo_pago}</Td>
                <Td>{new Date(p.fecha_pago).toLocaleDateString()}</Td>
                <Td>{p.estado}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* Registro de Créditos */}
      <div className="form-section creditos-section">
        <h2 className="section-title">Dar Crédito</h2>
        <div className="form-row">
          <Input
            placeholder="Monto crédito"
            size="sm"
            value={nuevoCredito.monto}
            onChange={e => setNuevoCredito({ ...nuevoCredito, monto: e.target.value })}
          />
          <Input
            placeholder="Motivo"
            size="sm"
            value={nuevoCredito.motivo}
            onChange={e => setNuevoCredito({ ...nuevoCredito, motivo: e.target.value })}
          />
          <button className="boton-credito" onClick={handleCredito}>
            Dar Crédito
          </button>
        </div>
      </div>

      {/* Tabla de Créditos */}
      <div className="table-section">
        <h2 className="section-title">Créditos Otorgados</h2>
        <Table size="sm" className="finanzas-table">
          <Thead>
            <Tr>
              <Th>Monto</Th>
              <Th>Motivo</Th>
              <Th>Fecha</Th>
            </Tr>
          </Thead>
          <Tbody>
            {creditos.map(c => (
              <Tr key={c.id}>
                <Td>{c.monto}</Td>
                <Td>{c.motivo}</Td>
                <Td>{new Date(c.fecha_creacion).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* Suscripciones */}
      <div className="table-section">
        <h2 className="section-title">Suscripciones PV</h2>
        <div className="suscripciones-section">
          {suscripciones.map(s => (
            <div key={s.id} className="suscripcion-item">
              <span>{s.plan}</span>
              <span>Expira: {new Date(s.expiracion).toLocaleDateString()}</span>
              <button
                className="boton-toggle"
                onClick={() => togglePV(s.id, s.estado === 'activa' ? 'cancelada' : 'activa')}
              >
                {s.estado === 'activa' ? 'Desactivar PV' : 'Activar PV'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
