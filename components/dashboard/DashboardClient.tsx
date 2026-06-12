"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Summary } from "./Summary";
import { ProductGrid } from "./ProductGrid";
import type { ProductUI } from "./ProductCard";
import { Button } from "@/components/ui/button";
import {
  Archive,
  Package,
  FolderOpen,
  Plus,
  X,
  FolderInput,
  Pencil,
  Check,
  GripVertical,
  Lock,
  Unlock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FolderItem = {
  id: string;
  name: string;
  allowedForSecondPassword: boolean;
  _count: { products: number };
};

type SortableFolderProps = {
  folder: FolderItem;
  count: number;
  isActive: boolean;
  isEditing: boolean;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  setEditingFolderId: (id: string | null) => void;
  setSelectedFolderId: (id: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  isAdmin: boolean;
  toggleFolderAccess: (id: string, allowed: boolean) => void;
};

function SortableFolderItem({
  folder,
  count,
  isActive,
  isEditing,
  editingFolderName,
  setEditingFolderName,
  setEditingFolderId,
  setSelectedFolderId,
  renameFolder,
  deleteFolder,
  isAdmin,
  toggleFolderAccess,
}: SortableFolderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-0.5">
      {isEditing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            renameFolder(folder.id, editingFolderName);
          }}
          className="flex items-center gap-0.5"
        >
          <input
            autoFocus
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            onBlur={() => renameFolder(folder.id, editingFolderName)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingFolderId(null);
            }}
            className="w-24 px-2 py-1 rounded-l-xl text-xs font-bold bg-primary text-primary-foreground outline-none border border-primary-foreground/20"
          />
          <button
            type="submit"
            className="px-1.5 py-1.5 rounded-r-xl text-xs bg-primary/80 text-primary-foreground hover:bg-primary transition-all duration-200"
          >
            <Check className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <>
          <button
            {...attributes}
            {...listeners}
            className={`px-1 py-1.5 rounded-l-xl text-xs cursor-grab active:cursor-grabbing transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
            }`}
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (isActive) {
                setEditingFolderId(folder.id);
                setEditingFolderName(folder.name);
              } else {
                setSelectedFolderId(folder.id);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {folder.name} ({count})
            {isActive && <Pencil className="w-3 h-3 opacity-60" />}
          </button>
          {isAdmin && (
            <button
              onClick={() => toggleFolderAccess(folder.id, !folder.allowedForSecondPassword)}
              className={`px-1.5 py-1.5 text-xs transition-all duration-200 hover:bg-foreground/10 ${
                isActive
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-foreground/5 text-muted-foreground"
              }`}
              title={folder.allowedForSecondPassword ? "Доступ разрешен для второго пароля" : "Доступ закрыт для второго пароля"}
            >
              {folder.allowedForSecondPassword ? (
                <Unlock className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>
          )}
          <button
            onClick={() => deleteFolder(folder.id)}
            className={`px-1.5 py-1.5 rounded-r-xl text-xs transition-all duration-200 hover:bg-destructive/20 hover:text-destructive ${
              isActive
                ? "bg-primary/80 text-primary-foreground"
                : "bg-foreground/5 text-muted-foreground"
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

interface DashboardClientProps {
  initialProducts: ProductUI[];
  globalRate?: number;
  initialFolderId?: string | null;
  initialActiveTab?: "active" | "archive";
}

export function DashboardClient({
  initialProducts,
  globalRate,
  initialFolderId = null,
  initialActiveTab = "active",
}: DashboardClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductUI[]>(initialProducts);
  const [role, setRole] = useState<string>("admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("site_role");
      if (savedRole) {
        setRole(savedRole);
      }
    }
  }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    () => new Set(initialProducts.map((p) => p.id)),
  );
  const [activeTab, setActiveTab] = useState<"active" | "archive">(initialActiveTab);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateFolderId = useCallback((id: string | null) => {
    setSelectedFolderId(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id === null) {
        url.searchParams.delete("folderId");
      } else {
        url.searchParams.set("folderId", id);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
      sessionStorage.setItem("selectedFolderId", id === null ? "null" : id);
    }
  }, []);

  const updateActiveTab = useCallback((tab: "active" | "archive") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("activeTab", tab);
      window.history.replaceState(null, "", url.pathname + url.search);
      sessionStorage.setItem("activeTab", tab);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    let folderId = params.get("folderId");
    let tab = params.get("activeTab") as "active" | "archive" | null;

    let updated = false;

    if (!folderId) {
      const savedFolder = sessionStorage.getItem("selectedFolderId");
      if (savedFolder && savedFolder !== "null") {
        folderId = savedFolder;
        setSelectedFolderId(folderId);
        updated = true;
      }
    } else {
      sessionStorage.setItem("selectedFolderId", folderId);
    }

    if (!tab) {
      const savedTab = sessionStorage.getItem("activeTab") as "active" | "archive" | null;
      if (savedTab === "active" || savedTab === "archive") {
        tab = savedTab;
        setActiveTab(tab);
        updated = true;
      }
    } else {
      sessionStorage.setItem("activeTab", tab);
    }

    if (updated) {
      const url = new URL(window.location.href);
      if (folderId) {
        url.searchParams.set("folderId", folderId);
      } else {
        url.searchParams.delete("folderId");
      }
      if (tab) {
        url.searchParams.set("activeTab", tab);
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = folders.findIndex((f) => f.id === active.id);
      const newIndex = folders.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(folders, oldIndex, newIndex);
      setFolders(reordered);
      fetch("/api/folders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((f) => f.id) }),
      }).catch((err) => console.error("Failed to reorder folders", err));
    },
    [folders],
  );

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      setFolders(data);
    } catch (err) {
      console.error("Failed to fetch folders", err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const toggleSelection = (id: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectAll = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    setSelectedIds(new Set(filteredIds));
  };

  const bulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/products/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          archive: 1,
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to archive products", err);
    }
  };

  const bulkUnarchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/products/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          archive: null,
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to unarchive products", err);
    }
  };

  const bulkMoveToFolder = async (folderId: string | null) => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/products/bulk-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          folderId,
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to move products to folder", err);
    }
  };

  const createFolder = async () => {
    const name = prompt("Название папки:");
    if (!name || name.trim().length === 0) return;
    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await fetchFolders();
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    const productCount = folder?._count?.products || 0;
    if (productCount > 0) {
      alert(`Нельзя удалить папку "${folder?.name}", так как в ней есть товары (${productCount} шт.). Сначала переместите их или удалите.`);
      return;
    }
    if (!confirm(`Удалить папку "${folder?.name}"?`)) return;
    try {
      const res = await fetch("/api/folders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка удаления");
      }
      if (selectedFolderId === folderId) {
        updateFolderId(null);
      }
      await fetchFolders();
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete folder", err);
      alert(err instanceof Error ? err.message : "Не удалось удалить папку");
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setEditingFolderId(null);
      return;
    }
    try {
      await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folderId, name: trimmed }),
      });
      await fetchFolders();
    } catch (err) {
      console.error("Failed to rename folder", err);
    }
    setEditingFolderId(null);
  };

  const toggleFolderAccess = async (folderId: string, allowed: boolean) => {
    try {
      const res = await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folderId, allowedForSecondPassword: allowed }),
      });
      if (!res.ok) {
        throw new Error("Failed to toggle folder access");
      }
      await fetchFolders();
    } catch (err) {
      console.error(err);
      alert("Не удалось изменить доступ к папке");
    }
  };

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["name", "folderName"],
      threshold: 0.3,
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (debouncedSearchQuery.trim()) {
      return fuse.search(debouncedSearchQuery).map((result) => result.item);
    }
    return products.filter((p) => {
      const matchesTab = activeTab === "active" ? !p.archive : p.archive;
      if (!matchesTab) return false;
      if (selectedFolderId === null) return true;
      return p.folderId === selectedFolderId;
    });
  }, [products, debouncedSearchQuery, activeTab, selectedFolderId, fuse]);

  const selectedProducts = filteredProducts.filter((p) =>
    selectedIds.has(p.id),
  );

  const summaryProducts = selectedProducts;

  const totalSpent = summaryProducts.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = summaryProducts.reduce((sum, p) => sum + p.income, 0);

  const totalProjectedRevenue = summaryProducts.reduce((sum, p) => {
    const actualNetPrice =
      p.netPrice ||
      ((p.priceInUA || 0) > 0 ? (p.priceInUA || 0) * 0.98 - 20 : 0);
    return sum + (p.totalPurchased || 0) * actualNetPrice;
  }, 0);

  const totalProjectedProfit = totalProjectedRevenue - totalSpent;

  const folderOrder: (string | null)[] = [
    null,
    ...folders.map((f) => f.id),
  ];

  const swipeFolder = useCallback(
    (direction: "left" | "right") => {
      const currentIdx = folderOrder.indexOf(selectedFolderId);
      const nextIdx =
        direction === "left"
          ? Math.min(currentIdx + 1, folderOrder.length - 1)
          : Math.max(currentIdx - 1, 0);
      if (nextIdx !== currentIdx) {
        updateFolderId(folderOrder[nextIdx] ?? null);
      }
    },
    [folderOrder, selectedFolderId, updateFolderId],
  );

  const currentFolderName =
    selectedFolderId === null
      ? "Все"
      : (folders.find((f) => f.id === selectedFolderId)?.name ?? "");

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const tabProducts = products.filter((p) =>
    activeTab === "active" ? !p.archive : p.archive,
  );

  return (
    <div className="py-4 space-y-4">
      <Header
        onAdd={() => {
          const params = selectedFolderId ? `?folderId=${selectedFolderId}` : "";
          router.push(`/product${params}`);
        }}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        hasSelection={selectedIds.size > 0}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <div className="glass max-lg:hidden p-1.5 rounded-2xl flex gap-1 w-fit mb-6">
        <button
          onClick={() => updateActiveTab("active")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Package className="w-4 h-4" />
          Активные ({products.filter((p) => !p.archive).length})
        </button>
        <button
          onClick={() => updateActiveTab("archive")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "archive"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Archive className="w-4 h-4" />
          Архив ({products.filter((p) => p.archive).length})
        </button>
      </div>

      {/* Folder Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => updateFolderId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            selectedFolderId === null
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Все ({tabProducts.length})
        </button>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={folders.map((f) => f.id)}
            strategy={horizontalListSortingStrategy}
          >
            {folders.map((folder) => {
              const count = tabProducts.filter(
                (p) => p.folderId === folder.id,
              ).length;
              return (
                <SortableFolderItem
                  key={folder.id}
                  folder={folder}
                  count={count}
                  isActive={selectedFolderId === folder.id}
                  isEditing={editingFolderId === folder.id}
                  editingFolderName={editingFolderName}
                  setEditingFolderName={setEditingFolderName}
                  setEditingFolderId={setEditingFolderId}
                  setSelectedFolderId={updateFolderId}
                  renameFolder={renameFolder}
                  deleteFolder={deleteFolder}
                  isAdmin={role === "admin"}
                  toggleFolderAccess={toggleFolderAccess}
                />
              );
            })}
          </SortableContext>
        </DndContext>
        <button
          onClick={createFolder}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-foreground/10 transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <Summary
        totalSpent={Number(totalSpent.toFixed(2))}
        totalIncome={Number(totalIncome.toFixed(2))}
        totalProjectedRevenue={Number(totalProjectedRevenue.toFixed(2))}
        totalProjectedProfit={Number(totalProjectedProfit.toFixed(2))}
        variationsCount={summaryProducts.length}
        folderName={currentFolderName}
        onSwipe={swipeFolder}
        products={summaryProducts}
      />

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
          {activeTab === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkArchive}
              className="glass border-none rounded-xl font-bold flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Archive className="w-4 h-4" />В архив ({selectedIds.size})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkUnarchive}
              className="glass border-none rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Package className="w-4 h-4" />
              Вернуть ({selectedIds.size})
            </Button>
          )}

          {/* Move to Folder */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="glass border-none rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <FolderInput className="w-4 h-4" />В папку ({selectedIds.size})
            </Button>
            {showFolderDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-background border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      bulkMoveToFolder(folder.id);
                      setShowFolderDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    {folder.name}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground italic">
                    Нет папок
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ProductGrid
        products={filteredProducts}
        selectedIds={selectedIds}
        onToggle={toggleSelection}
        globalRate={globalRate}
      />
    </div>
  );
}
