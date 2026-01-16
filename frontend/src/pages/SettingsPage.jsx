import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, useAuth } from "@/App";
import { toast } from "sonner";
import { 
  User, 
  Plus, 
  Trash2,
  Shield,
  UserCircle,
  LogOut,
  ClipboardList,
  Pencil,
  Check,
  X,
  ListTodo,
  Circle,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Sliders,
  GripVertical,
  Users,
  Bell,
  RefreshCw,
  Send,
  GitMerge,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Checklist Item Component
function SortableChecklistItem({ item, index, isEditing, editingText, setEditingText, onEdit, onUpdate, onCancelEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-secondary/50 group ${isDragging ? 'bg-secondary shadow-lg' : ''}`}
      data-testid={`template-item-${item.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary touch-none"
        data-testid={`drag-handle-${item.id}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">{index + 1}</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input 
            value={editingText} 
            onChange={(e) => setEditingText(e.target.value)} 
            className="flex-1" 
            autoFocus 
            onKeyDown={(e) => { 
              if (e.key === 'Enter') onUpdate(item.id); 
              if (e.key === 'Escape') onCancelEdit(); 
            }} 
          />
          <button onClick={() => onUpdate(item.id)} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
          <button onClick={onCancelEdit} className="icon-btn"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <>
          <span className="flex-1">{item.task}</span>
          <button onClick={() => onEdit(item)} className="icon-btn opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => onDelete(item.id)} className="icon-btn text-destructive opacity-0 group-hover:opacity-100" data-testid={`delete-task-${item.id}`}><Trash2 className="w-4 h-4" /></button>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { staff, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [checklistTemplates, setChecklistTemplates] = useState({ opening: null, closing: null });
  const [todos, setTodos] = useState([]);
  const [config, setConfig] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [duplicateClients, setDuplicateClients] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showAddConfigItemModal, setShowAddConfigItemModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  
  // Forms
  const [staffForm, setStaffForm] = useState({ name: "", pin: "", role: "staff" });
  const [newTask, setNewTask] = useState("");
  const [newTodo, setNewTodo] = useState({ text: "", priority: "normal" });
  const [accountForm, setAccountForm] = useState({ name: "", phone: "", email: "", pin: "" });
  const [configItemForm, setConfigItemForm] = useState({ value: "", label: "" });
  const [roleForm, setRoleForm] = useState({ name: "", description: "", permissions: [] });
  const [activeConfigType, setActiveConfigType] = useState("sale_types");
  
  // State
  const [activeChecklistType, setActiveChecklistType] = useState("opening");
  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingTodo, setEditingTodo] = useState(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [editingConfigItem, setEditingConfigItem] = useState(null);
  const [editingConfigLabel, setEditingConfigLabel] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState(null);
  const [selectedPrimaryClient, setSelectedPrimaryClient] = useState(null);
  const [syncingChecklists, setSyncingChecklists] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isOwner) {
      navigate("/");
      return;
    }
    fetchData();
  }, [isOwner, navigate]);

  const fetchData = async () => {
    try {
      const [staffRes, templatesRes, todosRes, configRes, meRes, rolesRes, permsRes, duplicatesRes, notifRes] = await Promise.all([
        api.get("/staff"),
        api.get("/checklists/templates"),
        api.get("/todos"),
        api.get("/config"),
        api.get("/auth/me"),
        api.get("/roles").catch(() => ({ data: [] })),
        api.get("/permissions").catch(() => ({ data: [] })),
        api.get("/clients/duplicates").catch(() => ({ data: { duplicates: [] } })),
        api.get("/notifications/settings").catch(() => ({ data: null }))
      ]);
      setStaffList(staffRes.data);
      setChecklistTemplates(templatesRes.data);
      setTodos(todosRes.data);
      setConfig(configRes.data);
      setRoles(rolesRes.data || []);
      setPermissions(permsRes.data || []);
      setDuplicateClients(duplicatesRes.data?.duplicates || []);
      setNotificationSettings(notifRes.data);
      setAccountForm({
        name: meRes.data.name || "",
        phone: meRes.data.phone || "",
        email: meRes.data.email || "",
        pin: ""
      });
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Staff handlers
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post("/staff", staffForm);
      toast.success("Staff member added");
      setShowAddStaffModal(false);
      setStaffForm({ name: "", pin: "", role: "staff" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add staff");
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (staffId === staff.id) {
      toast.error("You cannot deactivate yourself");
      return;
    }
    if (!window.confirm(`Deactivate ${staffName}?`)) return;
    try {
      await api.delete(`/staff/${staffId}`);
      toast.success("Staff deactivated");
      fetchData();
    } catch (error) {
      toast.error("Failed to deactivate");
    }
  };

  // Account handlers
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const updateData = {};
      if (accountForm.name) updateData.name = accountForm.name;
      if (accountForm.phone !== undefined) updateData.phone = accountForm.phone;
      if (accountForm.email !== undefined) updateData.email = accountForm.email;
      if (accountForm.pin) updateData.pin = accountForm.pin;
      
      await api.put("/auth/me", updateData);
      toast.success("Account updated");
      setShowEditAccountModal(false);
      setAccountForm({ ...accountForm, pin: "" });
      const updatedStaff = { ...staff, name: accountForm.name };
      localStorage.setItem("salon_staff", JSON.stringify(updatedStaff));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update account");
    }
  };

  // Checklist handlers
  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    try {
      await api.post(`/checklists/templates/${activeChecklistType}/items?task=${encodeURIComponent(newTask)}`);
      toast.success("Task added");
      setNewTask("");
      setShowAddTaskModal(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const handleUpdateChecklistItem = async (itemId) => {
    if (!editingText.trim()) return;
    try {
      await api.put(`/checklists/templates/${activeChecklistType}/items/${itemId}?task=${encodeURIComponent(editingText)}`);
      toast.success("Task updated");
      setEditingItem(null);
      setEditingText("");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    try {
      await api.delete(`/checklists/templates/${activeChecklistType}/items/${itemId}`);
      toast.success("Task removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove");
    }
  };

  const handleSyncChecklists = async () => {
    setSyncingChecklists(true);
    try {
      await api.post("/checklists/sync-from-template");
      toast.success("Checklists synced with templates");
    } catch (error) {
      toast.error("Failed to sync");
    } finally {
      setSyncingChecklists(false);
    }
  };

  // Drag and Drop handler
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const currentTemplate = checklistTemplates[activeChecklistType];
      const items = currentTemplate?.items || [];
      const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const oldIndex = sortedItems.findIndex(item => item.id === active.id);
      const newIndex = sortedItems.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);
        const updatedItems = reorderedItems.map((item, index) => ({
          ...item,
          order: index
        }));

        setChecklistTemplates(prev => ({
          ...prev,
          [activeChecklistType]: {
            ...prev[activeChecklistType],
            items: updatedItems
          }
        }));

        try {
          await api.put(`/checklists/templates/${activeChecklistType}`, updatedItems);
          toast.success("Order updated");
        } catch (error) {
          toast.error("Failed to save order");
          fetchData();
        }
      }
    }
  };

  // Todo handlers
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.text.trim()) return;
    try {
      await api.post("/todos", newTodo);
      toast.success("To-do added");
      setNewTodo({ text: "", priority: "normal" });
      setShowAddTodoModal(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to add");
    }
  };

  const handleToggleTodo = async (todoId) => {
    try {
      await api.put(`/todos/${todoId}/toggle`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleUpdateTodo = async (todoId) => {
    if (!editingTodoText.trim()) return;
    try {
      await api.put(`/todos/${todoId}?text=${encodeURIComponent(editingTodoText)}`);
      setEditingTodo(null);
      setEditingTodoText("");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await api.delete(`/todos/${todoId}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleClearCompletedTodos = async () => {
    if (!window.confirm("Clear completed?")) return;
    try {
      await api.delete("/todos/completed/clear");
      fetchData();
    } catch (error) {
      toast.error("Failed to clear");
    }
  };

  // Config handlers
  const handleAddConfigItem = async (e) => {
    e.preventDefault();
    if (!configItemForm.value.trim() || !configItemForm.label.trim()) return;
    try {
      await api.post(`/config/${activeConfigType}/items?value=${encodeURIComponent(configItemForm.value)}&label=${encodeURIComponent(configItemForm.label)}`);
      toast.success("Option added");
      setConfigItemForm({ value: "", label: "" });
      setShowAddConfigItemModal(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to add");
    }
  };

  const handleUpdateConfigItem = async (itemId) => {
    if (!editingConfigLabel.trim()) return;
    try {
      await api.put(`/config/${activeConfigType}/items/${itemId}?label=${encodeURIComponent(editingConfigLabel)}`);
      setEditingConfigItem(null);
      setEditingConfigLabel("");
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDeleteConfigItem = async (itemId) => {
    try {
      await api.delete(`/config/${activeConfigType}/items/${itemId}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // Role handlers
  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleForm);
        toast.success("Role updated");
      } else {
        await api.post("/roles", roleForm);
        toast.success("Role created");
      }
      setShowRoleModal(false);
      setRoleForm({ name: "", description: "", permissions: [] });
      setEditingRole(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save role");
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await api.delete(`/roles/${roleId}`);
      toast.success("Role deleted");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Cannot delete role");
    }
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  // Client merge handlers
  const handleMergeClients = async () => {
    if (!selectedPrimaryClient || !selectedDuplicateGroup) return;
    const duplicateIds = selectedDuplicateGroup.clients
      .filter(c => c.id !== selectedPrimaryClient)
      .map(c => c.id);
    
    try {
      await api.post("/clients/merge", {
        primary_client_id: selectedPrimaryClient,
        duplicate_client_ids: duplicateIds
      });
      toast.success("Clients merged successfully");
      setShowMergeModal(false);
      setSelectedDuplicateGroup(null);
      setSelectedPrimaryClient(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to merge clients");
    }
  };

  // Notification settings handlers
  const handleUpdateNotificationSettings = async (field, value) => {
    try {
      const params = new URLSearchParams();
      params.append(field, value);
      await api.put(`/notifications/settings?${params.toString()}`);
      setNotificationSettings(prev => ({ ...prev, [field]: value }));
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      await api.post("/notifications/test-telegram");
      toast.success("Test notification sent!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send test");
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isOwner) return null;

  const currentTemplate = checklistTemplates[activeChecklistType];
  const templateItems = currentTemplate?.items || [];
  const sortedTemplateItems = [...templateItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);
  
  const configItems = config?.[activeConfigType] || [];
  const configLabels = {
    sale_types: "Sale Types",
    expense_categories: "Expense Categories", 
    order_types: "Order Types",
    payment_methods: "Payment Methods"
  };

  const getPriorityIcon = (priority) => {
    if (priority === "high") return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (priority === "low") return <Circle className="w-4 h-4 text-muted-foreground" />;
    return null;
  };

  const togglePermission = (permId) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  return (
    <div className="page-container" data-testid="settings-page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your salon</p>
      </header>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="w-full grid grid-cols-8 mb-6 bg-secondary rounded-full p-1 text-xs overflow-x-auto">
          <TabsTrigger value="todos" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-todos">
            <ListTodo className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-account">
            <UserCircle className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-staff">
            <User className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-roles">
            <Shield className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="checklists" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-checklists">
            <ClipboardList className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="customize" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-customize">
            <Sliders className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-duplicates">
            <GitMerge className="w-4 h-4" />
            {duplicateClients.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {duplicateClients.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-card px-2" data-testid="tab-notifications">
            <Bell className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* To-Do Tab */}
        <TabsContent value="todos" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{activeTodos.length} active</div>
            <div className="flex gap-2">
              {completedTodos.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearCompletedTodos} className="rounded-full text-xs">
                  Clear Done
                </Button>
              )}
              <Button onClick={() => setShowAddTodoModal(true)} size="sm" className="rounded-full" data-testid="add-todo-btn">
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl shadow-card overflow-hidden">
            {todos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No tasks yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activeTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 group" data-testid={`todo-${todo.id}`}>
                    <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} className="w-5 h-5" />
                    {editingTodo === todo.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input value={editingTodoText} onChange={(e) => setEditingTodoText(e.target.value)} className="flex-1" autoFocus />
                        <button onClick={() => handleUpdateTodo(todo.id)} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { setEditingTodo(null); setEditingTodoText(""); }} className="icon-btn"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1">{todo.text}</span>
                        {getPriorityIcon(todo.priority)}
                        <button onClick={() => { setEditingTodo(todo.id); setEditingTodoText(todo.text); }} className="icon-btn opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTodo(todo.id)} className="icon-btn text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                ))}
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-4 opacity-50 group">
                    <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} className="w-5 h-5" />
                    <span className="flex-1 line-through">{todo.text}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <button onClick={() => handleDeleteTodo(todo.id)} className="icon-btn text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="animate-fade-in">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-accent" />
              </div>
              <div>
                <div className="font-serif text-xl text-primary">{accountForm.name || staff?.name}</div>
                <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />{staff?.role}</Badge>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {accountForm.phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />{accountForm.phone}
                </div>
              )}
              {accountForm.email && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />{accountForm.email}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowEditAccountModal(true)} className="flex-1 rounded-full" data-testid="edit-account-btn">
                <Pencil className="w-4 h-4 mr-2" />Edit Account
              </Button>
              <Button variant="outline" onClick={handleLogout} className="rounded-full" data-testid="logout-btn">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{staffList.length} members</div>
            <Button onClick={() => setShowAddStaffModal(true)} size="sm" className="rounded-full" data-testid="add-staff-btn">
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="space-y-3">
            {staffList.map((member) => (
              <div key={member.id} className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between" data-testid={`staff-${member.id}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.role === "owner" ? "bg-accent/20" : "bg-secondary"}`}>
                    {member.role === "owner" ? <Shield className="w-5 h-5 text-accent" /> : <User className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
                  </div>
                </div>
                {member.id !== staff.id && (
                  <button onClick={() => handleDeleteStaff(member.id, member.name)} className="icon-btn text-destructive"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{roles.length} roles</div>
            <Button onClick={() => { setEditingRole(null); setRoleForm({ name: "", description: "", permissions: [] }); setShowRoleModal(true); }} size="sm" className="rounded-full" data-testid="add-role-btn">
              <Plus className="w-4 h-4 mr-1" />Add Role
            </Button>
          </div>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="bg-card border border-border/50 rounded-xl p-4" data-testid={`role-${role.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-5 h-5 ${role.is_system ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-muted-foreground">{role.description || 'No description'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditRole(role)} className="icon-btn"><Pencil className="w-4 h-4" /></button>
                    {!role.is_system && (
                      <button onClick={() => handleDeleteRole(role.id)} className="icon-btn text-destructive"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.permissions?.slice(0, 5).map(p => (
                    <Badge key={p} variant="secondary" className="text-xs">{p.replace(/_/g, ' ')}</Badge>
                  ))}
                  {role.permissions?.length > 5 && (
                    <Badge variant="outline" className="text-xs">+{role.permissions.length - 5} more</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="animate-fade-in">
          <div className="flex gap-2 mb-4">
            {["opening", "closing"].map((type) => (
              <button key={type} onClick={() => setActiveChecklistType(type)} className={`tab-item ${activeChecklistType === type ? "active" : ""}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{templateItems.length} tasks • Drag to reorder</div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncChecklists} 
                disabled={syncingChecklists}
                className="rounded-full"
                data-testid="sync-checklists-btn"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncingChecklists ? 'animate-spin' : ''}`} />
                Sync Today
              </Button>
              <Button onClick={() => setShowAddTaskModal(true)} size="sm" className="rounded-full" data-testid="add-task-btn">
                <Plus className="w-4 h-4 mr-1" />Add
              </Button>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-card">
            {sortedTemplateItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tasks yet</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedTemplateItems.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedTemplateItems.map((item, index) => (
                      <SortableChecklistItem
                        key={item.id}
                        item={item}
                        index={index}
                        isEditing={editingItem === item.id}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        onEdit={(item) => { setEditingItem(item.id); setEditingText(item.task); }}
                        onUpdate={handleUpdateChecklistItem}
                        onCancelEdit={() => { setEditingItem(null); setEditingText(""); }}
                        onDelete={handleDeleteChecklistItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Use "Sync Today" to apply template changes to today's checklist</p>
        </TabsContent>

        {/* Customize Tab */}
        <TabsContent value="customize" className="animate-fade-in">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {Object.keys(configLabels).map((type) => (
              <button key={type} onClick={() => setActiveConfigType(type)} className={`tab-item whitespace-nowrap ${activeConfigType === type ? "active" : ""}`}>
                {configLabels[type]}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{configItems.length} options</div>
            <Button onClick={() => setShowAddConfigItemModal(true)} size="sm" className="rounded-full" data-testid="add-config-btn">
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-card">
            {configItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No options configured</div>
            ) : (
              <div className="space-y-2">
                {configItems.filter(i => i.active !== false).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-secondary/50 group" data-testid={`config-item-${item.id}`}>
                    {editingConfigItem === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input value={editingConfigLabel} onChange={(e) => setEditingConfigLabel(e.target.value)} className="flex-1" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateConfigItem(item.id); if (e.key === 'Escape') { setEditingConfigItem(null); setEditingConfigLabel(""); } }} />
                        <button onClick={() => handleUpdateConfigItem(item.id)} className="icon-btn text-emerald-600"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { setEditingConfigItem(null); setEditingConfigLabel(""); }} className="icon-btn"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">{item.value}</span>
                        <button onClick={() => { setEditingConfigItem(item.id); setEditingConfigLabel(item.label); }} className="icon-btn opacity-0 group-hover:opacity-100"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteConfigItem(item.id)} className="icon-btn text-destructive opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Customize options for sales, expenses, and orders</p>
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">{duplicateClients.length} duplicate groups found</div>
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-full">
              <RefreshCw className="w-4 h-4 mr-1" />Refresh
            </Button>
          </div>
          
          {duplicateClients.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-50" />
              <h3 className="font-medium text-lg mb-2">No Duplicates Found</h3>
              <p className="text-sm text-muted-foreground">All clients have unique phone numbers</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateClients.map((group, idx) => (
                <div key={idx} className="bg-card border border-amber-200 rounded-2xl p-4 shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">{group.clients.length} clients with same phone</span>
                    </div>
                    <Badge variant="outline">{group.phone}</Badge>
                  </div>
                  <div className="space-y-2 mb-3">
                    {group.clients.map(client => (
                      <div key={client.id} className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.phone}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {client.deposit_history?.length || 0} deposits
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => { setSelectedDuplicateGroup(group); setSelectedPrimaryClient(group.clients[0].id); setShowMergeModal(true); }}
                    size="sm" 
                    className="w-full rounded-full"
                  >
                    <GitMerge className="w-4 h-4 mr-2" />Merge Clients
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="animate-fade-in">
          <div className="space-y-6">
            {/* In-App Notifications */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
              <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                In-App Notifications
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Popup Reminders</div>
                  <div className="text-sm text-muted-foreground">Show popup notifications for due dates</div>
                </div>
                <Switch 
                  checked={notificationSettings?.popup_enabled !== false}
                  onCheckedChange={(checked) => handleUpdateNotificationSettings("popup_enabled", checked)}
                />
              </div>
            </div>

            {/* Telegram Notifications */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
              <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                Telegram Notifications
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Enable Telegram</div>
                    <div className="text-sm text-muted-foreground">Send reminders via Telegram bot</div>
                  </div>
                  <Switch 
                    checked={notificationSettings?.telegram_enabled || false}
                    onCheckedChange={(checked) => handleUpdateNotificationSettings("telegram_enabled", checked)}
                  />
                </div>

                {notificationSettings?.telegram_enabled && (
                  <>
                    <div className="form-group">
                      <Label>Bot Token</Label>
                      <Input
                        type="password"
                        value={notificationSettings?.telegram_bot_token || ""}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, telegram_bot_token: e.target.value }))}
                        onBlur={(e) => e.target.value && handleUpdateNotificationSettings("telegram_bot_token", e.target.value)}
                        placeholder="Get from @BotFather on Telegram"
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-group">
                      <Label>Chat ID</Label>
                      <Input
                        value={notificationSettings?.telegram_chat_id || ""}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, telegram_chat_id: e.target.value }))}
                        onBlur={(e) => e.target.value && handleUpdateNotificationSettings("telegram_chat_id", e.target.value)}
                        placeholder="Your Telegram chat ID"
                        className="form-input font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Message @userinfobot on Telegram to get your Chat ID
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleTestTelegram}
                      disabled={testingTelegram || !notificationSettings?.telegram_bot_token || !notificationSettings?.telegram_chat_id}
                      className="rounded-full"
                    >
                      {testingTelegram ? "Sending..." : "Send Test Message"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
              <h3 className="font-medium text-lg mb-4">Reminder Settings</h3>
              <div className="form-group">
                <Label>Days Before Due Date</Label>
                <Select
                  value={String(notificationSettings?.reminder_days_before || 2)}
                  onValueChange={(v) => handleUpdateNotificationSettings("reminder_days_before", parseInt(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduled Reports */}
            {notificationSettings?.telegram_enabled && (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
                <h3 className="font-medium text-lg mb-4">Scheduled Reports (Telegram)</h3>
                <div className="space-y-4">
                  {/* Daily Report */}
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={notificationSettings?.daily_report_enabled || false}
                        onCheckedChange={(checked) => handleUpdateNotificationSettings("daily_report_enabled", checked)}
                      />
                      <div>
                        <div className="font-medium">Daily Report</div>
                        <div className="text-xs text-muted-foreground">End-of-day P&L summary</div>
                      </div>
                    </div>
                    {notificationSettings?.daily_report_enabled && (
                      <Input
                        type="time"
                        value={notificationSettings?.daily_report_time || "20:00"}
                        onChange={(e) => handleUpdateNotificationSettings("daily_report_time", e.target.value)}
                        className="w-24"
                      />
                    )}
                  </div>

                  {/* Weekly Report */}
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={notificationSettings?.weekly_report_enabled || false}
                        onCheckedChange={(checked) => handleUpdateNotificationSettings("weekly_report_enabled", checked)}
                      />
                      <div>
                        <div className="font-medium">Weekly Report</div>
                        <div className="text-xs text-muted-foreground">Weekly P&L summary</div>
                      </div>
                    </div>
                    {notificationSettings?.weekly_report_enabled && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(notificationSettings?.weekly_report_day || 0)}
                          onValueChange={(v) => handleUpdateNotificationSettings("weekly_report_day", parseInt(v))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Mon</SelectItem>
                            <SelectItem value="1">Tue</SelectItem>
                            <SelectItem value="2">Wed</SelectItem>
                            <SelectItem value="3">Thu</SelectItem>
                            <SelectItem value="4">Fri</SelectItem>
                            <SelectItem value="5">Sat</SelectItem>
                            <SelectItem value="6">Sun</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={notificationSettings?.weekly_report_time || "20:00"}
                          onChange={(e) => handleUpdateNotificationSettings("weekly_report_time", e.target.value)}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>

                  {/* Monthly Report */}
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={notificationSettings?.monthly_report_enabled || false}
                        onCheckedChange={(checked) => handleUpdateNotificationSettings("monthly_report_enabled", checked)}
                      />
                      <div>
                        <div className="font-medium">Monthly Report</div>
                        <div className="text-xs text-muted-foreground">Monthly P&L summary</div>
                      </div>
                    </div>
                    {notificationSettings?.monthly_report_enabled && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(notificationSettings?.monthly_report_day || 1)}
                          onValueChange={(v) => handleUpdateNotificationSettings("monthly_report_day", parseInt(v))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(28)].map((_, i) => (
                              <SelectItem key={i+1} value={String(i+1)}>Day {i+1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={notificationSettings?.monthly_report_time || "20:00"}
                          onChange={(e) => handleUpdateNotificationSettings("monthly_report_time", e.target.value)}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>

                  {/* Quarterly Report */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={notificationSettings?.quarterly_report_enabled || false}
                        onCheckedChange={(checked) => handleUpdateNotificationSettings("quarterly_report_enabled", checked)}
                      />
                      <div>
                        <div className="font-medium">Quarterly Report</div>
                        <div className="text-xs text-muted-foreground">Sent on 1st of Jan, Apr, Jul, Oct</div>
                      </div>
                    </div>
                    {notificationSettings?.quarterly_report_enabled && (
                      <Input
                        type="time"
                        value={notificationSettings?.quarterly_report_time || "20:00"}
                        onChange={(e) => handleUpdateNotificationSettings("quarterly_report_time", e.target.value)}
                        className="w-24"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Reports */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-card">
              <h3 className="font-medium text-lg mb-4">Download Reports</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${api.defaults.baseURL}/reports/download?report_type=daily`, '_blank')}
                  className="rounded-full"
                >
                  Daily CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${api.defaults.baseURL}/reports/download?report_type=weekly`, '_blank')}
                  className="rounded-full"
                >
                  Weekly CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${api.defaults.baseURL}/reports/download?report_type=monthly`, '_blank')}
                  className="rounded-full"
                >
                  Monthly CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`${api.defaults.baseURL}/reports/download?report_type=quarterly`, '_blank')}
                  className="rounded-full"
                >
                  Quarterly CSV
                </Button>
              </div>
              {notificationSettings?.telegram_enabled && notificationSettings?.telegram_bot_token && notificationSettings?.telegram_chat_id && (
                <>
                  <p className="text-sm text-muted-foreground mt-4 mb-3">Or send to Telegram:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => api.post('/reports/send-telegram?report_type=daily').then(() => toast.success('Daily report sent!')).catch(() => toast.error('Failed to send'))}
                      className="rounded-full"
                    >
                      Send Daily
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => api.post('/reports/send-telegram?report_type=weekly').then(() => toast.success('Weekly report sent!')).catch(() => toast.error('Failed to send'))}
                      className="rounded-full"
                    >
                      Send Weekly
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => api.post('/reports/send-telegram?report_type=monthly').then(() => toast.success('Monthly report sent!')).catch(() => toast.error('Failed to send'))}
                      className="rounded-full"
                    >
                      Send Monthly
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => api.post('/reports/send-telegram?report_type=quarterly').then(() => toast.success('Quarterly report sent!')).catch(() => toast.error('Failed to send'))}
                      className="rounded-full"
                    >
                      Send Quarterly
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Staff Modal */}
      <Dialog open={showAddStaffModal} onOpenChange={setShowAddStaffModal}>
        <DialogContent className="sm:max-w-md" data-testid="add-staff-modal">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Add Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Name *</Label>
              <Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required className="form-input" />
            </div>
            <div className="form-group">
              <Label>PIN (4-6 digits) *</Label>
              <Input type="password" value={staffForm.pin} onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} minLength={4} maxLength={6} required className="form-input font-mono text-center text-xl" />
            </div>
            <div className="form-group">
              <Label>Role</Label>
              <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full rounded-full py-6" data-testid="submit-staff">Add Staff</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      <Dialog open={showEditAccountModal} onOpenChange={setShowEditAccountModal}>
        <DialogContent className="sm:max-w-md" data-testid="edit-account-modal">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Edit Account</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateAccount} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Name</Label>
              <Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <Label>Phone</Label>
              <Input type="tel" value={accountForm.phone} onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })} placeholder="+353 ..." className="form-input" />
            </div>
            <div className="form-group">
              <Label>Email</Label>
              <Input type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="form-input" />
            </div>
            <div className="form-group">
              <Label>New PIN (leave empty to keep current)</Label>
              <Input type="password" value={accountForm.pin} onChange={(e) => setAccountForm({ ...accountForm, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="••••" className="form-input font-mono text-center text-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full py-6" data-testid="update-account">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Modal */}
      <Dialog open={showAddTaskModal} onOpenChange={setShowAddTaskModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Add Task</DialogTitle></DialogHeader>
          <form onSubmit={handleAddChecklistItem} className="space-y-5 mt-4">
            <div className="text-sm text-muted-foreground">Adding to: <span className="font-medium capitalize">{activeChecklistType}</span></div>
            <div className="form-group">
              <Label>Task *</Label>
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} required className="form-input" />
            </div>
            <Button type="submit" className="w-full rounded-full py-6">Add Task</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Todo Modal */}
      <Dialog open={showAddTodoModal} onOpenChange={setShowAddTodoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Add To-Do</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTodo} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Task *</Label>
              <Input value={newTodo.text} onChange={(e) => setNewTodo({ ...newTodo, text: e.target.value })} required className="form-input" />
            </div>
            <div className="form-group">
              <Label>Priority</Label>
              <Select value={newTodo.priority} onValueChange={(v) => setNewTodo({ ...newTodo, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full rounded-full py-6">Add To-Do</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Config Item Modal */}
      <Dialog open={showAddConfigItemModal} onOpenChange={setShowAddConfigItemModal}>
        <DialogContent className="sm:max-w-md" data-testid="add-config-modal">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Add {configLabels[activeConfigType]?.slice(0, -1)}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddConfigItem} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Value (internal) *</Label>
              <Input value={configItemForm.value} onChange={(e) => setConfigItemForm({ ...configItemForm, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g., hair_color" required className="form-input font-mono" />
            </div>
            <div className="form-group">
              <Label>Label (display) *</Label>
              <Input value={configItemForm.label} onChange={(e) => setConfigItemForm({ ...configItemForm, label: e.target.value })} placeholder="e.g., Hair Color" required className="form-input" />
            </div>
            <Button type="submit" className="w-full rounded-full py-6" data-testid="submit-config">Add Option</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="role-modal">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editingRole ? "Edit Role" : "Create Role"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveRole} className="space-y-5 mt-4">
            <div className="form-group">
              <Label>Role Name *</Label>
              <Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g., Manager" required className="form-input" />
            </div>
            <div className="form-group">
              <Label>Description</Label>
              <Input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="Brief description of this role" className="form-input" />
            </div>
            <div className="form-group">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-border rounded-xl p-3">
                {permissions.map(perm => (
                  <div key={perm.id} className="flex items-center gap-3 py-2 px-2 hover:bg-secondary/50 rounded-lg">
                    <Checkbox 
                      checked={roleForm.permissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{perm.name}</div>
                      <div className="text-xs text-muted-foreground">{perm.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full py-6">{editingRole ? "Update Role" : "Create Role"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Clients Modal */}
      <Dialog open={showMergeModal} onOpenChange={setShowMergeModal}>
        <DialogContent className="sm:max-w-md" data-testid="merge-modal">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Merge Clients</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Select the primary client to keep. All other clients will be merged into it.</p>
            <div className="space-y-2">
              {selectedDuplicateGroup?.clients.map(client => (
                <div 
                  key={client.id}
                  onClick={() => setSelectedPrimaryClient(client.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedPrimaryClient === client.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground">{client.phone}</div>
                  {selectedPrimaryClient === client.id && (
                    <Badge className="mt-2" variant="default">Primary</Badge>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleMergeClients} className="w-full rounded-full py-6" disabled={!selectedPrimaryClient}>
              <GitMerge className="w-4 h-4 mr-2" />Merge into Primary
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
