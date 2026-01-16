import { useState, useEffect } from "react";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { 
  Scissors, 
  Plus, 
  Trash2,
  Euro,
  CheckCircle2,
  Clock,
  Package,
  Pencil,
  Check,
  X
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrdersPage() {
  const { staff, isOwner } = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // active, completed, all
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [orderForm, setOrderForm] = useState({
    client_id: "",
    hair_description: "",
    deposit_amount: "",
    full_amount: "",
    cost: "",
    due_date: "",
    payment_method: "cash",
    notes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        api.get("/hair-orders"),
        api.get("/clients")
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.client_id) {
      toast.error("Please select a client");
      return;
    }
    const client = clients.find(c => c.id === orderForm.client_id);
    try {
      await api.post("/hair-orders", {
        ...orderForm,
        client_name: client?.name || "Unknown",
        deposit_amount: parseFloat(orderForm.deposit_amount),
        full_amount: parseFloat(orderForm.full_amount),
        cost: parseFloat(orderForm.cost) || 0
      });
      toast.success("Order created");
      setShowOrderModal(false);
      setOrderForm({ client_id: "", hair_description: "", deposit_amount: "", full_amount: "", cost: "", due_date: "", payment_method: "cash", notes: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to create order");
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.put(`/hair-orders/${selectedOrder.id}`, {
        hair_description: orderForm.hair_description,
        deposit_amount: parseFloat(orderForm.deposit_amount),
        full_amount: parseFloat(orderForm.full_amount),
        cost: parseFloat(orderForm.cost) || 0,
        due_date: orderForm.due_date,
        payment_method: orderForm.payment_method,
        notes: orderForm.notes
      });
      toast.success("Order updated");
      setShowEditModal(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleMarkOrdered = async (orderId) => {
    try {
      await api.put(`/hair-orders/${orderId}/mark-ordered`);
      toast.success("Marked as ordered");
      fetchData();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleMarkComplete = async (orderId) => {
    try {
      await api.put(`/hair-orders/${orderId}/complete`);
      toast.success("Order completed");
      fetchData();
    } catch (error) {
      toast.error("Failed to complete order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await api.delete(`/hair-orders/${orderId}`);
      toast.success("Order deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setOrderForm({
      client_id: order.client_id,
      hair_description: order.hair_description,
      deposit_amount: String(order.deposit_amount),
      full_amount: String(order.full_amount),
      cost: String(order.cost || ""),
      due_date: order.due_date,
      payment_method: order.payment_method || "cash",
      notes: order.notes || ""
    });
    setShowEditModal(true);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === "active") return !order.is_completed;
    if (filter === "completed") return order.is_completed;
    return true;
  });

  const activeCount = orders.filter(o => !o.is_completed).length;
  const completedCount = orders.filter(o => o.is_completed).length;

  return (
    <div className="page-container" data-testid="orders-page">
      {/* Header */}
      <header className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{activeCount} active • {completedCount} completed</p>
        </div>
        <Button 
          onClick={() => {
            setOrderForm({ client_id: "", hair_description: "", deposit_amount: "", full_amount: "", cost: "", due_date: "", payment_method: "cash", notes: "" });
            setShowOrderModal(true);
          }}
          className="rounded-full"
          data-testid="add-order-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "all", label: "All" }
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`tab-item ${filter === f.value ? "active" : ""}`}
            data-testid={`filter-${f.value}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse font-serif text-xl text-primary">Loading...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <Scissors className="empty-state-icon" />
          <h3 className="empty-state-title">No orders found</h3>
          <p className="empty-state-text">Create your first custom order</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const remaining = (order.full_amount || 0) - (order.deposit_amount || 0);
            const profit = (order.full_amount || 0) - (order.cost || 0);
            
            return (
              <div 
                key={order.id}
                className={`bg-card border rounded-2xl p-5 shadow-card ${order.is_completed ? "opacity-60 border-border/30" : "border-border/50"}`}
                data-testid={`order-${order.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      order.is_completed ? "bg-emerald-100" : order.is_ordered ? "bg-blue-100" : "bg-amber-100"
                    }`}>
                      {order.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : order.is_ordered ? (
                        <Package className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-primary">{order.client_name}</div>
                      <div className="text-sm text-muted-foreground">{order.hair_description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.is_ordered && !order.is_completed && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">Ordered</Badge>
                    )}
                    {order.is_completed && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Completed</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
                    <div className="font-mono text-lg">{formatCurrency(order.full_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Deposit</div>
                    <div className="font-mono text-lg text-emerald-600">{formatCurrency(order.deposit_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</div>
                    <div className="font-mono text-lg text-amber-600">{formatCurrency(remaining)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Due Date</div>
                    <div className="font-mono text-lg">{order.due_date}</div>
                  </div>
                </div>

                {order.cost > 0 && (
                  <div className="bg-secondary/30 rounded-lg p-3 mb-4 flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost: {formatCurrency(order.cost)}</span>
                    <span className="text-emerald-600 font-medium">Profit: {formatCurrency(profit)}</span>
                  </div>
                )}

                {order.notes && (
                  <div className="text-sm text-muted-foreground mb-4 italic">"{order.notes}"</div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {!order.is_ordered && !order.is_completed && (
                    <Button
                      onClick={() => handleMarkOrdered(order.id)}
                      size="sm"
                      className="rounded-full bg-blue-600 hover:bg-blue-700"
                      data-testid={`mark-ordered-${order.id}`}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Mark as Ordered
                    </Button>
                  )}
                  {order.is_ordered && !order.is_completed && (
                    <Button
                      onClick={() => handleMarkComplete(order.id)}
                      size="sm"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                      data-testid={`mark-complete-${order.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Complete & Collect {formatCurrency(remaining)}
                    </Button>
                  )}
                  {!order.is_completed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(order)}
                      className="rounded-full"
                      data-testid={`edit-order-${order.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteOrder(order.id)}
                    className="rounded-full text-destructive hover:text-destructive"
                    data-testid={`delete-order-${order.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Order Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="order-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New Custom Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOrder} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Client *</Label>
              <Select
                value={orderForm.client_id}
                onValueChange={(v) => setOrderForm({ ...orderForm, client_id: v })}
              >
                <SelectTrigger data-testid="order-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.phone && `(${client.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Description *</Label>
              <Input
                value={orderForm.hair_description}
                onChange={(e) => setOrderForm({ ...orderForm, hair_description: e.target.value })}
                placeholder="e.g., 22'' Brazilian Body Wave"
                required
                data-testid="order-description"
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <Label>Total (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderForm.full_amount}
                  onChange={(e) => setOrderForm({ ...orderForm, full_amount: e.target.value })}
                  required
                  data-testid="order-total"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Deposit (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderForm.deposit_amount}
                  onChange={(e) => setOrderForm({ ...orderForm, deposit_amount: e.target.value })}
                  required
                  data-testid="order-deposit"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderForm.cost}
                  onChange={(e) => setOrderForm({ ...orderForm, cost: e.target.value })}
                  data-testid="order-cost"
                  className="form-input font-mono"
                />
              </div>
            </div>
            {orderForm.full_amount && orderForm.deposit_amount && (
              <div className="bg-secondary/50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining on pickup:</span>
                  <span className="font-mono font-medium text-amber-600">
                    {formatCurrency((parseFloat(orderForm.full_amount) || 0) - (parseFloat(orderForm.deposit_amount) || 0))}
                  </span>
                </div>
                {orderForm.cost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {formatCurrency((parseFloat(orderForm.full_amount) || 0) - (parseFloat(orderForm.cost) || 0))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={orderForm.due_date}
                onChange={(e) => setOrderForm({ ...orderForm, due_date: e.target.value })}
                required
                data-testid="order-due-date"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Payment Method</Label>
              <Select
                value={orderForm.payment_method}
                onValueChange={(v) => setOrderForm({ ...orderForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Notes</Label>
              <Input
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="Special instructions..."
                data-testid="order-notes"
                className="form-input"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg bg-amber-600 hover:bg-amber-700" data-testid="submit-order">
              Create Order
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="edit-order-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOrder} className="space-y-5 mt-4">
            <div className="text-sm text-muted-foreground mb-2">
              Client: <span className="font-medium text-primary">{selectedOrder?.client_name}</span>
            </div>
            <div className="form-group">
              <Label>Description *</Label>
              <Input
                value={orderForm.hair_description}
                onChange={(e) => setOrderForm({ ...orderForm, hair_description: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <Label>Total (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={orderForm.full_amount}
                  onChange={(e) => setOrderForm({ ...orderForm, full_amount: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Deposit (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={orderForm.deposit_amount}
                  onChange={(e) => setOrderForm({ ...orderForm, deposit_amount: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={orderForm.cost}
                  onChange={(e) => setOrderForm({ ...orderForm, cost: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
            </div>
            <div className="form-group">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={orderForm.due_date}
                onChange={(e) => setOrderForm({ ...orderForm, due_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Notes</Label>
              <Input
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                className="form-input"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="update-order">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
