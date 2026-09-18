"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export type Template = {
  id: string;
  title: string;
  category: string;
  text: string;
  shortcut?: string | null;
  order: number;
};

type QuickTemplatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (text: string) => void;
};

export function QuickTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: QuickTemplatesModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Общие");
  const [text, setText] = useState("");
  const [shortcut, setShortcut] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/olx/templates");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setIsEditing(false);
      setEditId(null);
    }
  }, [isOpen]);

  const categories = ["Все", ...Array.from(new Set(templates.map((t) => t.category || "Общие")))];

  const filtered = templates.filter((t) => {
    const matchesCategory = selectedCategory === "Все" || t.category === selectedCategory;
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.text.toLowerCase().includes(search.toLowerCase()) ||
      (t.shortcut && t.shortcut.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setLoading(true);

    try {
      if (editId) {
        await fetch(`/api/olx/templates/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, text, category, shortcut }),
        });
      } else {
        await fetch("/api/olx/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, text, category, shortcut }),
        });
      }

      await fetchTemplates();
      setIsEditing(false);
      setEditId(null);
      setTitle("");
      setText("");
      setShortcut("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Удалить этот шаблон?")) return;
    try {
      await fetch(`/api/olx/templates/${id}`, { method: "DELETE" });
      fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (t: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditId(t.id);
    setTitle(t.title);
    setCategory(t.category || "Общие");
    setText(t.text);
    setShortcut(t.shortcut || "");
    setIsEditing(true);
  };

  const startCreate = () => {
    setEditId(null);
    setTitle("");
    setCategory(selectedCategory !== "Все" ? selectedCategory : "Общие");
    setText("");
    setShortcut("");
    setIsEditing(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-card border border-border/40 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Шаблоны быстрых ответов</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Заготовленные фразы для мгновенных ответов покупателям в 1 клик
                </DialogDescription>
              </div>
            </div>

            {!isEditing && (
              <Button
                onClick={startCreate}
                size="sm"
                className="font-bold rounded-xl gap-1.5 shadow-md shadow-primary/20"
              >
                <Plus className="w-4 h-4" /> Новый шаблон
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3.5 my-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">Название кнопки</label>
                <Input
                  placeholder="например: В наличии"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-foreground/5 text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">Категория</label>
                <Input
                  placeholder="Наличие / Доставка / Оплата"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-foreground/5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Шорткат (быстрый вызов через слеш)</label>
              <Input
                placeholder="например: /nal"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                className="bg-foreground/5 text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">Текст сообщения покупателю</label>
              <Textarea
                placeholder="Текст, который будет автоматически вставлен в поле ввода..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="bg-foreground/5 text-sm resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="rounded-xl font-bold"
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading} className="rounded-xl font-bold">
                {editId ? "Сохранить изменения" : "Создать шаблон"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 my-2">
            {/* Поиск и категории */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Поиск по фразам или шорткатам..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-foreground/5 text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-foreground/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Список шаблонов */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Шаблоны не найдены
                </div>
              ) : (
                filtered.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onSelectTemplate) {
                        onSelectTemplate(t.text);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-xl bg-foreground/5 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {t.title}
                        </span>
                        {t.shortcut && (
                          <Badge variant="outline" className="text-[10px] font-mono py-0 px-1 bg-background/50">
                            {t.shortcut}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 opacity-70">
                          {t.category}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => startEdit(t, e)}
                          className="h-7 w-7 rounded-lg hover:bg-background/80"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(t.id, e)}
                          className="h-7 w-7 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
