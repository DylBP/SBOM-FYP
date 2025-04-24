import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import SBOMDetails from "./pages/SBOMDetails";
import ConfirmSignup from "./pages/ConfirmSignup";
import ProtectedRoute from "./components/ProtectedRoute";
import Generator from "./pages/Generator";
import ProjectView from "./pages/ProjectView";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sbom/:id" element={<ProtectedRoute><SBOMDetails /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectView /></ProtectedRoute>} />
          <Route path="/generate" element={<ProtectedRoute><Generator /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/confirm-signup" element={<ConfirmSignup />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
