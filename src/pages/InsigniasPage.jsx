// src/pages/InsigniasPage.jsx
import React from 'react';
import './InsigniasPage.css';

const InsigniasPage = () => {
  const insignias = [
    { nombre: 'Disciplina', icono: '/icons/insignia1.png' },
    { nombre: 'Excelencia', icono: '/icons/insignia2.png' },
    { nombre: 'Honor', icono: '/icons/insignia3.png' },
  ];

  return (
    <div className="insignias-page">
      <h2>Mis Insignias</h2>
      <div className="insignias-grid">
        {insignias.map((insignia, index) => (
          <div className="insignia-card" key={index}>
            <img src={insignia.icono} alt={insignia.nombre} />
            <p>{insignia.nombre}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsigniasPage;
