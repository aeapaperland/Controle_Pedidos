
import React, { useState, useEffect } from 'react';
import Dashboard from './views/Dashboard';
import Orders from './views/Orders';
import Catalog from './views/Catalog';
import Financial from './views/Financial';
import { Menu, X, LayoutDashboard, ShoppingBag, BookOpen, DollarSign, LogOut } from 'lucide-react';
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

  // 3. Mini Donuts na Caixinha (Subcampos solicitados)
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

  // 4. Clássicos e Doces Finos
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
  { 
    id: 'prod_lascas', 
    name: 'Lascas de Chocolate (250g)', 
    basePrice: 49.00, 
    costPrice: 14.00, 
    category: 'Chocolate', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 30,
    description: 'Pedaços rústicos de chocolate nobre com toppings e decorações.'
  },
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

  // 5. Biscoitos Decorados (Subcampos solicitados)
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

  // 6. Kits Personalizados (Subcampos solicitados)
  { 
    id: 'prod_kit_1', 
    name: 'Kit Personalizado 1', 
    basePrice: 150.00, 
    costPrice: 50.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 120,
    description: 'Kit P: 5 Mini Donuts, 5 Pirulitos, 5 Trufas.'
  },
  { 
    id: 'prod_kit_2', 
    name: 'Kit Personalizado 2', 
    basePrice: 280.00, 
    costPrice: 90.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 240,
    description: 'Kit M: 10 Mini Donuts, 10 Pirulitos, 10 Cupcakes, 5 Pães de Mel.'
  },
  { 
    id: 'prod_kit_3', 
    name: 'Kit Personalizado 3', 
    basePrice: 450.00, 
    costPrice: 150.00, 
    category: 'Kit Festa', 
    imageUrl: '', 
    measureUnit: 'un', 
    productionTimeMinutes: 360,
    description: 'Kit G: 15 Mini Donuts, 15 Pirulitos, 15 Cupcakes, 10 Trufas, 10 PopsCicles.'
  },

  // 7. Pão de Mel (Subcampos solicitados)
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
];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'i1', name: 'Chocolate ao Leite (Nobre)', quantity: 2.5, unit: 'kg', minStock: 1.0 },
    { id: 'i2', name: 'Leite Condensado', quantity: 10, unit: 'un', minStock: 5 },
    { id: 'i3', name: 'Pasta Americana Branca', quantity: 800, unit: 'g', minStock: 500 },
];

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // App State
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingBag size={20} /> },
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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={orders} onNavigate={handleNavigate} />;
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
          />
        );
      default:
        return <Dashboard orders={orders} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-rose-50 overflow-hidden font-sans text-gray-800">
      
      {/* TOP NAVIGATION BAR */}
      <header className="bg-white border-b border-rose-100 shadow-sm z-20 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavigate('dashboard')}>
               <div className="text-3xl font-script text-rose-600 font-bold select-none">
                  A&A Delícias
               </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 items-center">
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
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <LogOut size={18} />
                Sair
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
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

    </div>
  );
}

export default App;
