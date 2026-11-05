import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Eye, Calendar, ArrowUpRight, Activity, Globe } from 'lucide-react';
import { SiteAnalytics, getSaoPauloDateKeyClient } from '../lib/db';

interface SiteVisitsAnalyticsProps {
  analytics: SiteAnalytics;
}

interface CompactBannerProps {
  analytics: SiteAnalytics;
  onOpenFullReport: () => void;
}

type PeriodFilter = 'today' | '7d' | '28d' | '90d';

const WEEKDAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SHORT_WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildDateList(daysCount: number, endDateKey: string): string[] {
  const [y, m, d] = endDateKey.split('-').map(Number);
  const baseDate = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1, 12, 0, 0));
  const result: string[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const dt = new Date(baseDate.getTime() - i * 86400000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    result.push(`${yy}-${mm}-${dd}`);
  }
  return result;
}

function formatDateBr(dateKey: string): { short: string; full: string; weekday: string; shortWeekday: string } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1, 12, 0, 0));
  const dayIdx = dt.getUTCDay();
  const dd = String(d || 1).padStart(2, '0');
  const mm = String(m || 1).padStart(2, '0');
  return {
    short: `${dd}/${mm}`,
    full: `${dd}/${mm}/${y}`,
    weekday: WEEKDAY_NAMES[dayIdx] || '',
    shortWeekday: SHORT_WEEKDAY[dayIdx] || '',
  };
}

