
import React from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, BookOpen, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobile, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingBag size={20} /> },
    { id: 'catalog', label: 'Catálogo', icon: <BookOpen size={20} /> },
    { id: 'financial', label: 'Financeiro', icon: <DollarSign size={20} /> },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-rose-100 shadow-lg transform transition-transform duration-300 ease-in-out
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 static'}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-rose-50 flex items-center justify-center">
            <h1 className="font-script text-3xl text-rose-600 font-bold">A&A Delícias</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (isMobile) setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${currentView === item.id 
                    ? 'bg-rose-50 text-rose-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-rose-50">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-rose-600 rounded-lg transition-colors">
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
