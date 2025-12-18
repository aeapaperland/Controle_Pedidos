
import React from 'react';
import { Order, ProductionStage, OrderStatus } from '../types';
import { Calendar, CheckSquare, Package, Truck, ArrowLeft } from 'lucide-react';

interface ProductionProps {
  orders: Order[];
  onBack: () => void;
}

const Production: React.FC<ProductionProps> = ({ orders, onBack }) => {
  const today = new Date();
  
  // Helper to get orders for a specific day offset
  const getOrdersForDay = (offset: number) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    return orders.filter(o => 
      o.dueDate === dateStr && 
      o.status !== OrderStatus.ORCAMENTO && 
      o.status !== OrderStatus.FINALIZADO
    );
  };

  const days = [
    { label: 'Hoje', offset: 0 },
    { label: 'Amanhã', offset: 1 },
    { label: 'Depois de Amanhã', offset: 2 },
    { label: 'Daqui 3 dias', offset: 3 },
  ];

  const getStageIcon = (stage: ProductionStage) => {
    switch (stage) {
      case ProductionStage.PRE_PREPARO: return <Calendar size={16} className="text-blue-500" />;
      case ProductionStage.PRODUCAO: return <CheckSquare size={16} className="text-orange-500" />;
      case ProductionStage.EMBALAGEM: return <Package size={16} className="text-purple-500" />;
      case ProductionStage.PRONTO: return <Truck size={16} className="text-green-500" />;
      default: return <CheckSquare size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
            onClick={onBack}
            className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"
            title="Voltar ao Painel"
        >
            <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Agenda de Produção</h1>
            <p className="text-gray-500 text-sm">Planejamento inteligente para não sobrecarregar sua rotina.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {days.map((day) => {
          const dailyOrders = getOrdersForDay(day.offset);
          
          return (
            <div key={day.label} className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden flex flex-col h-full">
              <div className="bg-rose-50 p-4 border-b border-rose-100">
                <h3 className="font-bold text-rose-800">{day.label}</h3>
                <span className="text-xs text-rose-500">
                   {new Date(new Date().setDate(new Date().getDate() + day.offset)).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="p-4 space-y-3 flex-1">
                {dailyOrders.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">Sem entregas agendadas</div>
                ) : (
                  dailyOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-gray-800 text-sm truncate">{order.customerName}</span>
                        <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                          {order.dueTime}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 font-medium">{order.theme}</p>
                      
                      {/* Auto-calculated current stage suggestion */}
                      <div className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-gray-200 mt-2">
                        {getStageIcon(order.productionStage)}
                        <span className="font-medium text-gray-700">{order.productionStage}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100 mt-8">
        <h3 className="font-bold text-gray-800 mb-4">Resumo de Tarefas (Kanban Simplificado)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Pré-Preparo</h4>
            <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
              <li>Derreter chocolate (Pedido Ana)</li>
              <li>Cortar tags (Pedido João)</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-3">Decoração</h4>
            <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
              <li>Pintar detalhes dourados (Harry Potter)</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">Embalagem</h4>
            <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
              <li>Colocar laços (Frozen)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Production;
