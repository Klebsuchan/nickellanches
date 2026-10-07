// src/lib/storeHours.ts

/**
 * Verifica se a loja está fechada na segunda-feira devido à manutenção do delivery.
 * Considera o fuso horário oficial de Passo Fundo / RS (America/Sao_Paulo).
 * Também aceita simulação para testes via URL (?simular_segunda=true) ou localStorage ('nickel_simular_segunda').
 */
export const isStoreClosedMonday = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('simular_segunda') === 'true' || params.get('segunda') === '1' || params.get('fechado') === 'true') {
        return true;
      }
      if (params.get('simular_segunda') === 'false') {
        return false;
      }
      const localSim = localStorage.getItem('nickel_simular_segunda');
      if (localSim === 'true') return true;
      if (localSim === 'false') return false;
    } catch {
      // Ignora erro de parsing de URL
    }
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
    });
    const weekday = formatter.format(new Date());
    // 'Mon' = Monday (Segunda-feira)
    return weekday === 'Mon';
  } catch {
    // Fallback para getDay() local (1 = Segunda-feira)
    return new Date().getDay() === 1;
  }
};

export const STORE_CLOSED_MESSAGE = "Loja fechada segunda-feira";
export const STORE_CLOSED_DESCRIPTION = "Nosso delivery está em manutenção às segundas-feiras. Retornamos nesta terça-feira a partir das 18:30!";
