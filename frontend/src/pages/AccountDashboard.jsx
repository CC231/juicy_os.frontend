import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Building2, 
  LogOut,
  Plus,
  ArrowRight,
  Sparkles,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AccountDashboard() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get account from localStorage first
        const storedAccount = localStorage.getItem("account");
        if (storedAccount) {
          setAccount(JSON.parse(storedAccount));
        }

        // Fetch workspaces
        const token = localStorage.getItem("account_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const [accountRes, workspacesRes] = await Promise.all([
          api.get("/accounts/me", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get("/workspaces", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setAccount(accountRes.data);
        setWorkspaces(workspacesRes.data.workspaces || []);
        localStorage.setItem("account", JSON.stringify(accountRes.data));
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("account_token");
          localStorage.removeItem("account");
          navigate("/login");
        }
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("account_token");
    localStorage.removeItem("account");
    localStorage.removeItem("salon_token");
    localStorage.removeItem("salon_staff");
    localStorage.removeItem("current_workspace");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleSelectWorkspace = (workspace) => {
    localStorage.setItem("current_workspace", JSON.stringify(workspace));
    navigate(`/workspace/${workspace.id}/login`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-serif text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  const planColors = {
    free: "bg-gray-100 text-gray-700",
    basic: "bg-blue-100 text-blue-700",
    pro: "bg-amber-100 text-amber-700"
  };

  return (
    <div className="min-h-screen bg-background" data-testid="account-dashboard">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="bg-card border-b border-border/50 p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl">Salon Control</h1>
              <p className="text-xs text-muted-foreground">Account Dashboard</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 relative z-10">
        <Tabs defaultValue="workspaces" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-secondary rounded-full p-1">
            <TabsTrigger value="workspaces" className="rounded-full data-[state=active]:bg-card" data-testid="tab-workspaces">
              <Building2 className="w-4 h-4 mr-2" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-full data-[state=active]:bg-card" data-testid="tab-account">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl">Your Workspaces</h2>
              <Button 
                onClick={() => navigate("/workspace/new")}
                className="rounded-full"
                data-testid="create-workspace-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Workspace
              </Button>
            </div>

            {workspaces.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-3xl p-12 text-center shadow-card">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-serif text-xl mb-2">No workspaces yet</h3>
                <p className="text-muted-foreground mb-6">Create your first workspace to start managing your business</p>
                <Button 
                  onClick={() => navigate("/workspace/new")}
                  className="rounded-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workspace
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {workspaces.map((workspace) => (
                  <div 
                    key={workspace.id}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-card hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => handleSelectWorkspace(workspace)}
                    data-testid={`workspace-${workspace.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl">{workspace.name}</h3>
                          <p className="text-muted-foreground">{workspace.business_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {workspace.owner_account_id === account?.id ? "Owner" : "Member"}
                        </Badge>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="animate-fade-in space-y-6">
            <h2 className="font-serif text-2xl">Account Details</h2>

            {/* Profile Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">{account?.name}</h3>
                  <Badge className={planColors[account?.subscription_status || "free"]}>
                    <Crown className="w-3 h-3 mr-1" />
                    {account?.plan_type || "Free"} Plan
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{account?.email}</div>
                  </div>
                  {account?.email_verified && (
                    <Badge variant="secondary" className="ml-auto text-emerald-600">Verified</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{account?.phone || "Not set"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-b border-border/50">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Member Since</div>
                    <div className="font-medium">{account?.created_at ? formatDate(account.created_at) : "N/A"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Workspaces</div>
                    <div className="font-medium">{workspaces.length} workspace(s)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-medium text-lg">Subscription</h3>
              </div>
              
              <div className="bg-secondary/50 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif text-xl">{account?.plan_type || "Free"} Plan</div>
                    <div className="text-sm text-muted-foreground">
                      {account?.subscription_status === "free" 
                        ? "Upgrade for more features" 
                        : "Active subscription"}
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full">
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
