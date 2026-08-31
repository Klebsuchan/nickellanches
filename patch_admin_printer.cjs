const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const targetPrintArea = `            {orderToPrint && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="font-bold text-xl uppercase"><NickelText /> LANCHES</h2>
                  <p className="text-xs">O Lanche Mais Divertido!</p>
                  <p>--------------------------------</p>
                </div>
                
                <div className="mb-4 text-xs">
                  <p><strong>Pedido:</strong> #{orderToPrint.id?.substring(0,6).toUpperCase()}</p>
                  <p><strong>Data:</strong> {orderToPrint.createdAt?.toDate ? orderToPrint.createdAt.toDate().toLocaleString() : ''}</p>
                  <p>--------------------------------</p>
                  <p><strong>Cliente:</strong> {orderToPrint.userName || 'Anônimo'}</p>
                  <p><strong>Telefone:</strong> __________________</p>
                  <p><strong>Endereço:</strong> __________________</p>
                  <p>________________________________</p>
                </div>`;

const newPrintArea = `            {orderToPrint && (
              <div>
                <div className="text-center mb-4">
                  <h2 className="font-bold text-xl uppercase font-display"><NickelText /> LANCHES</h2>
                  <p className="text-sm font-bold">Delivery de Verdade!</p>
                  <p>--------------------------------</p>
                </div>
                
                <div className="mb-4 text-sm font-bold">
                  <p className="text-lg"><strong>SENHA:</strong> {orderToPrint.id?.substring(0,4).toUpperCase()}</p>
                  <p><strong>Pedido:</strong> #{orderToPrint.id}</p>
                  <p><strong>Data:</strong> {orderToPrint.createdAt?.toDate ? orderToPrint.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}</p>
                  <p>--------------------------------</p>
                  <p className="text-lg"><strong>Cliente:</strong> {orderToPrint.userName || 'Anônimo'}</p>
                  <p><strong>Pagamento:</strong> {orderToPrint.paymentMethod || 'A Confirmar'}</p>
                  <p><strong>Endereço:</strong> {orderToPrint.address || 'Retirada no Balcão'}</p>
                  <p>--------------------------------</p>
                </div>`;

content = content.replace(targetPrintArea, newPrintArea);

const oldPrintItems = `                  {orderToPrint.items.map((item, i) => (
                    <div key={i} className="mb-1">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.observation && (
                        <div className="pl-4 italic">- Obs: {item.observation}</div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="text-right text-xs">
                  <div className="font-bold text-lg">TOTAL: R$ {orderToPrint.totalPrice.toFixed(2)}</div>
                  <p>Agradecemos a preferência!</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}`;

const newPrintItems = `                  {orderToPrint.items.map((item, i) => {
                    const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
                    const itemTotal = (item.price + extrasTotal) * item.quantity;
                    return (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>R$ {itemTotal.toFixed(2)}</span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="pl-4 text-xs font-bold uppercase">+ {item.extras.map(e => e.name).join(', ')}</div>
                      )}
                      {item.observation && (
                        <div className="pl-4 text-xs italic font-bold uppercase">- Obs: {item.observation}</div>
                      )}
                    </div>
                  )})}
                </div>
                
                <div className="text-right">
                  <div className="font-black text-2xl uppercase mt-2">TOTAL: R$ {orderToPrint.totalPrice.toFixed(2)}</div>
                  <p className="text-sm font-bold uppercase mt-4 text-center">Agradecemos a preferência!</p>
                  <p className="text-center font-bold">---</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}`;

content = content.replace(oldPrintItems, newPrintItems);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Printer patched');
