"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, RefreshCw, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import type { ExchangeRates } from "@/lib/rates";

type Currency = "UAH" | "USD" | "EUR" | "CNY";

const CURRENCIES: {
  code: Currency;
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
}[] = [
  {
    code: "UAH",
    label: "Гривна",
    symbol: "₴",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    code: "USD",
    label: "Доллар",
    symbol: "$",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    code: "EUR",
    label: "Евро",
    symbol: "€",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    code: "CNY",
    label: "Юань",
    symbol: "¥",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

function Flag({ code }: { code: Currency }) {
  if (code === "UAH") {
    return (
      <svg viewBox="0 0 60 40" className="w-8 h-6 rounded-[3px] shadow-sm border border-white/10 shrink-0">
        <rect width="60" height="20" fill="#005BBB" />
        <rect y="20" width="60" height="20" fill="#FFD500" />
      </svg>
    );
  }
  if (code === "USD") {
    return (
      <svg viewBox="0 0 60 40" className="w-8 h-6 rounded-[3px] shadow-sm border border-white/10 shrink-0">
        <rect width="60" height="40" fill="#B22234" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} y={i * 6.15 + 3.08} width="60" height="3.08" fill="white" />
        ))}
        <rect width="24" height="21.5" fill="#3C3B6E" />
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => (
            <circle key={`${row}-${col}`} cx={2 + col * 4} cy={2.2 + row * 4.3} r="0.8" fill="white" />
          )),
        )}
      </svg>
    );
  }
  if (code === "EUR") {
    return (
      <svg viewBox="0 0 60 40" className="w-8 h-6 rounded-[3px] shadow-sm border border-white/10 shrink-0">
        <rect width="60" height="40" fill="#003399" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const cx = 30 + 12 * Math.cos(angle);
          const cy = 20 + 12 * Math.sin(angle);
          return (
            <polygon
              key={i}
              points={Array.from({ length: 5 })
                .map((_, j) => {
                  const a = ((j * 144 - 90) * Math.PI) / 180;
                  return `${cx + 2 * Math.cos(a)},${cy + 2 * Math.sin(a)}`;
                })
                .join(" ")}
              fill="#FFCC00"
            />
          );
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className="w-8 h-6 rounded-[3px] shadow-sm border border-white/10 shrink-0">
      <rect width="60" height="40" fill="#DE2910" />
      <polygon
        points="12,6 13.8,11.5 19.6,11.5 14.9,15 16.7,20.5 12,17 7.3,20.5 9.1,15 4.4,11.5 10.2,11.5"
        fill="#FFDE00"
      />
      {[
        [23, 4],
        [26, 8],
        [26, 14],
        [23, 18],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="#FFDE00" />
      ))}
    </svg>
  );
}

interface CalculatorClientProps {
  rates: ExchangeRates;
}

