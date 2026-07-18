import React from 'react';
import { OrderInfo } from '../types';
import { Printer, CheckSquare } from 'lucide-react';

interface WaiterPanelProps {
  orders: OrderInfo[];
  onClose: () => void;
}

export default function WaiterPanel({ orders, onClose }: WaiterPanelProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 overflow-y-auto p-4 md:p-8">
      {/* App UI (Hidden during print) */}
      <div className="max-w-4xl mx-auto" id="waiter-ui">
        <div className="flex justify-between items-center border-b-4 border-black border-dashed pb-4 mb-8">
          <div className="flex flex-col">
            <h1 className="text-6xl font-display comic-text-bold leading-none tracking-wide">PAINEL DO GARÇOM</h1>
            <p className="text-xs tracking-[0.4em] uppercase text-zinc-600 font-bold mt-1">Comanda eletrônica e controle</p>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 border-2 border-yellow-400 text-yellow-400 font-display text-sm tracking-widest rounded-full hover:bg-yellow-400 hover:text-black transition-colors"
          >
            VOLTAR
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {orders.map(order => (
            <div key={order.id} className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-6 relative group hover:border-yellow-400 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-display uppercase">Pedido #{order.id}</h3>
                  <span className="text-sm text-zinc-400">{order.timestamp.toLocaleTimeString()}</span>
                </div>
                <button 
                  onClick={handlePrint}
                  className="p-2 bg-yellow-400 text-black rounded-lg shadow-[0_0_10px_rgba(250,204,21,0.5)] opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center"
                >
                  <Printer size={18} />
                  <span className="text-sm font-bold uppercase">Imprimir</span>
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between border-b border-zinc-800 pb-2">
                    <span><span className="font-bold text-yellow-400">{item.quantity}x</span> {item.name}</span>
                    <span className="font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-xl font-bold border-t border-zinc-800 pt-4">
                <span className="font-display tracking-widest">TOTAL:</span>
                <span className="font-display text-2xl text-yellow-400 tracking-wider">R$ {order.total.toFixed(2)}</span>
              </div>
              
              <button className="w-full mt-6 py-3 bg-zinc-800 text-yellow-400 rounded-lg font-display text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-yellow-400 hover:text-black transition-colors">
                <CheckSquare size={20} />
                Marcar como Preparado
              </button>
            </div>
          ))}
          
          {orders.length === 0 && (
            <div className="col-span-2 text-center py-12 text-zinc-500 font-display text-xl uppercase">
              Nenhum pedido ativo no momento.
            </div>
          )}
        </div>
      </div>

      {/* Printable Command (Only visible during print) */}
      <div id="printable-command" className="p-4 hidden bg-white text-black w-[80mm] mx-auto font-mono">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">NICKEL LANCHES</h2>
          <p className="text-sm">O Lanche Mais Divertido!</p>
          <p className="text-xs">--------------------------------</p>
        </div>
        
        {orders.length > 0 && (
          <div>
            <h3 className="font-bold text-lg mb-2">PEDIDO #{orders[0].id}</h3>
            <p className="text-sm mb-4">Hora: {orders[0].timestamp.toLocaleTimeString()}</p>
            
            <div className="space-y-2 text-sm border-t border-b border-black py-4 my-4">
              {orders[0].items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity}x {item.name.substring(0, 15)}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>R$ {orders[0].total.toFixed(2)}</span>
            </div>
            
            <div className="text-center mt-8 text-sm">
              <p>Obrigado pela preferência!</p>
              <p>*** VOLTE SEMPRE ***</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
