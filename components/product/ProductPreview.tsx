"use client";

import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  ExternalLink,
  Package,
  TrendingUp,
  TrendingDown,
  Truck,
  Settings,
  Cpu,
  Weight,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

type ProductPreviewProps = {
  data: any;
  rates?: { cny?: number; usd?: number };
};

export function ProductPreview({ data, rates }: ProductPreviewProps) {
  const images: string[] = Array.isArray(data?.images)
    ? data.images.map((img: any) =>
        typeof img === "string" ? img : img?.url ?? "",
      ).filter(Boolean)
    : [];

  const rateCNY = data?.rateCNY || rates?.cny || 0;
  const rateUSD = data?.rateUSD || rates?.usd || 0;
  const priceCNY = Number(data?.priceCNY) || 0;
  const priceInUA = Number(data?.priceInUA) || 0;
  const purchased = Number(data?.purchasedCount) || 0;
  const sells = Number(data?.sellsCount) || 0;
  const shippingUA = Number(data?.shippingUA) || 0;
  const managementUAH = Number(data?.managementUAH) || 0;

  const purchaseUnitCostUAH = priceCNY * (rateCNY > 0 ? rateCNY : 1);
  const totalGoodsCost = purchased * purchaseUnitCostUAH;
  const computedIncome = sells * priceInUA;
  const totalCalculatedCosts = totalGoodsCost + shippingUA + managementUAH;
  const potentialTotalRevenue = purchased * priceInUA;
  const potentialProfit = potentialTotalRevenue - totalCalculatedCosts;
  const margin = computedIncome - totalCalculatedCosts;
  const remainingStock = purchased - sells;

  const shippingLabel =
    data?.shippingType === "sea"
      ? "Море (7.1$/кг)"
      : data?.shippingType === "custom"
        ? `Своя (${data?.customShippingRate || 0}$/кг)`
        : "Авиа (18.3$/кг)";

  const flags = [
    { key: "workModalWindowIOS", label: "Модальное окно iOS", value: data?.workModalWindowIOS },
    { key: "soundReducer", label: "Шумоподавление", value: data?.soundReducer },
    { key: "sensesOfEar", label: "Датчик уха", value: data?.sensesOfEar },
    { key: "wirelessCharger", label: "Беспроводная зарядка", value: data?.wirelessCharger },
    { key: "gyroscope", label: "Гироскоп", value: data?.gyroscope },
  ];

  const activeFlags = flags.filter((f) => f.value);

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${data?.name || "Product"} ${i + 1}`}
              className="h-48 w-48 object-cover rounded-xl border shadow-sm flex-shrink-0"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Доход (текущий)"
          value={`${computedIncome.toFixed(2)} ₴`}
          large
        />
        <StatCard
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          label="Расходы (всего)"
          value={`${totalCalculatedCosts.toFixed(2)} ₴`}
          large
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
          label="Продано / Куплено"
          value={`${sells} / ${purchased}`}
          large
        />
        <StatCard
          icon={<Package className="h-5 w-5 text-orange-500" />}
          label="Остаток на складе"
          value={`${remainingStock} шт`}
          large
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`p-5 border-2 ${potentialProfit >= 0 ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50/50 dark:bg-red-950/20"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Прогноз прибыли (если продать все {purchased} шт)
            </p>
          </div>
          <p
            className={`text-3xl font-bold ${potentialProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {potentialProfit >= 0 ? "+" : ""}
            {potentialProfit.toFixed(2)} ₴
          </p>
        </Card>
        <Card
          className={`p-5 border-2 ${margin >= 0 ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50/50 dark:bg-red-950/20"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Маржа ({sells} из {purchased} шт)
            </p>
          </div>
          <p
            className={`text-3xl font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {margin >= 0 ? "+" : ""}
            {margin.toFixed(2)} ₴
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Цены и курсы
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
          <InfoRow label="Цена закупки" value={`${priceCNY} ¥`} />
          <InfoRow
            label="Закупка в ₴"
            value={`${purchaseUnitCostUAH.toFixed(2)} ₴`}
          />
          <InfoRow label="Цена продажи" value={`${priceInUA} ₴`} />
          <InfoRow
            label="Сумма закупки"
            value={`${totalGoodsCost.toFixed(2)} ₴`}
            sub={`${purchased} шт`}
          />
          <InfoRow
            label="Курс CNY"
            value={rateCNY > 0 ? rateCNY.toFixed(4) : "—"}
          />
          <InfoRow
            label="Курс USD"
            value={rateUSD > 0 ? rateUSD.toFixed(4) : "—"}
          />
          <InfoRow
            label="Доставка"
            value={`${shippingUA.toFixed(2)} ₴`}
            sub={shippingLabel}
          />
          <InfoRow
            label="Управление"
            value={`${managementUAH.toFixed(2)} ₴`}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Характеристики
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
          {data?.chip && (
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Чип</p>
                <p className="font-medium">{data.chip}</p>
              </div>
            </div>
          )}
          {data?.weight && (
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Вес</p>
                <p className="font-medium">{data.weight} г</p>
              </div>
            </div>
          )}
          {data?.equipment && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Комплектация</p>
                <p className="font-medium">{data.equipment}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Тип доставки</p>
              <p className="font-medium">{shippingLabel}</p>
            </div>
          </div>
        </div>
      </Card>

      {activeFlags.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Функции
          </h3>
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <span
                key={flag.key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  flag.value
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {flag.value ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                {flag.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      {(data?.olxUrl || data?.pinduoduoUrl) && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ссылки
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            {data?.olxUrl && (
              <a
                href={data.olxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                OLX
              </a>
            )}
            {data?.pinduoduoUrl && (
              <a
                href={data.pinduoduoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Pinduoduo
              </a>
            )}
          </div>
        </Card>
      )}

      {data?.folder && (
        <div className="text-sm text-muted-foreground">
          Папка: <span className="font-medium text-foreground">{data.folder.name}</span>
        </div>
      )}

      {data?.expenses && data.expenses.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Детальные расходы
          </h3>
          <div className="space-y-2">
            {data.expenses.map((exp: any, i: number) => (
              <div
                key={exp.id || i}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{exp.type || "Без типа"}</span>
                <span className="font-semibold">{Number(exp.amount).toFixed(2)} ₴</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  large,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`font-bold ${large ? "text-xl sm:text-2xl" : "text-lg"}`}>
        {value}
      </p>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
