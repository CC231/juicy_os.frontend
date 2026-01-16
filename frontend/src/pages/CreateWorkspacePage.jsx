import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { 
  Building2, 
  ArrowLeft,
  Sparkles,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateWorkspacePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    business_type: "",
    custom_type: "",
    owner_pin: "",
    confirm_pin: ""
  });

  useEffect(() => {
    const fetchBusinessTypes = async () => {
      try {
        const token = localStorage.getItem("account_token");
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await api.get("/business-types", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBusinessTypes(response.data);
      } catch (error) {
        console.error("Failed to fetch business types");
      }
    };
    fetchBusinessTypes();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.owner_pin !== form.confirm_pin) {
      toast.error("PINs don't match");
      return;
    }
    
    if (form.owner_pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("account_token");
      const businessType = form.business_type === "Other" ? form.custom_type : form.business_type;
      
      const response = await api.post("/workspaces", {
        name: form.name,
        business_type: businessType,
        owner_pin: form.owner_pin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Workspace created successfully!");
      
      // Store workspace and navigate to PIN login
      localStorage.setItem("current_workspace", JSON.stringify(response.data));
      navigate(`/workspace/${response.data.id}/login`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="create-workspace-page">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="bg-card border-b border-border/50 p-4 sticky top-0 z-20">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-serif text-xl">Create Workspace</h1>
            <p className="text-xs text-muted-foreground">Set up your new business</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 relative z-10">
        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-card">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto mb-6 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="font-serif text-2xl text-center mb-6">New Workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Name */}
            <div className="form-group">
              <Label>Business Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Luxe Hair Studio"
                required
                data-testid="workspace-name"
                className="form-input"
              />
            </div>

            {/* Business Type */}
            <div className="form-group">
              <Label>Business Type *</Label>
              <Select
                value={form.business_type}
                onValueChange={(v) => setForm({ ...form, business_type: v })}
              >
                <SelectTrigger data-testid="business-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Type (if Other selected) */}
            {form.business_type === "Other" && (
              <div className="form-group animate-fade-in">
                <Label>Custom Business Type *</Label>
                <Input
                  value={form.custom_type}
                  onChange={(e) => setForm({ ...form, custom_type: e.target.value })}
                  placeholder="e.g., Pet Grooming"
                  required
                  data-testid="custom-type"
                  className="form-input"
                />
              </div>
            )}

            {/* PIN Section */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Create a PIN to access this workspace. You'll use this PIN to log in as the owner.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <Label>Owner PIN (4-6 digits) *</Label>
                  <Input
                    type="password"
                    value={form.owner_pin}
                    onChange={(e) => setForm({ ...form, owner_pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="••••"
                    required
                    minLength={4}
                    maxLength={6}
                    data-testid="owner-pin"
                    className="form-input font-mono text-center text-xl"
                  />
                </div>
                <div className="form-group">
                  <Label>Confirm PIN *</Label>
                  <Input
                    type="password"
                    value={form.confirm_pin}
                    onChange={(e) => setForm({ ...form, confirm_pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    placeholder="••••"
                    required
                    maxLength={6}
                    data-testid="confirm-pin"
                    className="form-input font-mono text-center text-xl"
                  />
                  {form.owner_pin && form.confirm_pin && form.owner_pin === form.confirm_pin && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs mt-1">
                      <Check className="w-3 h-3" /> PINs match
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full py-6 text-lg"
              disabled={loading || !form.name || !form.business_type || !form.owner_pin || form.owner_pin !== form.confirm_pin}
              data-testid="create-workspace-submit"
            >
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
