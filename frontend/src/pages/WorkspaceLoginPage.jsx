import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { Building2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WorkspaceLoginPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { login } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    const stored = localStorage.getItem("current_workspace");
    if (stored) {
      setWorkspace(JSON.parse(stored));
    } else {
      // Fetch workspace info
      const fetchWorkspace = async () => {
        try {
          const token = localStorage.getItem("account_token");
          const response = await api.get(`/workspaces/${workspaceId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setWorkspace(response.data);
          localStorage.setItem("current_workspace", JSON.stringify(response.data));
        } catch (error) {
          toast.error("Workspace not found");
          navigate("/dashboard");
        }
      };
      fetchWorkspace();
    }
  }, [workspaceId, navigate]);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    const fullPin = newPin.join("");
    if (fullPin.length >= 4 && newPin.slice(0, 4).every(d => d)) {
      handleLogin(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (pinCode) => {
    if (loading) return;
    
    const cleanPin = pinCode || pin.join("");
    if (cleanPin.length < 4) {
      setError("Enter at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      const accountToken = localStorage.getItem("account_token");
      const response = await api.post(`/workspaces/${workspaceId}/enter`, {
        pin: cleanPin
      }, {
        headers: { Authorization: `Bearer ${accountToken}` }
      });

      // Store workspace token and staff info
      localStorage.setItem("current_workspace", JSON.stringify(response.data.workspace));
      
      // Use auth context login to update state properly
      login(response.data.staff, response.data.token);

      toast.success(`Welcome to ${response.data.workspace.name}!`);
      navigate("/");
    } catch (error) {
      setError(error.response?.data?.detail || "Invalid PIN");
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="workspace-login-page">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="p-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to workspaces
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Workspace Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-4 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-serif text-2xl">{workspace?.name || "Loading..."}</h1>
            <p className="text-muted-foreground">{workspace?.business_type}</p>
          </div>

          {/* PIN Entry */}
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
            <div className="flex items-center justify-center gap-2 mb-6">
              <KeyRound className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-medium">Enter your PIN</h2>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-mono ${
                    error ? "border-destructive" : ""
                  }`}
                  data-testid={`pin-input-${index}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-destructive text-center text-sm mb-4">{error}</p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Enter your 4-6 digit PIN to access this workspace
            </p>

            {loading && (
              <div className="text-center mt-4">
                <div className="animate-pulse text-primary">Verifying...</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
