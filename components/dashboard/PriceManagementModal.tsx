"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	X,
	Search,
	FolderOpen,
	TrendingUp,
	TrendingDown,
	Coins,
	Save,
	RotateCcw,
	Loader2,
	Check,
	Layers,
	Sparkles,
	ExternalLink,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductUI, ProductVariantUI } from "./ProductCard";

type VariantDraft = {
	priceCNY: number;
	priceInUA: number | null;
	netPrice: number | null;
	purchasedCount: number;
	sellsCount: number;
	shippingUA?: number | null;
	managementUAH?: number | null;
	rateCNY?: number | null;
};

type PriceManagementModalProps = {
	isOpen: boolean;
	onClose: () => void;
	products: ProductUI[];
	globalRate?: number;
	folders?: { id: string; name: string }[];
	currentFolderId?: string | null;
	onSaveSuccess: (
		updatedVariants: Array<{
			productId: string | number;
			variant: ProductVariantUI;
		}>,
	) => void;
};

export function PriceManagementModal({
	isOpen,
	onClose,
	products,
	globalRate = 5.9,
	folders = [],
	currentFolderId = null,
	onSaveSuccess,
}: PriceManagementModalProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFolder, setSelectedFolder] = useState<string | null>(
		currentFolderId,
	);
	const [onlyChanged, setOnlyChanged] = useState(false);
	const [drafts, setDrafts] = useState<Record<string, VariantDraft>>({});
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
		null,
	);

	// Initialize and sync folder
	useEffect(() => {
		setSelectedFolder(currentFolderId);
	}, [currentFolderId]);

	// Handle ESC key to close
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isSaving) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, isSaving, onClose]);

	// Touch drag-to-close handling for iOS feel
	const touchStartY = useRef<number | null>(null);
	const [dragY, setDragY] = useState(0);

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartY.current = e.touches[0].clientY;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (touchStartY.current === null) return;
		const dy = e.touches[0].clientY - touchStartY.current;
		if (dy > 0) {
			setDragY(dy);
		}
	};

	const handleTouchEnd = () => {
		if (dragY > 120) {
			onClose();
		}
		setDragY(0);
		touchStartY.current = null;
	};

	// Helper to calculate auto netPrice (standard 3% + 30 UAH OLX / commission formula)
	const calcNetPrice = (
		sellPrice: number | null | undefined,
	): number | null => {
		if (sellPrice === null || sellPrice === undefined || sellPrice <= 0)
			return null;
		return Math.round((sellPrice * 0.97 - 30) * 100) / 100;
	};

	// Get current variant values (draft or original)
	const getVariantData = useCallback(
		(variant: ProductVariantUI, fallbackProduct: ProductUI) => {
			const variantKey = variant.id || `${fallbackProduct.id}-default`;
			const draft = drafts[variantKey];

			const priceCNY = draft ? draft.priceCNY : variant.priceCNY || 0;
			const priceInUA = draft ? draft.priceInUA : (variant.priceInUA ?? null);
			const netPrice = draft
				? draft.netPrice
				: (variant.netPrice ?? calcNetPrice(priceInUA));
			const purchasedCount = draft
				? draft.purchasedCount
				: (variant.purchasedCount ?? fallbackProduct.totalPurchased ?? 0);
			const sellsCount = draft
				? draft.sellsCount
				: (variant.sellsCount ?? fallbackProduct.sellsCount ?? 0);

			const rateCNY = variant.rateCNY || fallbackProduct.rateCNY || globalRate;
			const shippingUA = Number(variant.shippingUA) || 0;
			const managementUAH = Number(variant.managementUAH) || 0;

			const unitShippingUAH =
				purchasedCount > 0
					? shippingUA / purchasedCount
					: Number(variant.weight || 0) > 0 &&
						  Number(variant.rateUSD || fallbackProduct.rateUSD || 0) > 0
						? (Number(variant.weight) / 1000) *
						  (variant.shippingType === "sea"
								? 7.1
								: variant.shippingType === "custom"
									? variant.customShippingRate || 0
									: 18.3) *
						  Number(variant.rateUSD || fallbackProduct.rateUSD || 0)
						: 0;
			const unitManagementUAH =
				purchasedCount > 0 ? managementUAH / purchasedCount : 0;

			const unitCostUAH =
				priceCNY * (rateCNY > 0 ? rateCNY : 1) +
				unitShippingUAH +
				unitManagementUAH;
			const actualNetPrice = netPrice ?? calcNetPrice(priceInUA) ?? 0;
			const unitMarginUAH =
				actualNetPrice > 0 ? actualNetPrice - unitCostUAH : 0;
			const totalSpent =
				priceCNY * (rateCNY > 0 ? rateCNY : 1) * purchasedCount +
				shippingUA +
				managementUAH;
			const totalProjectedRevenue = actualNetPrice * purchasedCount;
			const totalProjectedProfit = totalProjectedRevenue - totalSpent;

			const isDirty = Boolean(draft);

			return {
				variantKey,
				priceCNY,
				priceInUA,
				netPrice,
				purchasedCount,
				sellsCount,
				rateCNY,
				shippingUA,
				managementUAH,
				unitCostUAH,
				actualNetPrice,
				unitMarginUAH,
				totalSpent,
				totalProjectedRevenue,
				totalProjectedProfit,
				isDirty,
			};
		},
		[drafts, globalRate],
	);

	// Update a single variant draft
	const handleUpdateDraft = (
		variant: ProductVariantUI,
		fallbackProduct: ProductUI,
		field: keyof VariantDraft,
		value: number | null,
	) => {
		const variantKey = variant.id || `${fallbackProduct.id}-default`;
		const origPriceCNY = variant.priceCNY || 0;
		const origPriceInUA = variant.priceInUA ?? null;
		const origNetPrice = variant.netPrice ?? calcNetPrice(origPriceInUA);
		const origPurchasedCount =
			variant.purchasedCount ?? fallbackProduct.totalPurchased ?? 0;
		const origSellsCount =
			variant.sellsCount ?? fallbackProduct.sellsCount ?? 0;

		const currentDraft: VariantDraft = drafts[variantKey] || {
			priceCNY: origPriceCNY,
			priceInUA: origPriceInUA,
			netPrice: origNetPrice,
			purchasedCount: origPurchasedCount,
			sellsCount: origSellsCount,
			shippingUA: variant.shippingUA,
			managementUAH: variant.managementUAH,
			rateCNY: variant.rateCNY,
		};

		const updatedDraft: VariantDraft = {
			...currentDraft,
			[field]: value,
		};

		// Auto update net price if selling price was changed and netPrice wasn't manually customized
		if (field === "priceInUA") {
			updatedDraft.netPrice = calcNetPrice(value);
		}

		// Check if this matches original values
		const isSameAsOriginal =
			updatedDraft.priceCNY === origPriceCNY &&
			updatedDraft.priceInUA === origPriceInUA &&
			updatedDraft.netPrice === origNetPrice &&
			updatedDraft.purchasedCount === origPurchasedCount &&
			updatedDraft.sellsCount === origSellsCount;

		setDrafts((prev) => {
			const next = { ...prev };
			if (isSameAsOriginal) {
				delete next[variantKey];
			} else {
				next[variantKey] = updatedDraft;
			}
			return next;
		});
	};

	// Revert a single variant draft
	const handleRevertVariant = (variantKey: string) => {
		setDrafts((prev) => {
			const next = { ...prev };
			delete next[variantKey];
			return next;
		});
	};

	// Revert all changes
	const handleRevertAll = () => {
		setDrafts({});
	};

	// Filter products and variants
	const filteredProducts = useMemo(() => {
		return products.filter((p) => {
			// Folder filter
			if (selectedFolder !== null && p.folderId !== selectedFolder) {
				return false;
			}

			// Search query filter
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchesName = p.name?.toLowerCase().includes(q);
				const matchesFolder = p.folderName?.toLowerCase().includes(q);
				const matchesVariant = p.variantsList?.some((v) =>
					v.pddSearchQuery?.toLowerCase().includes(q),
				);
				if (!matchesName && !matchesFolder && !matchesVariant) return false;
			}

			// Only changed filter
			if (onlyChanged) {
				const hasDirty = (
					p.variantsList && p.variantsList.length > 0
						? p.variantsList
						: [{ id: undefined, priceCNY: p.priceCNY }]
				).some((v) => {
					const key = v.id || `${p.id}-default`;
					return Boolean(drafts[key]);
				});
				if (!hasDirty) return false;
			}

			return true;
		});
	}, [products, selectedFolder, searchQuery, onlyChanged, drafts]);

	// Total summary of all items in modal
	const globalModalStats = useMemo(() => {
		let totalInvested = 0;
		let totalProjectedRev = 0;
		let totalUnits = 0;
		let totalSold = 0;
		let changedVariantsCount = Object.keys(drafts).length;

		products.forEach((p) => {
			const variants =
				p.variantsList && p.variantsList.length > 0
					? p.variantsList
					: [{ id: undefined, priceCNY: p.priceCNY }];
			variants.forEach((v) => {
				const d = getVariantData(v, p);
				totalInvested += d.totalSpent;
				totalProjectedRev += d.totalProjectedRevenue;
				totalUnits += d.purchasedCount;
				totalSold += d.sellsCount;
			});
		});

		const totalProjectedMargin = totalProjectedRev - totalInvested;

		return {
			totalInvested,
			totalProjectedRev,
			totalProjectedMargin,
			totalUnits,
			totalSold,
			changedVariantsCount,
		};
	}, [products, drafts, getVariantData]);

	// Bulk save changes to backend in a single transaction
	const handleSaveAll = async () => {
		const changedKeys = Object.keys(drafts);
		if (changedKeys.length === 0) return;

		setIsSaving(true);
		setSaveSuccessMessage(null);

		try {
			const updatesPayload: Array<{
				id: string;
				priceCNY: number;
				priceInUA: number | null;
				netPrice: number | null;
				purchasedCount: number;
				sellsCount: number;
			}> = [];

			const optimisticUpdates: Array<{
				productId: string | number;
				variant: ProductVariantUI;
			}> = [];

			for (const p of products) {
				const variants =
					p.variantsList && p.variantsList.length > 0 ? p.variantsList : [];
				for (const v of variants) {
					if (!v.id) continue;
					const draft = drafts[v.id];
					if (draft) {
						updatesPayload.push({
							id: v.id,
							priceCNY: Number(draft.priceCNY) || 0,
							priceInUA:
								draft.priceInUA !== null ? Number(draft.priceInUA) : null,
							netPrice: draft.netPrice !== null ? Number(draft.netPrice) : null,
							purchasedCount: Number(draft.purchasedCount) || 0,
							sellsCount: Number(draft.sellsCount) || 0,
						});

						optimisticUpdates.push({
							productId: p.id,
							variant: {
								...v,
								priceCNY: Number(draft.priceCNY) || 0,
								priceInUA:
									draft.priceInUA !== null ? Number(draft.priceInUA) : null,
								netPrice:
									draft.netPrice !== null ? Number(draft.netPrice) : null,
								purchasedCount: Number(draft.purchasedCount) || 0,
								sellsCount: Number(draft.sellsCount) || 0,
							},
						});
					}
				}
			}

			if (updatesPayload.length === 0) {
				setIsSaving(false);
				return;
			}

			const res = await fetch("/api/variants/bulk-update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ updates: updatesPayload }),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Ошибка сохранения цен");
			}

			const data = await res.json();
			setDrafts({});
			setSaveSuccessMessage(`Успешно сохранено ${data.updatedCount} позиций!`);
			onSaveSuccess(optimisticUpdates);

			setTimeout(() => {
				setSaveSuccessMessage(null);
			}, 3000);
		} catch (e) {
			console.error(e);
			alert(e instanceof Error ? e.message : "Не удалось сохранить цены");
		} finally {
			setIsSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
			onClick={() => {
				if (!isSaving) onClose();
			}}
		>
			<div
				className="w-full max-h-[92vh] sm:max-h-[88vh] sm:max-w-4xl bg-background/95 border-t sm:border border-white/15 rounded-t-4xl sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-transform duration-150 animate-in slide-in-from-bottom"
				style={{
					transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* iOS Grabber Pill for mobile touch gesture */}
				<div
					className="w-full pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing sm:hidden"
					onTouchStart={handleTouchStart}
					onTouchMove={handleTouchMove}
					onTouchEnd={handleTouchEnd}
				>
					<div className="w-12 h-1.5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
				</div>

				{/* Modal Header */}
				<div className="px-4 sm:px-6 py-3.5 border-b border-border/40 flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2.5">
							<div className="p-2 rounded-xl bg-primary/10 text-primary">
								<Coins className="w-5 h-5" />
							</div>
							<div>
								<h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
									Управление ценами
									{globalModalStats.changedVariantsCount > 0 && (
										<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse">
											{globalModalStats.changedVariantsCount} не сохранено
										</span>
									)}
								</h2>
								<p className="text-[11px] text-muted-foreground font-medium">
									Закупка (CNY) и продажа (UAH) с авто-расчетом маржи
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{globalModalStats.changedVariantsCount > 0 && (
								<Button
									size="sm"
									variant="outline"
									onClick={handleRevertAll}
									disabled={isSaving}
									className="rounded-xl text-xs font-bold gap-1.5 h-8 sm:h-9 hover:bg-destructive/10 hover:text-destructive border-border/60"
									title="Отменить все несохраненные изменения"
								>
									<RotateCcw className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Сбросить</span>
								</Button>
							)}

							<Button
								size="sm"
								onClick={handleSaveAll}
								disabled={
									isSaving || globalModalStats.changedVariantsCount === 0
								}
								className="rounded-xl text-xs font-black gap-1.5 h-8 sm:h-9 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:scale-102 active:scale-98 transition-all"
							>
								{isSaving ? (
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										Сохранение...
									</>
								) : (
									<>
										<Save className="w-3.5 h-3.5" />
										Сохранить ({globalModalStats.changedVariantsCount})
									</>
								)}
							</Button>

							<button
								onClick={onClose}
								disabled={isSaving}
								className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
								title="Закрыть"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Success Message Banner */}
					{saveSuccessMessage && (
						<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
							<Check className="w-4 h-4 shrink-0" />
							{saveSuccessMessage}
						</div>
					)}

					{/* Global Quick Stats Pill */}
					<div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-foreground/3 border border-foreground/5 text-center">
						<div className="space-y-0.5">
							<span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-center gap-1">
								<TrendingDown className="w-3 h-3 text-red-500" />
								Закупка
							</span>
							<p className="text-xs sm:text-sm font-black text-foreground">
								{globalModalStats.totalInvested.toLocaleString("ru-RU", {
									maximumFractionDigits: 0,
								})}{" "}
								<span className="text-[10px] opacity-70">₴</span>
							</p>
						</div>

						<div className="space-y-0.5 border-x border-foreground/10 px-1">
							<span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-center gap-1">
								<TrendingUp className="w-3 h-3 text-green-500" />
								Продажа
							</span>
							<p className="text-xs sm:text-sm font-black text-foreground">
								{globalModalStats.totalProjectedRev.toLocaleString("ru-RU", {
									maximumFractionDigits: 0,
								})}{" "}
								<span className="text-[10px] opacity-70">₴</span>
							</p>
						</div>

						<div className="space-y-0.5">
							<span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-center gap-1">
								<Sparkles className="w-3 h-3 text-primary" />
								Прогноз маржи
							</span>
							<p
								className={`text-xs sm:text-sm font-black ${
									globalModalStats.totalProjectedMargin >= 0
										? "text-primary"
										: "text-destructive"
								}`}
							>
								{globalModalStats.totalProjectedMargin >= 0 ? "+" : ""}
								{globalModalStats.totalProjectedMargin.toLocaleString("ru-RU", {
									maximumFractionDigits: 0,
								})}{" "}
								<span className="text-[10px] opacity-70">₴</span>
							</p>
						</div>
					</div>

					{/* Search & Filters */}
					<div className="flex flex-wrap items-center gap-2">
						<div className="flex-1 min-w-50 relative">
							<Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								placeholder="Поиск по названию товара..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-8 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							)}
						</div>

						{/* Folder Dropdown */}
						{folders.length > 0 && (
							<div className="flex items-center gap-1 bg-foreground/5 border border-foreground/10 rounded-xl px-2 py-1 text-xs">
								<FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
								<select
									value={selectedFolder || ""}
									onChange={(e) => setSelectedFolder(e.target.value || null)}
									className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
								>
									<option value="" className="bg-background text-foreground">
										Все папки
									</option>
									{folders.map((f) => (
										<option
											key={f.id}
											value={f.id}
											className="bg-background text-foreground"
										>
											{f.name}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Filter Toggle: Only Edited */}
						{globalModalStats.changedVariantsCount > 0 && (
							<button
								onClick={() => setOnlyChanged(!onlyChanged)}
								className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
									onlyChanged
										? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
										: "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
								}`}
							>
								<Filter className="w-3 h-3" />
								Только измененные ({globalModalStats.changedVariantsCount})
							</button>
						)}
					</div>
				</div>

				{/* Modal Body: Scrollable Product & Variant List */}
				<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 custom-scrollbar">
					{filteredProducts.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground text-sm font-medium">
							Товары не найдены
						</div>
					) : (
						filteredProducts.map((product) => {
							const variants =
								product.variantsList && product.variantsList.length > 0
									? product.variantsList
									: [{ id: undefined, priceCNY: product.priceCNY }];

							return (
								<div
									key={product.id}
									className="p-3.5 sm:p-4 rounded-2xl bg-foreground/2 hover:bg-foreground/4 border border-foreground/8 transition-all space-y-3"
								>
									{/* Product Header Row */}
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-3 min-w-0">
											<div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-muted/30 shrink-0 border border-foreground/10">
												<Image
													src={
														product.img ||
														"https://placehold.co/100x100?text=Item"
													}
													alt={product.name}
													fill
													sizes="44px"
													className="object-cover"
												/>
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<h3 className="text-xs sm:text-sm font-black text-foreground truncate">
														{product.name}
													</h3>
													{product.folderName && (
														<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
															{product.folderName}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
													<span>
														{variants.length}{" "}
														{variants.length === 1 ? "вариант" : "варианта"}
													</span>
													{product.archive ? (
														<span className="text-amber-500 font-bold">
															• Архив
														</span>
													) : null}
												</div>
											</div>
										</div>

										<Link
											href={`/product/${product.id}`}
											className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
											title="Открыть карточку товара"
										>
											<ExternalLink className="w-4 h-4" />
										</Link>
									</div>

									{/* Variants Grid / Rows */}
									<div className="space-y-2.5 pt-1">
										{variants.map((variant, vIdx) => {
											const data = getVariantData(variant, product);

											return (
												<div
													key={data.variantKey}
													className={`p-3 rounded-xl border transition-all ${
														data.isDirty
															? "bg-amber-500/4 border-amber-500/40 shadow-xs"
															: "bg-background/40 border-foreground/5"
													}`}
												>
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-2">
															{variants.length > 1 && (
																<span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-foreground/5 text-muted-foreground flex items-center gap-1">
																	<Layers className="w-2.5 h-2.5" />
																	Вариант {vIdx + 1}
																	{variant.pddSearchQuery &&
																		` (${variant.pddSearchQuery})`}
																</span>
															)}
															{data.isDirty && (
																<span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500">
																	Изменено
																</span>
															)}
														</div>

														{data.isDirty && (
															<button
																onClick={() =>
																	handleRevertVariant(data.variantKey)
																}
																className="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
															>
																<RotateCcw className="w-2.5 h-2.5" /> Сбросить
															</button>
														)}
													</div>

													{/* Editable Price Fields Grid */}
													<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
														{/* 1. Buy Price (CNY) */}
														<div className="space-y-1">
															<label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
																<span>Закупка (¥)</span>
																<span className="text-[9px] font-medium text-muted-foreground/70">
																	≈{data.unitCostUAH.toFixed(0)}₴
																</span>
															</label>
															<div className="relative">
																<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
																	¥
																</span>
																<input
																	type="number"
																	step="0.1"
																	min="0"
																	value={data.priceCNY || ""}
																	onChange={(e) =>
																		handleUpdateDraft(
																			variant,
																			product,
																			"priceCNY",
																			e.target.value === ""
																				? 0
																				: parseFloat(e.target.value),
																		)
																	}
																	className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
																/>
															</div>
														</div>

														{/* 2. Selling Price (UAH) */}
														<div className="space-y-1">
															<label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider flex items-center justify-between">
																<span>Продажа (₴)</span>
																{data.actualNetPrice > 0 && (
																	<span className="text-[9px] font-medium text-primary">
																		чист: {data.actualNetPrice.toFixed(0)}₴
																	</span>
																)}
															</label>
															<div className="relative">
																<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
																	₴
																</span>
																<input
																	type="number"
																	step="1"
																	min="0"
																	placeholder="0"
																	value={
																		data.priceInUA !== null
																			? data.priceInUA
																			: ""
																	}
																	onChange={(e) =>
																		handleUpdateDraft(
																			variant,
																			product,
																			"priceInUA",
																			e.target.value === ""
																				? null
																				: parseFloat(e.target.value),
																		)
																	}
																	className="w-full bg-foreground/5 border border-foreground/10 rounded-xl pl-6 pr-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
																/>
															</div>
														</div>

														{/* 3. Purchased Count (Шт) */}
														<div className="space-y-1">
															<label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
																Куплено (шт)
															</label>
															<input
																type="number"
																step="1"
																min="0"
																value={data.purchasedCount}
																onChange={(e) =>
																	handleUpdateDraft(
																		variant,
																		product,
																		"purchasedCount",
																		e.target.value === ""
																			? 0
																			: parseInt(e.target.value, 10),
																	)
																}
																className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
															/>
														</div>

														{/* 4. Sells Count (Шт) */}
														<div className="space-y-1">
															<label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
																Продано (шт)
															</label>
															<input
																type="number"
																step="1"
																min="0"
																value={data.sellsCount}
																onChange={(e) =>
																	handleUpdateDraft(
																		variant,
																		product,
																		"sellsCount",
																		e.target.value === ""
																			? 0
																			: parseInt(e.target.value, 10),
																	)
																}
																className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
															/>
														</div>
													</div>

													{/* Real-time Margins & Metrics Summary */}
													<div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-foreground/5 text-[10px] font-bold">
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">
																Маржа с 1 шт:
															</span>
															<span
																className={`px-1.5 py-0.5 rounded-md ${
																	data.unitMarginUAH > 0
																		? "bg-green-500/15 text-green-500"
																		: data.unitMarginUAH < 0
																			? "bg-red-500/15 text-red-500"
																			: "text-muted-foreground"
																}`}
															>
																{data.unitMarginUAH > 0 ? "+" : ""}
																{data.unitMarginUAH.toFixed(1)} ₴
															</span>
														</div>

														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">
																Прогноз прибыли:
															</span>
															<span
																className={
																	data.totalProjectedProfit >= 0
																		? "text-primary font-black"
																		: "text-destructive font-black"
																}
															>
																{data.totalProjectedProfit >= 0 ? "+" : ""}
																{data.totalProjectedProfit.toFixed(0)} ₴
															</span>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Modal Sticky Footer */}
				<div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-3">
					<div className="text-xs text-muted-foreground">
						{globalModalStats.changedVariantsCount > 0 ? (
							<span className="font-bold text-amber-500">
								{globalModalStats.changedVariantsCount}{" "}
								{globalModalStats.changedVariantsCount === 1
									? "изменение"
									: "изменений"}{" "}
								не сохранено
							</span>
						) : (
							<span>Все цены актуальны</span>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={onClose}
							disabled={isSaving}
							className="rounded-xl font-bold text-xs h-9 sm:h-10"
						>
							Закрыть
						</Button>
						<Button
							onClick={handleSaveAll}
							disabled={isSaving || globalModalStats.changedVariantsCount === 0}
							className="rounded-xl font-black text-xs h-9 sm:h-10 px-5 shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:scale-102 active:scale-98 transition-all"
						>
							{isSaving ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-1.5" />
									Сохранение...
								</>
							) : (
								<>
									<Save className="w-4 h-4 mr-1.5" />
									Сохранить ({globalModalStats.changedVariantsCount})
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
