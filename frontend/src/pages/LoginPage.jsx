import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, api } from "@/App";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { login, staff } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (staff) {
      navigate("/");
      return;
    }

    // Initialize salon on first load
    const initSalon = async () => {
      try {
        await api.post("/setup/init");
      } catch (error) {
        // Ignore errors - salon might already be initialized
      } finally {
        setInitializing(false);
      }
    };
    initSalon();
  }, [staff, navigate]);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = pin.split("");
    newPin[index] = value;
    const updatedPin = newPin.join("").slice(0, 4);
    setPin(updatedPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 4 digits entered
    if (updatedPin.length === 4) {
      handleLogin(updatedPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async (pinValue) => {
    if (pinValue.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const staffData = await login(pinValue);
      toast.success(`Welcome, ${staffData.name}`);
      navigate("/");
    } catch (error) {
      setPin("");
      inputRefs.current[0]?.focus();
      toast.error("Invalid PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-serif text-2xl text-primary">Setting up...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6" data-testid="login-page">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 mb-6">
            <Scissors className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-primary mb-3">
            Salon Control
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter your PIN to continue
          </p>
        </div>

        {/* PIN Input */}
        <div className="mb-8">
          <div className="flex justify-center gap-4" data-testid="pin-input-container">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pin[index] || ""}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                data-testid={`pin-input-${index}`}
                className="w-16 h-20 text-center text-3xl font-mono bg-card border-2 border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-ring/20 outline-none disabled:opacity-50"
                style={{ transition: "border-color 0.2s ease, box-shadow 0.2s ease" }}
              />
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        {/* Help text */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Default owner PIN: <span className="font-mono font-medium">1234</span></p>
        </div>
      </div>
    </div>
  );
}
