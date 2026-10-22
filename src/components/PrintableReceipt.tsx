import { Order, PrinterSettings, isOrderPaid } from '../lib/db';
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
      style={{ 
        wordBreak: 'break-word', 
        overflowWrap: 'anywhere',
        color: '#000000',
        backgroundColor: '#ffffff',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* Header */}
      <div className="text-center pb-2 border-b-2 border-black mb-2" style={{ borderBottom: '2px solid #000' }}>
        <h2 className="font-black text-xl tracking-tight uppercase" style={{ fontWeight: 900, color: '#000' }}>{settings.printHeader}</h2>
        {settings.printSubHeader && <p className="font-bold text-xs uppercase" style={{ fontWeight: 700, color: '#000' }}>{settings.printSubHeader}</p>}
        {settings.printPhone && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#000' }}>Tel/WhatsApp: {settings.printPhone}</p>}
        {settings.printAddress && <p className="text-[10px] leading-tight mt-0.5 break-words" style={{ color: '#222' }}>{settings.printAddress}</p>}
        {viaTitle && (
          <div 
            className="mt-1.5 py-0.5 px-2 font-black text-xs uppercase tracking-wider inline-block rounded-xs"
            style={{ 
              backgroundColor: '#000000', 
              color: '#ffffff', 
              WebkitPrintColorAdjust: 'exact', 
              printColorAdjust: 'exact',
              fontWeight: 900
            }}
          >
            {viaTitle}
          </div>
        )}
      </div>

      {/* Identification & Número do Pedido em Alto Destaque */}
      <div className="mb-2 pb-2 border-b-2 border-black" style={{ borderBottom: '2px solid #000' }}>
        {settings.showOrderNumber && (
          <div 
            className="my-2 py-2 px-3 text-center rounded-sm border-2 border-black shadow-sm"
            style={{ 
              backgroundColor: '#000000', 
              color: '#ffffff', 
              border: '2px solid #000000',
              WebkitPrintColorAdjust: 'exact', 
              printColorAdjust: 'exact' 
            }}
          >
            <div className="font-black text-2xl sm:text-3xl tracking-tight leading-none uppercase" style={{ fontWeight: 900, color: '#ffffff' }}>
              PEDIDO #{order.orderNumber || (order.id ? order.id.substring(0, 4).toUpperCase() : '1')}
            </div>
            {settings.showPassword && order.id && (
              <div className="text-xs font-black tracking-widest mt-1 uppercase" style={{ color: '#ffffff', fontWeight: 900 }}>
                SENHA: {order.id.substring(0, 4).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-black font-bold text-center mt-1" style={{ color: '#000', fontWeight: 700 }}>Data/Hora: {orderTimeStr}</p>
        
        {/* Customer Details */}
        <div className="mt-1.5 pt-1.5 border-t border-dotted border-black" style={{ borderTop: '1px dotted #000' }}>
          <p className="font-bold text-sm break-words" style={{ color: '#000' }}>Cliente: <span className="font-black uppercase" style={{ fontWeight: 900 }}>{sanitizeForThermal(order.userName || 'Balcão / Cliente')}</span></p>
          {settings.showCustomerPhone && order.whatsapp && (
            <p className="font-semibold text-xs mt-0.5" style={{ color: '#000' }}>WhatsApp: {order.whatsapp}</p>
          )}
          {settings.showDeliveryAddress && (
            <div 
              className="mt-1 p-1.5 border border-dashed border-black text-xs rounded-xs"
              style={{ 
                backgroundColor: '#ffffff', 
                border: '1px dashed #000000',
                WebkitPrintColorAdjust: 'exact', 
                printColorAdjust: 'exact'
              }}
            >
              <div className="font-black uppercase text-[10px]" style={{ color: '#000', fontWeight: 900 }}>Endereço de Entrega:</div>
              <div className="font-bold break-words leading-snug mt-0.5" style={{ color: '#000', fontWeight: 700 }}>
                {order.address || 'Retirada no Balcão'}
                {order.region && !hasRegion && (
                  <span> ({order.region})</span>
                )}
              </div>
            </div>
          )}
          {order.receiptNotes && (
            <div 
              className="mt-1 p-1 text-xs break-words"
              style={{ 
                backgroundColor: '#ffffff', 
                borderLeft: '3px solid #000000', 
                borderTop: '1px solid #ddd',
                borderBottom: '1px solid #ddd',
                color: '#000'
              }}
            >
              <span className="font-bold">Obs. Entrega: </span>{sanitizeForThermal(order.receiptNotes)}
            </div>
          )}
        </div>
      </div>

      {/* Items Section - Itens do Pedido em Destaque e Negrito */}
      <div className="py-1 mb-2">
        <div 
          className="font-black text-center text-sm py-1 uppercase tracking-wider mb-2.5 border-y-2 border-black"
          style={{ 
            backgroundColor: '#000000', 
            color: '#ffffff', 
            borderTop: '2px solid #000',
            borderBottom: '2px solid #000',
            WebkitPrintColorAdjust: 'exact', 
            printColorAdjust: 'exact',
            fontWeight: 900
          }}
        >
          {isKitchenOnly ? 'PREPARO DA COZINHA' : 'ITENS DO PEDIDO'}
        </div>

        <div className="space-y-2.5">
          {order.items?.map((item, i) => {
            const extrasTotal = item.extras?.reduce((s: number, e: any) => s + (Number(e.price) || 0), 0) || 0;
            const itemTotal = (Number(item.price) + extrasTotal) * Number(item.quantity);

            return (
              <div key={i} className="border-b-2 border-black pb-2.5 mb-2.5" style={{ borderBottom: '2px solid #000000' }}>
                <div className="flex justify-between items-start font-black gap-2">
                  <span className="flex-1 min-w-0 break-words leading-tight uppercase font-black text-base sm:text-[17px] text-black" style={{ color: '#000', fontWeight: 900 }}>
                    <span 
                      className="inline-block px-2 py-0.5 rounded text-sm font-black mr-1.5 align-middle"
                      style={{ 
                        backgroundColor: '#000000', 
                        color: '#ffffff', 
                        WebkitPrintColorAdjust: 'exact', 
                        printColorAdjust: 'exact',
                        fontWeight: 900
                      }}
                    >
                      {item.quantity}x
                    </span>
                    <span className="align-middle font-black" style={{ fontWeight: 900 }}>{sanitizeForThermal(item.name || 'Item')}</span>
                  </span>
                  {!isKitchenOnly && (
                    <span className="shrink-0 font-mono font-black text-sm sm:text-base whitespace-nowrap text-right text-black" style={{ fontWeight: 900, color: '#000' }}>
                      R$ {itemTotal.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {item.extras && item.extras.length > 0 && (
                  <div className="pl-2.5 mt-1.5 space-y-1 text-xs border-l-4 border-black ml-1" style={{ borderLeft: '4px solid #000000' }}>
                    <div className="font-black text-black uppercase text-[11px] tracking-wide" style={{ fontWeight: 900, color: '#000' }}>
                      ADICIONAIS:
                    </div>
                    {item.extras.map((e: any, exIdx: number) => (
                      <div key={exIdx} className="flex justify-between text-black font-extrabold pl-0.5 gap-2" style={{ fontWeight: 800, color: '#000' }}>
                        <span className="min-w-0 break-words leading-tight">+ {sanitizeForThermal(e.name || '')}</span>
                        {!isKitchenOnly && (
                          <span className="shrink-0 font-mono font-extrabold text-black whitespace-nowrap text-xs" style={{ fontWeight: 800, color: '#000' }}>
                            {Number(e.price) > 0 ? `+R$ ${Number(e.price).toFixed(2).replace('.', ',')}` : 'Incluso'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {settings.showItemObservations && item.observation && item.observation.trim() && (
                  <div 
                    className="mt-2 py-1.5 px-2 text-xs font-black uppercase text-black break-words leading-snug rounded-xs"
                    style={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px dashed #000000',
                      borderLeft: '5px solid #000000',
                      color: '#000000',
                      fontWeight: 900,
                      WebkitPrintColorAdjust: 'exact', 
                      printColorAdjust: 'exact'
                    }}
                  >
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
        <div className="pt-1 pb-2 border-t-2 border-black mb-2" style={{ borderTop: '2px solid #000' }}>
          {(fee > 0 || discount > 0.01) && (
            <div className="flex justify-between text-xs font-semibold mb-0.5" style={{ color: '#000' }}>
              <span>Subtotal Itens:</span>
              <span className="font-mono">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {discount > 0.01 && (
            <div className="flex justify-between text-xs font-bold mb-0.5" style={{ color: '#000' }}>
              <span>Desconto:</span>
              <span className="font-mono">-R$ {discount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {fee > 0 && (
            <div className="flex justify-between text-xs font-semibold mb-1" style={{ color: '#000' }}>
              <span>Taxa de Entrega:</span>
              <span className="font-mono">R$ {fee.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div 
            className="flex justify-between items-center text-base font-black border-y-2 border-black py-1.5 my-1.5"
            style={{ 
              borderTop: '2px solid #000000', 
              borderBottom: '2px solid #000000',
              fontWeight: 900,
              color: '#000000'
            }}
          >
            <span>TOTAL DO PEDIDO:</span>
            <span className="font-mono text-lg">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>

          {settings.showPaymentDetails && (
            <div className="mt-2 text-xs" style={{ color: '#000' }}>
              <div 
                className="text-center font-black text-xs py-1 px-1 uppercase tracking-wide mb-1.5 rounded-xs"
                style={{ 
                  backgroundColor: '#000000', 
                  color: '#ffffff', 
                  WebkitPrintColorAdjust: 'exact', 
                  printColorAdjust: 'exact',
                  fontWeight: 900
                }}
              >
                {isOrderPaid(order) ? '>>> PEDIDO PAGO E CONFIRMADO <<<' : '>>> AGUARDANDO PAGAMENTO <<<'}
              </div>
              <p className="font-bold break-words" style={{ color: '#000' }}>
                Pagamento: <span className="font-black uppercase" style={{ fontWeight: 900 }}>{cleanPayment}</span>
              </p>
              <p className="font-bold" style={{ color: '#000' }}>
                Status: <span className="font-black" style={{ fontWeight: 900 }}>{isOrderPaid(order) ? 'PAGO' : 'AGUARDANDO PAGAMENTO'}</span>
              </p>
              {order.changeFor && (
                <p className="font-black mt-0.5" style={{ color: '#000', fontWeight: 900 }}>Troco para: R$ {order.changeFor}</p>
              )}
              {order.receiptAuthCode && (
                <div 
                  className="mt-1 p-1 border border-stone-400 text-[10px] break-words"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #888', color: '#000' }}
                >
                  <p className="font-bold">Autenticação: {order.receiptAuthCode}</p>
                  {order.receiptTimestamp && <p>Horário: {order.receiptTimestamp}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2 border-t-2 border-dashed border-black" style={{ borderTop: '2px dashed #000' }}>
        {settings.printFooter && (
          <p className="font-bold uppercase text-xs break-words" style={{ fontWeight: 700, color: '#000' }}>{settings.printFooter}</p>
        )}
        <p className="font-black text-xs mt-1" style={{ fontWeight: 900, color: '#000' }}>*** ATÉ A PRÓXIMA! ***</p>
      </div>

      {/* Feed lines for physical printer cutter */}
      <div style={{ height: `${(settings.feedLines || 4) * 0.4}cm` }} className="w-full"></div>
    </div>
  );
}
