import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, History, Star, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogle, signOut } from '../lib/firebase';
import { getUserProfile, getTopUsers, getLatestOrders, UserProfile, Order } from '../lib/db';
import { RANKING_DATA } from '../data';

interface SidebarProps {
  user: FirebaseUser | null;
  onReorder: (order: Order) => void;
}

export default function Sidebar({ user, onReorder }: SidebarProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [topUsers, setTopUsers] = useState<(UserProfile & { id: string })[]>([]);
  const [latestOrders, setLatestOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const top = await getTopUsers();
        setTopUsers(top);

        if (user) {
          const p = await getUserProfile(user.uid);
          setProfile(p);
          const orders = await getLatestOrders(user.uid);
          setLatestOrders(orders);
        } else {
          setProfile(null);
          setLatestOrders([]);
        }
      } catch (error) {
        console.error("Error loading sidebar data:", error);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="flex flex-col space-y-6 h-full">
      {/* Profile / Login Section */}
      <div className="comic-panel p-4 rounded-2xl text-black">
        {user ? (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={user.photoURL || ''} alt="Profile" className="w-12 h-12 rounded-full border border-stone-200 shadow-sm" />
                <div>
                  <h4 className="font-bold text-lg leading-tight">{user.displayName}</h4>
                  <span className="text-xs font-bold text-zinc-600 bg-zinc-100 border border-stone-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Star size={10} className="text-yellow-500" /> {profile?.xp || 0} XP
                  </span>
                </div>
              </div>
              <button 
                onClick={signOut}
                className="p-2 border border-stone-200 rounded-lg hover:bg-zinc-100 shadow-sm hover:shadow-sm transition-all hover:-translate-y-1 bg-white"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
            
            {latestOrders.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-black border-dashed">
                <h5 className="font-display font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                  <History size={16} /> Últimos Pedidos
                </h5>
                <div className="space-y-2">
                  {latestOrders.map(order => (
                    <div key={order.id} className="bg-zinc-100 p-3 rounded-lg border border-stone-200 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-bold flex flex-wrap gap-1">
                          {order.items.map((item, i) => <span key={i} title={item.name}>{item.emoji}</span>)}
                        </div>
                        <div className="text-xs font-bold font-display bg-white px-2 py-1 rounded-full border border-stone-200">
                          R$ {order.totalPrice.toFixed(2)}
                        </div>
                      </div>
                      <button 
                        onClick={() => onReorder(order)}
                        className="w-full py-1.5 bg-yellow-400 text-black text-xs font-display font-bold uppercase tracking-wider rounded-md border border-stone-200 shadow-sm hover:shadow-sm active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={14} /> Pedir Novamente
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 flex flex-col items-center">
            <h4 className="font-display font-bold text-lg mb-2">Entre na Brincadeira!</h4>
            <p className="text-xs font-bold text-zinc-600 mb-4">Faça login para salvar seus pedidos e acumular pontos de XP.</p>
            <button 
              onClick={signInWithGoogle}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-stone-200 text-black font-bold rounded-xl hover:bg-zinc-100 shadow-sm hover:shadow-sm transition-all hover:-translate-y-1"
            >
              <LogIn size={20} /> Entrar com Google
            </button>
          </div>
        )}
      </div>

      {/* Rankings Section */}
      <div className="comic-panel p-4 rounded-2xl flex-grow flex flex-col text-black">
        <h4 className="text-xl font-display text-black comic-text-bold tracking-widest mb-3">RANKING DA GALERA</h4>
        
        <div className="space-y-3 flex-grow">
          {(topUsers.length > 0 ? topUsers : RANKING_DATA).slice(0, 5).map((u, index) => {
            // Support both mock data and real data
            const name = (u as any).name;
            const xp = (u as UserProfile).xp !== undefined ? (u as UserProfile).xp : (u as any).points;
            const avatar = (u as UserProfile).avatarUrl ? (
              <img src={(u as UserProfile).avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (u as any).avatar
            );
            const isCurrentUser = user && (u as UserProfile).email === user.email;

            return (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-2 rounded-xl border border-stone-200 ${
                  index === 0 
                    ? 'bg-yellow-400 shadow-sm' 
                    : 'bg-zinc-100 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-display ${index === 0 ? 'text-black' : 'text-zinc-500'}`}>
                    {index + 1}º
                  </span>
                  <div className="w-8 h-8 bg-white border border-stone-200 rounded-full flex items-center justify-center text-sm overflow-hidden shadow-sm">
                    {avatar}
                  </div>
                  <span className="text-sm font-bold truncate max-w-[100px]">{name} {isCurrentUser && '(Você)'}</span>
                </div>
                <span className="text-sm font-bold bg-white border border-stone-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                  {xp} XP
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
