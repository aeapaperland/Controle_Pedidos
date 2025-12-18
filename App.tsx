import React, { useState, useEffect } from 'react';
import Dashboard from './views/Dashboard';
import Orders from './views/Orders';
import Catalog from './views/Catalog';
import Financial from './views/Financial';
import Inventory from './views/Inventory';
import Production from './views/Production';
import { Menu, X, LayoutDashboard, ShoppingBag, BookOpen, DollarSign, LogOut, Camera, Upload, Download, CloudUpload, Save, RefreshCw, Smartphone, Monitor, Share2, Package, CalendarCheck, Cloud, AlertTriangle, CheckCircle } from 'lucide-react';
import { Order, Product, Customer, Transaction, OrderStatus, InventoryItem, ProductionStage } from './types';

// Mock Data (Initial State)
const INITIAL_ORDERS: Order[] = [];

const INITIAL_PRODUCTS: Product[] = [
  // 1. Mini Donuts
  { 
    id: 'prod_donut_mini', 
    name: 'Mini Donuts', 
    basePrice: 5.85, 
    costPrice: 2.00, 
    category: 'Donut', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 20,
    description: 'Mini donut personalizado no tema desejado.'
  },
  
  // 2. Pirulitos
  { 
    id: 'prod_pirulito', 
    name: 'Pirulitos', 
    basePrice: 14.00, 
    costPrice: 4.00, 
    category: 'Pirulito', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 20,
    description: 'Pirulito de chocolate decorado.'
  },

  // 3. Cake Pop
  { 
    id: 'prod_cakepop', 
    name: 'Cake Pop', 
    basePrice: 17.00, 
    costPrice: 5.00, 
    category: 'Cake Pop', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 30,
    description: 'Bolo no palito banhado em chocolate e decorado.'
  },

  // 4. CupCake
  { 
    id: 'prod_cupcake', 
    name: 'CupCake', 
    basePrice: 19.00, 
    costPrice: 6.00, 
    category: 'Cupcake', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 40,
    description: 'Cupcake massa fofinha com cobertura decorada.'
  },

  // 5. Pão de Mel (mini)
  { 
    id: 'prod_pdm_mini', 
    name: 'Pão de Mel (mini)', 
    basePrice: 19.50, 
    costPrice: 5.00, 
    category: 'Pão de Mel', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 25,
    description: 'Versão mini delicada recheada.'
  },

  // 6. Pão de Mel (médio)
  { 
    id: 'prod_pdm_med', 
    name: 'Pão de Mel (médio)', 
    basePrice: 22.00, 
    costPrice: 6.00, 
    category: 'Pão de Mel', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 30,
    description: 'Tamanho tradicional, ideal para lembrancinha.'
  },

  // 7. Pão de Mel no Palito
  { 
    id: 'prod_pdm_palito', 
    name: 'Pão de Mel no Palito', 
    basePrice: 25.00, 
    costPrice: 7.00, 
    category: 'Pão de Mel', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 35,
    description: 'Decorado no palito, excelente para compor a mesa.'
  },

  // 8. PopsCicle
  { 
    id: 'prod_popscicle', 
    name: 'PopsCicle', 
    basePrice: 22.00, 
    costPrice: 7.00, 
    category: 'Popsicle', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 40,
    description: 'Picolé de bolo trufado (estilo Magnum) decorado no tema.'
  },

  // 9. Trufas
  { 
    id: 'prod_trufa', 
    name: 'Trufas', 
    basePrice: 16.00, 
    costPrice: 4.00, 
    category: 'Trufa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 25,
    description: 'Trufa de chocolate nobre recheada e decorada.'
  },

  // 10. Lascas de Chocolate Decoradas
  { 
    id: 'prod_lascas', 
    name: 'Lascas de Chocolate Decoradas', 
    basePrice: 28.00, 
    costPrice: 8.00, 
    category: 'Chocolate', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 30,
    description: 'Pedaços rústicos de chocolate nobre com toppings e decorações.'
  },

  // 11. Biscoitos Decorados
  { 
    id: 'prod_biscoito', 
    name: 'Biscoitos Decorados', 
    basePrice: 24.00, 
    costPrice: 6.00, 
    category: 'Biscoito', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 45,
    description: 'Biscoito amanteigado decorado com glacê real (Unidade).'
  },

  // 12. Biscoitos Decorados (Coleção com 6)
  { 
    id: 'prod_biscoito_6', 
    name: 'Biscoitos Decorados (Coleção com 6)', 
    basePrice: 139.00, 
    costPrice: 35.00, 
    category: 'Biscoito', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 240,
    description: 'Coleção temática especial contendo 6 biscoitos decorados.'
  },

  // 13. 3D Modelagens Especiais
  { 
    id: 'prod_3d', 
    name: '3D Modelagens Especiais', 
    basePrice: 35.00, 
    costPrice: 10.00, 
    category: 'Modelagem', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 60,
    description: 'Personagens ou itens complexos totalmente modelados à mão.'
  },

  // 14. Kit Personalizado 1
  { 
    id: 'prod_kit_1', 
    name: 'Kit Personalizado 1', 
    basePrice: 426.00, 
    costPrice: 150.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 180,
    description: '10 Mini Donuts, 5 Cake Pops, 5 Pães de Mel (mini), 5 Pirulitos, 5 Cupcakes.'
  },

  // 15. Kit Personalizado 2
  { 
    id: 'prod_kit_2', 
    name: 'Kit Personalizado 2', 
    basePrice: 677.00, 
    costPrice: 250.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 300,
    description: '20 Mini Donuts, 8 Cake Pops, 8 Pães de Mel (mini), 8 Pirulitos, 8 Cupcakes.'
  },

  // 16. Kit Personalizado 3
  { 
    id: 'prod_kit_3', 
    name: 'Kit Personalizado 3', 
    basePrice: 852.00, 
    costPrice: 350.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 420,
    description: '30 Mini Donuts, 10 Cake Pops, 10 Pães de Mel (mini), 10 Pirulitos, 10 Cupcakes.'
  },

  // 17. Mini Donuts na Caixinha (com 2 donuts)
  { 
    id: 'prod_box_2', 
    name: 'Mini Donuts na Caixinha (com 2 donuts)', 
    basePrice: 18.50, 
    costPrice: 6.00, 
    category: 'Kit', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 30,
    description: 'Caixinha para presente contendo 2 mini donuts decorados.'
  },

  // 18. Mini Donuts na Caixinha (com 9 donuts)
  { 
    id: 'prod_box_9', 
    name: 'Mini Donuts na Caixinha (com 9 donuts)', 
    basePrice: 54.00, 
    costPrice: 15.00, 
    category: 'Kit', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 60,
    description: 'Caixa grande contendo 9 mini donuts decorados.'
  },
];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'i1', name: 'Chocolate ao Leite (Nobre)', quantity: 2.5, unit: 'kg', minStock: 1.0 },
    { id: 'i2', name: 'Leite Condensado', quantity: 10, unit: 'un', minStock: 5 },
    { id: 'i3', name: 'Pasta Americana Branca', quantity: 800, unit: 'g', minStock: 500 },
];

