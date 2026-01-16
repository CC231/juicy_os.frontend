import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { Mail, Lock, User, Phone, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login, register, verify
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    name: "", 
    phone: "" 
  });
  const [otpForm, setOtpForm] = useState({ otp: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/accounts/login", loginForm);
      localStorage.setItem("account_token", response.data.token);
      localStorage.setItem("account", JSON.stringify(response.data.account));
      toast.success(`Welcome back, ${response.data.account.name}!`);
      navigate("/dashboard");
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (detail === "Email not verified") {
        setPendingEmail(loginForm.email);
        // Request new OTP
        await api.post("/accounts/register", { 
          email: loginForm.email, 
          password: loginForm.password,
          name: "User",
          phone: ""
        }).catch(() => {});
        toast.info("Please verify your email first");
        setMode("verify");
      } else {
        toast.error(detail || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/accounts/register", {
        email: registerForm.email,
        password: registerForm.password,
        name: registerForm.name,
        phone: registerForm.phone
      });
      setPendingEmail(registerForm.email);
      toast.success("Check your email for verification code");
      setMode("verify");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/accounts/verify-otp", {
        email: pendingEmail,
        otp: otpForm.otp
      });
      localStorage.setItem("account_token", response.data.token);
      localStorage.setItem("account", JSON.stringify(response.data.account));
      toast.success("Email verified! Welcome!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="account-login-page">
      <div className="noise-overlay" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl text-primary">Salon Control</h1>
          <p className="text-muted-foreground mt-2">Manage your business with ease</p>
        </div>

        {/* Login Form */}
        {mode === "login" && (
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card animate-fade-in">
            <h2 className="font-serif text-2xl text-center mb-6">Welcome Back</h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  data-testid="login-email"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </Label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                  className="form-input"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full rounded-full py-6 text-lg"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button 
                  onClick={() => setMode("register")}
                  className="text-primary font-medium hover:underline"
                  data-testid="go-to-register"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Register Form */}
        {mode === "register" && (
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card animate-fade-in">
            <h2 className="font-serif text-2xl text-center mb-6">Create Account</h2>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                <Input
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  data-testid="register-name"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  data-testid="register-email"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  required
                  data-testid="register-phone"
                  className="form-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Password
                  </Label>
                  <Input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••"
                    required
                    minLength={6}
                    data-testid="register-password"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <Label>Confirm</Label>
                  <Input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="••••••"
                    required
                    data-testid="register-confirm-password"
                    className="form-input"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full rounded-full py-6 text-lg"
                disabled={loading}
                data-testid="register-submit"
              >
                {loading ? "Creating..." : "Create Account"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button 
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                  data-testid="go-to-login"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* OTP Verification */}
        {mode === "verify" && (
          <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card animate-fade-in">
            <h2 className="font-serif text-2xl text-center mb-2">Verify Email</h2>
            <p className="text-center text-muted-foreground mb-6">
              Enter the 6-digit code sent to<br />
              <span className="text-primary font-medium">{pendingEmail}</span>
            </p>
            
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="form-group">
                <Input
                  type="text"
                  value={otpForm.otp}
                  onChange={(e) => setOtpForm({ otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="000000"
                  required
                  maxLength={6}
                  data-testid="otp-input"
                  className="form-input text-center text-3xl font-mono tracking-[0.5em]"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full rounded-full py-6 text-lg"
                disabled={loading || otpForm.otp.length !== 6}
                data-testid="verify-submit"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button 
                onClick={() => setMode("login")}
                className="text-muted-foreground hover:text-primary text-sm"
              >
                ← Back to login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
