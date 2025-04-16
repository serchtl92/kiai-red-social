import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterStudentPage from "./pages/RegisterStudentPage";
import RegisterSenseiPage from "./pages/RegisterSenseiPage";
import RegistrarSenseiLider from "./pages/RegistrarSenseiLider";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage"; // ✅ ESTE ES EL IMPORT QUE FALTABA
import RegistrarAdmin from './pages/RegistrarAdmin';
import CrearOrganizacionPage from './pages/CrearOrganizacionPage';
import ConfirmadoPage from './pages/ConfirmadoPage';
import EsperaValidacionPage from "./pages/EsperaValidacionPage"
import InsigniasPage from './pages/InsigniasPage';
import PostPage from './pages/PostPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/registrar-estudiante" element={<RegisterStudentPage />} />
        <Route path="/registrar-sensei" element={<RegisterSenseiPage />} />
        <Route path="/registrar-sensei-lider" element={<RegistrarSenseiLider />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} /> {/* ✅ RUTA PARA ADMIN */}
        <Route path="/registrar-admin" element={<RegistrarAdmin />} />
        <Route path="/crear-organizacion" element={<CrearOrganizacionPage />} />
        <Route path="/confirmado" element={<ConfirmadoPage />} />
        <Route path="/espera-validacion" element={<EsperaValidacionPage />} />
        <Route path="/insignias" element={<InsigniasPage />} />
        <Route path="/publicaciones" element={<PostPage />} />

      </Routes>
    </Router>
  );
}

export default App;
