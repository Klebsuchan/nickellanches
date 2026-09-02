const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const interfaceStr = `interface ProfileViewProps {
  orderHistory?: OrderInfo[];
  onClose: () => void;
}`;

const replacementInterface = `import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../lib/db';
import { LogIn, LogOut, Star } from 'lucide-react';

interface ProfileViewProps {
  orderHistory?: OrderInfo[];
  onClose: () => void;
  user?: FirebaseUser | null;
  userProfile?: UserProfile | null;
  onLogin?: () => void;
  onLogout?: () => void;
}`;

content = content.replace(interfaceStr, replacementInterface);

const funcStr = `export default function ProfileView({ onClose, orderHistory = [] }: ProfileViewProps) {`;
const replacementFunc = `export default function ProfileView({ onClose, orderHistory = [], user, userProfile, onLogin, onLogout }: ProfileViewProps) {`;

content = content.replace(funcStr, replacementFunc);

// Find the "Histórico de Pedidos" section and insert the Login card ABOVE it
const authCard = `        {/* Authentication Card */}
        <div className="mb-12">
          {user ? (
            <div className="bg-white border-2 border-[#4E2A84] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E2A84] rounded-full blur-3xl opacity-10"></div>
              <div className="flex items-center gap-4 relative z-10">
                <img src={user.photoURL || ''} alt="Profile" className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover" />
                <div>
                  <h3 className="font-black text-2xl text-stone-900 leading-none">{user.displayName}</h3>
                  <p className="text-stone-500 font-medium text-sm mb-2">{user.email}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-sm rounded-full">
                    <Star size={14} className="fill-yellow-500" /> {userProfile?.xp || 0} Pontos de XP
                  </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-6 py-3 border-2 border-stone-200 text-stone-600 font-bold uppercase rounded-xl hover:bg-stone-50 hover:text-red-500 hover:border-red-200 transition-all relative z-10 w-full md:w-auto justify-center"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#4E2A84] to-[#6b3fb3] p-8 rounded-3xl shadow-md text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-20"></div>
              <div className="relative z-10 max-w-md">
                <h3 className="font-black text-3xl uppercase tracking-tight mb-2">Salve seus Pedidos</h3>
                <p className="text-white/80 font-medium">Faça login com o Google para manter seu histórico salvo na nuvem e acumular pontos de XP a cada pedido!</p>
              </div>
              <button 
                onClick={onLogin}
                className="flex items-center gap-2 px-8 py-4 bg-white text-[#4E2A84] font-black uppercase tracking-wider rounded-xl hover:scale-105 hover:shadow-lg active:scale-95 transition-all relative z-10 shadow-md w-full md:w-auto justify-center"
              >
                <LogIn size={20} /> Entrar com Google
              </button>
            </div>
          )}
        </div>

`;

const orderHistoryTarget = `        <div className="mt-12 mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-6 flex items-center gap-2">`;

content = content.replace(orderHistoryTarget, authCard + orderHistoryTarget);

fs.writeFileSync('src/components/ProfileView.tsx', content);
