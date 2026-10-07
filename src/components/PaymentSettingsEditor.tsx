import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Save, 
  Check, 
  Copy, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Wallet,
  Landmark,
  Building2
} from 'lucide-react';
import { PaymentSettings, savePaymentSettings, DEFAULT_PAYMENT_SETTINGS } from '../lib/db';
import { generatePixPayload, generatePixQRCode } from '../lib/pix';
import { useToast } from './Toast';
import { playSound } from '../lib/audio';

interface PaymentSettingsEditorProps {
  initialSettings?: PaymentSettings;
}

export default function PaymentSettingsEditor({ initialSettings }: PaymentSettingsEditorProps) {
  const [settings, setSettings] = useState<PaymentSettings>(() => {
    if (!initialSettings) return DEFAULT_PAYMENT_SETTINGS;
    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...initialSettings,
      cardOnline: {
        ...DEFAULT_PAYMENT_SETTINGS.cardOnline,
        ...(initialSettings.cardOnline || {})
      },
      bankAccount: {
        ...DEFAULT_PAYMENT_SETTINGS.bankAccount,
        ...(initialSettings.bankAccount || {})
      }
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testAmount, setTestAmount] = useState('35.00');
  const [previewQrCodeUrl, setPreviewQrCodeUrl] = useState('');
  const [previewPixPayload, setPreviewPixPayload] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...DEFAULT_PAYMENT_SETTINGS,
        ...initialSettings,
        cardOnline: {
          ...DEFAULT_PAYMENT_SETTINGS.cardOnline,
          ...(initialSettings.cardOnline || {})
        },
        bankAccount: {
          ...DEFAULT_PAYMENT_SETTINGS.bankAccount,
          ...(initialSettings.bankAccount || {})
        }
      });
    }
  }, [initialSettings]);

  // Atualiza a prévia do PIX sempre que a chave, nome, cidade ou valor mudam
  useEffect(() => {
    const amountNum = parseFloat(testAmount.replace(',', '.')) || 0;
    const payload = generatePixPayload({
      key: settings.pix.key,
      merchantName: settings.pix.merchantName,
      merchantCity: settings.pix.merchantCity,
      amount: amountNum,
      keyType: settings.pix.keyType,
      txid: 'PREVIEW'
    });
    setPreviewPixPayload(payload);

    if (payload) {
      generatePixQRCode(payload).then(url => setPreviewQrCodeUrl(url));
    } else {
      setPreviewQrCodeUrl('');
    }
  }, [settings.pix, testAmount]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await savePaymentSettings(settings);
      playSound('coin');
      addToast({
        message: 'Configurações de pagamento salvas com sucesso!',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      playSound('error');
      addToast({
        message: 'Erro ao salvar configurações no banco de dados.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPayload = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    playSound('coin');
    addToast({
      message: 'Código PIX Copia e Cola copiado!',
      type: 'success'
    });
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-stone-700/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#F28B20] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Recebimento Direto
            </span>
            <span className="text-stone-400 text-xs font-semibold">Cai 100% na Conta do Proprietário</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Formas de Pagamento (Online e Entrega)
          </h2>
          <p className="text-stone-300 text-sm max-w-2xl mt-1">
            Configure o PIX e o Cartão de Crédito / Débito para os clientes pagarem pelo site, com o dinheiro caindo diretamente na sua conta bancária.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg hover:shadow-green-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shrink-0"
        >
          <Save size={18} />
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Ativação Global de Pagamentos Online */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F28B20] flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-stone-900 uppercase text-sm">
              Habilitar Pagamentos Online no Site
            </h3>
            <p className="text-xs text-stone-500">
              Quando ativado, os clientes podem pagar com PIX Imediato ou Cartão de Débito/Crédito antes de enviar o pedido.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={settings.onlinePaymentsEnabled} 
            onChange={e => setSettings({ ...settings, onlinePaymentsEnabled: e.target.checked })} 
            className="sr-only peer" 
          />
          <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#F28B20]"></div>
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. SEÇÃO PIX DINÂMICO (VALOR EXATO NA CONTA DO PROPRIETÁRIO) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <QrCode size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-stone-900 uppercase">PIX Imediato (QR Code & Copia e Cola)</h3>
                  <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Cai na Hora
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">O cliente paga no app do banco e cai direto na sua conta bancária</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-700">PIX Online Ativo?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.pix.enabled} 
                  onChange={e => setSettings({
                    ...settings,
                    pix: { ...settings.pix, enabled: e.target.checked }
                  })} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Tipo de Chave PIX
              </label>
              <select
                value={settings.pix.keyType}
                onChange={e => setSettings({
                  ...settings,
                  pix: { ...settings.pix, keyType: e.target.value as any }
                })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-[#F28B20] text-sm"
              >
                <option value="telefone">Telefone / Celular</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória (EVP)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase">
                  Chave PIX da sua Conta Bancária *
                </label>
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    pix: {
                      ...settings.pix,
                      keyType: 'telefone',
                      key: '54999598389',
                      instructions: 'A chave PIX é o próprio número de WhatsApp da lanchonete: (54) 99959-8389. Ao fazer o PIX, anexe o comprovante na conversa do WhatsApp para agilizar a preparação!'
                    }
                  })}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>📱</span>
                  <span>Usar WhatsApp da Loja (54) 99959-8389</span>
                </button>
              </div>
              <input
                type="text"
                value={settings.pix.key}
                onChange={e => setSettings({
                  ...settings,
                  pix: { ...settings.pix, key: e.target.value }
                })}
                placeholder="Ex: 54999598389 ou nickellanches@gmail.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-[#F28B20] text-sm"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Para telefone/WhatsApp, o QR Code e o Copia e Cola são gerados automaticamente com o código internacional do Banco Central (+55).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Nome do Titular da Conta *
              </label>
              <input
                type="text"
                value={settings.pix.merchantName}
                onChange={e => setSettings({
                  ...settings,
                  pix: { ...settings.pix, merchantName: e.target.value }
                })}
                placeholder="Ex: NICKEL LANCHES ou BRAIAN CAMARGO"
                maxLength={25}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-[#F28B20] text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Nome que aparece no comprovante (máx. 25 letras).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Cidade da Conta Bancária *
              </label>
              <input
                type="text"
                value={settings.pix.merchantCity}
                onChange={e => setSettings({
                  ...settings,
                  pix: { ...settings.pix, merchantCity: e.target.value }
                })}
                placeholder="Ex: PASSO FUNDO"
                maxLength={15}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-[#F28B20] text-sm"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Cidade da agência/conta (máx. 15 letras).
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Instruções do PIX para o Cliente
              </label>
              <input
                type="text"
                value={settings.pix.instructions}
                onChange={e => setSettings({
                  ...settings,
                  pix: { ...settings.pix, instructions: e.target.value }
                })}
                placeholder="Ex: Pague o valor exato no app do banco e envie o comprovante pelo WhatsApp."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 outline-none focus:border-[#F28B20] text-sm"
              />
            </div>
          </div>

          {/* SIMULADOR EM TEMPO REAL DO PIX */}
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-stone-200 gap-2">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-[#F28B20]" />
                <h4 className="font-bold text-sm text-stone-900 uppercase">
                  Simulação do PIX (Como o cliente verá no pedido)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">Simular valor: R$</span>
                <input
                  type="text"
                  value={testAmount}
                  onChange={e => setTestAmount(e.target.value)}
                  className="w-20 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-center text-stone-900 outline-none focus:border-[#F28B20]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-stone-200 shadow-sm text-center">
                {previewQrCodeUrl ? (
                  <img 
                    src={previewQrCodeUrl} 
                    alt="Preview QR Code PIX" 
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-stone-100 rounded-lg text-stone-400 text-xs text-center p-4">
                    Preencha a chave PIX acima para gerar o QR Code
                  </div>
                )}
                <span className="mt-2 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Valor: R$ {parseFloat(testAmount.replace(',', '.') || '0').toFixed(2).replace('.', ',')}</span>
                </span>
              </div>

              {/* Payload Copia e Cola */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1">
                    Código Copia e Cola Gerado (BRCode Oficial com o Valor Exato)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={previewPixPayload} 
                      placeholder="Código PIX copia e cola oficial aparecerá aqui..."
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs font-mono text-stone-600 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyPayload(previewPixPayload)}
                      disabled={!previewPixPayload}
                      className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedPayload ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      <span>{copiedPayload ? 'Copiado!' : 'Testar Cópia'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl text-xs text-stone-700 space-y-1">
                  <span className="font-bold text-stone-900 block flex items-center gap-1">
                    <ShieldCheck size={14} className="text-[#F28B20]" />
                    Como funciona no checkout do cliente?
                  </span>
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    O sistema soma automaticamente os lanches + adicionais + frete da região. O QR Code e o Copia e Cola são gerados no valor exato, sem que o cliente precise digitar o valor manualmente no app do banco. O dinheiro cai instantaneamente na sua conta cadastrada na chave PIX!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SEÇÃO CONTA BANCÁRIA (AGÊNCIA & CONTA / TED / DOC / DEPÓSITO) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Landmark size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-stone-900 uppercase">Conta Bancária (Agência & Conta)</h3>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    TED / DOC / Entre Contas
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  Para clientes que preferem pagar transferindo direto para o seu banco via agência e conta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-700">Conta Bancária Ativa?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.bankAccount?.enabled ?? true} 
                  onChange={e => setSettings({
                    ...settings,
                    bankAccount: {
                      ...settings.bankAccount,
                      enabled: e.target.checked
                    }
                  })} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                  Instituição Financeira / Banco *
                </label>
                <input
                  type="text"
                  value={settings.bankAccount?.bankName || ''}
                  onChange={e => setSettings({
                    ...settings,
                    bankAccount: { ...settings.bankAccount, bankName: e.target.value }
                  })}
                  placeholder="Ex: Nubank (260), Banco do Brasil, Bradesco, Itaú, Caixa, Sicredi"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm"
                />
                
                {/* Sugestões rápidas de banco */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-stone-400 font-bold uppercase py-0.5">Sugestões:</span>
                  {[
                    'Nubank (260)',
                    'Banco do Brasil (001)',
                    'Bradesco (237)',
                    'Itaú (341)',
                    'Caixa Econômica (104)',
                    'Sicredi (748)',
                    'Inter (077)'
                  ].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        bankAccount: { ...settings.bankAccount, bankName: b }
                      })}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md font-semibold transition-colors"
                    >
                      {b.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                    Número da Agência *
                  </label>
                  <input
                    type="text"
                    value={settings.bankAccount?.agency || ''}
                    onChange={e => setSettings({
                      ...settings,
                      bankAccount: { ...settings.bankAccount, agency: e.target.value }
                    })}
                    placeholder="Ex: 0001 ou 1234-5"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                    Número da Conta com Dígito *
                  </label>
                  <input
                    type="text"
                    value={settings.bankAccount?.accountNumber || ''}
                    onChange={e => setSettings({
                      ...settings,
                      bankAccount: { ...settings.bankAccount, accountNumber: e.target.value }
                    })}
                    placeholder="Ex: 99106460-4"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                    Tipo de Conta
                  </label>
                  <select
                    value={settings.bankAccount?.accountType || 'corrente'}
                    onChange={e => setSettings({
                      ...settings,
                      bankAccount: { ...settings.bankAccount, accountType: e.target.value as any }
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="corrente">Conta Corrente (CC)</option>
                    <option value="poupanca">Conta Poupança (CP)</option>
                    <option value="pagamento">Conta de Pagamento</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                    CPF ou CNPJ do Titular
                  </label>
                  <input
                    type="text"
                    value={settings.bankAccount?.holderDocument || ''}
                    onChange={e => setSettings({
                      ...settings,
                      bankAccount: { ...settings.bankAccount, holderDocument: e.target.value }
                    })}
                    placeholder="Ex: 000.000.000-00 (Opcional, mas útil p/ TED)"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                  Nome Completo do Titular da Conta *
                </label>
                <input
                  type="text"
                  value={settings.bankAccount?.holderName || ''}
                  onChange={e => setSettings({
                    ...settings,
                    bankAccount: { ...settings.bankAccount, holderName: e.target.value }
                  })}
                  placeholder="Ex: Braian Kleber Camargo"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                  Instruções para o Cliente
                </label>
                <input
                  type="text"
                  value={settings.bankAccount?.instructions || ''}
                  onChange={e => setSettings({
                    ...settings,
                    bankAccount: { ...settings.bankAccount, instructions: e.target.value }
                  })}
                  placeholder="Ex: Faça a transferência com o valor exato do pedido e anexe o comprovante com agência e conta."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Live Bank Card Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" /> Prévia do Cartão de Depósito
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                  Como o cliente vê
                </span>
              </div>

              {/* Physical/Digital Card Graphic */}
              <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-5 rounded-2xl border-2 border-stone-800 shadow-xl relative overflow-hidden space-y-4">
                {/* Background watermark */}
                <div className="absolute -right-4 -bottom-6 text-white/5 pointer-events-none">
                  <Landmark size={140} />
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 block">
                      DADOS PARA TRANSFERÊNCIA
                    </span>
                    <h4 className="font-black text-lg text-white uppercase tracking-tight">
                      {settings.bankAccount?.bankName || 'BANCO A DEFINIR'}
                    </h4>
                  </div>
                  <div className="p-2 bg-stone-800/80 rounded-xl border border-stone-700 text-yellow-400">
                    <Building2 size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-stone-800/70 p-2.5 rounded-xl border border-stone-700">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Agência</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-black text-sm text-yellow-300">
                        {settings.bankAccount?.agency || '0001'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (settings.bankAccount?.agency) {
                            navigator.clipboard.writeText(settings.bankAccount.agency);
                            setCopiedBankField('agency');
                            playSound('coin');
                            addToast({ message: 'Agência copiada!', type: 'success' });
                            setTimeout(() => setCopiedBankField(null), 2000);
                          }
                        }}
                        className="text-[10px] text-stone-400 hover:text-white p-1 rounded bg-stone-700/60 transition-colors"
                        title="Copiar Agência"
                      >
                        {copiedBankField === 'agency' ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-stone-800/70 p-2.5 rounded-xl border border-stone-700">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">
                      Conta ({settings.bankAccount?.accountType === 'poupanca' ? 'Poupança' : 'Corrente'})
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="font-mono font-black text-sm text-yellow-300">
                        {settings.bankAccount?.accountNumber || '00000000-0'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (settings.bankAccount?.accountNumber) {
                            navigator.clipboard.writeText(settings.bankAccount.accountNumber);
                            setCopiedBankField('account');
                            playSound('coin');
                            addToast({ message: 'Conta copiada!', type: 'success' });
                            setTimeout(() => setCopiedBankField(null), 2000);
                          }
                        }}
                        className="text-[10px] text-stone-400 hover:text-white p-1 rounded bg-stone-700/60 transition-colors"
                        title="Copiar Conta"
                      >
                        {copiedBankField === 'account' ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-800 pt-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-400">Titular:</span>
                    <span className="font-bold text-white uppercase text-right">
                      {settings.bankAccount?.holderName || 'NOME DO TITULAR'}
                    </span>
                  </div>
                  {settings.bankAccount?.holderDocument && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">CPF/CNPJ:</span>
                      <span className="font-mono text-stone-300 text-right">
                        {settings.bankAccount.holderDocument}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-[11px] text-blue-200 leading-tight">
                  {settings.bankAccount?.instructions || 'O cliente poderá copiar a agência e conta em 1 clique na finalização do pedido.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SEÇÃO CARTÃO DE CRÉDITO E DÉBITO ONLINE */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <CreditCard size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-stone-900 uppercase">Cartão de Crédito e Débito Online</h3>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Débito & Crédito
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium">
                  O cliente paga pelo cartão (débito ou crédito) e o dinheiro cai diretamente na sua conta bancária
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-700">Cartão Online Ativo?</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.cardOnline.enabled} 
                  onChange={e => setSettings({
                    ...settings,
                    cardOnline: { ...settings.cardOnline, enabled: e.target.checked }
                  })} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-xs text-stone-700 space-y-1">
              <p className="font-bold text-stone-900">
                Como o cliente paga no cartão e o dinheiro cai na sua conta bancária?
              </p>
              <p className="leading-relaxed">
                Você pode utilizar o <strong>Link de Pagamento / Checkout do Cartão</strong> gerado no seu próprio banco ou maquininha (como Mercado Pago, PagBank/PagSeguro, InfinitePay, Stone/Ton, Asaas, Nubank ou Stripe). O cliente abre o link seguro no próprio pedido, digita os dados do cartão de crédito ou débito, e o valor é creditado diretamente na sua conta bancária.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-stone-800">
                <input 
                  type="checkbox"
                  checked={settings.cardOnline.acceptCredit}
                  onChange={e => setSettings({
                    ...settings,
                    cardOnline: { ...settings.cardOnline, acceptCredit: e.target.checked }
                  })}
                  className="w-4 h-4 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                />
                <span>Aceitar Cartão de Crédito Online</span>
              </label>
            </div>

            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-stone-800">
                <input 
                  type="checkbox"
                  checked={settings.cardOnline.acceptDebit}
                  onChange={e => setSettings({
                    ...settings,
                    cardOnline: { ...settings.cardOnline, acceptDebit: e.target.checked }
                  })}
                  className="w-4 h-4 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                />
                <span>Aceitar Cartão de Débito Online</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Link de Recebimento do Cartão (Mercado Pago, InfinitePay, PagBank, Stone, etc.)
              </label>
              <input
                type="url"
                value={settings.cardOnline.paymentLinkUrl}
                onChange={e => setSettings({
                  ...settings,
                  cardOnline: { ...settings.cardOnline, paymentLinkUrl: e.target.value }
                })}
                placeholder="Ex: https://mpago.la/... ou seu link oficial de recebimento"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-900 outline-none focus:border-purple-500 text-sm"
              />
              <span className="text-[11px] text-stone-500 mt-1 block">
                Cole aqui o link de cobrança gerado no seu app para receber cartões de crédito e débito na sua conta bancária. Se deixar em branco, o cliente pode solicitar o link direto no WhatsApp ao enviar o pedido.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Instruções de Pagamento no Cartão
              </label>
              <input
                type="text"
                value={settings.cardOnline.instructions}
                onChange={e => setSettings({
                  ...settings,
                  cardOnline: { ...settings.cardOnline, instructions: e.target.value }
                })}
                placeholder="Ex: Pague no cartão com segurança. O valor cai direto para a lanchonete."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 uppercase block mb-1.5">
                Bandeiras Aceitas / Observações
              </label>
              <input
                type="text"
                value={settings.cardOnline.customNote || ''}
                onChange={e => setSettings({
                  ...settings,
                  cardOnline: { ...settings.cardOnline, customNote: e.target.value }
                })}
                placeholder="Ex: Aceitamos Visa, Mastercard, Elo e Hipercard."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-medium text-stone-900 outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. INFORMAÇÕES SOBRE PAGAMENTO NA ENTREGA */}
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-[#F28B20]" />
            <h3 className="font-black text-stone-900 uppercase text-sm">
              Formas de Pagamento na Entrega (ao Motoboy)
            </h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Além dos pagamentos online acima, o checkout do cliente inclui automaticamente as opções presenciais para a entrega:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
              <CreditCard size={16} className="text-purple-600" />
              <span>Cartão de Crédito (Maquininha)</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              <span>Cartão de Débito (Maquininha)</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 flex items-center gap-2">
              <QrCode size={16} className="text-green-600" />
              <span>PIX na Entrega (ao Motoboy)</span>
            </div>
          </div>
        </div>

        {/* Botão de Salvar no Rodapé */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg hover:shadow-green-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            <Check size={20} />
            <span>{isSaving ? 'Salvando Configurações...' : 'Salvar Formas de Pagamento'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
