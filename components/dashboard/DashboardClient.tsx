"use client";

import { useState, useEffect, useCallback } from "react";
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
}

export function DashboardClient({
  initialProducts,
  globalRate,
}: DashboardClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductUI[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    () => new Set(initialProducts.map((p) => p.id)),
  );
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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
    if (!confirm("Удалить папку? Товары останутся без папки.")) return;
    try {
      await fetch("/api/folders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: folderId }),
      });
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      await fetchFolders();
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete folder", err);
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

  const filteredProducts = products.filter((p) => {
    const matchesTab = activeTab === "active" ? !p.archive : p.archive;
    if (!matchesTab) return false;
    if (selectedFolderId === null) return true;
    if (selectedFolderId === "__none__") return !p.folderId;
    return p.folderId === selectedFolderId;
  });

  const selectedProducts = filteredProducts.filter((p) =>
    selectedIds.has(p.id),
  );

  const summaryProducts = selectedProducts;

  const totalSpent = summaryProducts.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = summaryProducts.reduce((sum, p) => sum + p.income, 0);

  const totalProjectedRevenue = summaryProducts.reduce((sum, p) => {
    return sum + (p.totalPurchased || 0) * (p.priceInUA || 0);
  }, 0);

  const totalProjectedProfit = totalProjectedRevenue - totalSpent;

  const folderOrder: (string | null)[] = [
    null,
    "__none__",
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
        setSelectedFolderId(folderOrder[nextIdx] ?? null);
      }
    },
    [folderOrder, selectedFolderId],
  );

  const currentFolderName =
    selectedFolderId === null
      ? "Все"
      : selectedFolderId === "__none__"
        ? "Без папки"
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
        onAdd={() => router.push("/product")}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        hasSelection={selectedIds.size > 0}
      />

      <div className="glass max-lg:hidden p-1.5 rounded-2xl flex gap-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("active")}
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
          onClick={() => setActiveTab("archive")}
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
          onClick={() => setSelectedFolderId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            selectedFolderId === null
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Все ({tabProducts.length})
        </button>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={folders.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
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
                  setSelectedFolderId={setSelectedFolderId}
                  renameFolder={renameFolder}
                  deleteFolder={deleteFolder}
                />
              );
            })}
          </SortableContext>
        </DndContext>
        <button
          onClick={() => setSelectedFolderId("__none__")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            selectedFolderId === "__none__"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
          }`}
        >
          Без папки ({tabProducts.filter((p) => !p.folderId).length})
        </button>
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
                <button
                  onClick={() => {
                    bulkMoveToFolder(null);
                    setShowFolderDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors"
                >
                  Без папки
                </button>
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
