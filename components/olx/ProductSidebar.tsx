"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Package,
  Coins,
  TrendingUp,
  Boxes,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Save,
  Loader2,
  DollarSign,
  ShoppingCart,
  Link2,
  Tag,
  Check,
  Search,
} from "lucide-react";
import type { ThreadItem } from "./ThreadList";

type ProductSidebarProps = {
  thread: ThreadItem | null;
  onThreadUpdated: () => void;
  globalRate?: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  images: string[];
  variants: Array<{
    id: string;
    priceCNY: number;
    priceInUA?: number | null;
    rateCNY?: number | null;
    purchasedCount?: number | null;
    sellsCount?: number | null;
    shippingUA?: number | null;
    managementUAH?: number | null;
  }>;
};

export function ProductSidebar({
  thread,
  onThreadUpdated,
  globalRate = 5.8,
}: ProductSidebarProps) {
  const [buyerNotes, setBuyerNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Состояние модалки продажи
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleNote, setSaleNote] = useState("");
  const [isRegisteringSale, setIsRegisteringSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);

  useEffect(() => {
    if (thread) {
      setBuyerNotes(thread.buyerNotes || "");
    }
  }, [thread?.id, thread?.buyerNotes]);

  // Загрузка каталога для выбора привязки
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCatalog(data);
        }
      } catch (e) {
        console.error("Failed to fetch products for linking:", e);
      }
    };
    fetchCatalog();
  }, []);

  const handleSaveNotes = async () => {
    if (!thread) return;
    setIsSavingNotes(true);
    try {
      await fetch(`/api/olx/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerNotes }),
      });
      onThreadUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleLinkProduct = async (productId: string, variantId?: string) => {
    if (!thread) return;
    try {
      await fetch(`/api/olx/threads/${thread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedProductId: productId,
          linkedVariantId: variantId || null,
        }),
      });
      setIsLinkModalOpen(false);
      onThreadUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const openSaleModal = () => {
    if (!thread) return;
    const defaultPrice =
      thread.linkedVariant?.priceInUA ||
      thread.advertPrice ||
      (thread.linkedProduct as any)?.variants?.[0]?.priceInUA ||
      0;
    setSaleAmount(Number(defaultPrice) || 0);
    setSaleQty(1);
    setSaleNote(thread.interlocutorName ? `Покупатель: ${thread.interlocutorName}` : "");
    setSaleSuccess(false);
    setIsSaleModalOpen(true);
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !thread.linkedProduct?.id) return;

    setIsRegisteringSale(true);
    try {
      const res = await fetch("/api/olx/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          productId: thread.linkedProduct.id,
          variantId: thread.linkedVariant?.id || (thread.linkedProduct as any)?.variants?.[0]?.id,
          amount: Number(saleAmount),
          quantity: Number(saleQty),
          note: saleNote,
        }),
      });

      if (res.ok) {
        setSaleSuccess(true);
        onThreadUpdated();
        setTimeout(() => {
          setIsSaleModalOpen(false);
          setSaleSuccess(false);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegisteringSale(false);
    }
  };

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card/60 rounded-2xl border border-border/40 p-6 text-center backdrop-blur-md shadow-lg">
        <Package className="w-10 h-10 opacity-20 mb-2" />
        <p className="text-xs font-semibold text-muted-foreground">
          Информация о товаре и сделке
        </p>
      </div>
    );
  }

  // Расчет себестоимости и маржи
  const linkedProduct = thread.linkedProduct as any;
  const variant = thread.linkedVariant || linkedProduct?.variants?.[0];
  const rateCNY = variant?.rateCNY || globalRate || 5.8;
  const costCNY = variant?.priceCNY || 0;
  const shippingUA = variant?.shippingUA || 0;
  const managementUA = variant?.managementUAH || 0;
  const totalCostUAH = Math.round(costCNY * rateCNY + shippingUA + managementUA);

  const sellingPriceUAH = thread.advertPrice || variant?.priceInUA || 0;
  const netProfitUAH = Math.round(sellingPriceUAH - totalCostUAH);
  const profitMargin = sellingPriceUAH > 0 ? Math.round((netProfitUAH / sellingPriceUAH) * 100) : 0;

  const purchasedCount = variant?.purchasedCount || 0;
  const sellsCount = variant?.sellsCount || 0;
  const inStock = Math.max(0, purchasedCount - sellsCount);

  return (
    <div className="flex flex-col h-full bg-card/60 rounded-2xl border border-border/40 overflow-hidden shadow-lg backdrop-blur-md">
      <div className="p-3.5 border-b border-border/30 bg-card/80 flex items-center justify-between">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" /> Сделка и Склад
        </h3>
        {linkedProduct && (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-0 px-1.5">
            Товар привязан
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Карточка объявления OLX */}
        <div className="p-3.5 rounded-2xl bg-foreground/5 border border-border/30 space-y-2.5">
          <div className="flex items-start gap-3">
            {thread.advertImage ? (
              <img
                src={thread.advertImage}
                alt=""
                className="w-14 h-14 object-cover rounded-xl border border-border/40 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Объявление на OLX
              </span>
              <h4 className="font-bold text-xs text-foreground line-clamp-2 leading-snug mt-0.5">
                {thread.advertTitle || "Без названия"}
              </h4>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-black text-foreground">
                  {thread.advertPrice ? `${thread.advertPrice} ₴` : "Цена не указана"}
                </span>
                {thread.advertUrl && (
                  <a
                    href={thread.advertUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
                  >
                    OLX.ua <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Склад и Финансы */}
        {linkedProduct ? (
          <div className="p-3.5 rounded-2xl bg-foreground/5 border border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Товар на складе
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLinkModalOpen(true)}
                className="h-6 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/10 gap-1"
              >
                <Link2 className="w-3 h-3" /> Сменить
              </Button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-foreground/10 shrink-0">
                <img
                  src={linkedProduct.images?.[0] || "https://placehold.co/100x100?text=No+Img"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-foreground truncate">{linkedProduct.name}</h5>
                <span className="text-[10px] text-muted-foreground">ID: {linkedProduct.id.slice(0, 8)}</span>
              </div>
            </div>

            {/* Метрики маржинальности и остатков */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/20">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                  <Boxes className="w-3 h-3 text-primary" /> Остаток
                </div>
                <div className="text-base font-black text-foreground mt-0.5">
                  <span className={inStock > 3 ? "text-emerald-500" : inStock > 0 ? "text-amber-500" : "text-destructive"}>
                    {inStock} шт
                  </span>
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">
                    (из {purchasedCount})
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/50 border border-border/20">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> Чистая прибыль
                </div>
                <div className="text-base font-black text-emerald-500 mt-0.5">
                  +{netProfitUAH} ₴
                  <span className="text-[10px] text-muted-foreground font-normal ml-1">
                    ({profitMargin}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] space-y-1 text-muted-foreground pt-1 border-t border-border/20">
              <div className="flex justify-between">
                <span>Себестоимость (закупка + дост.):</span>
                <span className="font-bold text-foreground">{totalCostUAH} ₴</span>
              </div>
              <div className="flex justify-between">
                <span>Розничная цена:</span>
                <span className="font-bold text-foreground">{sellingPriceUAH} ₴</span>
              </div>
            </div>

            {/* Главная кнопка: Оформить продажу */}
            <Button
              onClick={openSaleModal}
              className="w-full font-black rounded-xl h-10 shadow-lg shadow-primary/20 gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs"
            >
              <ShoppingCart className="w-4 h-4" /> Оформить продажу (1 клик)
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-border/60 text-center space-y-2">
            <Package className="w-8 h-8 mx-auto opacity-30 text-primary" />
            <p className="text-xs font-bold text-foreground">Товар склада не привязан</p>
            <p className="text-[10px] text-muted-foreground">
              Привяжите товар из вашего каталога, чтобы видеть себестоимость, остатки и списывать продажи в 1 клик
            </p>
            <Button
              size="sm"
              onClick={() => setIsLinkModalOpen(true)}
              className="font-bold rounded-xl text-xs gap-1.5 mt-1"
            >
              <Link2 className="w-3.5 h-3.5" /> Выбрать товар из базы
            </Button>
          </div>
        )}

        {/* Заметки о покупателе */}
        <div className="p-3.5 rounded-2xl bg-foreground/5 border border-border/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Заметки о клиенте
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 gap-1"
            >
              {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Сохранить
            </Button>
          </div>

          <Textarea
            placeholder="Город, отделение Новой Почты, телефон, договоренности..."
            value={buyerNotes}
            onChange={(e) => setBuyerNotes(e.target.value)}
            rows={3}
            className="text-xs bg-background/50 border-none resize-none rounded-xl"
          />
        </div>
      </div>

      {/* Модалка выбора товара из каталога */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/60 shadow-2xl p-5 sm:p-7 rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground tracking-tight">Привязать товар из каталога</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Выберите товар для диалога &quot;{thread.advertTitle}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Поиск по названию товара..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9 text-xs bg-muted/40 border-border/60 rounded-xl"
            />
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {catalog
              .filter((p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
              .map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleLinkProduct(prod.id, prod.variants[0]?.id)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.images?.[0] || "https://placehold.co/80x80"}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-foreground group-hover:text-primary truncate">
                        {prod.name}
                      </h5>
                      <span className="text-[10px] text-muted-foreground">
                        {prod.variants[0]?.priceInUA ? `${prod.variants[0].priceInUA} ₴` : "Без цены"}
                      </span>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" className="h-7 text-xs font-bold group-hover:text-primary">
                    Выбрать
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Модалка фиксации продажи */}
      <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/60 shadow-2xl p-5 sm:p-7 rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">Оформить продажу</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Создать запись дохода и списать единицу со склада
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {saleSuccess ? (
            <div className="py-8 text-center space-y-2 text-emerald-500">
              <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
              <h4 className="font-black text-base">Продажа успешно зафиксирована!</h4>
              <p className="text-xs text-muted-foreground">
                Доход добавлен в статистику, остаток на складе обновлен
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirmSale} className="space-y-4 my-2">
              <div className="p-3 rounded-xl bg-foreground/5 text-xs space-y-1">
                <div className="text-muted-foreground">Товар:</div>
                <div className="font-bold text-foreground truncate">{linkedProduct?.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Сумма продажи (₴)</label>
                  <Input
                    type="number"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(Number(e.target.value))}
                    className="bg-foreground/5 font-black text-base"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">Количество (шт)</label>
                  <Input
                    type="number"
                    min={1}
                    value={saleQty}
                    onChange={(e) => setSaleQty(Number(e.target.value))}
                    className="bg-foreground/5 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold">Примечание к сделке (опционально)</label>
                <Input
                  placeholder="например: OLX Доставка Новая Почта"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  className="bg-foreground/5 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isRegisteringSale}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20 gap-2 mt-2"
              >
                {isRegisteringSale ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Зафиксировать доход ({saleAmount * saleQty} ₴)
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
