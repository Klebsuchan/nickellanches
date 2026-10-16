// src/lib/storeHours.ts

export interface StoreStatus {
  isOpen: boolean;
  reason: 'monday_maintenance' | 'before_opening_hours' | 'open';
  title: string;
  description: string;
  bannerText: string;
  badgeText: string;
}

/**
 * Retorna o status completo da loja considerando:
 * 1. Fuso horário oficial de Passo Fundo / RS (America/Sao_Paulo)
 * 2. Horário de funcionamento: Terça a Domingo, compras liberadas a partir das 18:30
 * 3. Segunda-feira: Fechado para manutenção
 * 4. Sobrescrita manual pelo Admin no localStorage ('nickel_simular_segunda') ou URL
 */
export const getStoreStatus = (): StoreStatus => {
  if (typeof window !== 'undefined') {
    try {
      // 1. Prioridade para controle do Admin no localStorage
      const localSim = localStorage.getItem('nickel_simular_segunda') || localStorage.getItem('nickel_forcar_fechado');
      if (localSim === 'false') {
        return {
          isOpen: true,
          reason: 'open',
          title: 'Loja Aberta (Forçado para Testes)',
          description: 'O delivery está operando normalmente.',
          bannerText: '',
          badgeText: 'ABERTO (TESTE)'
        };
      }
      if (localSim === 'true') {
        return {
          isOpen: false,
          reason: 'monday_maintenance',
          title: 'Loja Fechada (Forçado para Testes)',
          description: 'Nosso delivery está em manutenção. Retornamos a partir das 18:30!',
          bannerText: '⚠️ LOJA FECHADA: DELIVERY EM MANUTENÇÃO HOJE!',
          badgeText: 'FECHADO (TESTE)'
        };
      }

      // 2. Parâmetros na URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('simular_segunda') === 'false' || params.get('segunda') === '0' || params.get('fechado') === 'false') {
        return {
          isOpen: true,
          reason: 'open',
          title: 'Loja Aberta',
          description: 'O delivery está operando normalmente.',
          bannerText: '',
          badgeText: 'ABERTO'
        };
      }
      if (params.get('simular_segunda') === 'true' || params.get('segunda') === '1' || params.get('fechado') === 'true') {
        return {
          isOpen: false,
          reason: 'monday_maintenance',
          title: 'Loja Fechada',
          description: 'Nosso delivery está em manutenção. Retornamos a partir das 18:30!',
          bannerText: '⚠️ LOJA FECHADA: DELIVERY EM MANUTENÇÃO HOJE!',
          badgeText: 'FECHADO'
        };
      }
    } catch {
      // Ignora erro
    }
  }

  try {
    const now = new Date();
    // Converter para o fuso horário de São Paulo (Passo Fundo / RS)
    const spDateStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    const spDate = new Date(spDateStr);

    const day = spDate.getDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, ..., 6 = Sábado
    const hour = spDate.getHours();
    const minute = spDate.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 1. Segunda-feira = Fechado o dia todo
    if (day === 1) {
      return {
        isOpen: false,
        reason: 'monday_maintenance',
        title: 'Loja fechada segunda-feira',
        description: 'Nosso delivery está em manutenção às segundas-feiras. Não é possível finalizar pedidos hoje. Retornamos terça-feira às 18:30!',
        bannerText: '⚠️ LOJA FECHADA SEGUNDA-FEIRA: DELIVERY EM MANUTENÇÃO HOJE! • Retornamos terça-feira às 18:30',
        badgeText: 'FECHADO (SEGUNDA)'
      };
    }

    // 2. Terça a Domingo antes das 18:30 (18:30 = 18 * 60 + 30 = 1110 minutos)
    const openTimeInMinutes = 18 * 60 + 30; // 18:30
    if (timeInMinutes < openTimeInMinutes) {
      return {
        isOpen: false,
        reason: 'before_opening_hours',
        title: 'Loja fechada no momento',
        description: 'Nosso delivery libera compras diariamente a partir das 18:30. Aguardamos seu pedido a partir das 18:30!',
        bannerText: '⏰ LOJA FECHADA NO MOMENTO: Compras liberadas a partir das 18:30!',
        badgeText: 'FECHADO (ABRE ÀS 18:30)'
      };
    }

    // 3. Aberto! (A partir das 18:30)
    return {
      isOpen: true,
      reason: 'open',
      title: 'Loja Aberta',
      description: 'O delivery está aberto e entregando lanches quentinhos!',
      bannerText: '',
      badgeText: 'ABERTO'
    };
  } catch {
    const localDay = new Date().getDay();
    const localHour = new Date().getHours();
    const localMin = new Date().getMinutes();
    if (localDay === 1) {
      return {
        isOpen: false,
        reason: 'monday_maintenance',
        title: 'Loja fechada segunda-feira',
        description: 'Nosso delivery está em manutenção às segundas-feiras. Retornamos terça-feira às 18:30!',
        bannerText: '⚠️ LOJA FECHADA SEGUNDA-FEIRA: DELIVERY EM MANUTENÇÃO HOJE!',
        badgeText: 'FECHADO (SEGUNDA)'
      };
    }
    if (localHour < 18 || (localHour === 18 && localMin < 30)) {
      return {
        isOpen: false,
        reason: 'before_opening_hours',
        title: 'Loja fechada no momento',
        description: 'Nosso delivery libera compras diariamente a partir das 18:30!',
        bannerText: '⏰ LOJA FECHADA NO MOMENTO: Compras liberadas a partir das 18:30!',
        badgeText: 'FECHADO (ABRE ÀS 18:30)'
      };
    }
    return {
      isOpen: true,
      reason: 'open',
      title: 'Loja Aberta',
      description: 'O delivery está operando normalmente.',
      bannerText: '',
      badgeText: 'ABERTO'
    };
  }
};

/**
 * Função mantida para compatibilidade
 */
export const isStoreClosedMonday = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const isStoreClosed = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const STORE_CLOSED_MESSAGE = "Loja Fechada no Momento";
export const STORE_CLOSED_DESCRIPTION = "Nosso delivery libera compras diariamente a partir das 18:30. Acompanhe nosso cardápio!";

