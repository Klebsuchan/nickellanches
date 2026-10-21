// src/lib/storeHours.ts

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  label: string;
  enabled: boolean;
  openTime: string;  // "18:30"
  closeTime: string; // "23:45"
}

export interface StoreHoursSettings {
  mode: 'auto' | 'open' | 'closed'; // 'auto' = segue a tabela de horários, 'open' = sempre aberto, 'closed' = fechado manualmente
  closedTitle: string;
  closedDescription: string;
  bannerText: string;
  schedule: DaySchedule[];
  updatedAtMs?: number;
}

export interface StoreStatus {
  isOpen: boolean;
  reason: 'monday_maintenance' | 'before_opening_hours' | 'manual_closed' | 'open';
  title: string;
  description: string;
  bannerText: string;
  badgeText: string;
  todayScheduleText?: string;
}

export const DEFAULT_STORE_HOURS: StoreHoursSettings = {
  mode: 'open',
  closedTitle: 'Loja Fechada no Momento',
  closedDescription: 'Nosso delivery está fechado agora. Confira nosso horário de atendimento e faça seu pedido assim que abrirmos!',
  bannerText: '⏰ LOJA FECHADA NO MOMENTO • CONFIRA NOSSO HORÁRIO DE ATENDIMENTO',
  schedule: [
    { dayOfWeek: 0, label: 'Domingo', enabled: true, openTime: '18:30', closeTime: '23:45' },
    { dayOfWeek: 1, label: 'Segunda-feira', enabled: false, openTime: '18:30', closeTime: '23:45' },
    { dayOfWeek: 2, label: 'Terça-feira', enabled: true, openTime: '18:30', closeTime: '23:45' },
    { dayOfWeek: 3, label: 'Quarta-feira', enabled: true, openTime: '18:30', closeTime: '23:45' },
    { dayOfWeek: 4, label: 'Quinta-feira', enabled: true, openTime: '18:30', closeTime: '23:45' },
    { dayOfWeek: 5, label: 'Sexta-feira', enabled: true, openTime: '18:30', closeTime: '23:59' },
    { dayOfWeek: 6, label: 'Sábado', enabled: true, openTime: '18:30', closeTime: '23:59' },
  ],
};

let memoryStoreHours: StoreHoursSettings | null = null;

export const setCachedStoreHours = (settings: StoreHoursSettings) => {
  memoryStoreHours = settings;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('nickel_store_hours', JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }
};

export const getCachedStoreHours = (): StoreHoursSettings => {
  if (memoryStoreHours) return memoryStoreHours;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('nickel_store_hours');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.schedule) && parsed.schedule.length === 7) {
          memoryStoreHours = { ...DEFAULT_STORE_HOURS, ...parsed };
          return memoryStoreHours!;
        }
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_STORE_HOURS;
};

const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

export const getSaoPauloNow = (): { dayOfWeek: number; minutes: number; timeString: string } => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || 'Sun';
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '00';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value || '00';

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = dayMap[weekdayStr] ?? now.getDay();
    const hour = parseInt(hourStr, 10) % 24;
    const minute = parseInt(minuteStr, 10);
    return {
      dayOfWeek,
      minutes: hour * 60 + minute,
      timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  } catch {
    const now = new Date();
    return {
      dayOfWeek: now.getDay(),
      minutes: now.getHours() * 60 + now.getMinutes(),
      timeString: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
  }
};

/**
 * Retorna o status completo da loja considerando as configurações do Painel Admin
 */
