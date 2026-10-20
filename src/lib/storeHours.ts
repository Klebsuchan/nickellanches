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
      // Prioridade apenas se o Admin explicitamente forçar fechado para teste no painel
      const localSim = localStorage.getItem('nickel_simular_segunda') || localStorage.getItem('nickel_forcar_fechado');
      if (localSim === 'true') {
        return {
          isOpen: false,
          reason: 'monday_maintenance',
          title: 'Loja Fechada (Teste)',
          description: 'O delivery está fechado temporariamente para manutenção/testes.',
          bannerText: '⚠️ LOJA FECHADA TEMPORARIAMENTE!',
          badgeText: 'FECHADO (TESTE)'
        };
      }
    } catch {
      // Ignora erro
    }
  }

  // Restaurante sempre aberto sem restrição de horário/tempo
  return {
    isOpen: true,
    reason: 'open',
    title: 'Loja Aberta',
    description: 'O delivery está operando normalmente.',
    bannerText: '',
    badgeText: 'ABERTO'
  };
};

/**
 * Funções mantidas para compatibilidade
 */
export const isStoreClosedMonday = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const isStoreClosed = (): boolean => {
  return !getStoreStatus().isOpen;
};

export const STORE_CLOSED_MESSAGE = "Loja Fechada Temporariamente";
export const STORE_CLOSED_DESCRIPTION = "Nosso delivery está temporariamente fechado. Em breve retornamos!";

