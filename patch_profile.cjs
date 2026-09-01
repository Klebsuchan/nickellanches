const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

// Imports
content = content.replace("import { ArrowRight, MapPin, Plus, Trash2 } from 'lucide-react';", "import { ArrowRight, MapPin, Plus, Trash2, Clock, ChevronDown, ShoppingBag } from 'lucide-react';\nimport { OrderInfo } from '../types';\nimport { motion, AnimatePresence } from 'motion/react';");

// Props
content = content.replace("interface ProfileViewProps {", "interface ProfileViewProps {\n  orderHistory?: OrderInfo[];");
content = content.replace("export default function ProfileView({ onClose }: ProfileViewProps) {", "export default function ProfileView({ onClose, orderHistory = [] }: ProfileViewProps) {\n  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);");

// Order History Section
const orderHistoryUI = `
        <div className="mt-12 mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-6 flex items-center gap-2">
            <Clock className="text-[#F28B20]" size={24} /> Histórico de Pedidos
          </h3>
          
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 border-dashed">
                <ShoppingBag size={32} className="mx-auto mb-3 text-stone-300" />
                <p className="font-medium text-stone-500">Nenhum pedido encontrado.</p>
              </div>
            ) : (
              orderHistory.map(order => (
                <div key={order.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                  <div 
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-stone-900 text-lg">Pedido #{order.id}</p>
                      <p className="text-sm text-stone-500 font-medium">
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(order.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#4E2A84]">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      <ChevronDown size={20} className={\`text-stone-400 transition-transform \${expandedOrder === order.id ? 'rotate-180' : ''}\`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-stone-100 bg-stone-50/50"
                      >
                        <div className="p-5 space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <div>
                                <span className="font-bold text-stone-700">{item.quantity}x</span>{' '}
                                <span className="font-medium text-stone-600">{item.name}</span>
                                {item.extras && item.extras.length > 0 && (
                                  <div className="text-xs text-stone-500 ml-5 mt-0.5">
                                    + {item.extras.map(e => e.name).join(', ')}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-stone-600">
                                R$ {((item.price + (item.extras?.reduce((acc, e) => acc + e.price, 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
`;

content = content.replace("</div>\n    </div>", `${orderHistoryUI}\n      </div>\n    </div>`);

fs.writeFileSync('src/components/ProfileView.tsx', content);