export const getStoreStatus = (overrideSettings?: StoreHoursSettings): StoreStatus => {
  const config = overrideSettings || getCachedStoreHours();
  const spNow = getSaoPauloNow();
  const todayConfig = config.schedule.find((d) => d.dayOfWeek === spNow.dayOfWeek) || config.schedule[0];

  // Compatibilidade legada caso a chave antiga de teste esteja ativa e mode não tenha sido alterado
  if (typeof window !== 'undefined' && !overrideSettings) {
    try {
      const localSim = localStorage.getItem('nickel_simular_segunda') || localStorage.getItem('nickel_forcar_fechado');
      if (localSim === 'true' && config.mode !== 'open') {
        return {
          isOpen: false,
          reason: 'manual_closed',
          title: config.closedTitle || 'Loja Fechada Temporariamente',
          description: config.closedDescription || 'O delivery está fechado temporariamente.',
          bannerText: config.bannerText || '⚠️ LOJA FECHADA TEMPORARIAMENTE!',
          badgeText: 'FECHADO (PAUSA MANUAL)',
        };
      }
    } catch {
      // ignore
    }
  }

  // 1. Modo Forçar Aberto
  if (config.mode === 'open') {
    return {
      isOpen: true,
      reason: 'open',
      title: 'Loja Aberta',
      description: 'O delivery está operando normalmente.',
      bannerText: '',
      badgeText: 'ABERTO (LIBERADO)',
      todayScheduleText: todayConfig?.enabled ? `${todayConfig.openTime} às ${todayConfig.closeTime}` : 'Horário Livre',
    };
  }

  // 2. Modo Forçar Fechado Manualmente
  if (config.mode === 'closed') {
    return {
      isOpen: false,
      reason: 'manual_closed',
      title: config.closedTitle || 'Loja Fechada Temporariamente',
      description: config.closedDescription || 'Nosso delivery está temporariamente pausado. Em breve retornamos!',
      bannerText: config.bannerText || '⏰ LOJA FECHADA TEMPORARIAMENTE!',
      badgeText: 'FECHADO (MANUAL)',
    };
  }

  // 3. Modo Automático (verifica turno da madrugada anterior e turno de hoje)
  const yesterdayDay = (spNow.dayOfWeek + 6) % 7;
  const yesterdayConfig = config.schedule.find((d) => d.dayOfWeek === yesterdayDay);
  if (yesterdayConfig && yesterdayConfig.enabled) {
    const yOpen = parseTimeToMinutes(yesterdayConfig.openTime);
    const yClose = parseTimeToMinutes(yesterdayConfig.closeTime);
    // Se fechava após a meia-noite (ex: 18:30 às 01:00) e ainda estamos antes do fechamento
    if (yClose < yOpen && spNow.minutes <= yClose) {
      return {
        isOpen: true,
        reason: 'open',
        title: 'Loja Aberta',
        description: `Atendimento aberto até as ${yesterdayConfig.closeTime}.`,
        bannerText: '',
        badgeText: `ABERTO (ATÉ ${yesterdayConfig.closeTime})`,
      };
    }
  }

  if (!todayConfig || !todayConfig.enabled) {
    return {
      isOpen: false,
      reason: 'monday_maintenance',
      title: config.closedTitle || `Fechado hoje (${todayConfig?.label || 'Folga'})`,
      description: config.closedDescription || `Não abrimos ${todayConfig?.label?.toLowerCase() || 'hoje'}. Confira nosso cardápio!`,
      bannerText: config.bannerText || `⏰ FECHADO HOJE (${(todayConfig?.label || '').toUpperCase()})`,
      badgeText: `FECHADO (${(todayConfig?.label || '').toUpperCase()})`,
    };
  }

  const openMin = parseTimeToMinutes(todayConfig.openTime);
  const closeMin = parseTimeToMinutes(todayConfig.closeTime);

  const isWithinToday =
    closeMin >= openMin
      ? spNow.minutes >= openMin && spNow.minutes <= closeMin
      : spNow.minutes >= openMin; // Fecha após meia-noite

  if (isWithinToday) {
    return {
      isOpen: true,
      reason: 'open',
      title: 'Loja Aberta',
      description: `Atendimento hoje das ${todayConfig.openTime} às ${todayConfig.closeTime}.`,
      bannerText: '',
      badgeText: `ABERTO (${todayConfig.openTime} - ${todayConfig.closeTime})`,
      todayScheduleText: `${todayConfig.openTime} às ${todayConfig.closeTime}`,
    };
  }

  const defaultBanner = `⏰ LOJA FECHADA • HOJE ABRIMOS DAS ${todayConfig.openTime} ÀS ${todayConfig.closeTime}`;
  const defaultDesc = `Nosso horário de funcionamento hoje (${todayConfig.label}) é das ${todayConfig.openTime} às ${todayConfig.closeTime}.`;

  return {
    isOpen: false,
    reason: 'before_opening_hours',
    title: config.closedTitle || 'Fora do Horário de Atendimento',
    description: defaultDesc,
    bannerText: defaultBanner,
    badgeText: `FECHADO (ABRE ÀS ${todayConfig.openTime})`,
    todayScheduleText: `${todayConfig.openTime} às ${todayConfig.closeTime}`,
  };
};

export const isStoreClosedMonday = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const isStoreClosed = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const STORE_CLOSED_MESSAGE = "Loja Fechada Temporariamente";
export const STORE_CLOSED_DESCRIPTION = "Nosso delivery está temporariamente fechado. Em breve retornamos!";


