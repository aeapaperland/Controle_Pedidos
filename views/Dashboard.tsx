import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import { Calendar, ClipboardList, BookOpen, DollarSign, Clock, Share2, X, Sparkles, MessageCircle, Gift } from 'lucide-react';
import { generateWeeklyReportPDF } from '../services/pdfService';

interface DashboardProps {
  orders: Order[];
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onNavigate }) => {
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);

  // --- Calculations ---
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Orders today
  const ordersToday = orders.filter(o => o.dueDate === todayStr && o.status !== OrderStatus.ORCAMENTO).length;

  // 2. Orders this week (Current Week: Monday to Sunday)
  const curr = new Date();
  const currentDay = curr.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  
  // Calculate days to subtract to get to Monday
  // If Sunday (0), go back 6 days. If Monday (1), go back 0 days.
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const ordersWeekList = orders.filter(o => {
    if (o.status === OrderStatus.ORCAMENTO) return false;
    
    // Parse YYYY-MM-DD safely to local date object at midnight
    const [y, m, d] = o.dueDate.split('-').map(Number);
    const orderDate = new Date(y, m - 1, d);
    orderDate.setHours(0, 0, 0, 0);
    
    return orderDate >= monday && orderDate <= sunday;
  }).sort((a, b) => {
     const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
     const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
     return dateA - dateB;
  });

  const ordersWeekCount = ordersWeekList.length;

  // Next Events (Upcoming confirmed orders)
  const nextEvents = orders
    .filter(o => {
        if (o.status === OrderStatus.ORCAMENTO) return false;
        const [y, m, d] = o.dueDate.split('-').map(Number);
        const orderDate = new Date(y, m - 1, d);
        const now = new Date();
        now.setHours(0,0,0,0);
        return orderDate >= now;
    })
    .sort((a, b) => {
        const dateA = new Date(a.dueDate + 'T00:00:00').getTime();
        const dateB = new Date(b.dueDate + 'T00:00:00').getTime();
        return dateA - dateB;
    })
    .slice(0, 3);

  // --- CRM: Opportunities (Birthdays coming up) ---
  // Regra: Lembrete aparece 11 meses após a festa anterior (ou seja, 1 mês antes do próximo aniversário)
  const opportunities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueClients = new Map<string, Order>();

    // Group by Customer + BirthdayPerson to avoid duplicates, keeping the latest order
    orders.forEach(order => {
       if (!order.birthdayPersonName) return;
       // Key: name + birthday person
       const key = `${order.customerName.toLowerCase()}-${order.birthdayPersonName.toLowerCase()}`;
       const existing = uniqueClients.get(key);
       
       if (!existing || new Date(order.dueDate) > new Date(existing.dueDate)) {
           uniqueClients.set(key, order);
       }
    });

    const results: { order: Order, nextDate: Date, newAge: number, daysUntil: number }[] = [];

    uniqueClients.forEach(order => {
        const [y, m, d] = order.dueDate.split('-').map(Number);
        const orderDate = new Date(y, m - 1, d); 
        orderDate.setHours(0,0,0,0);
        
        // 1. Check if the party has actually passed
        if (orderDate >= today) return;

        const currentYear = today.getFullYear();
        
        // Determine next occurrence this year based on MM/DD
        let nextDate = new Date(currentYear, orderDate.getMonth(), orderDate.getDate());
        
        // If date passed this year, next one is next year
        if (nextDate < today) {
            nextDate.setFullYear(currentYear + 1);
        }

        // Logic: Reminder appears after 11 months from the party date.
        // Effectively 1 month before nextDate.
        const reminderStart = new Date(nextDate);
        reminderStart.setMonth(nextDate.getMonth() - 1);
        reminderStart.setHours(0, 0, 0, 0);

        // Example: Party 20/12/2024. Next bday 20/12/2025. Reminder 20/11/2025.
        // If today is 20/11/2025: today >= reminderStart (True) -> Show
        // If today is 19/11/2025: today >= reminderStart (False) -> Hide
        
        if (today >= reminderStart) {
            const diffTime = nextDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const yearDiff = nextDate.getFullYear() - orderDate.getFullYear();
            const newAge = (order.birthdayPersonAge || 0) + yearDiff;
            
            results.push({
                order,
                nextDate,
                newAge,
                daysUntil: diffDays
            });
        }
    });

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [orders]);

  const handleCrmMessage = (op: { order: Order, nextDate: Date, newAge: number }) => {
      const firstName = op.order.customerName.split(' ')[0];
      const bdayName = op.order.birthdayPersonName;
      const dateStr = op.nextDate.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
      
      const msg = `Olá ${firstName}! Tudo bem? 🎂\n\nO sistema da A&A Delícias me avisou que o aniversário de *${bdayName}* está chegando (dia ${dateStr}).\n\nAno passado foi um prazer participar! Vamos planejar os doces para os *${op.newAge} aninhos*? 🥳🍬\n\nEstou à disposição!`;
      
      const whatsapp = op.order.customerWhatsapp.replace(/\D/g, '');
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
  };

  const handlePrintWeek = () => {
    generateWeeklyReportPDF(ordersWeekList, monday, sunday);
  };

  // Helper for Matrix Counts
  const getMatrixCounts = (items: OrderItem[]) => {
    const counts = {
        donuts: 0, pirulitos: 0, cakepop: 0, cupcake: 0,
        pdm_mini: 0, pdm_medio: 0, pdm_palito: 0,
        especiais: 0, biscoitos: 0, lascas: 0
    };
    items.forEach(item => {
        const n = item.name.toLowerCase();
        const q = item.quantity;
        if (n.includes('donut')) counts.donuts += q;
        else if (n.includes('pirulito')) counts.pirulitos += q;
        else if (n.includes('cake pop') || n.includes('cakepop')) counts.cakepop += q;
        else if (n.includes('cupcake')) counts.cupcake += q;
        else if (n.includes('pão de mel') || n.includes('pao de mel')) {
            if (n.includes('mini')) counts.pdm_mini += q;
            else if (n.includes('palito')) counts.pdm_palito += q;
            else counts.pdm_medio += q;
        }
        else if (n.includes('3d') || n.includes('especial') || n.includes('especiais')) counts.especiais += q;
        else if (n.includes('biscoito')) counts.biscoitos += q;
        else if (n.includes('lasca')) counts.lascas += q;
    });
    return counts;
  };

  // --- Components ---

  const NavCard = ({ icon: Icon, title, subtitle, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className={`
        bg-white p-6 rounded-2xl shadow-sm border border-rose-50 
        flex flex-col justify-between items-start text-left hover:shadow-md hover:border-rose-200 transition-all group
        h-40 w-full relative overflow-hidden
      `}
    >
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 mb-2`}>
        <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-500 text-sm font-medium mt-1">{subtitle}</p>
      </div>

      <div className="absolute top-6 right-6 opacity-10 transform scale-150 group-hover:scale-125 transition-transform">
         <Icon size={64} />
      </div>
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Olá, Adriana!</h1>
            <p className="text-gray-500">Aqui está o resumo do seu negócio hoje.</p>
        </div>
      </div>

      {/* Navigation Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavCard 
           icon={ClipboardList}
           title="Pedidos"
           subtitle={`${ordersToday} entregas hoje`}
           colorClass="bg-blue-500"
           onClick={() => onNavigate('orders')}
        />
        <NavCard 
           icon={BookOpen}
           title="Catálogo"
           subtitle="Gerenciar produtos"
           colorClass="bg-purple-500"
           onClick={() => onNavigate('catalog')}
        />
        <NavCard 
           icon={DollarSign}
           title="Financeiro"
           subtitle="Ver fluxo de caixa"
           colorClass="bg-green-500"
           onClick={() => onNavigate('financial')}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => setIsWeekModalOpen(true)}
          className="bg-white p-4 rounded-xl border border-rose-100 flex items-center gap-4 shadow-sm hover:border-rose-300 hover:shadow-md transition-all text-left group"
        >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Clock size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500">Entregas da Semana</p>
                <p className="text-2xl font-bold text-gray-800">{ordersWeekCount}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">Ver lista completa</p>
            </div>
        </button>
      </div>

      {/* CRM Section: Upcoming Birthdays */}
      {opportunities.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
                <Gift size={100} />
            </div>
            
            <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2 relative z-10">
                <Sparkles className="text-amber-600" size={20} fill="currentColor" />
                Oportunidades de Re-venda (Aniversários Próximos)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {opportunities.map((op, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-amber-200 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-800">{op.order.customerName}</span>
                                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                                    {op.daysUntil <= 0 ? 'Hoje!' : `Em ${op.daysUntil} dias`}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-tight">
                                Aniversário de <strong>{op.order.birthdayPersonName}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Vai fazer <span className="font-bold text-rose-500">{op.newAge} anos</span> em {op.nextDate.toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <button 
                            onClick={() => handleCrmMessage(op)}
                            className="p-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-sm transition-transform hover:scale-110 flex-shrink-0 ml-3"
                            title="Enviar Lembrete WhatsApp"
                        >
                            <MessageCircle size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-rose-500"/>
              Próximas Entregas
          </h3>
          <div className="space-y-3">
              {nextEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhuma entrega próxima agendada.</p>
              ) : (
                  nextEvents.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100">
                          <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded border text-center min-w-[50px]">
                                  <span className="block text-xs text-gray-500 uppercase">{new Date(order.dueDate + 'T00:00:00').toLocaleString('pt-BR', { month: 'short' })}</span>
                                  <span className="block text-lg font-bold text-rose-600">{new Date(order.dueDate + 'T00:00:00').getDate()}</span>
                              </div>
                              <div>
                                  <h4 className="font-bold text-gray-800">{order.customerName}</h4>
                                  <p className="text-xs text-gray-500">{order.theme} • {order.partyType}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="block text-sm font-medium text-gray-700">{order.dueTime}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.status === OrderStatus.PENDENTE_100 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                              }`}>
                                  {order.status}
                              </span>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* Modal for Weekly Orders (Matrix View) */}
      {isWeekModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Entregas da Semana</h2>
                        <p className="text-sm text-gray-500">
                            {monday.toLocaleDateString('pt-BR')} até {sunday.toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrintWeek}
                            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"
                        >
                            <Share2 size={18} /> Compartilhar Lista
                        </button>
                        <button onClick={() => setIsWeekModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto p-6">
                    {ordersWeekList.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhuma entrega programada para esta semana.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-gray-200 text-xs sm:text-sm">
                                <thead className="bg-sky-400 text-white">
                                    <tr>
                                        <th className="p-2 border border-sky-500/30 font-semibold min-w-[150px]">Temas</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Data Entrega</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Donuts</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Pirulitos</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">CakePop</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">CupCake</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Pão de Mel<br/>(mini)</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Pão de Mel<br/>(médio)</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Pão de Mel<br/>(palito)</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Mod.<br/>Especiais (3D)</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Biscoitos</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center">Lascas</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center min-w-[150px]">Obs.:</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ordersWeekList.map((order, idx) => {
                                        const counts = getMatrixCounts(order.items);
                                        const rowClass = idx % 2 === 0 ? 'bg-white' : 'bg-sky-50';
                                        return (
                                            <tr key={order.id} className={`${rowClass} hover:bg-sky-100 transition-colors`}>
                                                <td className="p-2 border-r border-gray-200 align-middle">
                                                    <div className="font-bold text-gray-800">{order.theme}</div>
                                                    <div className="text-xs text-gray-500">{order.customerName}</div>
                                                </td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">
                                                    {new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                                                </td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.donuts || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.pirulitos || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.cakepop || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.cupcake || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.pdm_mini || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.pdm_medio || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.pdm_palito || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.especiais || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.biscoitos || ''}</td>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">{counts.lascas || ''}</td>
                                                <td className="p-2 border-r border-gray-200 align-middle text-xs text-gray-600 italic max-w-[200px]">
                                                    {order.notes}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-right text-sm text-gray-500">
                    Total de {ordersWeekCount} entregas nesta semana
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;