// Helper to resize images before saving to prevent LocalStorage Quota limits on mobile
const resizeImage = (base64Str: string, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Compress to JPEG 0.8 quality to save space
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64Str); // Fail safe
  });
};

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Nunca');
  
  // App State with Persistence
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  
  // Logo State (Persisted)
  const [logo, setLogo] = useState<string>(() => {
    return localStorage.getItem('appLogo') || '';
  });

  // Safe Save function
  const saveToStorage = (key: string, data: any) => {
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
          console.error(`Erro ao salvar ${key}:`, e);
          alert("Atenção: Memória cheia! Tente apagar fotos antigas ou fazer backup dos dados.");
      }
  };

  // Persistence Effects
  useEffect(() => { saveToStorage('orders', orders); }, [orders]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('customers', customers); }, [customers]);
  useEffect(() => { saveToStorage('transactions', transactions); }, [transactions]);
  useEffect(() => { saveToStorage('inventory', inventory); }, [inventory]);
  
  useEffect(() => {
      const savedTime = localStorage.getItem('lastSyncTime');
      if (savedTime) setLastSyncTime(savedTime);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingBag size={20} /> },
    { id: 'production', label: 'Produção', icon: <CalendarCheck size={20} /> },
    { id: 'inventory', label: 'Estoque', icon: <Package size={20} /> },
    { id: 'catalog', label: 'Catálogo', icon: <BookOpen size={20} /> },
    { id: 'financial', label: 'Financeiro', icon: <DollarSign size={20} /> },
  ];

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  // Handle Logo Upload with Compression
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Resize before saving to avoid storage limits
        resizeImage(base64).then(resized => {
            setLogo(resized);
            try {
                localStorage.setItem('appLogo', resized);
            } catch (e) {
                alert("Imagem muito grande mesmo após compressão. Tente outra.");
            }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Data (Backup) - Enhanced with Web Share API for Mobile
  const handleExportData = async () => {
      const now = new Date().toISOString();
      const data = {
          orders,
          products,
          customers,
          transactions,
          inventory,
          logo,
          exportDate: now
      };
      
      const jsonString = JSON.stringify(data);
      const fileName = `AEA_Dados_${now.slice(0, 10)}.json`;
      
      // Update Last Sync Time
      const formattedTime = new Date().toLocaleString('pt-BR');
      setLastSyncTime(formattedTime);
      localStorage.setItem('lastSyncTime', formattedTime);

      // Try Native Share (Mobile/Supported Browsers)
      try {
          const file = new File([jsonString], fileName, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                  files: [file],
                  title: 'Sincronização A&A Delícias',
                  text: 'Arquivo de dados para sincronização.'
              });
              return; // Success, exit function
          }
      } catch (err) {
          console.log("Sharing failed or cancelled, falling back to download", err);
      }

      // Fallback: Direct Download (Desktop)
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
  };

  // Import Data (Restore)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              // Version Check
              if (json.exportDate) {
                  const fileDate = new Date(json.exportDate);
                  const confirmMsg = `Este arquivo é de ${fileDate.toLocaleString('pt-BR')}. Deseja carregar estes dados?`;
                  if (!window.confirm(confirmMsg)) {
                      e.target.value = '';
                      return;
                  }
              }

              if (json.orders) setOrders(json.orders);
              if (json.products) setProducts(json.products);
              if (json.customers) setCustomers(json.customers);
              if (json.transactions) setTransactions(json.transactions);
              if (json.inventory) setInventory(json.inventory);
              if (json.logo) {
                  setLogo(json.logo);
                  localStorage.setItem('appLogo', json.logo);
              }
              
              // Update Sync Time
              const now = new Date().toLocaleString('pt-BR');
              setLastSyncTime(now);
              localStorage.setItem('lastSyncTime', now);

              alert("Dados carregados com sucesso! O sistema está atualizado.");
              window.location.reload();
          } catch (err) {
              alert("Erro ao ler arquivo. Verifique se é um arquivo válido do sistema.");
          }
      };
      reader.readAsText(file);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={orders} onNavigate={handleNavigate} logo={logo} />;
      case 'orders':
        return (
          <Orders 
            orders={orders} 
            products={products} 
            customers={customers}
            transactions={transactions}
            setOrders={setOrders}
            setCustomers={setCustomers}
            setTransactions={setTransactions}
            onBack={() => setCurrentView('dashboard')}
            logo={logo}
          />
        );
      case 'production':
        return (
          <Production 
            orders={orders} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'inventory':
        return (
          <Inventory 
            inventory={inventory} 
            setInventory={setInventory}
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      case 'catalog':
        return (
          <Catalog 
            products={products} 
            onBack={() => setCurrentView('dashboard')} 
            onDelete={handleDeleteProduct}
            onAdd={handleAddProduct}
            onUpdate={handleUpdateProduct}
          />
        );
      case 'financial':
        return (
          <Financial 
             transactions={transactions} 
             setTransactions={setTransactions} 
             onBack={() => setCurrentView('dashboard')}
             orders={orders}
             logo={logo}
          />
        );
      default:
        return <Dashboard orders={orders} onNavigate={handleNavigate} logo={logo} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-rose-50 overflow-hidden font-sans text-gray-800">
      
      {/* TOP NAVIGATION BAR */}
      <header className="bg-white border-b border-rose-100 shadow-sm z-20 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo Section (Clickable for Upload) */}
            <div className="flex-shrink-0 flex items-center">
               <label className="cursor-pointer relative group flex items-center gap-2" title="Clique para alterar a logo">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoUpload}
                  />
                  {logo ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-rose-100">
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={16} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-200 transition-colors">
                       <Upload size={20} />
                    </div>
                  )}
               </label>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4 items-center">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${currentView === item.id 
                      ? 'text-rose-600 bg-rose-50' 
                      : 'text-gray-500 hover:text-rose-500 hover:bg-gray-50'}
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              
              {/* Sync Button (Desktop) */}
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                title={`Sincronizado: ${lastSyncTime}`}
              >
                  {lastSyncTime !== 'Nunca' ? <CheckCircle size={18} className="text-green-500"/> : <RefreshCw size={18} />}
                  <span className="hidden lg:inline">Sincronizar</span>
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              
              <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <LogOut size={18} />
                Sair
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden gap-4">
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                className="text-blue-600"
              >
                  <Cloud size={24} />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-100 focus:outline-none transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-rose-100 shadow-lg animate-fade-in z-50">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-4 text-base font-medium rounded-lg transition-colors
                    ${currentView === item.id 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-rose-500'}
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              
              <div className="border-t border-gray-100 my-2 pt-2 px-3">
                 <button 
                    onClick={() => { setIsSyncModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold"
                 >
                    <RefreshCw size={18} /> Sincronizar / Google Drive
                 </button>
              </div>

              <div className="border-t border-gray-100 my-2 pt-2">
                 <button className="w-full flex items-center gap-3 px-3 py-4 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg">
                    <LogOut size={20} />
                    Sair do Sistema
                 </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
             {renderView()}
          </div>
        </div>
      </main>

      {/* SYNC / BACKUP MODAL */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white text-center relative">
                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Cloud size={28} /> Sincronização Nuvem
                    </h2>
                    <p className="text-blue-100 text-sm mt-2">
                        Conecte seus dispositivos via Google Drive
                    </p>
                    <button 
                        onClick={() => setIsSyncModalOpen(false)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800 flex gap-2 items-start">
                        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="mb-1 font-bold">Como funciona:</p>
                            1. Faça alterações em um aparelho (Ex: PC).<br/>
                            2. Clique em <strong>"Salvar no Drive"</strong>.<br/>
                            3. No outro aparelho (Ex: Celular), clique em <strong>"Abrir do Drive"</strong> para atualizar.
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400">
                        Última atualização: <span className="font-bold text-gray-600">{lastSyncTime}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* EXPORT SECTION */}
                        <button 
                            onClick={handleExportData}
                            className="w-full py-4 bg-blue-50 border-2 border-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-100 hover:border-blue-300 transition-all flex items-center justify-center gap-3 group"
                        >
                            <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload size={24} />
                            </div>
                            <div className="text-left">
                                <span className="block text-lg">Salvar no Drive</span>
                                <span className="block text-xs font-normal opacity-70">Envia os dados atuais para a nuvem</span>
                            </div>
                        </button>

                        {/* IMPORT SECTION */}
                        <label className="w-full py-4 bg-green-50 border-2 border-green-100 text-green-700 rounded-xl font-bold hover:bg-green-100 hover:border-green-300 transition-all flex items-center justify-center gap-3 cursor-pointer group">
                            <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                            <div className="bg-white p-2 rounded-full text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                                <Download size={24} />
                            </div>
                            <div className="text-left">
                                <span className="block text-lg">Abrir do Drive</span>
                                <span className="block text-xs font-normal opacity-70">Atualiza este aparelho com o arquivo</span>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                    <button onClick={() => setIsSyncModalOpen(false)} className="text-gray-500 text-sm hover:underline">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default App;
