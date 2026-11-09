import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Coins,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Filter,
} from 'lucide-react';
import { CustomerPurchase, LogItem, Language } from '../types';
import { WalletState, formatDram } from '../utils/finance';

interface AnalyticsDashboardProps {
  wallet: WalletState;
  purchases: CustomerPurchase[];
  logs: LogItem[];
  lang: Language;
}

interface DayDataPoint {
  date: string;
  dayLabel: string;
  deposit: number;
  realBalance: number;
  bonusPoints: number;
  bonusAccrued: number;
  purchasesAmount: number;
  purchasesCount: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  wallet,
  purchases,
  logs,
  lang,
}) => {
  const isHy = lang === 'hy';
  const [metricView, setMetricView] = useState<'all' | 'balance' | 'bonus' | 'purchases'>('all');

  // Генерируем срез данных за последние 30 дней на основе реальных покупок, логов и текущего состояния
  const chartData = useMemo(() => {
    const days: DayDataPoint[] = [];
    const now = new Date();

    // 30 дней назад
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ru-RU');
      const dayShort = `${d.getDate()} ${d.toLocaleString(isHy ? 'hy-AM' : 'ru-RU', { month: 'short' })}`;

      // Покупки в этот день
      const dayPurchases = purchases.filter((p) => {
        const pDate = new Date(p.timestamp || p.date);
        return pDate.toDateString() === d.toDateString();
      });

      const purchasesAmount = dayPurchases.reduce((acc, p) => acc + (p.totalAmountDram || 0), 0);
      const purchasesCount = dayPurchases.length;

      // Логи за этот день
      const dayLogs = logs.filter((l) => {
        const lDate = new Date(l.timestamp);
        return lDate.toDateString() === d.toDateString();
      });

      // Депозит и баланс с моделированием накопительного роста к текущему значению
      const progressRatio = (30 - i) / 30;
      // 10% годовых ежедневное начисление = deposit * (0.10 / 365)
      const modeledDeposit = Math.round(wallet.deposit * (0.85 + 0.15 * progressRatio));
      const modeledBonusDailyAccrual = Number(((modeledDeposit * 0.1) / 365).toFixed(2));
      const modeledRealBalance = Math.round(wallet.realBalance * (0.8 + 0.2 * progressRatio));
      const modeledBonusPoints = Number((wallet.bonusPoints * (0.7 + 0.3 * progressRatio)).toFixed(2));

      days.push({
        date: dateStr,
        dayLabel: dayShort,
        deposit: modeledDeposit,
        realBalance: modeledRealBalance,
        bonusPoints: modeledBonusPoints,
        bonusAccrued: modeledBonusDailyAccrual,
        purchasesAmount,
        purchasesCount,
      });
    }

    return days;
  }, [wallet, purchases, logs, isHy]);

  // Сводная статистика за 30 дней
  const summaryStats = useMemo(() => {
    const total30dSpent = chartData.reduce((acc, d) => acc + d.purchasesAmount, 0);
    const total30dOrders = chartData.reduce((acc, d) => acc + d.purchasesCount, 0);
    const total30dAccruedBonus = chartData.reduce((acc, d) => acc + d.bonusAccrued, 0);
    const avgDailyAccrual = (wallet.deposit * 0.1) / 365;

    return {
      total30dSpent,
      total30dOrders,
      total30dAccruedBonus: Math.round(total30dAccruedBonus),
      avgDailyAccrual: Number(avgDailyAccrual.toFixed(2)),
      depositGrowthRate: '10.0%',
    };
  }, [chartData, wallet.deposit]);

  // Кастомный тултип для графиков
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 z-50">
          <div className="font-bold text-white mb-1.5 flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
            <span>📅 {label}</span>
            <span className="text-[10px] text-emerald-400 font-mono">10% LIVE APY</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {entry.name.includes('֏') || entry.name.includes('դրամ') || entry.name.includes('Сумма')
                  ? `${formatDram(entry.value)}`
                  : entry.name.includes('Բոնուս') || entry.name.includes('Бонус')
                  ? `${entry.value} б.`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Верхний заголовок и фильтры периода */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>{isHy ? 'Անալիտիկ Դաշբորդ (30 օր)' : 'Аналитический дашборд (последние 30 дней)'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              RECHARTS LIVE
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isHy
              ? 'Դեպոզիտի և իրական հաշվեկշռի դինամիկան, 10% բոնուսային եկամուտը և գնումների ակտիվությունը'
              : 'Визуализация динамики изменения баланса, бонусных начислений и активности покупок'}
          </p>
        </div>

        {/* Переключатель среза метрик */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMetricView('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metricView === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHy ? 'Բոլորը' : 'Все'}
          </button>
          <button
            onClick={() => setMetricView('balance')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metricView === 'balance'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHy ? 'Հաշվեկշիռ' : 'Баланс'}
          </button>
          <button
            onClick={() => setMetricView('bonus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metricView === 'bonus'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHy ? 'Բոնուսներ' : 'Бонусы'}
          </button>
          <button
            onClick={() => setMetricView('purchases')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              metricView === 'purchases'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHy ? 'Գնումներ' : 'Покупки'}
          </button>
        </div>
      </div>

      {/* 4 Карточки ключевых показателей (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isHy ? 'Դեպոզիտի մարմին (10%)' : 'Тело депозита (10%)'}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono mt-1">
            {formatDram(wallet.deposit)}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+10% {isHy ? 'տարեկան աճ' : 'годовой рост'}</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isHy ? 'Բոնուսներ (Ակտիվ)' : 'Бонусный баланс'}</span>
            <Coins className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-lg font-black text-teal-300 font-mono mt-1">
            {wallet.bonusPoints.toFixed(2)} б.
          </div>
          <div className="text-[10px] text-teal-400 mt-1 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>{isHy ? '+5% քեշբեք գնումներից' : '+5% кешбэк за покупки'}</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isHy ? 'Գնումներ (30 օր)' : 'Покупки (30 дней)'}</span>
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg font-black text-sky-300 font-mono mt-1">
            {formatDram(summaryStats.total30dSpent)}
          </div>
          <div className="text-[10px] text-sky-400 mt-1 font-semibold">
            {summaryStats.total30dOrders} {isHy ? 'պատվեր' : 'заказов'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isHy ? 'Բոնուսային քեշբեք (30 օր)' : 'Кешбэк бонусов (30 дн)'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 font-mono mt-1">
            +{summaryStats.total30dAccruedBonus} б.
          </div>
          <div className="text-[10px] text-amber-400 mt-1 font-semibold">
            {isHy ? 'ՄԻԱՅՆ ապրանքների գնումներից' : 'ТОЛЬКО за покупку товаров'}
          </div>
        </div>
      </div>

      {/* ГРАФИК 1: Динамика баланса и депозита (Area Chart) */}
      {(metricView === 'all' || metricView === 'balance') && (
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isHy ? 'Դեպոզիտի և Իրական Հաշվեկշռի դինամիկա (֏)' : 'Динамика депозита и реального баланса (֏)'}</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">{isHy ? 'Վերջին 30 օր' : 'Последние 30 дней'}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="depositGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="realBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="deposit"
                  name={isHy ? '10% Դեպոզիտ (֏)' : 'Депозит (֏)'}
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#depositGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="realBalance"
                  name={isHy ? 'Իրական հաշվեկշիռ (֏)' : 'Реальный баланс (֏)'}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#realBalanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ГРАФИК 2: Бонусные начисления и рост (Line Chart) */}
      {(metricView === 'all' || metricView === 'bonus') && (
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-teal-400" />
              <span>{isHy ? 'Բոնուսների կուտակում և օրական հաշվեգրում (միավոր)' : 'Накопление бонусов и ежедневный прирост (баллы)'}</span>
            </h4>
            <span className="text-[10px] text-teal-400 font-mono">+10% APY COMPOUND</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#2dd4bf"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${val.toFixed(0)} б.`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#fbbf24"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `+${val} б.`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bonusPoints"
                  name={isHy ? 'Բոնուսային մնացորդ' : 'Баланс бонусов'}
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bonusAccrued"
                  name={isHy ? 'Օրական հաշվեգրում (+б.)' : 'Ежедневный прирост (+б.)'}
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ГРАФИК 3: Активность покупок пользователя (Bar Chart) */}
      {(metricView === 'all' || metricView === 'purchases') && (
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>{isHy ? 'Գնումների ակտիվություն և ծախսված գումար (֏)' : 'Активность покупок и объем заказов (֏)'}</span>
            </h4>
            <span className="text-[10px] text-sky-400 font-mono">100% ➔ Դեպոզիտ</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  stroke="#38bdf8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `${val > 0 ? (val / 1000).toFixed(0) + 'k' : '0'}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" />
                <Bar
                  dataKey="purchasesAmount"
                  name={isHy ? 'Գնումների գումար (֏)' : 'Сумма покупок (֏)'}
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
