
import React, { useState, useMemo } from 'react';
import { Transaction, Order, OrderStatus } from '../types';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, Filter, Trash2, X, Save, Calendar, Settings, CalendarClock, Printer } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateFinancialReportPDF } from '../services/pdfService';

interface FinancialProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onBack: () => void;
  orders: Order[];
}

const CATEGORIES = ['Venda', 'Insumos', 'Embalagem', 'Custos Fixos', 'Marketing', 'Equipamentos', 'Outros'];

const Financial: React.FC<FinancialProps> = ({ transactions, setTransactions, onBack, orders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [closingDay, setClosingDay] = useState<number>(31); // Default to full month
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'INCOME',
    date: new Date().toISOString().split('T')[0],
    category: 'Venda',
    description: '',
    amount: 0
  });

  // --- Calculations & Filtering ---

  // 1. Determine Date Range based on Closing Day
  const dateRange = useMemo(() => {
    const [year, month] = filterDate.split('-').map(Number);
    
    // Standard Calendar Month (if closing day is 31 or invalid)
    if (closingDay >= 31 || closingDay < 1) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0); // Last day of current month
        return { start, end, label: `01/${month.toString().padStart(2, '0')} a ${end.getDate()}/${month.toString().padStart(2, '0')}` };
    }

    // Custom Closing Date (e.g., Closing 20th -> Period: 21st Prev Month to 20th Curr Month)
    const end = new Date(year, month - 1, closingDay);
    const start = new Date(year, month - 2, closingDay + 1);
    
    return { 
        start, 
        end,
        label: `${start.getDate()}/${(start.getMonth()+1).toString().padStart(2, '0')} a ${end.getDate()}/${(end.getMonth()+1).toString().padStart(2, '0')}`
    };
  }, [filterDate, closingDay]);

  // 2. Calculate Pending Revenue for CURRENT Period
  // "50% pending should be considered the remainder of the payment on the day of the party"
  const currentPeriodPending = useMemo(() => {
    return orders.reduce((sum, order) => {
        const dueDate = new Date(order.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const start = new Date(dateRange.start); start.setHours(0,0,0,0);
        const end = new Date(dateRange.end); end.setHours(23,59,59,999);

        // Check if order is in the current period
        const isInPeriod = dueDate >= start && dueDate <= end;

        if (isInPeriod) {
            if (order.status === OrderStatus.PENDENTE_100) {
                return sum + order.totalPrice;
            } else if (order.status === OrderStatus.PENDENTE_50) {
                // 50% Paid (in transactions), 50% Pending (here)
                return sum + (order.totalPrice * 0.5);
            }
        }
        return sum;
    }, 0);
  }, [orders, dateRange]);

  // 3. Determine Next Month Date Range & Provision
  const nextPeriodProvision = useMemo(() => {
    const [year, month] = filterDate.split('-').map(Number);
    let nextStart, nextEnd;

    // Define the "Next Period" dates
    if (closingDay >= 31 || closingDay < 1) {
        nextStart = new Date(year, month, 1); 
        nextEnd = new Date(year, month + 1, 0);
    } else {
        nextStart = new Date(year, month - 1, closingDay + 1);
        nextEnd = new Date(year, month, closingDay);
    }
    
    // Calculate Provision for NEXT period
    const provisionAmount = orders.reduce((sum, order) => {
        const dueDate = new Date(order.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const start = new Date(nextStart); start.setHours(0,0,0,0);
        const end = new Date(nextEnd); end.setHours(23,59,59,999);

        const isInPeriod = dueDate >= start && dueDate <= end;

        if (isInPeriod) {
            if (order.status === OrderStatus.PENDENTE_100) {
                return sum + order.totalPrice;
            } else if (order.status === OrderStatus.PENDENTE_50) {
                return sum + (order.totalPrice * 0.5);
            }
        }
        return sum;
    }, 0);

    return provisionAmount;
  }, [filterDate, closingDay, orders]);

  // 4. Filter Transactions by Date Range first (Base for everything)
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        const tTime = tDate.setHours(0,0,0,0);
        const startTime = dateRange.start.setHours(0,0,0,0);
        const endTime = dateRange.end.setHours(23,59,59,999);
        
        return tTime >= startTime && tTime <= endTime;
    });
  }, [transactions, dateRange]);

  // 5. Apply Type/Category filters for the List View
  const listTransactions = useMemo(() => {
    return dateFilteredTransactions.filter(t => {
      const matchesType = filterType === 'ALL' ? true : t.type === filterType;
      const matchesCategory = filterCategory === 'ALL' ? true : t.category === filterCategory;
      return matchesType && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dateFilteredTransactions, filterType, filterCategory]);

  // 6. Totals based on Date Range (ignoring list filters)
  const totals = useMemo(() => {
    const income = dateFilteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = dateFilteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [dateFilteredTransactions]);

  // 7. Chart Data based on Date Range
  const chartData = useMemo(() => {
    const dataMap = new Map<string, { sortDate: number, displayDate: string, income: number, expense: number }>();
    
    dateFilteredTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const dayStr = `${tDate.getDate()}/${tDate.getMonth() + 1}`; // Display format D/M
        const sortKey = tDate.getTime(); // Use timestamp for sorting
        const key = t.date; // Unique key per day YYYY-MM-DD

        const existing = dataMap.get(key) || { sortDate: sortKey, displayDate: dayStr, income: 0, expense: 0 };
        
        if (t.type === 'INCOME') existing.income += t.amount;
        else existing.expense += t.amount;
        
        dataMap.set(key, existing);
    });

    // Sort by date
    const sortedData = Array.from(dataMap.values()).sort((a, b) => a.sortDate - b.sortDate);
    
    let currentBalance = 0;
    return sortedData.map(item => {
        currentBalance += (item.income - item.expense);
        return { ...item, balance: currentBalance };
    });

  }, [dateFilteredTransactions]);

  // --- Handlers ---

  const handleSaveTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || newTransaction.amount <= 0) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: newTransaction.date!,
      type: newTransaction.type!,
      amount: Number(newTransaction.amount),
      description: newTransaction.description!,
      category: newTransaction.category!
    };

    setTransactions(prev => [transaction, ...prev]);
    setIsModalOpen(false);
    setNewTransaction({
      type: 'INCOME',
      date: new Date().toISOString().split('T')[0],
      category: 'Venda',
      description: '',
      amount: 0
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handlePrintReport = () => {
      generateFinancialReportPDF(dateFilteredTransactions, dateRange.start, dateRange.end, totals);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 font-script">Fluxo de Caixa</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end sm:items-center">
            {/* Date & Closing Day Controls */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                <div className="relative group">
                    <input 
                        type="month"
                        className="p-2 rounded-md text-gray-700 outline-none text-sm"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                    <span className="absolute -top-2 left-2 text-[10px] bg-white px-1 text-gray-400">Mês Ref.</span>
                </div>
                
                <div className="h-6 w-px bg-gray-200"></div>

                <div className="relative flex items-center pr-2">
                    <Settings size={14} className="text-gray-400 mr-1" />
                    <input 
                        type="number"
                        min="1"
                        max="31"
                        className="w-12 p-1 text-sm border-b border-gray-200 focus:border-rose-500 outline-none text-center"
                        value={closingDay}
                        onChange={(e) => setClosingDay(Number(e.target.value))}
                        title="Dia do fechamento da fatura/mês"
                    />
                    <span className="absolute -top-2 left-0 text-[10px] bg-white px-1 text-gray-400 whitespace-nowrap">Dia Fech.</span>
                </div>
            </div>

            <button 
                onClick={handlePrintReport}
                className="p-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-rose-600 transition-colors shadow-sm"
                title="Baixar Relatório PDF"
            >
                <Printer size={20} />
            </button>

            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm w-full sm:w-auto"
            >
                <Plus size={20} /> Nova
            </button>
        </div>
      </div>

      {/* Period Info Banner */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-rose-50/50 px-4 py-2 rounded-lg border border-rose-100">
         <Calendar size={16} className="text-rose-400" />
         <span>
            Exibindo período: <span className="font-bold text-rose-700">{dateRange.label}</span>
            {closingDay < 31 && <span className="text-xs ml-2 text-gray-400">(Fechamento personalizado dia {closingDay})</span>}
         </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Receitas (Caixa)</p>
                    <h3 className="text-2xl font-bold text-green-600">R$ {totals.income.toFixed(2)}</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-full text-green-600">
                    <TrendingUp size={24} />
                </div>
            </div>
            {/* Current Period Pending Indicator */}
            {currentPeriodPending > 0 && (
                <div className="mt-3 pt-3 border-t border-green-50">
                    <div className="flex items-center gap-1 text-green-700 text-sm">
                        <Plus size={14} />
                        <span className="font-bold">R$ {currentPeriodPending.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400">a receber neste período</p>
                </div>
            )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Despesas</p>
                <h3 className="text-2xl font-bold text-red-600">R$ {totals.expense.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-600">
                <TrendingDown size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Saldo do Período</p>
                <h3 className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {totals.balance.toFixed(2)}
                </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <DollarSign size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-sm text-gray-500 font-medium mb-1">Provisão (Próx. Mês)</p>
                <h3 className="text-2xl font-bold text-purple-600">R$ {nextPeriodProvision.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-full text-purple-600 relative z-10">
                <CalendarClock size={24} />
            </div>
            <div className="absolute right-0 top-0 h-full w-1 bg-purple-500"></div>
        </div>
      </div>

      {/* Chart & List */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-100 lg:w-2/3 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-gray-800 mb-4">Evolução no Período</h3>
            <div className="flex-1 w-full h-64">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                            <CartesianGrid stroke="#f5f5f5" vertical={false} />
                            <XAxis dataKey="displayDate" tickLine={false} axisLine={false} tick={{fontSize: 12}} interval="preserveStartEnd" />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} tick={{fontSize: 12}} />
                            <Tooltip 
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
                                labelFormatter={(label) => `Data: ${label}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="income" name="Receita" barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Despesa" barSize={20} fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                        <Calendar size={48} className="mb-2 opacity-20" />
                        <p>Sem dados para este período.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm border border-rose-100 lg:w-1/3 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-rose-50 bg-rose-50/30 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Extrato</h3>
                    <span className="text-xs text-gray-500">{listTransactions.length} lançamentos</span>
                 </div>
                 <div className="flex gap-2">
                    <select 
                        className="text-xs border rounded-lg p-2 bg-white flex-1"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                    >
                        <option value="ALL">Todos Tipos</option>
                        <option value="INCOME">Entradas</option>
                        <option value="EXPENSE">Saídas</option>
                    </select>
                    <select 
                        className="text-xs border rounded-lg p-2 bg-white flex-1"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">Todas Categorias</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-gray-100">
                        {listTransactions.length === 0 ? (
                             <tr><td className="p-8 text-center text-gray-400">Nenhuma transação encontrada.</td></tr>
                        ) : (
                            listTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 group">
                                    <td className="p-3 pl-4">
                                        <div className="font-medium text-gray-800 truncate max-w-[140px]" title={t.description}>{t.description}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(t.date).toLocaleDateString('pt-BR')} • <span className="bg-gray-100 px-1 rounded">{t.category}</span>
                                        </div>
                                    </td>
                                    <td className={`p-3 text-right font-bold whitespace-nowrap ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="p-3 text-right w-10 pr-4">
                                        <button 
                                            onClick={() => handleDelete(t.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Nova Transação</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
                <div className="flex gap-4">
                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${newTransaction.type === 'INCOME' ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            className="hidden" 
                            name="type" 
                            checked={newTransaction.type === 'INCOME'} 
                            onChange={() => setNewTransaction({...newTransaction, type: 'INCOME'})} 
                        />
                        Receita
                    </label>
                    <label className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${newTransaction.type === 'EXPENSE' ? 'bg-red-50 border-red-200 text-red-700 font-bold' : 'hover:bg-gray-50'}`}>
                        <input 
                            type="radio" 
                            className="hidden" 
                            name="type" 
                            checked={newTransaction.type === 'EXPENSE'} 
                            onChange={() => setNewTransaction({...newTransaction, type: 'EXPENSE'})} 
                        />
                        Despesa
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                    <input 
                        className="w-full p-2 border rounded-lg bg-gray-50" 
                        placeholder="Ex: Venda Bolo Chocolate"
                        value={newTransaction.description}
                        onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full p-2 border rounded-lg bg-gray-50" 
                            placeholder="0.00"
                            value={newTransaction.amount === 0 ? '' : newTransaction.amount}
                            onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border rounded-lg bg-gray-50" 
                            value={newTransaction.date}
                            onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                    <select 
                        className="w-full p-2 border rounded-lg bg-gray-50"
                        value={newTransaction.category}
                        onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                    >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 rounded-lg text-gray-600 hover:bg-gray-100 border border-transparent"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSaveTransaction}
                    className="flex-1 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center gap-2 font-medium shadow-md"
                >
                    <Save size={18} /> Salvar
                </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Financial;
