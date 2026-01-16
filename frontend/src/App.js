import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages - Account Level (Layer 1)
import AccountLoginPage from "./pages/AccountLoginPage";
import AccountDashboard from "./pages/AccountDashboard";
import CreateWorkspacePage from "./pages/CreateWorkspacePage";
import WorkspaceLoginPage from "./pages/WorkspaceLoginPage";

// Pages - Workspace Level (Layer 2 - Existing salon app)
import LoginPage from "./pages/LoginPage";
import TodayPage from "./pages/TodayPage";
import MoneyPage from "./pages/MoneyPage";
import ClientsPage from "./pages/ClientsPage";
import OrdersPage from "./pages/OrdersPage";
import SettingsPage from "./pages/SettingsPage";
import { BottomNav } from "./components/BottomNav";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Axios instance for API calls
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Check which token to use based on the endpoint
  const isAccountEndpoint = config.url?.startsWith('/accounts') || 
                            config.url?.startsWith('/workspaces') || 
                            config.url?.startsWith('/business-types');
  
  if (isAccountEndpoint) {
    const accountToken = localStorage.getItem("account_token");
    if (accountToken) {
      config.headers.Authorization = `Bearer ${accountToken}`;
    }
  } else {
    const salonToken = localStorage.getItem("salon_token");
    if (salonToken) {
      config.headers.Authorization = `Bearer ${salonToken}`;
    }
  }
  return config;
});

// Auth Context for workspace-level auth (existing PIN-based)
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [staff, setStaff] = useState(() => {
    const stored = localStorage.getItem("salon_staff");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("salon_token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setStaff(response.data);
          localStorage.setItem("salon_staff", JSON.stringify(response.data));
        } catch {
          localStorage.removeItem("salon_token");
          localStorage.removeItem("salon_staff");
          setStaff(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (staffData, token) => {
    localStorage.setItem("salon_token", token);
    localStorage.setItem("salon_staff", JSON.stringify(staffData));
    setStaff(staffData);
  };

  const logout = () => {
    localStorage.removeItem("salon_token");
    localStorage.removeItem("salon_staff");
    setStaff(null);
  };

  const isOwner = staff?.role === "owner";

  return (
    <AuthContext.Provider value={{ staff, login, logout, loading, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

// Account-level auth check
function RequireAccount({ children }) {
  const accountToken = localStorage.getItem("account_token");
  
  if (!accountToken) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Workspace-level auth check (existing PIN-based)
function RequireWorkspaceAuth({ children }) {
  const { staff, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-serif text-2xl text-primary">Loading...</div>
      </div>
    );
  }
  
  if (!staff) {
    // Check if we have a workspace selected
    const currentWorkspace = localStorage.getItem("current_workspace");
    if (currentWorkspace) {
      const workspace = JSON.parse(currentWorkspace);
      return <Navigate to={`/workspace/${workspace.id}/login`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Layout with bottom navigation for workspace pages
function WorkspaceLayout({ children }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="noise-overlay" />
      {children}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-center" />
        <Routes>
          {/* Account-level routes (Layer 1) */}
          <Route path="/login" element={<AccountLoginPage />} />
          <Route path="/dashboard" element={
            <RequireAccount>
              <AccountDashboard />
            </RequireAccount>
          } />
          <Route path="/workspace/new" element={
            <RequireAccount>
              <CreateWorkspacePage />
            </RequireAccount>
          } />
          <Route path="/workspace/:workspaceId/login" element={
            <RequireAccount>
              <WorkspaceLoginPage />
            </RequireAccount>
          } />

          {/* Workspace-level routes (Layer 2 - Existing salon app) */}
          <Route path="/" element={
            <RequireWorkspaceAuth>
              <WorkspaceLayout>
                <TodayPage />
              </WorkspaceLayout>
            </RequireWorkspaceAuth>
          } />
          <Route path="/money" element={
            <RequireWorkspaceAuth>
              <WorkspaceLayout>
                <MoneyPage />
              </WorkspaceLayout>
            </RequireWorkspaceAuth>
          } />
          <Route path="/orders" element={
            <RequireWorkspaceAuth>
              <WorkspaceLayout>
                <OrdersPage />
              </WorkspaceLayout>
            </RequireWorkspaceAuth>
          } />
          <Route path="/clients" element={
            <RequireWorkspaceAuth>
              <WorkspaceLayout>
                <ClientsPage />
              </WorkspaceLayout>
            </RequireWorkspaceAuth>
          } />
          <Route path="/settings" element={
            <RequireWorkspaceAuth>
              <WorkspaceLayout>
                <SettingsPage />
              </WorkspaceLayout>
            </RequireWorkspaceAuth>
          } />

          {/* Legacy PIN login page (for backward compatibility) */}
          <Route path="/pin-login" element={<LoginPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
