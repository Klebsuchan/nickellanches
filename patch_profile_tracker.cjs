const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

// I need to add Gamepad2 to imports
content = content.replace("import { LogIn, LogOut, Star } from 'lucide-react';", "import { LogIn, LogOut, Star, Gamepad2, CheckCircle2, ChefHat, Bike, PackageCheck } from 'lucide-react';");
content = content.replace("export default function ProfileView({ onClose, orderHistory = [], user, userProfile, onLogin, onLogout }: ProfileViewProps) {", "export default function ProfileView({ onClose, orderHistory = [], user, userProfile, onLogin, onLogout, onPlayGame }: ProfileViewProps & { onPlayGame?: () => void }) {");

const activeOrdersCode = `
        {/* ACTIVE ORDERS TRACKER */}
        {orderHistory.filter(o => o.status !== 'entregue').length > 0 && (
          <div className="mb-12 space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tight text-[#F28B20] mb-6 flex items-center gap-2">
              <ChefHat size={28} /> Pedidos em Andamento
            </h3>
            {orderHistory.filter(o => o.status !== 'entregue').map(order => (
              <div key={order.id} className="bg-white border-2 border-[#4E2A84] p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F28B20] rounded-full blur-3xl opacity-10"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                    <h4 className="font-black text-xl text-stone-900">Pedido #{order.id.substring(0,6)}</h4>
                    <p className="text-stone-500 font-medium text-sm">Total: R$ {order.total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="bg-[#4E2A84] text-white px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wide">
                    {order.status === 'recebido' && 'Recebido'}
                    {order.status === 'preparando' && 'Na Cozinha'}
                    {order.status === 'a_caminho' && 'Saiu para Entrega'}
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="relative flex justify-between items-center mb-8 z-10 before:absolute before:top-1/2 before:-translate-y-1/2 before:h-1 before:bg-stone-200 before:w-full before:-z-10">
                  {[
                    { id: 'recebido', label: 'Recebido', icon: CheckCircle2 },
                    { id: 'preparando', label: 'Cozinha', icon: ChefHat },
                    { id: 'a_caminho', label: 'Entrega', icon: Bike },
                    { id: 'entregue', label: 'Concluído', icon: PackageCheck }
                  ].map((step, idx) => {
                    const statuses = ['recebido', 'preparando', 'a_caminho', 'entregue'];
                    const currentIndex = statuses.indexOf(order.status);
                    const isCompleted = idx <= currentIndex;
                    const isActive = idx === currentIndex;
                    
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center border-4 \${isCompleted ? 'bg-[#F28B20] border-white text-white shadow-md' : 'bg-stone-100 border-white text-stone-400'}\`}>
                          <step.icon size={18} />
                        </div>
                        <span className={\`text-xs font-bold uppercase tracking-wider \${isActive ? 'text-[#F28B20]' : 'text-stone-400'}\`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-2xl p-5 border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                  <div className="text-center md:text-left">
                    <h5 className="font-black text-stone-900 uppercase">A ansiedade bateu?</h5>
                    <p className="text-sm font-medium text-stone-500">Jogue nosso minigame enquanto preparamos seu lanche!</p>
                  </div>
                  <button 
                    onClick={() => { if(onPlayGame) onPlayGame(); }}
                    className="w-full md:w-auto bg-[#4E2A84] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-[#3a1f63] transition-colors shadow-md"
                  >
                    <Gamepad2 size={18} /> Jogar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
`;

content = content.replace('<div className="mb-8 flex items-center justify-between">', activeOrdersCode + '\n        <div className="mb-8 flex items-center justify-between">');
fs.writeFileSync('src/components/ProfileView.tsx', content);
