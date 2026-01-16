import { useState, useEffect } from "react";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Tag,
  AlertTriangle,
  FileText,
  Euro,
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClientsPage() {
  const { staff } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Forms
  const [clientForm, setClientForm] = useState({
    name: "", phone: "", email: "", notes: "", tags: [], risk_level: "normal"
  });
  const [depositForm, setDepositForm] = useState({
    amount: "", required_date: "", service_description: ""
  });
  const [newTag, setNewTag] = useState("");

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterTag) params.append("tag", filterTag);
      if (filterRisk) params.append("risk_level", filterRisk);
      
      const response = await api.get(`/clients?${params.toString()}`);
      setClients(response.data);
    } catch (error) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchClients, 300);
    return () => clearTimeout(debounce);
  }, [search, filterTag, filterRisk]);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedClient) {
        await api.put(`/clients/${selectedClient.id}`, clientForm);
        toast.success("Client updated");
      } else {
        await api.post("/clients", clientForm);
        toast.success("Client added");
      }
      setShowClientModal(false);
      resetClientForm();
      fetchClients();
    } catch (error) {
      toast.error("Failed to save client");
    }
  };

  const handleAddDeposit = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await api.post("/deposits", {
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        amount: parseFloat(depositForm.amount),
        required_date: depositForm.required_date,
        service_description: depositForm.service_description
      });
      toast.success("Deposit request created");
      setShowDepositModal(false);
      setDepositForm({ amount: "", required_date: "", service_description: "" });
      // Refresh client data
      const response = await api.get(`/clients/${selectedClient.id}`);
      setSelectedClient(response.data);
    } catch (error) {
      toast.error("Failed to create deposit request");
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient || !window.confirm(`Delete ${selectedClient.name}?`)) return;
    try {
      await api.delete(`/clients/${selectedClient.id}`);
      toast.success("Client deleted");
      setShowDetailModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  const resetClientForm = () => {
    setClientForm({ name: "", phone: "", email: "", notes: "", tags: [], risk_level: "normal" });
    setEditMode(false);
    setSelectedClient(null);
  };

  const openClientDetail = async (client) => {
    try {
      const response = await api.get(`/clients/${client.id}`);
      setSelectedClient(response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Failed to load client details");
    }
  };

  const openEditClient = () => {
    if (!selectedClient) return;
    setClientForm({
      name: selectedClient.name,
      phone: selectedClient.phone || "",
      email: selectedClient.email || "",
      notes: selectedClient.notes || "",
      tags: selectedClient.tags || [],
      risk_level: selectedClient.risk_level
    });
    setEditMode(true);
    setShowDetailModal(false);
    setShowClientModal(true);
  };

  const addTag = () => {
    if (newTag && !clientForm.tags.includes(newTag)) {
      setClientForm({ ...clientForm, tags: [...clientForm.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setClientForm({ ...clientForm, tags: clientForm.tags.filter(t => t !== tag) });
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "high": return "risk-high";
      case "medium": return "risk-medium";
      default: return "risk-normal";
    }
  };

  // Get all unique tags from clients
  const allTags = [...new Set(clients.flatMap(c => c.tags || []))];

  return (
    <div className="page-container" data-testid="clients-page">
      {/* Header */}
      <header className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} clients</p>
        </div>
        <Button 
          onClick={() => {
            resetClientForm();
            setShowClientModal(true);
          }}
          className="rounded-full"
          data-testid="add-client-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </header>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input pl-12"
            data-testid="client-search"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => { setFilterTag(""); setFilterRisk(""); }}
            className={`tab-item ${!filterTag && !filterRisk ? "active" : ""}`}
          >
            All
          </button>
          <button
            onClick={() => { setFilterRisk("high"); setFilterTag(""); }}
            className={`tab-item ${filterRisk === "high" ? "active" : ""}`}
            data-testid="filter-high-risk"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            High Risk
          </button>
          {allTags.slice(0, 5).map(tag => (
            <button
              key={tag}
              onClick={() => { setFilterTag(tag); setFilterRisk(""); }}
              className={`tab-item ${filterTag === tag ? "active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse font-serif text-xl text-primary">Loading...</div>
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <User className="empty-state-icon" />
          <h3 className="empty-state-title">No clients found</h3>
          <p className="empty-state-text">
            {search ? "Try a different search" : "Add your first client to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => openClientDetail(client)}
              className="w-full bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between card-hover text-left"
              data-testid={`client-${client.id}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  client.risk_level === "high" ? "bg-red-100" : 
                  client.risk_level === "medium" ? "bg-amber-100" : "bg-secondary"
                }`}>
                  <User className={`w-6 h-6 ${
                    client.risk_level === "high" ? "text-red-600" : 
                    client.risk_level === "medium" ? "text-amber-600" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <div className="font-medium text-primary flex items-center gap-2">
                    {client.name}
                    {client.risk_level !== "normal" && (
                      <Badge variant="outline" className={`text-xs ${getRiskBadgeClass(client.risk_level)}`}>
                        {client.risk_level}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3">
                    {client.phone && <span>{client.phone}</span>}
                    {client.tags?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {client.tags.slice(0, 2).join(", ")}
                        {client.tags.length > 2 && `+${client.tags.length - 2}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="client-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editMode ? "Edit Client" : "Add Client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-6 mt-4">
            <div className="form-group">
              <Label>Name *</Label>
              <Input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="Client name"
                required
                data-testid="client-name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                placeholder="+353 ..."
                data-testid="client-phone"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Email</Label>
              <Input
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="email@example.com"
                data-testid="client-email"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Risk Level</Label>
              <Select
                value={clientForm.risk_level}
                onValueChange={(v) => setClientForm({ ...clientForm, risk_level: v })}
              >
                <SelectTrigger data-testid="client-risk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  data-testid="client-new-tag"
                  className="form-input"
                />
                <Button type="button" variant="outline" onClick={addTag} className="rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {clientForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {clientForm.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="pl-3 pr-1 py-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 p-1">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <Label>Internal Notes</Label>
              <Textarea
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                placeholder="Notes visible only to staff..."
                rows={3}
                data-testid="client-notes"
                className="resize-none"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-client">
              {editMode ? "Save Changes" : "Add Client"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Client Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="client-detail-modal">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                  {selectedClient.name}
                  {selectedClient.risk_level !== "normal" && (
                    <Badge variant="outline" className={getRiskBadgeClass(selectedClient.risk_level)}>
                      {selectedClient.risk_level} risk
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${selectedClient.phone}`} className="hover:text-primary">
                        {selectedClient.phone}
                      </a>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedClient.email}`} className="hover:text-primary">
                        {selectedClient.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedClient.tags?.length > 0 && (
                  <div>
                    <div className="section-title">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedClient.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedClient.notes && (
                  <div>
                    <div className="section-title">Internal Notes</div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-sm">
                      {selectedClient.notes}
                    </div>
                  </div>
                )}

                {/* Deposit History */}
                {selectedClient.deposit_history?.length > 0 && (
                  <div>
                    <div className="section-title">Deposit History</div>
                    <div className="space-y-2">
                      {selectedClient.deposit_history.slice(0, 5).map((dep, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="font-mono">€{dep.amount}</span>
                          <Badge variant={dep.status === "paid" ? "default" : dep.status === "pending" ? "secondary" : "outline"}>
                            {dep.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowDepositModal(true);
                    }}
                    className="flex-1 rounded-full"
                    data-testid="request-deposit-btn"
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Request Deposit
                  </Button>
                  <Button
                    onClick={openEditClient}
                    className="flex-1 rounded-full"
                    data-testid="edit-client-btn"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleDeleteClient}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  data-testid="delete-client-btn"
                >
                  Delete Client
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Deposit Modal */}
      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent className="sm:max-w-md" data-testid="deposit-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Request Deposit</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleAddDeposit} className="space-y-6 mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                For: <span className="font-medium text-primary">{selectedClient.name}</span>
              </div>
              <div className="form-group">
                <Label>Amount (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  placeholder="50.00"
                  required
                  data-testid="deposit-amount"
                  className="form-input font-mono text-2xl"
                />
              </div>
              <div className="form-group">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={depositForm.required_date}
                  onChange={(e) => setDepositForm({ ...depositForm, required_date: e.target.value })}
                  required
                  data-testid="deposit-date"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <Label>Service Description *</Label>
                <Input
                  value={depositForm.service_description}
                  onChange={(e) => setDepositForm({ ...depositForm, service_description: e.target.value })}
                  placeholder="e.g., Balayage appointment"
                  required
                  data-testid="deposit-service"
                  className="form-input"
                />
              </div>
              <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-deposit">
                Create Deposit Request
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
