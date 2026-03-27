import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Vault from "./pages/Vault";
import Dashboard from "./pages/Dashboard";
import GuestVault from "./pages/GuestVault";

// Protected route — redirects to login if no token
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/vault"
        element={
          <ProtectedRoute>
            <Vault />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/guest-vault" element={<GuestVault />} />
    </Routes>
  );
}

export default App;