export function SiteVisitsCompactBanner({ analytics, onOpenFullReport }: CompactBannerProps) {
  const todayKey = analytics.todayKey || getSaoPauloDateKeyClient().dateKey;
  const dailyMap = analytics.dailyVisits || {};
  const todayVisits = Number(dailyMap[todayKey]) || 0;

  // Calcula média diária dos dias ativos (com pelo menos 1 registro ou desde o primeiro dia registrado)
  const { dailyAverage, activeDaysCount, totalAllTime } = useMemo(() => {
    const entries = Object.entries(dailyMap).filter(([, count]) => Number(count) > 0);
    const sumDaily = entries.reduce((acc, [, c]) => acc + (Number(c) || 0), 0);
    const total = Math.max(Number(analytics.totalVisits) || 0, sumDaily);
    const days = Math.max(1, entries.length);
    const avg = total / days;
    return {
      dailyAverage: avg,
      activeDaysCount: days,
      totalAllTime: total,
    };
  }, [analytics, dailyMap]);

  return (
    <div className="mb-5 bg-white rounded-xl border border-stone-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a73e8]/10 border border-[#1a73e8]/25 text-[#1a73e8] flex items-center justify-center shrink-0">
          <BarChart3 size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-stone-900">
              Tráfego do Site (Estilo Google Search Console)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">
            Contabiliza quando a pessoa entra no site (sem contar recarregamentos de página)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div className="px-3 py-1.5 rounded-lg bg-[#9334e6]/5 border border-[#9334e6]/20">
          <span className="text-[10px] font-bold uppercase text-[#9334e6] block">
            Média Diária de Visitas
          </span>
          <span className="text-base font-black text-stone-900">
            {dailyAverage % 1 === 0 ? dailyAverage.toFixed(0) : dailyAverage.toFixed(1).replace('.', ',')}{' '}
            <span className="text-[11px] font-semibold text-stone-500">/ dia</span>
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-[#1e8e3e]/5 border border-[#1e8e3e]/20">
          <span className="text-[10px] font-bold uppercase text-[#1e8e3e] block">
            Visitas Hoje
          </span>
          <span className="text-base font-black text-stone-900">
            {todayVisits}{' '}
            <span className="text-[11px] font-semibold text-stone-500">acessos</span>
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-[#1a73e8]/5 border border-[#1a73e8]/20">
          <span className="text-[10px] font-bold uppercase text-[#1a73e8] block">
            Total Acumulado ({activeDaysCount} {activeDaysCount === 1 ? 'dia' : 'dias'})
          </span>
          <span className="text-base font-black text-stone-900">
            {totalAllTime}{' '}
            <span className="text-[11px] font-semibold text-stone-500">visitas</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenFullReport}
          className="px-3.5 py-2 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <span>Ver Gráfico Search Console</span>
          <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function SiteVisitsAnalytics({ analytics }: SiteVisitsAnalyticsProps) {
  const [period, setPeriod] = useState<PeriodFilter>('28d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [onlyDaysWithVisits, setOnlyDaysWithVisits] = useState<boolean>(false);

  const todayKey = analytics.todayKey || getSaoPauloDateKeyClient().dateKey;
  const dailyMap = analytics.dailyVisits || {};
  const hourlyMap = analytics.hourlyVisits?.[todayKey] || {};

  // Dados calculados de acordo com o período selecionado
  const stats = useMemo(() => {
    const daysCount = period === '7d' ? 7 : period === '28d' ? 28 : period === '90d' ? 90 : 1;
    const dateKeys = buildDateList(daysCount, todayKey);

    const series = dateKeys.map((dk) => {
      const count = Number(dailyMap[dk]) || 0;
      const formatted = formatDateBr(dk);
      return {
        key: dk,
        label: formatted.short,
        fullLabel: `${formatted.weekday}, ${formatted.full}`,
        shortWeekday: formatted.shortWeekday,
        count,
      };
    });

    // Série horária para quando o filtro "Hoje (24h)" está ativo
    const hourlySeries = Array.from({ length: 24 }, (_, h) => {
      const hk = String(h).padStart(2, '0');
      const count = Number(hourlyMap[hk]) || 0;
      return {
        key: hk,
        label: `${hk}:00`,
        fullLabel: `Hoje às ${hk}:00h`,
        shortWeekday: 'Hoje',
        count,
      };
    });

    const periodTotal = series.reduce((acc, item) => acc + item.count, 0);
    const activeDaysInPeriod = series.filter((item) => item.count > 0).length;

    // Média diária considerando os dias desde o início da contabilização no período (para não distorcer com zeros anteriores ao sistema)
    const firstActiveIdx = series.findIndex((item) => item.count > 0);
    const daysSinceFirstVisitInPeriod =
      firstActiveIdx >= 0 ? Math.max(1, series.length - firstActiveIdx) : 1;

    const dailyAverageActive = periodTotal / daysSinceFirstVisitInPeriod;
    const dailyAverageCalendar = periodTotal / Math.max(1, daysCount);

    // Todas as datas já registradas no histórico geral
    const allRecordedEntries = Object.entries(dailyMap).filter(([, c]) => Number(c) > 0);
    const allTimeSum = allRecordedEntries.reduce((acc, [, c]) => acc + (Number(c) || 0), 0);
    const totalAllTime = Math.max(Number(analytics.totalVisits) || 0, allTimeSum);
    const globalActiveDays = Math.max(1, allRecordedEntries.length);
    const globalDailyAverage = totalAllTime / globalActiveDays;

    // Pico diário
    let peakDay = { key: todayKey, count: Number(dailyMap[todayKey]) || 0 };
    for (const [k, v] of Object.entries(dailyMap)) {
      const num = Number(v) || 0;
      if (num >= peakDay.count) {
        peakDay = { key: k, count: num };
      }
    }

    const todayVisits = Number(dailyMap[todayKey]) || 0;

    return {
      daysCount,
      series: period === 'today' ? hourlySeries : series,
      dailySeries: series,
      periodTotal,
      activeDaysInPeriod,
      daysSinceFirstVisitInPeriod,
      dailyAverageActive,
      dailyAverageCalendar,
      totalAllTime,
      globalActiveDays,
      globalDailyAverage,
      peakDay,
      todayVisits,
    };
  }, [analytics, dailyMap, hourlyMap, period, todayKey]);

  // Geometria do gráfico SVG estilo Google Search Console
  const chartWidth = 900;
  const chartHeight = 260;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const maxY = useMemo(() => {
    const maxVal = Math.max(...stats.series.map((s) => s.count), stats.dailyAverageActive, 4);
    return Math.ceil(maxVal * 1.2);
  }, [stats.series, stats.dailyAverageActive]);

  const points = useMemo(() => {
    const len = stats.series.length;
    return stats.series.map((item, idx) => {
      const x = padLeft + (len <= 1 ? innerWidth / 2 : (idx / (len - 1)) * innerWidth);
      const y = padTop + innerHeight - (item.count / maxY) * innerHeight;
      return { x, y, item, idx };
    });
  }, [stats.series, innerWidth, innerHeight, maxY]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = padTop + innerHeight;
    return `${linePath} L ${last.x.toFixed(1)} ${baselineY} L ${first.x.toFixed(1)} ${baselineY} Z`;
  }, [points, linePath, innerHeight]);

  const avgY = useMemo(() => {
    const refAvg = period === 'today' ? stats.todayVisits / 24 : stats.dailyAverageActive;
    const clamped = Math.min(maxY, Math.max(0, refAvg));
    return padTop + innerHeight - (clamped / maxY) * innerHeight;
  }, [period, stats.todayVisits, stats.dailyAverageActive, maxY, innerHeight]);

  // Linhas de grade horizontais (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = Math.round(maxY * ratio);
    const y = padTop + innerHeight - ratio * innerHeight;
    return { val, y };
  });

  // Lista da tabela (do mais recente para o mais antigo)
  const tableRows = useMemo(() => {
    const reversed = [...stats.dailySeries].reverse();
    if (onlyDaysWithVisits) {
      return reversed.filter((r) => r.count > 0);
    }
    return reversed;
  }, [stats.dailySeries, onlyDaysWithVisits]);

  const lastVisitFormatted = useMemo(() => {
    if (!analytics.lastVisitAt) return 'Agora mesmo';
    const d = new Date(analytics.lastVisitAt);
    if (isNaN(d.getTime())) return 'Recente';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [analytics.lastVisitAt]);

  return (
    <div className="space-y-6 pb-10">
      {/* Cabeçalho estilo Google Search Console */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center shadow-sm">
            <Globe size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                Desempenho de Visitas do Site
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                Google Search Console Style
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Contabiliza sempre que uma pessoa entra no site (nova sessão de visita, sem contar recarregamentos de página / F5).
            </p>
          </div>
        </div>

        {/* Seletor de Período estilo Search Console */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            {[
              { id: 'today', label: 'Hoje (24h)' },
              { id: '7d', label: 'Últimos 7 dias' },
              { id: '28d', label: 'Últimos 28 dias' },
              { id: '90d', label: 'Últimos 3 meses' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPeriod(tab.id as PeriodFilter);
                  setHoveredIndex(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === tab.id
                    ? 'bg-[#1a73e8] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Painel Principal: Cartões Superiores + Gráfico Search Console */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* 4 Cartões de Métricas estilo Google Search Console */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-stone-200">
          {/* Card 1: Total de Aberturas (Azul Search Console) */}
          <div className="p-5 border-b sm:border-b-0 sm:border-r border-stone-200 bg-[#1a73e8]/[0.04] relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a73e8]" />
            <div className="flex items-center justify-between text-xs font-bold text-[#1a73e8] mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#1a73e8] inline-block" />
                Total de Aberturas ({period === 'today' ? 'Hoje' : period === '7d' ? '7 dias' : period === '28d' ? '28 dias' : '90 dias'})
              </span>
              <Eye size={15} />
            </div>
            <div className="text-3xl font-black text-stone-900 tracking-tight">
              {stats.periodTotal.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">
              Total acumulado geral: <strong className="text-stone-800">{stats.totalAllTime.toLocaleString('pt-BR')}</strong> aberturas
            </div>
          </div>

          {/* Card 2: Média Diária de Visitas (Roxo Search Console) */}
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-stone-200 bg-[#9334e6]/[0.04] relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#9334e6]" />
            <div className="flex items-center justify-between text-xs font-bold text-[#9334e6] mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#9334e6] inline-block" />
                Média Diária de Visitas
              </span>
              <TrendingUp size={15} />
            </div>
            <div className="text-3xl font-black text-stone-900 tracking-tight">
              {stats.dailyAverageActive % 1 === 0
                ? stats.dailyAverageActive.toFixed(0)
                : stats.dailyAverageActive.toFixed(1).replace('.', ',')}
              <span className="text-sm font-bold text-stone-500 ml-1">/ dia</span>
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">
              Base: {stats.daysSinceFirstVisitInPeriod}{' '}
              {stats.daysSinceFirstVisitInPeriod === 1 ? 'dia ativo' : 'dias ativos'} • Média global:{' '}
              <strong className="text-stone-800">
                {stats.globalDailyAverage % 1 === 0
                  ? stats.globalDailyAverage.toFixed(0)
                  : stats.globalDailyAverage.toFixed(1).replace('.', ',')}/dia
              </strong>
            </div>
          </div>

          {/* Card 3: Visitas Hoje (Verde Search Console) */}
          <div className="p-5 border-b sm:border-b-0 sm:border-r border-stone-200 bg-[#1e8e3e]/[0.04] relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1e8e3e]" />
            <div className="flex items-center justify-between text-xs font-bold text-[#1e8e3e] mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#1e8e3e] inline-block" />
                Visitas Hoje ({formatDateBr(todayKey).short})
              </span>
              <Activity size={15} />
            </div>
            <div className="text-3xl font-black text-stone-900 tracking-tight">
              {stats.todayVisits.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">
              Última abertura: <strong className="text-stone-800">{lastVisitFormatted}</strong>
            </div>
          </div>

          {/* Card 4: Pico Diário / Recorde (Laranja Search Console) */}
          <div className="p-5 bg-[#e37400]/[0.04] relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#e37400]" />
            <div className="flex items-center justify-between text-xs font-bold text-[#e37400] mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#e37400] inline-block" />
                Pico Diário (Recorde)
              </span>
              <Calendar size={15} />
            </div>
            <div className="text-3xl font-black text-stone-900 tracking-tight">
              {stats.peakDay.count.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-stone-500 font-medium mt-1">
              Registrado em: <strong className="text-stone-800">{formatDateBr(stats.peakDay.key).full}</strong>
            </div>
          </div>
        </div>

        {/* Área do Gráfico Interativo estilo Google Search Console */}
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-3 h-0.5 bg-[#1a73e8] inline-block" />
                <span className="w-2 h-2 rounded-full bg-[#1a73e8] -ml-2.5" />
                {period === 'today' ? 'Aberturas por Hora (Hoje)' : 'Aberturas do Site por Dia'}
              </span>
              <span className="flex items-center gap-1.5 text-stone-600">
                <span className="w-4 border-b-2 border-dashed border-[#9334e6] inline-block" />
                Linha da Média ({period === 'today'
                  ? `${(stats.todayVisits / 24).toFixed(1).replace('.', ',')}/h`
                  : `${stats.dailyAverageActive.toFixed(1).replace('.', ',')}/dia`})
              </span>
            </div>

            {hoveredIndex !== null && points[hoveredIndex] && (
              <div className="px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-bold flex items-center gap-3 shadow-sm">
                <span>{points[hoveredIndex].item.fullLabel}</span>
                <span className="text-[#8ab4f8] font-black">
                  {points[hoveredIndex].item.count} {points[hoveredIndex].item.count === 1 ? 'abertura' : 'aberturas'}
                </span>
              </div>
            )}
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-64 min-w-[560px] select-none overflow-visible"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <defs>
                <linearGradient id="gscBlueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#1a73e8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas Horizontais de Grade */}
              {yTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={t.y}
                    x2={chartWidth - padRight}
                    y2={t.y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={t.y + 4}
                    textAnchor="end"
                    className="fill-stone-400 text-[11px] font-semibold"
                  >
                    {t.val}
                  </text>
                </g>
              ))}

              {/* Linha Tracejada da Média Diária */}
              <line
                x1={padLeft}
                y1={avgY}
                x2={chartWidth - padRight}
                y2={avgY}
                stroke="#9334e6"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Área Preenchida */}
              {areaPath && <path d={areaPath} fill="url(#gscBlueArea)" />}

              {/* Linha Principal Azul Google Search Console */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#1a73e8"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Guia Vertical no Hover */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <line
                  x1={points[hoveredIndex].x}
                  y1={padTop}
                  x2={points[hoveredIndex].x}
                  y2={padTop + innerHeight}
                  stroke="#9ca3af"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Pontos e Rótulos do Eixo X */}
              {points.map((p, idx) => {
                const showLabel =
                  points.length <= 10 ||
                  idx === 0 ||
                  idx === points.length - 1 ||
                  idx % Math.ceil(points.length / 8) === 0;
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={p.item.key}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    {/* Área clicável invisível maior para facilitar hover */}
                    <rect
                      x={p.x - Math.max(8, innerWidth / points.length / 2)}
                      y={padTop}
                      width={Math.max(16, innerWidth / points.length)}
                      height={innerHeight}
                      fill="transparent"
                    />

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : p.item.count > 0 ? 4 : 2.5}
                      fill={isHovered ? '#1a73e8' : p.item.count > 0 ? '#1a73e8' : '#ffffff'}
                      stroke="#1a73e8"
                      strokeWidth={isHovered ? 3 : 2}
                    />

                    {showLabel && (
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className={`text-[11px] font-semibold ${
                          isHovered ? 'fill-[#1a73e8] font-bold' : 'fill-stone-500'
                        }`}
                      >
                        {p.item.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Tabela Diária estilo Google Search Console */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 md:px-6 border-b border-stone-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-stone-900">
              Histórico Diário de Aberturas do Site
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Quantidade exata de vezes que o site foi aberto em cada dia e comparação com a média diária
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer select-none bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            <input
              type="checkbox"
              checked={onlyDaysWithVisits}
              onChange={(e) => setOnlyDaysWithVisits(e.target.checked)}
              className="rounded text-[#1a73e8] focus:ring-[#1a73e8]"
            />
            <span>Mostrar apenas dias com visitas</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-black uppercase text-stone-500 tracking-wider">
                <th className="py-3 px-5">Data</th>
                <th className="py-3 px-5">Dia da Semana</th>
                <th className="py-3 px-5 text-right">Aberturas do Site (Visitas)</th>
                <th className="py-3 px-5 text-right">Média Diária</th>
                <th className="py-3 px-5 w-48">Proporção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 font-medium">
                    Nenhum registro encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const formatted = formatDateBr(row.key);
                  const isToday = row.key === todayKey;
                  const ratio =
                    stats.peakDay.count > 0
                      ? Math.min(100, Math.round((row.count / stats.peakDay.count) * 100))
                      : 0;
                  const diffFromAvg = row.count - stats.dailyAverageActive;

                  return (
                    <tr
                      key={row.key}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isToday ? 'bg-[#1a73e8]/[0.03]' : ''
                      }`}
                    >
                      <td className="py-3 px-5 font-bold text-stone-900 whitespace-nowrap">
                        {formatted.full}
                        {isToday && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-[#1a73e8] text-white">
                            Hoje
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-stone-600 font-medium">{formatted.weekday}</td>
                      <td className="py-3 px-5 text-right font-black text-sm text-stone-900">
                        {row.count.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {row.count === 0 ? (
                          <span className="text-stone-400 font-medium">—</span>
                        ) : diffFromAvg >= 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            +{diffFromAvg.toFixed(1).replace('.', ',')} vs média
                          </span>
                        ) : (
                          <span className="text-stone-600 font-semibold bg-stone-100 px-2 py-0.5 rounded-md">
                            {diffFromAvg.toFixed(1).replace('.', ',')} vs média
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a73e8] rounded-full transition-all"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
