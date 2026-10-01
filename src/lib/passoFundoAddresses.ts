// ======================================================================
// Passo Fundo - RS Address & Automatic Delivery Fee Calculation Service
// ======================================================================

export interface PassoFundoStreet {
  name: string;
  bairro: string;
  region: 'petropolis' | 'cidade' | 'afastado';
  fee: number;
  popular?: boolean;
}

export interface AddressSuggestion {
  displayName: string;
  street: string;
  bairro: string;
  city: string;
  region: 'petropolis' | 'cidade' | 'afastado';
  fee: number;
}

// Bairros de Passo Fundo categorizados por taxa de frete da Nickel Lanches (Rua Uruguai, 919 - Petrópolis)
export const PETROPOLIS_KEYWORDS = [
  'petropolis', 'petrópolis', 'vila petropolis', 'vila petrópolis', 'lava pes', 'lava-pés', 
  'bahia', 'minas gerais', 'parana', 'paraná', 'sao paulo', 'são paulo', 'santa catarina',
  'goias', 'goiás', 'espirito santo', 'espírito santo', 'almirante tamandare', 'almirante tamandaré',
  'placido de castro', 'plácido de castro', 'cruz alta', 'condomínio petrópolis', 'parque da gare'
];

export const AFASTADO_KEYWORDS = [
  'roselandia', 'roselândia', 'distrito industrial', 'pulador', 'bom recreio', 'sao valentim', 
  'são valentim', 'trevo', 'fora do trevo', 'taquaruçu', 'taquarucu', 'passo do cruz', 
  'br 285', 'br-285', 'rs 153', 'rs-153', 'rs 324', 'rs-324', 'universidade', 'upf', 'campus',
  'loteamento da upf', 'perimetro rural', 'zona rural'
];

