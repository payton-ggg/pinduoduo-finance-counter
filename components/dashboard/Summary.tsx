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
import type { ProductUI } from "./ProductCard";

type SummaryProps = {
  totalSpent: number;
  totalIncome: number;
  totalProjectedRevenue: number;
  totalProjectedProfit: number;
  variationsCount: number;
  folderName?: string;
  onSwipe?: (direction: "left" | "right") => void;
  products?: ProductUI[];
};

export function Summary({
  totalSpent,
  totalIncome,
  totalProjectedRevenue,
  totalProjectedProfit,
  variationsCount,
  folderName,
  onSwipe,
  products,
}: SummaryProps) {
  const [showGross, setShowGross] = useState(false);
  const [showBreakEven, setShowBreakEven] = useState(false);
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
    if (
      !isDragging.current &&
      Math.abs(dx) > 10 &&
      Math.abs(dx) > Math.abs(dy)
    ) {
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

      if (
        touchStartX.current === null ||
        touchStartY.current === null ||
        !onSwipe
      ) {
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

  const getBreakEvenPlan = () => {
    if (profit >= 0 || !products || products.length === 0) return null;

    let deficit = Math.abs(profit);
    const plan: { name: string; count: number; total: number }[] = [];

    const available = products
      .filter((p) => {
        const price = p.priceInUA || 0;
        if (price <= 0) return false;
        const sold = Math.floor(p.income / price);
        const stock = p.totalPurchased || 0;
        return stock > sold;
      })
      .map((p) => {
        const price = p.priceInUA || 0;
        const sold = Math.floor(p.income / price);
        const stock = p.totalPurchased || 0;
        return {
          id: p.id,
          name: p.name,
          price,
          remaining: stock - sold,
        };
      })
      .sort((a, b) => b.price - a.price);

    for (const item of available) {
      if (deficit <= 0) break;
      const needToSell = Math.min(item.remaining, Math.ceil(deficit / item.price));
      if (needToSell > 0) {
        plan.push({ name: item.name, count: needToSell, total: needToSell * item.price });
        deficit -= needToSell * item.price;
      }
    }

    return {
      plan,
      remainingDeficit: deficit > 0 ? deficit : 0,
    };
  };

  const breakEvenPlan = getBreakEvenPlan();

  return (
    <div className="mb-6 overflow-hidden py-5 rounded-xl">
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
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold transition-transform ${slideClass}`}
          >
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
        style={
          dragOffset
            ? {
                transform: `translateX(${dragOffset}px)`,
                opacity: Math.max(0.3, 1 - Math.abs(dragOffset) / 200),
              }
            : undefined
        }
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

        <Card 
          onClick={() => {
            if (profit < 0) setShowBreakEven(!showBreakEven);
          }}
          className={`p-5 glass-card flex flex-col justify-between space-y-3 relative overflow-hidden group ${profit < 0 ? "cursor-pointer hover:border-primary/40" : ""}`}
        >
          <div className="absolute -top-3 -left-4 w-120 h-120 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          <div className="flex items-center justify-between text-primary relative z-10">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
              {showBreakEven && profit < 0 ? "Выход в ноль" : "Прибыль"}
            </span>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10">
            {!showBreakEven || profit >= 0 ? (
              <div
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  profit >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {profit.toLocaleString()}{" "}
                <span className="text-sm font-medium opacity-70">₴</span>
              </div>
            ) : (
              <div className="text-sm text-foreground/90 font-medium h-[32px] sm:h-[36px] overflow-y-auto custom-scrollbar">
                {breakEvenPlan?.plan.length ? (
                  <div className="space-y-1 pr-1">
                    {breakEvenPlan.plan.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="truncate max-w-[120px] mr-2" title={item.name}>{item.name}:</span>
                        <span className="whitespace-nowrap font-bold text-primary">{item.count} шт</span>
                      </div>
                    ))}
                    {breakEvenPlan.plan.length > 3 && (
                      <div className="text-xs text-muted-foreground italic">
                        + еще {breakEvenPlan.plan.length - 3} тов.
                      </div>
                    )}
                    {breakEvenPlan.remainingDeficit > 0 && (
                      <div className="text-destructive text-[10px] mt-1 border-t border-destructive/20 pt-1 leading-tight">
                        Не хватит товара, останется {breakEvenPlan.remainingDeficit.toLocaleString()} ₴
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-destructive text-xs">
                    Нет товаров для продажи
                  </div>
                )}
              </div>
            )}
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
