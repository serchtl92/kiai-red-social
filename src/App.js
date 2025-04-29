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
import ProfileUser from './pages/ProfileUser';
import SolicitudesAmistad from './pages/SolicitudesAmistad';
import NotificacionesPage from './pages/NotificacionesPage';
import PublicacionPage from './pages/PublicacionPage';
import ProfilePhotosPage from './pages/ProfilePhotosPage';
import EditProfilePage from './pages/EditProfilePage';
import DashboardSensei from './components/DashboardSensei/DashboardSensei';

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
        <Route path="/usuario/:id" element={<ProfileUser />} />
        <Route path="/perfil/:id" element={<ProfileUser />} /> {/* para que funcione navigate(`/perfil/${id}`) */}
        <Route path="/solicitudes" element={<SolicitudesAmistad />} />
        <Route path="/notificaciones" element={<NotificacionesPage />} />
        <Route path="/publicaciones/:id" element={<PublicacionPage />} />
        <Route path="/mis-fotos" element={<ProfilePhotosPage />} />
        <Route path="/editar-perfil" element={<EditProfilePage />} />
        <Route path="/dashboard-sensei" element={<DashboardSensei />} />

      </Routes>
    </Router>
  );
}

export default App;
