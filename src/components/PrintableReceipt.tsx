import React from 'react';
import { Order, PrinterSettings } from '../lib/db';

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
    const extras = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
    return sum + ((item.price + extras) * item.quantity);
  }, 0) || order.totalPrice;

  return (
    <div className={`text-black font-mono bg-white ${fontClass}`}>
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-black mb-2">
        <h2 className="font-black text-xl tracking-tight uppercase">{settings.printHeader}</h2>
        {settings.printSubHeader && <p className="font-bold text-xs uppercase">{settings.printSubHeader}</p>}
        {settings.printPhone && <p className="text-[11px] font-semibold mt-0.5">{settings.printPhone}</p>}
        {settings.printAddress && <p className="text-[10px] text-stone-700 leading-none mt-0.5">{settings.printAddress}</p>}
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
        <p className="text-[11px] text-stone-800">Horário: {orderTimeStr}</p>
        
        {/* Customer Details */}
        <div className="mt-1.5 pt-1.5 border-t border-dotted border-stone-400">
          <p className="font-bold text-sm">Cliente: <span className="font-black uppercase">{order.userName || 'Balcão / Cliente'}</span></p>
          {settings.showCustomerPhone && order.whatsapp && (
            <p className="font-semibold text-xs">WhatsApp: {order.whatsapp}</p>
          )}
          {settings.showDeliveryAddress && (
            <div className="mt-1 text-xs">
              <span className="font-bold">Entrega: </span>
              <span className="font-semibold">{order.address || 'Retirada no Balcão'}</span>
              {order.region && !order.address?.includes(order.region) && (
                <span className="italic"> ({order.region})</span>
              )}
            </div>
          )}
          {order.receiptNotes && (
            <div className="mt-1 p-1 bg-stone-100 border border-stone-400 text-xs">
              <span className="font-bold">Obs. Entrega: </span>{order.receiptNotes}
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
            const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;
            const itemTotal = (item.price + extrasTotal) * item.quantity;

            return (
              <div key={i} className="border-b border-dashed border-stone-300 pb-1.5">
                <div className="flex justify-between items-start font-black text-sm">
                  <span className="flex-1 pr-2">
                    {item.quantity}x {item.name}
                  </span>
                  {!isKitchenOnly && (
                    <span className="whitespace-nowrap">
                      R$ {itemTotal.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {item.extras && item.extras.length > 0 && (
                  <div className="pl-3 text-xs font-bold text-stone-800 mt-0.5">
                    + Adicionais: {item.extras.map((e: any) => e.name).join(', ')}
                  </div>
                )}

                {settings.showItemObservations && item.observation && item.observation.trim() && (
                  <div className="pl-3 mt-1 py-0.5 px-1 bg-stone-200 border-l-2 border-black text-xs font-black uppercase text-stone-900">
                    ⚠ OBS: {item.observation.trim()}
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
          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div className="flex justify-between text-xs font-semibold mb-0.5">
              <span>Subtotal:</span>
              <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Taxa de Entrega:</span>
              <span>R$ {order.deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-lg font-black border-y border-black py-1 my-1">
            <span>TOTAL:</span>
            <span>R$ {order.totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>

          {settings.showPaymentDetails && (
            <div className="mt-2 text-xs">
              <p className="font-bold">
                Forma de Pagamento: <span className="font-black uppercase">{order.paymentMethod || 'A Confirmar'}</span>
              </p>
              {order.changeFor && (
                <p className="font-black mt-0.5">Troco para: R$ {order.changeFor}</p>
              )}
              {order.receiptAuthCode && (
                <div className="mt-1 p-1 border border-stone-400 text-[10px] bg-stone-50">
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
          <p className="font-bold uppercase text-xs">{settings.printFooter}</p>
        )}
        <p className="font-black text-xs mt-1">***</p>
      </div>

      {/* Feed lines for physical printer cutter */}
      <div style={{ height: `${(settings.feedLines || 4) * 0.4}cm` }} className="w-full"></div>
    </div>
  );
}
