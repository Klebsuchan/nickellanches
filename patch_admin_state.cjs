const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Replace activeTab type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos'>('orders');",
  "const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promos' | 'banners'>('orders');"
);

// Add Banners import
content = content.replace(
  "import { Order, getProducts, saveProduct, deleteProduct, getPromos, savePromo, deletePromo, getAllOrders, updateOrderStatus, PromoCode, subscribeToAllOrders } from '../lib/db';",
  "import { Order, getProducts, saveProduct, deleteProduct, getPromos, savePromo, deletePromo, getAllOrders, updateOrderStatus, PromoCode, subscribeToAllOrders, Banner, getBanners, saveBanner, deleteBanner, subscribeToProducts, subscribeToPromos, subscribeToBanners } from '../lib/db';"
);

content = content.replace(
  "const [promos, setPromos] = useState<PromoCode[]>([]);",
  "const [promos, setPromos] = useState<PromoCode[]>([]);\n  const [banners, setBanners] = useState<Banner[]>([]);"
);

// We need to replace loadData and useEffect to use subscriptions
const oldLoadData = `  const loadData = async () => {
    try {
      setProducts(await getProducts());
      setPromos(await getPromos());
    } catch (e) {
      console.error(e);
      addToast({ message: 'Erro ao carregar dados', type: 'error' as any });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscribeToAllOrders((newOrders) => {
        setOrders(prev => {
          if (autoPrintRef.current) {
            const currentIds = new Set(prev.map(o => o.id));
            newOrders.forEach(order => {
              if (order.status === 'preparando' && order.id && !currentIds.has(order.id) && !printedOrders.current.has(order.id)) {
                console.log('Auto-printing new order', order.id);
                setOrderToPrint(order);
                printedOrders.current.add(order.id);
                localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders.current)));
              }
            });
          }
          return newOrders;
        });
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated]);`;

const newLoadData = `  const loadData = async () => {
    // Replaced by real-time subscriptions below
  };

  useEffect(() => {
    if (isAuthenticated) {
      const unsubOrders = subscribeToAllOrders((newOrders) => {
        setOrders(prev => {
          if (autoPrintRef.current) {
            const currentIds = new Set(prev.map(o => o.id));
            newOrders.forEach(order => {
              if (order.status === 'preparando' && order.id && !currentIds.has(order.id) && !printedOrders.current.has(order.id)) {
                console.log('Auto-printing new order', order.id);
                setOrderToPrint(order);
                printedOrders.current.add(order.id);
                localStorage.setItem('printed_orders', JSON.stringify(Array.from(printedOrders.current)));
                // Trigger real print dialogue here
                setTimeout(() => window.print(), 500);
              }
            });
          }
          return newOrders;
        });
      });
      const unsubProducts = subscribeToProducts(setProducts);
      const unsubPromos = subscribeToPromos(setPromos);
      const unsubBanners = subscribeToBanners(setBanners);

      return () => {
        unsubOrders();
        unsubProducts();
        unsubPromos();
        unsubBanners();
      };
    }
  }, [isAuthenticated]);`;

content = content.replace(oldLoadData, newLoadData);

// Add Banners Tab Button
content = content.replace(
  `<button onClick={() => setActiveTab('promos')} className={\`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-widest \${activeTab === 'promos' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}\`}><Tag size={18}/> Cupons</button>`,
  `<button onClick={() => setActiveTab('promos')} className={\`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-widest \${activeTab === 'promos' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}\`}><Tag size={18}/> Cupons</button>\n              <button onClick={() => setActiveTab('banners')} className={\`flex items-center gap-2 px-4 py-3 font-bold uppercase tracking-widest \${activeTab === 'banners' ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}\`}><Tag size={18}/> Banners</button>`
);

// Add Banners Tab render
content = content.replace(
  `{activeTab === 'promos' && <PromoEditor promos={promos} onUpdate={loadData} />}`,
  `{activeTab === 'promos' && <PromoEditor promos={promos} onUpdate={() => {}} />}\n            {activeTab === 'banners' && <BannerEditor banners={banners} />}`
);

// Change onUpdate passed to editors
content = content.replace(
  `<ProductEditor products={products} onUpdate={loadData} />`,
  `<ProductEditor products={products} onUpdate={() => {}} />`
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log('Done State Changes');
