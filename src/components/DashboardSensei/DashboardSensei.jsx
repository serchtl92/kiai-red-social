// src/components/DashboardSensei/DashboardSensei.jsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import FinanzasTab from './FinanzasTab';
import EstudiantesTab from './EstudiantesTab';
import MiOrganizacionTab from './MiOrganizacionTab';
import { supabase } from '../../supabase/client';

const DashboardSensei = () => {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const obtenerPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: senseiData } = await supabase
          .from('senseis')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setPerfil(senseiData);
      }
    };
    obtenerPerfil();
  }, []);

  const corregirDojoEstudiantes = async () => {
    const { error } = await supabase.rpc('actualizar_dojo_estudiantes');
    if (error) {
      alert('Error al corregir dojos: ' + error.message);
    } else {
      alert('Dojo de estudiantes corregido exitosamente ✅');
      window.location.reload();
    }
  };

  return (
    <>
      <button 
        style={{
          marginBottom: '20px',
          backgroundColor: '#3182CE',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={corregirDojoEstudiantes}
      >
        Corregir dojos de estudiantes
      </button>

      <Tabs variant="enclosed" isFitted>
        <TabList mb="1em">
          <Tab>Finanzas</Tab>
          <Tab>Solicitudes Pendientes</Tab>
          <Tab>Mi Organización</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <FinanzasTab />
          </TabPanel>
          <TabPanel>
            {perfil ? <EstudiantesTab perfil={perfil} /> : <p>Cargando...</p>}
          </TabPanel>
          <TabPanel>
            {perfil ? <MiOrganizacionTab perfil={perfil} /> : <p>Cargando...</p>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};

export default DashboardSensei;
