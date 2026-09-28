import QRCode from 'qrcode';

export interface PixPayloadParams {
  key: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  keyType?: 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria' | string;
}

function normalizeString(str: string, maxLength: number): string {
  const normalized = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^A-Za-z0-9 ]/g, "") // remove special characters
    .trim()
    .toUpperCase();
  return normalized.substring(0, maxLength);
}

function emv(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

function calculateCrc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload({
  key,
  merchantName,
  merchantCity,
  amount,
  txid = '***',
  keyType
}: PixPayloadParams): string {
  if (!key) return '';

  let cleanKey = key.trim();
  const digitsOnly = cleanKey.replace(/\D/g, '');

  // Padrão do Banco Central do Brasil para chaves PIX de telefone:
  // Deve conter o prefixo internacional +55 (ex: +5554999598389)
  const isPhone = keyType === 'telefone' || 
    cleanKey.startsWith('+55') || 
    (!cleanKey.includes('@') && !cleanKey.includes('-') && (digitsOnly.length === 10 || digitsOnly.length === 11) && keyType !== 'cpf');

  if (isPhone) {
    if (cleanKey.startsWith('+55')) {
      cleanKey = `+55${cleanKey.replace('+55', '').replace(/\D/g, '')}`;
    } else if (digitsOnly.length === 12 || digitsOnly.length === 13) {
      if (digitsOnly.startsWith('55')) {
        cleanKey = `+${digitsOnly}`;
      } else {
        cleanKey = `+55${digitsOnly}`;
      }
    } else if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      cleanKey = `+55${digitsOnly}`;
    }
  }

  const cleanName = normalizeString(merchantName || 'NICKEL LANCHES', 25) || 'NICKEL LANCHES';
  const cleanCity = normalizeString(merchantCity || 'PASSO FUNDO', 15) || 'PASSO FUNDO';
  const formattedAmount = Number(amount || 0).toFixed(2);
  const cleanTxid = (txid || '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';

  // 26: Merchant Account Information - Pix
  const mai = emv('00', 'br.gov.bcb.pix') + emv('01', cleanKey);
  
  // 62: Additional Data Field Template
  const adf = emv('05', cleanTxid);

  let raw = 
    emv('00', '01') +
    emv('26', mai) +
    emv('52', '0000') +
    emv('53', '986');

  if (Number(formattedAmount) > 0) {
    raw += emv('54', formattedAmount);
  }

  raw +=
    emv('58', 'BR') +
    emv('59', cleanName) +
    emv('60', cleanCity) +
    emv('62', adf) +
    '6304';

  const crc = calculateCrc16(raw);
  return `${raw}${crc}`;
}

export async function generatePixQRCode(payload: string): Promise<string> {
  if (!payload) return '';
  try {
    return await QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Erro ao gerar QRCode do PIX:', err);
    return '';
  }
}
