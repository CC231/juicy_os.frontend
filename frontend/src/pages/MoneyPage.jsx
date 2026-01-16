import { useState, useEffect } from "react";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Pencil,
  CheckSquare,
  Square,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function MoneyPage() {
  const { staff, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState("sales");
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stock, setStock] = useState([]);
  const [salesSummary, setSalesSummary] = useState({});
  const [expensesSummary, setExpensesSummary] = useState({});
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  
  // Mass selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState([]);
  
  // Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [stockForm, setStockForm] = useState({ name: "", category: "products", quantity: "", min_threshold: "5", unit_price: "" });
  const [adjustForm, setAdjustForm] = useState({ quantity_change: "", reason: "" });
  const [editSaleForm, setEditSaleForm] = useState({ sale_type: "service", description: "", amount: "", cost: "", quantity: "1", payment_method: "cash" });
  const [editExpenseForm, setEditExpenseForm] = useState({ category: "supplies", description: "", amount: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes, stockRes, salesSumRes, expensesSumRes] = await Promise.all([
        api.get("/sales"),
        api.get("/expenses"),
        api.get("/stock"),
        api.get(`/sales/summary?period=${period}`),
        api.get(`/expenses/summary?period=${period}`)
      ]);
      setSales(salesRes.data);
      setExpenses(expensesRes.data);
      setStock(stockRes.data);
      setSalesSummary(salesSumRes.data);
      setExpensesSummary(expensesSumRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await api.post("/stock", {
        ...stockForm,
        quantity: parseInt(stockForm.quantity),
        min_threshold: parseInt(stockForm.min_threshold),
        unit_price: parseFloat(stockForm.unit_price || 0)
      });
      toast.success("Stock item added");
      setShowStockModal(false);
      setStockForm({ name: "", category: "products", quantity: "", min_threshold: "5", unit_price: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add stock item");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedStock) return;
    try {
      await api.put(`/stock/${selectedStock.id}/adjust`, {
        quantity_change: parseInt(adjustForm.quantity_change),
        reason: adjustForm.reason,
        staff_id: staff.id
      });
      toast.success("Stock adjusted");
      setShowAdjustModal(false);
      setSelectedStock(null);
      setAdjustForm({ quantity_change: "", reason: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to adjust stock");
    }
  };

  // Mass selection handlers
  const toggleSelectSale = (saleId) => {
    setSelectedSaleIds(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    );
  };

  const selectAllSales = () => {
    if (selectedSaleIds.length === sales.length) {
      setSelectedSaleIds([]);
    } else {
      setSelectedSaleIds(sales.map(s => s.id));
    }
  };

  const handleBulkDeleteSales = async () => {
    if (selectedSaleIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedSaleIds.length} selected sales?`)) return;
    
    try {
      await api.post("/sales/bulk-delete", { ids: selectedSaleIds });
      toast.success(`Deleted ${selectedSaleIds.length} sales`);
      setSelectedSaleIds([]);
      setSelectionMode(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete sales");
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedSaleIds([]);
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Delete this sale?")) return;
    try {
      await api.delete(`/sales/${saleId}`);
      toast.success("Sale deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete sale");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success("Expense deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const openEditSaleModal = (sale) => {
    setSelectedSale(sale);
    setEditSaleForm({
      sale_type: sale.sale_type || "service",
      description: sale.description || "",
      amount: String(sale.amount || ""),
      cost: String(sale.cost || ""),
      quantity: String(sale.quantity || "1"),
      payment_method: sale.payment_method || "cash"
    });
    setShowEditSaleModal(true);
  };

  const handleEditSale = async (e) => {
    e.preventDefault();
    if (!selectedSale) return;
    try {
      await api.put(`/sales/${selectedSale.id}`, {
        sale_type: editSaleForm.sale_type,
        description: editSaleForm.description,
        amount: parseFloat(editSaleForm.amount),
        cost: parseFloat(editSaleForm.cost) || 0,
        quantity: parseInt(editSaleForm.quantity) || 1,
        payment_method: editSaleForm.payment_method
      });
      toast.success("Sale updated");
      setShowEditSaleModal(false);
      setSelectedSale(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update sale");
    }
  };

  const openEditExpenseModal = (expense) => {
    setSelectedExpense(expense);
    setEditExpenseForm({
      category: expense.category || "supplies",
      description: expense.description || "",
      amount: String(expense.amount || "")
    });
    setShowEditExpenseModal(true);
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        category: editExpenseForm.category,
        description: editExpenseForm.description,
        amount: parseFloat(editExpenseForm.amount)
      });
      toast.success("Expense updated");
      setShowEditExpenseModal(false);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to update expense");
    }
  };

  const lowStockItems = stock.filter(item => item.quantity <= item.min_threshold);

  return (
    <div className="page-container" data-testid="money-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Money</h1>
        <p className="text-muted-foreground text-sm mt-1">Track sales, expenses, and inventory</p>
      </header>

      {/* Period Selector */}
      <div className="flex gap-2 mb-8 p-1 bg-secondary/50 rounded-xl w-fit">
        {["today", "week", "month"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-primary"
            }`}
            data-testid={`period-${p}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10">
        <div className="stat-card" data-testid="summary-services">
          <div className="stat-label">Services</div>
          <div className="stat-value text-xl sm:text-2xl lg:text-3xl text-emerald-600">
            {formatCurrency(salesSummary.service)}
          </div>
        </div>
        <div className="stat-card" data-testid="summary-retail">
          <div className="stat-label">Retail</div>
          <div className="stat-value text-xl sm:text-2xl lg:text-3xl text-emerald-600">
            {formatCurrency(salesSummary.retail)}
          </div>
        </div>
        <div className="stat-card" data-testid="summary-expenses">
          <div className="stat-label">Expenses</div>
          <div className="stat-value text-2xl md:text-3xl text-red-600">
            {formatCurrency(expensesSummary.total)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6 bg-secondary rounded-full p-1">
          <TabsTrigger value="sales" className="rounded-full data-[state=active]:bg-card" data-testid="tab-sales">
            <TrendingUp className="w-4 h-4 mr-2" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-full data-[state=active]:bg-card" data-testid="tab-expenses">
            <TrendingDown className="w-4 h-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="stock" className="rounded-full data-[state=active]:bg-card" data-testid="tab-stock">
            <Package className="w-4 h-4 mr-2" />
            Stock
            {lowStockItems.length > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {lowStockItems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="animate-fade-in">
          {/* Selection Mode Header */}
          {isOwner && sales.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              {selectionMode ? (
                <>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllSales}
                      className="text-sm"
                    >
                      {selectedSaleIds.length === sales.length ? (
                        <CheckSquare className="w-4 h-4 mr-2" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      {selectedSaleIds.length === sales.length ? "Deselect All" : "Select All"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedSaleIds.length} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteSales}
                      disabled={selectedSaleIds.length === 0}
                      className="rounded-full"
                      data-testid="bulk-delete-btn"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedSaleIds.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelSelection}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="rounded-full"
                  data-testid="select-mode-btn"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select
                </Button>
              )}
            </div>
          )}
          
          {sales.length === 0 ? (
            <div className="empty-state">
              <TrendingUp className="empty-state-icon" />
              <h3 className="empty-state-title">No sales yet</h3>
              <p className="empty-state-text">Sales will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 20).map((sale) => {
                const profit = (sale.amount || 0) - (sale.cost || 0);
                const isSelected = selectedSaleIds.includes(sale.id);
                return (
                <div 
                  key={sale.id} 
                  className={`bg-card border rounded-xl p-4 flex items-center justify-between transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border/50"
                  }`}
                  data-testid={`sale-${sale.id}`}
                  onClick={selectionMode ? () => toggleSelectSale(sale.id) : undefined}
                >
                  {selectionMode && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectSale(sale.id)}
                      className="mr-3"
                    />
                  )}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      sale.sale_type === "service" ? "bg-emerald-100" : 
                      sale.sale_type === "deposit" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${
                        sale.sale_type === "service" ? "text-emerald-600" : 
                        sale.sale_type === "deposit" ? "text-amber-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-primary">
                        {sale.description}
                        {sale.quantity > 1 && <span className="text-muted-foreground ml-1">×{sale.quantity}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sale.sale_type === "service" ? "Service" : sale.sale_type === "deposit" ? "Deposit" : "Retail"} • {sale.payment_method?.toUpperCase() || "CASH"} • {formatDate(sale.sale_date || sale.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-lg text-emerald-600">{formatCurrency(sale.amount)}</div>
                      {sale.cost > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Cost: {formatCurrency(sale.cost)} • Profit: <span className="text-amber-600">{formatCurrency(profit)}</span>
                        </div>
                      )}
                    </div>
                    {isOwner && !selectionMode && (
                      <>
                        <button 
                          onClick={() => openEditSaleModal(sale)}
                          className="icon-btn text-muted-foreground hover:text-primary"
                          data-testid={`edit-sale-${sale.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSale(sale.id)}
                          className="icon-btn text-muted-foreground hover:text-destructive"
                          data-testid={`delete-sale-${sale.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="animate-fade-in">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <TrendingDown className="empty-state-icon" />
              <h3 className="empty-state-title">No expenses yet</h3>
              <p className="empty-state-text">Expenses will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 20).map((expense) => (
                <div 
                  key={expense.id} 
                  className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between"
                  data-testid={`expense-${expense.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-primary">{expense.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} • {formatDate(expense.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-lg text-red-600">-{formatCurrency(expense.amount)}</div>
                    {isOwner && (
                      <>
                        <button 
                          onClick={() => openEditExpenseModal(expense)}
                          className="icon-btn text-muted-foreground hover:text-primary"
                          data-testid={`edit-expense-${expense.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="icon-btn text-muted-foreground hover:text-destructive"
                          data-testid={`delete-expense-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">{stock.length} items tracked</div>
            <Button 
              onClick={() => setShowStockModal(true)}
              className="rounded-full"
              data-testid="add-stock-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Low Stock Warning */}
          {lowStockItems.length > 0 && (
            <div className="alert-card danger mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium">{lowStockItems.length} item(s) running low</span>
            </div>
          )}

          {stock.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" />
              <h3 className="empty-state-title">No stock items</h3>
              <p className="empty-state-text">Add high-value items to track</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stock.map((item) => {
                const isLow = item.quantity <= item.min_threshold;
                return (
                  <div 
                    key={item.id} 
                    className={`bg-card border rounded-xl p-4 flex items-center justify-between ${isLow ? "border-red-200 bg-red-50/30" : "border-border/50"}`}
                    data-testid={`stock-${item.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLow ? "bg-red-100" : "bg-secondary"}`}>
                        <Package className={`w-5 h-5 ${isLow ? "text-red-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="font-medium text-primary">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.category} • Min: {item.min_threshold}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-mono text-xl ${isLow ? "text-red-600" : "text-primary"}`}>
                        {item.quantity}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStock(item);
                          setShowAdjustModal(true);
                        }}
                        className="rounded-full"
                        data-testid={`adjust-stock-${item.id}`}
                      >
                        Adjust
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Stock Modal */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent className="sm:max-w-md" data-testid="stock-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Add Stock Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-6 mt-4">
            <div className="form-group">
              <Label>Item Name</Label>
              <Input
                value={stockForm.name}
                onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })}
                placeholder="e.g., Hair Color 6N"
                required
                data-testid="stock-name"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Category</Label>
              <Select
                value={stockForm.category}
                onValueChange={(v) => setStockForm({ ...stockForm, category: v })}
              >
                <SelectTrigger data-testid="stock-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                  placeholder="0"
                  required
                  data-testid="stock-quantity"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <Label>Min. Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockForm.min_threshold}
                  onChange={(e) => setStockForm({ ...stockForm, min_threshold: e.target.value })}
                  placeholder="5"
                  data-testid="stock-threshold"
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <Label>Unit Price (€) - Optional</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={stockForm.unit_price}
                onChange={(e) => setStockForm({ ...stockForm, unit_price: e.target.value })}
                placeholder="0.00"
                data-testid="stock-price"
                className="form-input"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-stock">
              Add Item
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent className="sm:max-w-md" data-testid="adjust-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Adjust Stock</DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="mt-4">
              <div className="text-center mb-6">
                <div className="text-muted-foreground text-sm mb-1">{selectedStock.name}</div>
                <div className="font-mono text-4xl text-primary">{selectedStock.quantity}</div>
                <div className="text-muted-foreground text-sm">Current quantity</div>
              </div>
              <form onSubmit={handleAdjustStock} className="space-y-6">
                <div className="form-group">
                  <Label>Adjustment</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustForm({ ...adjustForm, quantity_change: String(parseInt(adjustForm.quantity_change || 0) - 1) })}
                      className="rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={adjustForm.quantity_change}
                      onChange={(e) => setAdjustForm({ ...adjustForm, quantity_change: e.target.value })}
                      placeholder="0"
                      required
                      data-testid="adjust-quantity"
                      className="form-input text-center font-mono text-2xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustForm({ ...adjustForm, quantity_change: String(parseInt(adjustForm.quantity_change || 0) + 1) })}
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    New total: {selectedStock.quantity + (parseInt(adjustForm.quantity_change) || 0)}
                  </div>
                </div>
                <div className="form-group">
                  <Label>Reason</Label>
                  <Select
                    value={adjustForm.reason}
                    onValueChange={(v) => setAdjustForm({ ...adjustForm, reason: v })}
                  >
                    <SelectTrigger data-testid="adjust-reason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="used">Used in service</SelectItem>
                      <SelectItem value="restocked">Restocked</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="correction">Inventory correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full py-6 text-lg" 
                  data-testid="submit-adjust"
                  disabled={!adjustForm.reason}
                >
                  Save Adjustment
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Modal */}
      <Dialog open={showEditSaleModal} onOpenChange={setShowEditSaleModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="edit-sale-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSale} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Sale Type</Label>
              <Select
                value={editSaleForm.sale_type}
                onValueChange={(v) => setEditSaleForm({ ...editSaleForm, sale_type: v })}
              >
                <SelectTrigger data-testid="edit-sale-type">
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
                value={editSaleForm.description}
                onChange={(e) => setEditSaleForm({ ...editSaleForm, description: e.target.value })}
                placeholder="e.g., Haircut, Shampoo"
                required
                data-testid="edit-sale-description"
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
                  value={editSaleForm.amount}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  data-testid="edit-sale-amount"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editSaleForm.cost}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, cost: e.target.value })}
                  placeholder="0.00"
                  data-testid="edit-sale-cost"
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={editSaleForm.quantity}
                  onChange={(e) => setEditSaleForm({ ...editSaleForm, quantity: e.target.value })}
                  placeholder="1"
                  data-testid="edit-sale-quantity"
                  className="form-input font-mono"
                />
              </div>
            </div>
            {editSaleForm.amount && (
              <div className="bg-secondary/50 rounded-xl p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-mono font-medium text-emerald-600">
                    {formatCurrency((parseFloat(editSaleForm.amount) || 0) - (parseFloat(editSaleForm.cost) || 0))}
                  </span>
                </div>
              </div>
            )}
            <div className="form-group">
              <Label>Payment Method</Label>
              <Select
                value={editSaleForm.payment_method}
                onValueChange={(v) => setEditSaleForm({ ...editSaleForm, payment_method: v })}
              >
                <SelectTrigger data-testid="edit-sale-payment">
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
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-edit-sale">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={showEditExpenseModal} onOpenChange={setShowEditExpenseModal}>
        <DialogContent className="sm:max-w-md" data-testid="edit-expense-modal">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditExpense} className="space-y-6 mt-4">
            <div className="form-group">
              <Label>Category</Label>
              <Select
                value={editExpenseForm.category}
                onValueChange={(v) => setEditExpenseForm({ ...editExpenseForm, category: v })}
              >
                <SelectTrigger data-testid="edit-expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label>Description</Label>
              <Input
                value={editExpenseForm.description}
                onChange={(e) => setEditExpenseForm({ ...editExpenseForm, description: e.target.value })}
                placeholder="e.g., Hair dye, Electricity bill"
                required
                data-testid="edit-expense-description"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <Label>Amount (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editExpenseForm.amount}
                onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                placeholder="0.00"
                required
                data-testid="edit-expense-amount"
                className="form-input font-mono text-2xl"
              />
            </div>
            <Button type="submit" className="w-full rounded-full py-6 text-lg" data-testid="submit-edit-expense">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
