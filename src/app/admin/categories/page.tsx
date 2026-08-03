"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, GripVertical, Search, X, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ImageUpload from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils/cn";
import axios from "axios";
import { toast } from "@/hooks/useToast";

const PRESET_COLORS = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B",
  "#EF4444","#EC4899","#06B6D4","#84CC16",
];
const PRESET_ICONS = ["📚","⚛️","🔬","🎓","🧪","🏛️","📐","🧬","⚗️","🔭","📊","🏆"];
const DEFAULT_FORM = { name:"", description:"", icon:"📚", color:"#3B82F6", isActive:true, displayOrder:0, thumbnail:"", banner:"" };

function CategoryForm({
  initial, onSave, onCancel, saving,
}: {
  initial: typeof DEFAULT_FORM;
  onSave: (data: typeof DEFAULT_FORM) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof DEFAULT_FORM, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="cat-name" label="Category Name *" placeholder="e.g. JEE Main"
          value={form.name} onChange={e => set("name", e.target.value)} />
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Display Order</label>
          <input type="number" min={0} value={form.displayOrder}
            onChange={e => set("displayOrder", parseInt(e.target.value) || 0)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground outline-none focus:ring-2 ring-primary/30" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
        <textarea rows={2} placeholder="Brief description..."
          value={form.description} onChange={e => set("description", e.target.value)}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground outline-none focus:ring-2 ring-primary/30 resize-none" />
      </div>

      {/* Icon picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Icon (emoji)</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ICONS.map(ic => (
            <button key={ic} type="button"
              onClick={() => set("icon", ic)}
              className={cn("w-9 h-9 text-lg rounded-lg border-2 transition-all", form.icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}
            >{ic}</button>
          ))}
          <input type="text" placeholder="Custom" maxLength={2}
            value={PRESET_ICONS.includes(form.icon) ? "" : form.icon}
            onChange={e => set("icon", e.target.value)}
            className="w-20 border-2 border-dashed border-border rounded-lg px-2 text-sm bg-background text-foreground outline-none focus:border-primary" />
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button key={c} type="button"
              onClick={() => set("color", c)}
              style={{ background: c }}
              className={cn("w-8 h-8 rounded-full border-2 transition-all", form.color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105")}
            />
          ))}
          <input type="color" value={form.color}
            onChange={e => set("color", e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent" />
          <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
        </div>
      </div>

      {/* Thumbnail */}
      <ImageUpload
        label="Thumbnail (optional)"
        value={form.thumbnail}
        folder="rhg-exam-portal/categories"
        previewHeight="h-32"
        onChange={(url) => set("thumbnail", url)}
        onRemove={() => set("thumbnail", "")}
      />

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => set("isActive", !form.isActive)}
          className={cn("relative w-11 h-6 rounded-full transition-colors", form.isActive ? "bg-green-500" : "bg-muted")}
        >
          <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform", form.isActive ? "translate-x-5" : "translate-x-0")} />
        </button>
        <span className="text-sm text-foreground">{form.isActive ? "Active" : "Inactive"}</span>
      </div>

      {/* Preview */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground mb-2">Preview</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: form.color + "22" }}>
            {form.thumbnail ? <img src={form.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" /> : form.icon}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{form.name || "Category Name"}</p>
            <p className="text-xs text-muted-foreground">{form.description || "Description"}</p>
          </div>
          <div className="ml-auto w-3 h-3 rounded-full" style={{ background: form.color }} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="button" variant="gold" size="sm" onClick={() => onSave(form)} isLoading={saving} loadingText="Saving..." className="flex-1">
          <Save className="h-3.5 w-3.5 mr-1" />Save Category
        </Button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    axios.get("/api/admin/categories?active=false")
      .then(r => setCategories(Array.isArray(r.data.data) ? r.data.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (data: typeof DEFAULT_FORM) => {
    if (!data.name.trim()) { toast({ title: "Name is required", variant: "error" }); return; }
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/api/admin/categories/${editing._id}`, data);
        toast({ title: "Category updated", variant: "success" });
      } else {
        await axios.post("/api/admin/categories", data);
        toast({ title: "Category created", variant: "success" });
      }
      setShowForm(false);
      setEditing(null);
      fetch();
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Save failed", variant: "error" });
    } finally { setSaving(false); }
  };

  const toggleActive = async (cat: any) => {
    try {
      await axios.put(`/api/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories(prev => prev.map(c => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
      toast({ title: `Category ${!cat.isActive ? "activated" : "deactivated"}`, variant: "success" });
    } catch { toast({ title: "Update failed", variant: "error" }); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c._id !== id));
      toast({ title: "Category deleted", variant: "success" });
    } catch { toast({ title: "Delete failed", variant: "error" }); }
    finally { setDeleting(null); }
  };

  const filtered = categories.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Categories</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categories</p>
        </div>
        <Button variant="gold" size="sm" className="gap-1.5" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />New Category
        </Button>
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-foreground">{editing ? "Edit Category" : "New Category"}</h2>
              </CardHeader>
              <CardContent>
                <CategoryForm
                  initial={editing ? {
                    name: editing.name, description: editing.description || "",
                    icon: editing.icon || "📚", color: editing.color || "#3B82F6",
                    isActive: editing.isActive, displayOrder: editing.displayOrder || 0,
                    thumbnail: editing.thumbnail || "", banner: editing.banner || "",
                  } : DEFAULT_FORM}
                  onSave={handleSave}
                  onCancel={() => { setShowForm(false); setEditing(null); }}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <Card>
        <CardHeader>
          <Input id="cat-search" placeholder="Search categories..." leftIcon={<Search className="h-4 w-4" />}
            value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-muted-foreground">{search ? "No categories match" : "No categories yet"}</p>
              {!search && <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>Create First Category</Button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((cat) => (
                <motion.div key={cat._id} layout
                  className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors",
                    cat.isActive ? "border-border bg-card" : "border-border/40 bg-muted/20 opacity-60"
                  )}
                >
                  {/* Color dot + icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: (cat.color || "#3B82F6") + "22" }}>
                    {cat.thumbnail
                      ? <img src={cat.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                      : (cat.icon || "📚")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{cat.name}</p>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                        cat.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                      )}>{cat.isActive ? "Active" : "Inactive"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{cat.description || "No description"}</p>
                  </div>

                  {/* Order badge */}
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">#{cat.displayOrder}</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleActive(cat)}
                      title={cat.isActive ? "Deactivate" : "Activate"}>
                      {cat.isActive ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(cat); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteCategory(cat._id)}
                      disabled={deleting === cat._id}>
                      {deleting === cat._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
