
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import { Calendar, ClipboardList, BookOpen, DollarSign, Clock, Share2, X, Sparkles, MessageCircle, Gift, FileText, AlertCircle } from 'lucide-react';
import { generateWeeklyReportPDF } from '../services/pdfService';

interface DashboardProps {
  orders: Order[];
  onNavigate: (view: string) => void;
  logo?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onNavigate, logo }) => {
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);

  // --- Calculations ---
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const ordersToday = orders.filter(o => o.dueDate === todayStr && o.status !== OrderStatus.ORCAMENTO).length;

  const curr = new Date();
  const currentDay = curr.getDay(); 
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const ordersWeekList = useMemo(() => {
      return orders.filter(o => {
        if (o.status === OrderStatus.ORCAMENTO) return false;

        const [y, m, d] = o.dueDate.split('-').map(Number);
        const orderDate = new Date(y, m - 1, d);
        orderDate.setHours(0, 0, 0, 0);
        
        return orderDate >= monday && orderDate <= sunday;
      }).sort((a, b) => {
         const dateA = new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime();
         const dateB = new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime();
         return dateA - dateB;
      });
  }, [orders, monday, sunday]);

  const ordersWeekCount = ordersWeekList.length;

  const pendingBudgets = useMemo(() => {
      return orders
        .filter(o => o.status === OrderStatus.ORCAMENTO)
        .sort((a, b) => {
            const dateA = new Date(a.dueDate + 'T00:00:00').getTime();
            const dateB = new Date(b.dueDate + 'T00:00:00').getTime();
            return dateA - dateB;
        });
  }, [orders]);

  const nextEvents = orders
    .filter(o => {
        if (o.status === OrderStatus.FINALIZADO || o.status === OrderStatus.ORCAMENTO) return false;
        
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

  const opportunities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const uniqueClients = new Map<string, Order>();

    // Step 1: Agrupar o último pedido finalizado por cliente/aniversariante
    orders.forEach(order => {
       if (!order.birthdayPersonName) return;
       if (order.status === OrderStatus.ORCAMENTO) return;
       
       const key = `${order.customerName.toLowerCase()}-${order.birthdayPersonName.toLowerCase()}`;
       const existing = uniqueClients.get(key);
       
       if (!existing || new Date(order.dueDate) > new Date(existing.dueDate)) {
           uniqueClients.set(key, order);
       }
    });

    const results: { order: Order, nextDate: Date, newAge: number, daysUntil: number }[] = [];

    // Step 2: Calcular data do PRÓXIMO aniversário
    uniqueClients.forEach(order => {
        const [y, m, d] = order.dueDate.split('-').map(Number);
        const lastPartyDate = new Date(y, m - 1, d);
        
        // Determinar o próximo aniversário (mesmo dia/mês, no ano atual ou no próximo)
        let nextBirthday = new Date(today.getFullYear(), lastPartyDate.getMonth(), lastPartyDate.getDate());
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        // Trigger: Aparecer 10 meses antes do próximo aniversário (ou seja, 2 meses antes da data)
        const triggerDate = new Date(nextBirthday);
        triggerDate.setMonth(nextBirthday.getMonth() - 2); 

        if (today >= triggerDate && today < nextBirthday) {
            const diffTime = nextBirthday.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Idade atualizada: idade anterior + diferença de anos
            const yearDiff = nextBirthday.getFullYear() - lastPartyDate.getFullYear();
            const newAge = (order.birthdayPersonAge || 0) + yearDiff;
            
            results.push({ order, nextDate: nextBirthday, newAge, daysUntil: diffDays });
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
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrintWeek = () => {
    generateWeeklyReportPDF(ordersWeekList, monday, sunday, logo);
  };

  const getOrderSummary = (order: Order): string[] => {
      const itemsMap = new Map<string, number>();
      order.items.forEach(item => {
           const normalized = item.name.replace(/^\(Incluso no Kit\) /, '').trim();
           if(normalized !== 'Kit Promocional' && !normalized.startsWith('Kit Personalizado')) {
               itemsMap.set(normalized, (itemsMap.get(normalized) || 0) + item.quantity);
           }
      });
      
      const summary: string[] = [];
      itemsMap.forEach((qty, name) => {
          summary.push(`${qty}x ${name}`);
      });
      return summary;
  };

  const getOrderNotes = (order: Order) => {
      const kitItems = order.items.filter(i => i.details === 'Kit Promocional' || i.name.startsWith('Kit Personalizado'));
      const kitNames = kitItems.map(k => k.name).join(', ');
      
      const parts = [];
      if (kitNames) parts.push(`Contém: ${kitNames}`);
      if (order.notes) parts.push(order.notes);
      
      return parts.join('. ');
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavCard 
           icon={ClipboardList}
           title="Pedidos"
           subtitle={`${ordersToday} entregas hoje`}
           colorClass="bg-blue-500"
           onClick={() => onNavigate('orders')}
        />
        <NavCard 
           icon={DollarSign}
           title="Financeiro"
           subtitle="Ver fluxo de caixa"
           colorClass="bg-green-500"
           onClick={() => onNavigate('financial')}
        />
      </div>

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

      {opportunities.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
                <Gift size={100} />
            </div>
            <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2 relative z-10">
                <Sparkles className="text-amber-600" size={20} fill="currentColor" />
                Oportunidades de Re-venda (Próximos Aniversários)
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
                                Fará <span className="font-bold text-rose-500">{op.newAge} anos</span> em {op.nextDate.toLocaleDateString('pt-BR')}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-gray-500"/>
                      Orçamentos Pendentes
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                      {pendingBudgets.length}
                  </span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                  {pendingBudgets.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                          <AlertCircle size={32} className="mb-2 opacity-20" />
                          <p className="text-sm">Nenhum orçamento em aberto.</p>
                      </div>
                  ) : (
                      pendingBudgets.map(order => (
                          <div key={order.id} onClick={() => onNavigate('orders')} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-rose-200 hover:bg-rose-50 cursor-pointer transition-all group">
                              <div className="flex justify-between items-start mb-1">
                                  <div>
                                      <h4 className="font-bold text-gray-700 group-hover:text-rose-700">{order.customerName}</h4>
                                      <p className="text-xs text-gray-500">Data Evento: {new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <span className="text-sm font-bold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">
                                      R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                                  </span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <p className="text-xs text-gray-500 italic truncate max-w-[200px]">{order.theme || 'Sem tema'}</p>
                                  <p className="text-[10px] text-blue-500 font-medium hover:underline">Ver detalhes &rarr;</p>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-rose-500"/>
                  Próximas Entregas (Confirmadas)
              </h3>
              <div className="space-y-3">
                  {nextEvents.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">Nenhuma entrega confirmada próxima.</p>
                  ) : (
                      nextEvents.map(order => (
                          <div key={order.id} className="p-3 bg-gray-50 rounded-lg hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100">
                              <div className="flex items-center justify-between mb-2">
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
                                          order.status === OrderStatus.PENDENTE_100 ? 'bg-red-100 text-red-600' : 
                                          order.status === OrderStatus.PENDENTE_50 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                      }`}>
                                          {order.status}
                                      </span>
                                  </div>
                              </div>
                              <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-100">
                                  <div className="font-semibold text-rose-500 mb-1">Itens:</div>
                                  <div className="space-y-0.5">
                                      {getOrderSummary(order).slice(0, 3).map((line, idx) => (
                                          <div key={idx}>{line}</div>
                                      ))}
                                      {getOrderSummary(order).length > 3 && <div>...</div>}
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

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
                            <p>Nenhuma entrega confirmada programada para esta semana.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-gray-200 text-xs sm:text-sm">
                                <thead className="bg-sky-400 text-white">
                                    <tr>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center w-[120px]">Data / Hora</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold w-[200px]">Cliente / Tema</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold">Itens do Pedido</th>
                                        <th className="p-2 border border-sky-500/30 font-semibold text-center w-[200px]">Obs.:</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ordersWeekList.map((order, idx) => {
                                        const rowClass = idx % 2 === 0 ? 'bg-white' : 'bg-sky-50';
                                        return (
                                            <tr key={order.id} className={`${rowClass} hover:bg-sky-100 transition-colors`}>
                                                <td className="p-2 border-r border-gray-200 text-center align-middle">
                                                    <div className="font-bold text-gray-800">
                                                        {new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{order.dueTime}</div>
                                                </td>
                                                
                                                <td className="p-2 border-r border-gray-200 align-middle">
                                                    <div className="font-bold text-gray-800">{order.customerName}</div>
                                                    <div className="text-xs text-gray-600">{order.theme}</div>
                                                </td>

                                                <td className="p-2 border-r border-gray-200 align-middle">
                                                    <div className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                                                        {getOrderSummary(order).map((itemStr, i) => (
                                                            <div key={i} className="mb-0.5">{itemStr}</div>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="p-2 border-r border-gray-200 align-middle text-xs text-gray-600 italic">
                                                    {getOrderNotes(order)}
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
                    Total de {ordersWeekCount} entregas confirmadas nesta semana
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
