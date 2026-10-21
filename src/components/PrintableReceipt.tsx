import React from 'react';
import { Order, PrinterSettings } from '../lib/db';
import { sanitizeForThermal } from '../lib/printerService';

interface PrintableReceiptProps {
  order: Order | null;
  settings: PrinterSettings;
  viaTitle?: string;
  isKitchenOnly?: boolean;
}

export default function PrintableReceipt({ order, settings, viaTitle, isKitchenOnly = false }: PrintableReceiptProps) {
  if (!order) return null;

  const fontClass = 
    settings.fontSize === 'small' ? 'text-[11px] leading-tight' : 
    settings.fontSize === 'large' ? 'text-[15px] leading-snug' : 
    'text-[13px] leading-tight';

  const orderTimeStr = (() => {
    if (order.createdAt?.toDate) {
      const d = order.createdAt.toDate();
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (typeof order.createdAt === 'string') return order.createdAt;
    return new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  })();

  const subtotal = order.items?.reduce((sum, item) => {
    const extras = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
    return sum + ((Number(item.price) + extras) * Number(item.quantity));
  }, 0) || order.totalPrice;
  const fee = Number(order.deliveryFee) || 0;
  const total = Number(order.totalPrice) || 0;
  const discount = Math.max(0, (subtotal + fee) - total);
  const cleanPayment = sanitizeForThermal(order.paymentMethod || 'A Confirmar');
  const hasRegion = order.region && order.address && order.address.toLowerCase().includes(order.region.toLowerCase());

  return (
    <div 
      className={`text-black font-mono bg-white px-2 py-1 max-w-full overflow-hidden box-border ${fontClass}`}
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-black mb-2">
        <h2 className="font-black text-xl tracking-tight uppercase">{settings.printHeader}</h2>
        {settings.printSubHeader && <p className="font-bold text-xs uppercase">{settings.printSubHeader}</p>}
        {settings.printPhone && <p className="text-[11px] font-semibold mt-0.5">Tel/WhatsApp: {settings.printPhone}</p>}
        {settings.printAddress && <p className="text-[10px] text-stone-700 leading-tight mt-0.5 break-words">{settings.printAddress}</p>}
        {viaTitle && (
          <div className="mt-1.5 py-0.5 px-2 bg-black text-white font-black text-xs uppercase tracking-wider inline-block">
            {viaTitle}
          </div>
        )}
      </div>

      {/* Identification */}
      <div className="mb-2 pb-2 border-b border-dashed border-black">
        {settings.showOrderNumber && (
          <div className="flex justify-between items-center mb-1">
            <span className="font-black text-lg">PEDIDO #{order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1')}</span>
            {settings.showPassword && order.id && (
              <span className="border border-black px-1.5 py-0.5 text-xs font-black">
                SENHA: {order.id.substring(0, 4).toUpperCase()}
              </span>
            )}
          </div>
        )}
        <p className="text-[11px] text-stone-800 font-semibold">Data/Hora: {orderTimeStr}</p>
        
        {/* Customer Details */}
        <div className="mt-1.5 pt-1.5 border-t border-dotted border-stone-400">
          <p className="font-bold text-sm break-words">Cliente: <span className="font-black uppercase">{sanitizeForThermal(order.userName || 'Balcão / Cliente')}</span></p>
          {settings.showCustomerPhone && order.whatsapp && (
            <p className="font-semibold text-xs mt-0.5">WhatsApp: {order.whatsapp}</p>
          )}
          {settings.showDeliveryAddress && (
            <div className="mt-1 p-1.5 bg-stone-50 border border-dashed border-stone-400 text-xs">
              <div className="font-black uppercase text-[10px] text-stone-700">Endereço de Entrega:</div>
              <div className="font-bold break-words leading-snug mt-0.5">
                {order.address || 'Retirada no Balcão'}
                {order.region && !hasRegion && (
                  <span> ({order.region})</span>
                )}
              </div>
            </div>
          )}
          {order.receiptNotes && (
            <div className="mt-1 p-1 bg-stone-100 border-l-2 border-black text-xs break-words">
              <span className="font-bold">Obs. Entrega: </span>{sanitizeForThermal(order.receiptNotes)}
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="py-1 mb-2">
        <div className="font-black text-center text-xs py-0.5 bg-black text-white uppercase tracking-wider mb-2">
          {isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO'}
        </div>

        <div className="space-y-2">
          {order.items?.map((item, i) => {
            const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
            const itemTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);

            return (
              <div key={i} className="border-b border-dashed border-stone-300 pb-2">
                <div className="flex justify-between items-start font-black text-sm gap-2">
                  <span className="flex-1 min-w-0 break-words leading-tight uppercase">
                    {item.quantity}x {sanitizeForThermal(item.name || 'Item')}
                  </span>
                  {!isKitchenOnly && (
                    <span className="shrink-0 font-mono whitespace-nowrap text-right">
                      R$ {itemTotal.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {item.extras && item.extras.length > 0 && (
                  <div className="pl-2 mt-1 space-y-0.5 text-xs border-l-2 border-stone-400">
                    <div className="font-bold text-stone-900 uppercase text-[10px] tracking-wide">
                      Adicionais:
                    </div>
                    {item.extras.map((e: any, exIdx: number) => (
                      <div key={exIdx} className="flex justify-between text-stone-800 font-semibold pl-1 gap-2">
                        <span className="min-w-0 break-words leading-tight">+ {sanitizeForThermal(e.name || '')}</span>
                        {!isKitchenOnly && (
                          <span className="shrink-0 font-mono text-stone-700 whitespace-nowrap text-[11px]">
                            {Number(e.price) > 0 ? `+R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : 'Incluso'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {settings.showItemObservations && item.observation && item.observation.trim() && (
                  <div className="mt-1.5 py-1 px-1.5 bg-stone-200 border-l-4 border-black text-xs font-black uppercase text-stone-900 break-words leading-snug">
                    &gt;&gt; OBS: {sanitizeForThermal(item.observation.trim())}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financials / Payment (hidden if isKitchenOnly) */}
      {!isKitchenOnly && (
        <div className="pt-1 pb-2 border-t-2 border-black mb-2">
          {(fee > 0 || discount > 0.01) && (
            <div className="flex justify-between text-xs font-semibold mb-0.5">
              <span>Subtotal Itens:</span>
              <span className="font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {discount > 0.01 && (
            <div className="flex justify-between text-xs font-bold mb-0.5">
              <span>Desconto:</span>
              <span className="font-mono">-R$ {discount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {fee > 0 && (
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Taxa de Entrega:</span>
              <span className="font-mono">R$ {fee.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-base font-black border-y border-black py-1 my-1">
            <span>TOTAL DO PEDIDO:</span>
            <span className="font-mono">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>

          {settings.showPaymentDetails && (
            <div className="mt-2 text-xs">
              <p className="font-bold break-words">
                Pagamento: <span className="font-black uppercase">{cleanPayment}</span>
              </p>
              {order.changeFor && (
                <p className="font-black mt-0.5">Troco para: R$ {order.changeFor}</p>
              )}
              {order.receiptAuthCode && (
                <div className="mt-1 p-1 border border-stone-400 text-[10px] bg-stone-50 break-words">
                  <p className="font-bold">Autenticação: {order.receiptAuthCode}</p>
                  {order.receiptTimestamp && <p>Horário: {order.receiptTimestamp}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 border-t border-dashed border-black">
        {settings.printFooter && (
          <p className="font-bold uppercase text-xs break-words">{settings.printFooter}</p>
        )}
        <p className="font-black text-xs mt-1">*** ATÉ A PRÓXIMA! ***</p>
      </div>

      {/* Feed lines for physical printer cutter */}
      <div style={{ height: `${(settings.feedLines || 4) * 0.4}cm` }} className="w-full"></div>
    </div>
  );
}
