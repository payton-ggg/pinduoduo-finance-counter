"use client";

import {
	Tag,
	Sparkles,
	Coins,
	Flame,
	Package,
	Percent,
	ArrowUp,
	ArrowDown,
	ArrowUpDown,
	X,
	SlidersHorizontal,
} from "lucide-react";
import type { SortKey, SortDirection } from "@/lib/sorting";

export interface SortOptionItem {
	key: SortKey;
	label: string;
	shortLabel: string;
	icon: React.ComponentType<{ className?: string }>;
	description: string;
}

export const SORT_ITEMS: SortOptionItem[] = [
	{
		key: "price_sale",
		label: "Цена продажи",
		shortLabel: "Продажа",
		icon: Tag,
		description: "Сортировка по цене продажи в Украине",
	},
	{
		key: "roi",
		label: "Лучший ROI",
		shortLabel: "ROI",
		icon: Sparkles,
		description: "Сортировка по окупаемости инвестиций (ROI %)",
	},
	{
		key: "purchase_sale_sum",
		label: "Закупка + Продажа",
		shortLabel: "Закупка + Продажа",
		icon: Coins,
		description: "Сортировка по сумме цены закупки (с учётом доставки) и цены продажи",
	},
	{
		key: "best_sales",
		label: "Лучшие продажи",
		shortLabel: "Продажи",
		icon: Flame,
		description: "Сортировка по количеству проданных единиц",
	},
	{
		key: "large_purchases",
		label: "Большие закупки",
		shortLabel: "Закупки",
		icon: Package,
		description: "Сортировка по количеству закупленных единиц",
	},
	{
		key: "sales_purchases_ratio",
		label: "Продажи / Закупки",
		shortLabel: "Соотношение",
		icon: Percent,
		description: "Сортировка по соотношению продаж к закупкам (%)",
	},
];

interface SortToolbarProps {
	sortBy: SortKey;
	sortDirection: SortDirection;
	onSortChange: (key: SortKey) => void;
	onReset: () => void;
	totalCount: number;
}

export function SortToolbar({
	sortBy,
	sortDirection,
	onSortChange,
	onReset,
	totalCount,
}: SortToolbarProps) {
	const isSorted = sortBy !== "default";

	return (
		<div className="flex flex-col gap-2 p-2 sm:p-2.5 glass-card rounded-2xl">
			{/* Top bar with title and active count */}
			<div className="flex items-center justify-between gap-2 px-1 text-xs">
				<div className="flex items-center gap-1.5 font-black text-muted-foreground uppercase tracking-wider text-[10px] sm:text-xs">
					<SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
					<span>Сортировка товаров</span>
					{isSorted && (
						<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] bg-primary/15 text-primary border border-primary/20 font-bold lowercase">
							активно: {SORT_ITEMS.find((s) => s.key === sortBy)?.shortLabel} (
							{sortDirection === "desc" ? "по убыванию" : "по возрастанию"})
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<span className="text-[10px] sm:text-xs font-bold text-muted-foreground/80">
						{totalCount} шт.
					</span>
					{isSorted && (
						<button
							type="button"
							onClick={onReset}
							className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] sm:text-xs font-bold text-muted-foreground bg-foreground/5 hover:bg-destructive/15 hover:text-destructive transition-all duration-200"
							title="Сбросить сортировку"
						>
							<X className="w-3 h-3" />
							<span>Сброс</span>
						</button>
					)}
				</div>
			</div>

			{/* Scrollable button pills */}
			<div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
				{SORT_ITEMS.map((item) => {
					const isActive = sortBy === item.key;
					const Icon = item.icon;

					return (
						<button
							key={item.key}
							type="button"
							onClick={() => onSortChange(item.key)}
							title={item.description}
							className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black transition-all duration-200 select-none ${
								isActive
									? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
									: "bg-foreground/5 text-muted-foreground hover:text-foreground hover:bg-foreground/10"
							}`}
						>
							<Icon
								className={`w-3.5 h-3.5 ${
									isActive ? "text-primary-foreground" : "text-muted-foreground"
								}`}
							/>
							<span className="whitespace-nowrap">{item.label}</span>

							{isActive ? (
								sortDirection === "desc" ? (
									<ArrowDown className="w-3.5 h-3.5 ml-0.5 animate-in fade-in zoom-in-75 duration-200" />
								) : (
									<ArrowUp className="w-3.5 h-3.5 ml-0.5 animate-in fade-in zoom-in-75 duration-200" />
								)
							) : (
								<ArrowUpDown className="w-3 h-3 ml-0.5 opacity-30 group-hover:opacity-70" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