export function CalculatorClient({ rates }: CalculatorClientProps) {
  const router = useRouter();
  const [from, setFrom] = useState<Currency>("CNY");
  const [to, setTo] = useState<Currency>("UAH");
  const [amount, setAmount] = useState("");

  const toUAH: Record<Currency, number> = {
    UAH: 1,
    USD: rates.usd,
    EUR: rates.eur,
    CNY: rates.cny,
  };

  const convert = useCallback(
    (value: number, fromCur: Currency, toCur: Currency) => {
      if (fromCur === toCur) return value;
      const inUAH = value * toUAH[fromCur];
      return inUAH / toUAH[toCur];
    },
    [toUAH],
  );

  const parsed = parseFloat(amount);
  const result = !isNaN(parsed) && parsed > 0 ? convert(parsed, from, to) : 0;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const fromCurrency = CURRENCIES.find((c) => c.code === from)!;
  const toCurrency = CURRENCIES.find((c) => c.code === to)!;

  const allConversions =
    !isNaN(parsed) && parsed > 0
      ? CURRENCIES.filter((c) => c.code !== from).map((c) => ({
          ...c,
          value: convert(parsed, from, c.code),
        }))
      : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6 glass-card">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
            className="glass rounded-xl border-none hover:bg-primary/20 transition-all h-10 w-10 sm:h-11 sm:w-11 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-3xl font-black tracking-tighter text-foreground">
              💱 <span className="text-primary">Калькулятор</span> валют
            </h1>
            <p className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
              Monobank / НБУ
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
          className="glass rounded-xl border-none hover:bg-primary/20 transition-all h-10 w-10 sm:h-11 sm:w-11 shrink-0 group"
          title="Обновить курсы"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-180 transition-transform duration-500" />
        </Button>
      </div>

      {/* Rates cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {CURRENCIES.filter((c) => c.code !== "UAH").map((c) => (
          <Card key={c.code} className="p-4 sm:p-5 glass-card flex flex-col justify-between space-y-3 group cursor-default hover:scale-[1.03] hover:shadow-xl hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
                {c.code}/UAH
              </span>
              <div className={`p-2 ${c.bgColor} rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <Flag code={c.code} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {toUAH[c.code].toFixed(2)}{" "}
              <span className="text-sm font-medium text-muted-foreground">₴</span>
            </div>
          </Card>
        ))}
        <Card className="p-4 sm:p-5 glass-card flex flex-col justify-between space-y-3 group cursor-default hover:scale-[1.03] hover:shadow-xl hover:border-primary/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground/80">
              Доставка / кг
            </span>
            <div className="p-2 bg-purple-500/10 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-lg">📦</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">✈️ Авиа</span>
              <span className="text-sm sm:text-base font-black text-foreground">
                {(18.3 * rates.usd).toFixed(0)}{" "}
                <span className="text-xs font-medium text-muted-foreground">₴</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">🚢 Море</span>
              <span className="text-sm sm:text-base font-black text-foreground">
                {(7.1 * rates.usd).toFixed(0)}{" "}
                <span className="text-xs font-medium text-muted-foreground">₴</span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Converter */}
      <div className="glass-card p-5 sm:p-8 space-y-6">
        {/* From section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Отдаю
          </label>
          <div className="flex gap-3">
            <div className="grid grid-cols-4 gap-2 flex-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setFrom(c.code)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    from === c.code
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:scale-[1.05] hover:shadow-md active:scale-95 border border-border/50"
                  }`}
                >
                  <Flag code={c.code} />
                  <span className="text-[10px] sm:text-xs font-black">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-black ${fromCurrency.color} pointer-events-none`}>
              {fromCurrency.symbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl bg-muted/30 border border-border px-10 sm:px-12 py-4 sm:py-5 text-2xl sm:text-3xl font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 hover:border-primary/30 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* Swap */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="glass rounded-full border-none hover:bg-primary/20 transition-all h-11 w-11 hover:rotate-180 duration-500 shrink-0"
          >
            <ArrowUpDown className="w-5 h-5" />
          </Button>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* To section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Получаю
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setTo(c.code)}
                className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  to === c.code
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.03]"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:scale-[1.05] hover:shadow-md active:scale-95 border border-border/50"
                }`}
              >
                <Flag code={c.code} />
                <span className="text-[10px] sm:text-xs font-black">{c.code}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-black ${toCurrency.color} pointer-events-none`}>
              {toCurrency.symbol}
            </span>
            <div className="w-full rounded-xl bg-primary/5 border-2 border-primary/20 px-10 sm:px-12 py-4 sm:py-5">
              <p className="text-2xl sm:text-3xl font-black text-primary">
                {result > 0 ? result.toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Cross rate */}
        {!isNaN(parsed) && parsed > 0 && (
          <div className="flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-muted/20">
            <Flag code={from} />
            <span className="text-xs sm:text-sm font-bold text-muted-foreground">
              1 {from} = {convert(1, from, to).toFixed(4)} {to}
            </span>
            <Flag code={to} />
          </div>
        )}
      </div>

      {/* All conversions */}
      {allConversions.length > 0 && (
        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Flag code={from} />
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-wider">
              {parsed} {from} во все валюты
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allConversions.map((c) => {
              const cur = CURRENCIES.find((cc) => cc.code === c.code)!;
              return (
                <div
                  key={c.code}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20 active:scale-[0.98] transition-all duration-200 cursor-default group"
                >
                  <div className="flex items-center gap-3">
                    <Flag code={c.code} />
                    <div>
                      <p className="text-sm font-black text-foreground">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground">{c.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg sm:text-xl font-black ${cur.color}`}>
                      {cur.symbol}{c.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
