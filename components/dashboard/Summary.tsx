import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Package,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

type SummaryProps = {
  totalSpent: number;
  totalIncome: number;
  totalProjectedRevenue: number;
  totalProjectedProfit: number;
  variationsCount: number;
  folderName?: string;
  onSwipe?: (direction: "left" | "right") => void;
};

export function Summary({
  totalSpent,
  totalIncome,
  totalProjectedRevenue,
  totalProjectedProfit,
  variationsCount,
  folderName,
  onSwipe,
}: SummaryProps) {
  const [showGross, setShowGross] = useState(false);
  const profit = totalIncome - totalSpent;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [slideClass, setSlideClass] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const prevFolderName = useRef(folderName);

  useEffect(() => {
    if (prevFolderName.current !== folderName && !isDragging.current) {
      prevFolderName.current = folderName;
    }
  }, [folderName]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isDragging.current = false;
    setSlideClass("");
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isDragging.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      touchDeltaX.current = dx;
      setDragOffset(dx * 0.4);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const wasDragging = isDragging.current;
      isDragging.current = false;

      if (touchStartX.current === null || touchStartY.current === null || !onSwipe) {
        setDragOffset(0);
        return;
      }
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;

      if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) {
        setDragOffset(0);
        return;
      }

      const direction = deltaX < 0 ? "left" : "right";
      setSlideClass(
        direction === "left"
          ? "animate-slide-out-left"
          : "animate-slide-out-right",
      );

      setTimeout(() => {
        onSwipe(direction);
        setDragOffset(0);
        setSlideClass(
          direction === "left"
            ? "animate-slide-in-right"
            : "animate-slide-in-left",
        );
        setTimeout(() => setSlideClass(""), 250);
      }, 150);
    },
    [onSwipe],
  );

  const handleChevron = useCallback(
    (direction: "left" | "right") => {
      if (!onSwipe) return;
      setSlideClass(
        direction === "left"
          ? "animate-slide-out-left"
          : "animate-slide-out-right",
      );
      setTimeout(() => {
        onSwipe(direction);
        setSlideClass(
          direction === "left"
            ? "animate-slide-in-right"
            : "animate-slide-in-left",
        );
        setTimeout(() => setSlideClass(""), 250);
      }, 150);
    },
    [onSwipe],
  );

  return (
    <div className="mb-6 overflow-hidden">
      <style>{`
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(60px); opacity: 0; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-out-left { animation: slideOutLeft 150ms ease-in forwards; }
        .animate-slide-out-right { animation: slideOutRight 150ms ease-in forwards; }
        .animate-slide-in-left { animation: slideInLeft 250ms ease-out forwards; }
        .animate-slide-in-right { animation: slideInRight 250ms ease-out forwards; }
      `}</style>
      {folderName && (
        <div className="flex items-center justify-center gap-2 mb-3 sm:hidden">
          <button
            onClick={() => handleChevron("right")}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold transition-transform ${slideClass}`}>
            <FolderOpen className="w-3.5 h-3.5" />
            {folderName}
          </div>
          <button
            onClick={() => handleChevron("left")}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/5 active:bg-foreground/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
      <div
        ref={gridRef}
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 ${slideClass}`}
        style={dragOffset ? { transform: `translateX(${dragOffset}px)`, opacity: Math.max(0.3, 1 - Math.abs(dragOffset) / 200) } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Расходы
          </span>
          <div className="p-2 bg-red-500/10 rounded-xl">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {totalSpent.toLocaleString()}{" "}
          <span className="text-sm font-medium text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Доходы
          </span>
          <div className="p-2 bg-green-500/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {totalIncome.toLocaleString()}{" "}
          <span className="text-sm font-medium text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3 relative overflow-hidden group">
        <div className="absolute -top-3 -left-4 w-120 h-120 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center justify-between text-primary relative z-10">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Прибыль
          </span>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black tracking-tight relative z-10 ${
            profit >= 0 ? "text-primary" : "text-destructive"
          }`}
        >
          {profit.toLocaleString()}{" "}
          <span className="text-sm font-medium opacity-70">₴</span>
        </div>
      </Card>

      <Card
        onClick={() => setShowGross(!showGross)}
        className="p-5 glass-card flex flex-col justify-between space-y-3 cursor-pointer group hover:border-primary/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-primary">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Прогноз {showGross ? "(Грязными)" : "(Чистыми)"}
          </span>
          <div className="p-2 bg-primary/10 rounded-xl transition-transform group-hover:rotate-12">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-primary">
          {showGross
            ? totalProjectedRevenue.toLocaleString()
            : totalProjectedProfit.toLocaleString()}{" "}
          <span className="text-sm font-medium opacity-70">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Товары
          </span>
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {variationsCount}
        </div>
      </Card>
      </div>
    </div>
  );
}
