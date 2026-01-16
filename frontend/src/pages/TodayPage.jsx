import { useState, useEffect } from "react";
import { useAuth, api } from "@/App";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Euro, 
  Package, 
  Plus,
  TrendingDown,
  LogOut,
  Scissors,
  CreditCard,
  Banknote,
  UserPlus,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TodayPage() {
  const { staff, logout, isOwner } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showHairOrderModal, setShowHairOrderModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ 
    sale_type: "service", 
    description: "", 
    amount: "", 
    cost: "",
    quantity: "1",
    payment_method: "cash",
    sale_date: ""  // For historical entries
  });
  const [expenseForm, setExpenseForm] = useState({ 
    category: "supplies", 
    description: "", 
    amount: "",
    expense_date: ""  // For historical entries
  });
  const [hairOrderForm, setHairOrderForm] = useState({
    client_id: "",
    hair_description: "",
    deposit_amount: "",
    full_amount: "",
    cost: "",
    due_date: "",
    payment_method: "cash",
    notes: ""
  });
  const [newClientForm, setNewClientForm] = useState({ name: "", phone: "", email: "" });
  const [config, setConfig] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchDashboard = async () => {
    try {
      const [dashRes, clientsRes, trendRes, configRes, notifRes] = await Promise.all([
        api.get("/dashboard/today"),
        api.get("/clients"),
        api.get("/dashboard/revenue-trend?days=7"),
        api.get("/config"),
        api.get("/notifications?unread_only=true&limit=10").catch(() => ({ data: [] }))
      ]);
      setDashboard(dashRes.data);
      setClients(clientsRes.data);
      setRevenueTrend(trendRes.data.trend);
      setConfig(configRes.data);
      setNotifications(notifRes.data || []);
      
      // Check for reminders
      api.post("/notifications/check-reminders").catch(() => {});
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    api.get("/checklists/today").catch(() => {});
  }, []);

  // Show popup notifications
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(notif => {
        if (!notif.read) {
          toast(notif.title, {
            description: notif.message,
            duration: 8000,
            action: {
              label: "Dismiss",
              onClick: () => api.put(`/notifications/${notif.id}/read`).catch(() => {})
            }
          });
        }
      });
    }
  }, [notifications]);

  const handleToggleChecklistItem = async (checklistId, itemId) => {
    try {
      await api.put(`/checklists/${checklistId}/items/${itemId}/toggle`);
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to update checklist");
    }
  };

  const handleMarkDepositPaid = async (depositId) => {
    try {
      await api.put(`/deposits/${depositId}/pay`);
      toast.success("Deposit marked as paid");
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to mark deposit as paid");
    }
  };

  const handleMarkHairOrderOrdered = async (orderId) => {
    try {
      await api.put(`/hair-orders/${orderId}/mark-ordered`);
      toast.success("Marked as ordered");
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleAddSale = async (e) => {
    e.preventDefault();
    try {
      const saleData = {
        sale_type: saleForm.sale_type,
        description: saleForm.description,
        amount: parseFloat(saleForm.amount),
        cost: parseFloat(saleForm.cost) || 0,
        quantity: parseInt(saleForm.quantity) || 1,
        payment_method: saleForm.payment_method,
        staff_id: staff.id
      };
      // Only include sale_date if it's set (not empty)
      if (saleForm.sale_date) {
        saleData.sale_date = saleForm.sale_date;
      }
      await api.post("/sales", saleData);
      toast.success(saleForm.sale_date ? `Sale recorded for ${saleForm.sale_date}` : "Sale recorded");
      setShowSaleModal(false);
      setSaleForm({ sale_type: "service", description: "", amount: "", cost: "", quantity: "1", payment_method: "cash", sale_date: "" });
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to add sale");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        staff_id: staff.id
      };
      // Only include expense_date if it's set (not empty)
      if (expenseForm.expense_date) {
        expenseData.expense_date = expenseForm.expense_date;
      }
      await api.post("/expenses", expenseData);
      toast.success(expenseForm.expense_date ? `Expense recorded for ${expenseForm.expense_date}` : "Expense recorded");
      setShowExpenseModal(false);
      setExpenseForm({ category: "supplies", description: "", amount: "", expense_date: "" });
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const handleAddHairOrder = async (e) => {
    e.preventDefault();
    if (!hairOrderForm.client_id) {
      toast.error("Please select a client");
      return;
    }
    const client = clients.find(c => c.id === hairOrderForm.client_id);
    try {
      await api.post("/hair-orders", {
        ...hairOrderForm,
        client_name: client?.name || "Unknown",
        deposit_amount: parseFloat(hairOrderForm.deposit_amount),
        full_amount: parseFloat(hairOrderForm.full_amount),
        cost: parseFloat(hairOrderForm.cost) || 0
      });
      toast.success("Hair order created");
      setShowHairOrderModal(false);
      setHairOrderForm({ client_id: "", hair_description: "", deposit_amount: "", full_amount: "", cost: "", due_date: "", payment_method: "cash", notes: "" });
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to create hair order");
    }
  };

  const handleAddNewClient = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/clients", {
        ...newClientForm,
        notes: "",
        tags: [],
        risk_level: "normal"
      });
      toast.success("Client added");
      setClients([...clients, response.data]);
      setHairOrderForm({ ...hairOrderForm, client_id: response.data.id });
      setShowNewClientModal(false);
      setNewClientForm({ name: "", phone: "", email: "" });
    } catch (error) {
      toast.error("Failed to add client");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  // Calculate remaining for hair order
  const calculateRemaining = (full, deposit) => {
    const f = parseFloat(full) || 0;
    const d = parseFloat(deposit) || 0;
    return f - d;
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="animate-pulse font-serif text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  const currentChecklist = new Date().getHours() < 14 
    ? dashboard?.checklists?.opening 
    : dashboard?.checklists?.closing;
  const checklistType = new Date().getHours() < 14 ? "Opening" : "Closing";

  return (
    <div className="page-container" data-testid="today-page">
      {/* Header */}
      <header className="page-header flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {staff?.name?.split(" ")[0]}</h1>
        </div>
        <button 
          onClick={logout}
          className="icon-btn text-muted-foreground hover:text-destructive"
          data-testid="logout-btn"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 stagger-children">
        <div className="stat-card" data-testid="stat-sales">
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value text-emerald-600">{formatCurrency(dashboard?.sales?.total)}</div>
          <div className="text-xs text-muted-foreground mt-2">{dashboard?.sales?.count || 0} transactions</div>
        </div>
        <div className="stat-card" data-testid="stat-expenses">
          <div className="stat-label">Expenses</div>
          <div className="stat-value text-red-500">{formatCurrency(dashboard?.expenses?.total)}</div>
        </div>
        <div className="stat-card col-span-2" data-testid="stat-net">
          <div className="stat-label">Net Today</div>
          <div className={`metric-big ${(dashboard?.net || 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatCurrency(dashboard?.net)}
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      {revenueTrend.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            7-Day Revenue Trend
          </h2>
          <div className="content-card">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#8C847C', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#8C847C', fontSize: 12 }}
                  tickFormatter={(value) => `€${value}`}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FDFCF8', 
                    border: '1px solid #E6E2DC',
                    borderRadius: '12px',
                    fontFamily: 'Manrope',
                    padding: '12px'
                  }}
                  formatter={(value, name) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Profit']}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#d4af37" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-muted-foreground">Profit</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="section">
        <h2 className="section-title">
          <Plus className="w-5 h-5 text-accent" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setShowSaleModal(true)}
            className="quick-action flex items-center gap-4"
            data-testid="add-sale-btn"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-primary">Add Sale</div>
              <div className="text-sm text-muted-foreground">Service or retail</div>
            </div>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="quick-action flex items-center gap-4"
            data-testid="add-expense-btn"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-primary">Add Expense</div>
              <div className="text-sm text-muted-foreground">Track spending</div>
            </div>
          </button>
          <button
            onClick={() => setShowHairOrderModal(true)}
            className="quick-action flex items-center gap-4"
            data-testid="add-hair-order-btn"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-primary">Hair Order</div>
              <div className="text-sm text-muted-foreground">Custom order</div>
            </div>
          </button>
        </div>
      </section>

      {/* Alerts Section */}
      {(dashboard?.deposit_alerts?.count > 0 || dashboard?.hair_order_alerts?.count > 0 || dashboard?.stock_alerts?.count > 0) && (
        <section className="section">
          <h2 className="section-title">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alerts
          </h2>
          <div className="space-y-4">
            {dashboard?.deposit_alerts?.items?.map((deposit) => (
              <div key={deposit.id} className="alert-card alert-warning flex items-center justify-between gap-4" data-testid={`deposit-alert-${deposit.id}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-amber-900 truncate">{deposit.client_name}</div>
                    <div className="text-sm text-amber-800/80">
                      {formatCurrency(deposit.amount)} deposit due • {deposit.service_description}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleMarkDepositPaid(deposit.id)}
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                  data-testid={`mark-paid-${deposit.id}`}
                >
                  <Euro className="w-4 h-4 mr-1" />
                  Paid
                </Button>
              </div>
            ))}
            {dashboard?.hair_order_alerts?.items?.map((order) => {
              const remaining = (order.full_amount || 0) - (order.deposit_amount || 0);
              return (
                <div key={order.id} className="alert-card alert-warning flex items-center justify-between gap-4" data-testid={`hair-order-alert-${order.id}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-200/60 flex items-center justify-center flex-shrink-0">
                      <Scissors className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-amber-900 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{order.client_name}</span>
                        {order.is_ordered && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Ordered</span>}
                      </div>
                      <div className="text-sm text-amber-800/80">
                        {order.hair_description} • Due: {order.due_date}
                      </div>
                      <div className="text-xs text-amber-800/70 mt-1">
                        Total: {formatCurrency(order.full_amount)} | Deposit: {formatCurrency(order.deposit_amount)} | 
                        <span className="font-semibold"> Remaining: {formatCurrency(remaining)}</span>
                      </div>
                    </div>
                  </div>
                  {!order.is_ordered && (
                    <Button
                      onClick={() => handleMarkHairOrderOrdered(order.id)}
                      size="sm"
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                      data-testid={`mark-ordered-${order.id}`}
                    >
                      Order Now
                    </Button>
                  )}
                </div>
              );
            })}
            {dashboard?.stock_alerts?.items?.map((item) => (
              <div key={item.id} className="alert-card alert-danger flex items-center gap-4" data-testid={`stock-alert-${item.id}`}>
                <div className="w-10 h-10 rounded-xl bg-red-200/60 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <div className="font-semibold text-red-900">{item.name}</div>
                  <div className="text-sm text-red-800/80">
                    Only {item.quantity} left (min: {item.min_threshold})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Checklist Section */}
      {currentChecklist && (
        <section className="section">
          <h2 className="section-title">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {checklistType} Checklist
          </h2>
          <div className="content-card">
            <div className="space-y-2">
              {currentChecklist.items?.map((item) => (
                <div
                  key={item.id}
                  className={`checklist-item ${item.completed ? "completed" : ""}`}
                  data-testid={`checklist-item-${item.id}`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggleChecklistItem(currentChecklist.id, item.id)}
                    data-testid={`checkbox-${item.id}`}
                    className="w-5 h-5"
                  />
                  <span className={`checklist-text flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-primary"}`}>
                    {item.task}
                  </span>
                  {item.completed && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            {currentChecklist.completed && (
              <div className="mt-6 pt-4 border-t border-border/50 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All tasks completed!
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add Sale Modal */}
      <Dialog open={showSaleModal} onOpenChange={setShowSaleModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="sale-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSale} className="space-y-5 mt-4">
            {/* Date selector for historical entries */}
            <div className="form-group">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date (leave empty for today)
              </Label>
              <Input
                type="date"
                value={saleForm.sale_date}
                onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                data-testid="sale-date"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Sale Type</Label>
              <Select
                value={saleForm.sale_type}
                onValueChange={(v) => setSaleForm({ ...saleForm, sale_type: v })}
              >
                <SelectTrigger data-testid="sale-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="retail">Retail Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Description</Label>
              <Input
                value={saleForm.description}
                onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                placeholder="e.g., Haircut, Shampoo"
                required
                data-testid="sale-description"
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group">
                <Label>Sale Price (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={saleForm.amount}
                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  data-testid="sale-amount"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={saleForm.cost}
                  onChange={(e) => setSaleForm({ ...saleForm, cost: e.target.value })}
                  placeholder="0.00"
                  data-testid="sale-cost"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={saleForm.quantity}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  placeholder="1"
                  data-testid="sale-quantity"
                  className="form-input font-mono"
                />
              </div>
            </div>
            {saleForm.amount && (
              <div className="bg-secondary/50 rounded-xl p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-mono font-medium text-emerald-600">
                    {formatCurrency((parseFloat(saleForm.amount) || 0) - (parseFloat(saleForm.cost) || 0))}
                  </span>
                </div>
              </div>
            )}
            <div className="form-group">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-4 gap-2">
                {(config?.payment_methods?.filter(m => m.active !== false) || [
                  { value: "cash", label: "Cash" },
                  { value: "card", label: "Card" },
                  { value: "transfer", label: "Transfer" },
                  { value: "other", label: "Other" }
                ]).map((method) => {
                  const value = method.value || method.id;
                  const label = method.label;
                  const Icon = value === "cash" ? Banknote : value === "card" ? CreditCard : Euro;
                  return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSaleForm({ ...saleForm, payment_method: value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${
                      saleForm.payment_method === value 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`payment-${value}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </button>
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-sale">
              Record Sale
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-md" data-testid="expense-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-6 mt-4">
            {/* Date selector for historical entries */}
            <div className="form-group">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date (leave empty for today)
              </Label>
              <Input
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                data-testid="expense-date"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
              >
                <SelectTrigger data-testid="expense-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(config?.expense_categories?.filter(c => c.active !== false) || [
                    { value: "supplies", label: "Supplies" },
                    { value: "utilities", label: "Utilities" },
                    { value: "rent", label: "Rent" },
                    { value: "marketing", label: "Marketing" },
                    { value: "equipment", label: "Equipment" },
                    { value: "other", label: "Other" }
                  ]).map((cat) => (
                    <SelectItem key={cat.value || cat.id} value={cat.value || cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Description</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="e.g., Hair dye, Electricity bill"
                required
                data-testid="expense-description"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Amount (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0.00"
                required
                data-testid="expense-amount"
                className="form-input font-mono text-2xl"
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full rounded-full py-6 text-lg" data-testid="submit-expense">
              Record Expense
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Hair Order Modal */}
      <Dialog open={showHairOrderModal} onOpenChange={setShowHairOrderModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="hair-order-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">New Hair Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHairOrder} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Client *</Label>
              <div className="flex gap-2">
                <Select
                  value={hairOrderForm.client_id}
                  onValueChange={(v) => setHairOrderForm({ ...hairOrderForm, client_id: v })}
                >
                  <SelectTrigger data-testid="hair-order-client" className="flex-1">
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewClientModal(true)}
                  className="rounded-full"
                  data-testid="add-new-client-btn"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="form-group">
              <Label>Hair Description *</Label>
              <Input
                value={hairOrderForm.hair_description}
                onChange={(e) => setHairOrderForm({ ...hairOrderForm, hair_description: e.target.value })}
                placeholder="e.g., 22'' Brazilian Body Wave"
                required
                data-testid="hair-order-description"
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
                  value={hairOrderForm.full_amount}
                  onChange={(e) => setHairOrderForm({ ...hairOrderForm, full_amount: e.target.value })}
                  placeholder="0.00"
                  required
                  data-testid="hair-order-full-amount"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Deposit (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hairOrderForm.deposit_amount}
                  onChange={(e) => setHairOrderForm({ ...hairOrderForm, deposit_amount: e.target.value })}
                  placeholder="0.00"
                  required
                  data-testid="hair-order-deposit"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hairOrderForm.cost}
                  onChange={(e) => setHairOrderForm({ ...hairOrderForm, cost: e.target.value })}
                  placeholder="0.00"
                  data-testid="hair-order-cost"
                  className="form-input font-mono"
                />
              </div>
            </div>
            {hairOrderForm.full_amount && hairOrderForm.deposit_amount && (
              <div className="bg-secondary/50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining on pickup:</span>
                  <span className="font-mono font-medium text-primary">
                    {formatCurrency(calculateRemaining(hairOrderForm.full_amount, hairOrderForm.deposit_amount))}
                  </span>
                </div>
                {hairOrderForm.cost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className="font-mono font-medium text-emerald-600">
                      {formatCurrency((parseFloat(hairOrderForm.full_amount) || 0) - (parseFloat(hairOrderForm.cost) || 0))}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="form-group">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={hairOrderForm.due_date}
                onChange={(e) => setHairOrderForm({ ...hairOrderForm, due_date: e.target.value })}
                required
                data-testid="hair-order-due-date"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "cash", icon: Banknote, label: "Cash" },
                  { value: "card", icon: CreditCard, label: "Card" },
                  { value: "transfer", icon: Euro, label: "Transfer" },
                  { value: "other", icon: Euro, label: "Other" }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setHairOrderForm({ ...hairOrderForm, payment_method: value })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                      hairOrderForm.payment_method === value 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`order-payment-${value}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <Label>Notes</Label>
              <Input
                value={hairOrderForm.notes}
                onChange={(e) => setHairOrderForm({ ...hairOrderForm, notes: e.target.value })}
                placeholder="Any special instructions..."
                data-testid="hair-order-notes"
                className="form-input"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg bg-amber-600 hover:bg-amber-700" data-testid="submit-hair-order">
              Create Hair Order
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Client Modal (Quick Add) */}
      <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
        <DialogContent className="sm:max-w-md" data-testid="new-client-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Quick Add Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddNewClient} className="space-y-6 mt-4">
            <div className="form-group">
              <Label>Name *</Label>
              <Input
                value={newClientForm.name}
                onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                placeholder="Client name"
                required
                data-testid="new-client-name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                placeholder="+353 ..."
                data-testid="new-client-phone"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Email</Label>
              <Input
                type="email"
                value={newClientForm.email}
                onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                placeholder="email@example.com"
                data-testid="new-client-email"
                className="form-input"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-new-client">
              Add Client & Select
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