// Base com as principais ruas e avenidas de Passo Fundo para sugestão instantânea sem delay
export const PASSO_FUNDO_STREETS: PassoFundoStreet[] = [
  // Bairro Petrópolis (Sede Nickel Lanches - R$ 10,00 apenas quando no bairro Petrópolis)
  { name: 'Rua Uruguai (Petrópolis)', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Lava Pés', bairro: 'Petrópolis', region: 'petropolis', fee: 10, popular: true },
  { name: 'Rua Bahia', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Minas Gerais', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Paraná', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua São Paulo', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Santa Catarina', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Goiás', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Mato Grosso', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Espírito Santo', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Plácido de Castro', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Cruz Alta', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Almirante Tamandaré', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },
  { name: 'Rua Rio de Janeiro', bairro: 'Petrópolis', region: 'petropolis', fee: 10 },

  // Centro e Bairros Urbanos (R$ 15,00) - Rua Uruguai geral/centro é R$ 15,00 conforme solicitado
  { name: 'Rua Uruguai', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Avenida Brasil Leste', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Avenida Brasil Oeste', bairro: 'Boqueirão', region: 'cidade', fee: 15, popular: true },
  { name: 'Avenida Presidente Vargas', bairro: 'São Cristóvão', region: 'cidade', fee: 15, popular: true },
  { name: 'Avenida Sete de Setembro', bairro: 'Vera Cruz', region: 'cidade', fee: 15, popular: true },
  { name: 'Avenida General Netto', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Moron', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Paissandu', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Coronel Chicuta', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Bento Gonçalves', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Fagundes dos Reis', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Teixeira Soares', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Capitão Eleutério', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua General Osório', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Independência', bairro: 'Centro', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua XV de Novembro', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Senador Pinheiro', bairro: 'Vila Rodrigues', region: 'cidade', fee: 15 },
  { name: 'Rua Scarpellini Ghezzi', bairro: 'Lucas Araújo', region: 'cidade', fee: 15, popular: true },
  { name: 'Rua Dona Eliza', bairro: 'Vila Vergueiro', region: 'cidade', fee: 15 },
  { name: 'Rua Silva Jardim', bairro: 'Vila Vergueiro', region: 'cidade', fee: 15 },
  { name: 'Rua Benjamin Constant', bairro: 'São Cristóvão', region: 'cidade', fee: 15 },
  { name: 'Rua Capitão Araújo', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua General Canabarro', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Guaporé', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua São Borja', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Eduardo de Brito', bairro: 'Vila Rodrigues', region: 'cidade', fee: 15 },
  { name: 'Rua Santo Antônio', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },
  { name: 'Rua Princesa Isabel', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },
  { name: 'Rua Minas Bogucheski', bairro: 'São Cristóvão', region: 'cidade', fee: 15 },
  { name: 'Rua Vacaria', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Soledade', bairro: 'Vera Cruz', region: 'cidade', fee: 15 },
  { name: 'Rua Carazinho', bairro: 'Vera Cruz', region: 'cidade', fee: 15 },
  { name: 'Rua Erechim', bairro: 'Vera Cruz', region: 'cidade', fee: 15 },
  { name: 'Rua Marau', bairro: 'Vera Cruz', region: 'cidade', fee: 15 },
  { name: 'Rua Lagoa Vermelha', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Palmeira das Missões', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Sananduva', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Nonoai', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Tapejara', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua Ibiraiaras', bairro: 'Boqueirão', region: 'cidade', fee: 15 },
  { name: 'Rua São Roque', bairro: 'São Cristóvão', region: 'cidade', fee: 15 },
  { name: 'Rua Cristóvão Colombo', bairro: 'São Cristóvão', region: 'cidade', fee: 15 },
  { name: 'Rua José Bonifácio', bairro: 'São Cristóvão', region: 'cidade', fee: 15 },
  { name: 'Rua Anita Garibaldi', bairro: 'Lucas Araújo', region: 'cidade', fee: 15 },
  { name: 'Rua Saldanha Marinho', bairro: 'Centro', region: 'cidade', fee: 15 },
  { name: 'Rua Coronel Pelegrini', bairro: 'Vila Vergueiro', region: 'cidade', fee: 15 },
  { name: 'Rua General Prestes Guimarães', bairro: 'Vila Rodrigues', region: 'cidade', fee: 15 },
  { name: 'Rua Dr. Vergueiro', bairro: 'Vila Vergueiro', region: 'cidade', fee: 15 },
  { name: 'Rua Doutor Bozano', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },
  { name: 'Rua Mascarenhas', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },
  { name: 'Rua Nereu Ramos', bairro: 'Fátima', region: 'cidade', fee: 15 },
  { name: 'Rua São Sebastião', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },
  { name: 'Rua Coronel Camisão', bairro: 'Vila Luiza', region: 'cidade', fee: 15 },

  // Fora do Trevo / Afastados (R$ 20,00)
  { name: 'Avenida Roselândia', bairro: 'Roselândia', region: 'afastado', fee: 20, popular: true },
  { name: 'Rodovia BR-285', bairro: 'Distrito Industrial', region: 'afastado', fee: 20 },
  { name: 'Rodovia RS-153', bairro: 'Fora do Trevo', region: 'afastado', fee: 20 },
  { name: 'Rodovia RS-324', bairro: 'Fora do Trevo', region: 'afastado', fee: 20 },
  { name: 'Rua do Pulador', bairro: 'Pulador', region: 'afastado', fee: 20 },
  { name: 'Estrada do Bom Recreio', bairro: 'Bom Recreio', region: 'afastado', fee: 20 },
  { name: 'Estrada de São Valentim', bairro: 'São Valentim', region: 'afastado', fee: 20 },
  { name: 'Avenida Brasil Leste (Após Trevo UPF)', bairro: 'Loteamento UPF', region: 'afastado', fee: 20 }
];

/**
 * Normaliza strings removendo acentos e pontuações
 */
export function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Classifica automaticamente a região e taxa com base no nome do endereço/rua/bairro
 */
export function determineRegionFromAddress(addressText: string): {
  region: 'petropolis' | 'cidade' | 'afastado';
  fee: number;
  label: string;
  detectedBairro: string;
} {
  const norm = normalizeStr(addressText);
  if (!norm) {
    return {
      region: 'cidade',
      fee: 15,
      label: 'Passo Fundo (Cidade)',
      detectedBairro: 'Outros bairros'
    };
  }

  // 1. Verifica se é afastado / fora do trevo
  for (const kw of AFASTADO_KEYWORDS) {
    if (norm.includes(kw)) {
      return {
        region: 'afastado',
        fee: 20,
        label: 'Fora do Trevo (Afastado)',
        detectedBairro: 'Região Afastada / Fora do Trevo'
      };
    }
  }

  // 2. Verifica se é Petrópolis (vizinho imediato da Nickel Lanches)
  for (const kw of PETROPOLIS_KEYWORDS) {
    if (norm.includes(kw)) {
      return {
        region: 'petropolis',
        fee: 10,
        label: 'Petrópolis',
        detectedBairro: 'Petrópolis'
      };
    }
  }

  // 3. Procura na base local de ruas
  for (const street of PASSO_FUNDO_STREETS) {
    const sNorm = normalizeStr(street.name);
    if (norm.includes(sNorm) || sNorm.includes(norm)) {
      return {
        region: street.region,
        fee: street.fee,
        label: street.region === 'petropolis' ? 'Petrópolis' : street.region === 'afastado' ? 'Fora do Trevo' : 'Passo Fundo (Cidade)',
        detectedBairro: street.bairro
      };
    }
  }

  // 4. Padrão para toda a malha urbana de Passo Fundo
  return {
    region: 'cidade',
    fee: 15,
    label: 'Outros bairros (Cidade)',
    detectedBairro: 'Bairro Urbano de Passo Fundo'
  };
}

/**
 * Busca sugestões de endereços:
 * 1. Filtra na base local rápida de Passo Fundo
 * 2. Consulta a API pública do OpenStreetMap / Nominatim com viés em Passo Fundo - RS
 */
export async function searchPassoFundoAddresses(query: string): Promise<AddressSuggestion[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const normQuery = normalizeStr(clean);
  const results: AddressSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Busca rápida na base interna
  for (const s of PASSO_FUNDO_STREETS) {
    const sNorm = normalizeStr(s.name);
    const bNorm = normalizeStr(s.bairro);

    if (sNorm.includes(normQuery) || bNorm.includes(normQuery)) {
      const key = `${s.name} - ${s.bairro}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          displayName: `${s.name}, ${s.bairro} - Passo Fundo, RS`,
          street: s.name,
          bairro: s.bairro,
          city: 'Passo Fundo - RS',
          region: s.region,
          fee: s.fee
        });
      }
    }
  }

  // Se já temos muitas opções locais ou o termo é curto, retorna as locais
  if (results.length >= 5) {
    return results.slice(0, 5);
  }

  // 2. Consulta rápida ao OpenStreetMap Nominatim com bounding box de Passo Fundo
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800); // 1.8s timeout para nunca travar a digitação

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean + ', Passo Fundo, RS')}&format=json&addressdetails=1&countrycodes=br&limit=5`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      for (const item of data) {
        const addr = item.address || {};
        const road = addr.road || addr.pedestrian || item.name || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
        const city = addr.city || addr.town || 'Passo Fundo';

        // Garante que é em Passo Fundo
        if (road && (normalizeStr(city).includes('passo fundo') || normalizeStr(item.display_name).includes('passo fundo'))) {
          const key = `${road} - ${suburb}`;
          if (!seen.has(key)) {
            seen.add(key);
            const classified = determineRegionFromAddress(`${road} ${suburb} ${item.display_name}`);
            results.push({
              displayName: `${road}${suburb ? ` - ${suburb}` : ''} - Passo Fundo, RS`,
              street: road,
              bairro: suburb || classified.detectedBairro,
              city: 'Passo Fundo - RS',
              region: classified.region,
              fee: classified.fee
            });
          }
        }
      }
    }
  } catch (_) {
    // Falha silenciosa de rede, os resultados locais da base interna garantem funcionamento offline
  }

  return results.slice(0, 6);
}
