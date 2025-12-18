
import React, { useState } from 'react';
import { Order, OrderStatus, ProductionStage, Product, OrderItem, Customer, Transaction } from '../types';
import { Plus, Search, Filter, MessageCircle, Sparkles, Save, X, Trash2, FileText, ShoppingBag, Printer, Edit, ArrowLeft, User, Share2, Truck, Percent } from 'lucide-react';
import { generateWhatsappMessage } from '../services/geminiService';
import { generateOrderPDF } from '../services/pdfService';

interface OrdersProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onBack: () => void;
  logo?: string;
}

// Definição da composição dos Kits para explosão automática de itens
const KITS_COMPOSITION: Record<string, { id: string, qty: number }[]> = {
  'prod_kit_1': [ // Kit 1 - R$ 426,00
    { id: 'prod_donut_mini', qty: 10 },
    { id: 'prod_cakepop', qty: 5 },
    { id: 'prod_pdm_mini', qty: 5 },
    { id: 'prod_pirulito', qty: 5 },
    { id: 'prod_cupcake', qty: 5 }
  ],
  'prod_kit_2': [ // Kit 2 - R$ 677,00
    { id: 'prod_donut_mini', qty: 20 },
    { id: 'prod_cakepop', qty: 8 },
    { id: 'prod_pdm_mini', qty: 8 },
    { id: 'prod_pirulito', qty: 8 },
    { id: 'prod_cupcake', qty: 8 }
  ],
  'prod_kit_3': [ // Kit 3 - R$ 852,00
    { id: 'prod_donut_mini', qty: 30 },
    { id: 'prod_cakepop', qty: 10 },
    { id: 'prod_pdm_mini', qty: 10 },
    { id: 'prod_pirulito', qty: 10 },
    { id: 'prod_cupcake', qty: 10 }
  ]
};

const Orders: React.FC<OrdersProps> = ({ 
  orders, products, customers, transactions, 
  setOrders, setCustomers, setTransactions, onBack, logo
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Form State
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    items: [],
    status: OrderStatus.ORCAMENTO,
    productionStage: ProductionStage.PRE_PREPARO,
    dueDate: new Date().toISOString().split('T')[0],
    totalPrice: 0,
    deliveryFee: 0,
    discount: 0,
    birthdayPersonName: '',
    birthdayPersonAge: undefined
  });

  // Temporary state for adding items line by line
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProductId(productId);
    if (product) {
        setItemPrice(product.basePrice);
        // Reset quantity based on unit type (e.g. if gram, suggest 100g, if unit, 1)
        setItemQuantity(product.measureUnit === 'g' ? 100 : 1);
    } else {
        setItemPrice(0);
        setItemQuantity(1);
    }
  };

  // Handle Customer Name Change (Autocomplete/Autofill Logic)
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewOrder(prev => ({ ...prev, customerName: name }));

    // Check if customer exists in database
    const existingCustomer = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    if (existingCustomer) {
      setNewOrder(prev => ({
        ...prev,
        customerName: existingCustomer.name,
        customerWhatsapp: existingCustomer.whatsapp,
        location: existingCustomer.address || prev.location,
        birthdayPersonName: existingCustomer.birthdayPersonName || prev.birthdayPersonName,
        birthdayPersonAge: existingCustomer.birthdayPersonAge || prev.birthdayPersonAge
      }));
    }
  };

  const calculateTotal = (items: OrderItem[], delivery: number, discount: number) => {
      const itemsTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      return Math.max(0, itemsTotal + (delivery || 0) - (discount || 0));
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || itemQuantity <= 0) return;

    const kitComposition = KITS_COMPOSITION[product.id];
    
    // List of potential items to add (without IDs initially)
    let candidates: Omit<OrderItem, 'id'>[] = [];

    if (kitComposition) {
        // 1. Kit Parent
        candidates.push({
            productId: product.id,
            name: product.name,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            details: 'Kit Promocional',
            measureUnit: 'un'
        });

        // 2. Kit Components
        kitComposition.forEach((comp) => {
            const compProduct = products.find(p => p.id === comp.id);
            if (compProduct) {
                candidates.push({
                    productId: compProduct.id,
                    name: `(Incluso no Kit) ${compProduct.name}`,
                    quantity: comp.qty * itemQuantity,
                    unitPrice: 0, 
                    details: `Item integrante do ${product.name}`,
                    measureUnit: compProduct.measureUnit
                });
            }
        });
    } else {
        // Standard Item
        candidates.push({
            productId: product.id,
            name: product.name,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            details: '',
            measureUnit: product.measureUnit
        });
    }

    const currentItems = [...(newOrder.items || [])];

    // Process each candidate: Merge if exists, otherwise Add
    candidates.forEach((candidate) => {
        // Check for existing item with same Product ID, Price, and Details
        const existingIndex = currentItems.findIndex(item => 
            item.productId === candidate.productId &&
            Math.abs(item.unitPrice - candidate.unitPrice) < 0.001 && // Float safety comparison
            (item.details || '').trim() === (candidate.details || '').trim()
        );

        if (existingIndex >= 0) {
            // Merge: Sum quantity
            currentItems[existingIndex] = {
                ...currentItems[existingIndex],
                quantity: currentItems[existingIndex].quantity + candidate.quantity
            };
        } else {
            // Add: Create new item with ID
            currentItems.push({
                ...candidate,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
        }
    });

    const updatedTotal = calculateTotal(currentItems, newOrder.deliveryFee || 0, newOrder.discount || 0);

    setNewOrder({
        ...newOrder,
        items: currentItems,
        totalPrice: updatedTotal
    });

    // Reset item inputs
    setSelectedProductId('');
    setItemQuantity(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (itemId: string) => {
      const updatedItems = (newOrder.items || []).filter(i => i.id !== itemId);
      const updatedTotal = calculateTotal(updatedItems, newOrder.deliveryFee || 0, newOrder.discount || 0);
      setNewOrder({
          ...newOrder,
          items: updatedItems,
          totalPrice: updatedTotal
      });
  };

  const handleDeliveryFeeChange = (val: number) => {
      const fee = isNaN(val) ? 0 : val;
      const updatedTotal = calculateTotal(newOrder.items || [], fee, newOrder.discount || 0);
      setNewOrder({
          ...newOrder,
          deliveryFee: fee,
          totalPrice: updatedTotal
      });
  };

  const handleDiscountChange = (val: number) => {
      const discount = isNaN(val) ? 0 : val;
      const updatedTotal = calculateTotal(newOrder.items || [], newOrder.deliveryFee || 0, discount);
      setNewOrder({
          ...newOrder,
          discount: discount,
          totalPrice: updatedTotal
      });
  };

  const handleEditOrder = (order: Order) => {
    setNewOrder({ 
        ...order, 
        deliveryFee: order.deliveryFee || 0,
        discount: order.discount || 0 
    });
    setIsModalOpen(true);
  };

  const handleSaveOrder = () => {
    // Validação de campos obrigatórios
    if (!newOrder.customerName) {
        alert("Por favor, preencha o nome do cliente.");
        return;
    }
    if (!newOrder.dueDate) {
        alert("Por favor, selecione a data do evento.");
        return;
    }
    
    const itemsTotal = newOrder.items?.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) || 0;
    const calculatedTotal = Math.max(0, itemsTotal + (newOrder.deliveryFee || 0) - (newOrder.discount || 0));

    let savedOrderId = newOrder.id;

    // Prepara objeto seguro com valores padrão para campos opcionais
    const safeOrderData = {
        customerName: newOrder.customerName,
        customerWhatsapp: newOrder.customerWhatsapp || '',
        partyType: newOrder.partyType || '',
        theme: newOrder.theme || '',
        items: newOrder.items || [],
        dueDate: newOrder.dueDate,
        dueTime: newOrder.dueTime || '00:00',
        location: newOrder.location || '',
        deliveryFee: newOrder.deliveryFee || 0,
        discount: newOrder.discount || 0,
        totalPrice: calculatedTotal,
        status: newOrder.status || OrderStatus.ORCAMENTO,
        productionStage: newOrder.productionStage || ProductionStage.PRE_PREPARO,
        notes: newOrder.notes || '',
        birthdayPersonName: newOrder.birthdayPersonName,
        birthdayPersonAge: newOrder.birthdayPersonAge
    };

    // 1. Save/Update Order
    if (newOrder.id) {
        // Update existing order
        const originalOrder = orders.find(o => o.id === newOrder.id);
        const updatedOrder: Order = {
            id: newOrder.id,
            createdAt: originalOrder?.createdAt || new Date().toISOString(),
            ...safeOrderData
        };
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } else {
        // Create new order
        savedOrderId = Math.random().toString(36).substring(2, 9);
        const order: Order = {
            id: savedOrderId,
            createdAt: new Date().toISOString(),
            ...safeOrderData
        };
        setOrders([order, ...orders]);
    }

    // 2. Save/Update Customer Data (Persistence Logic)
    const existingCustomerIndex = customers.findIndex(c => c.name.toLowerCase() === newOrder.customerName?.toLowerCase());
    
    const customerData: Customer = {
        id: existingCustomerIndex >= 0 ? customers[existingCustomerIndex].id : Math.random().toString(36).substring(2, 9),
        name: newOrder.customerName!,
        whatsapp: newOrder.customerWhatsapp || '',
        address: newOrder.location,
        birthdayPersonName: newOrder.birthdayPersonName,
        birthdayPersonAge: newOrder.birthdayPersonAge,
        lastOrderDate: new Date().toISOString()
    };

    if (existingCustomerIndex >= 0) {
        // Update existing customer with new details
        const updatedCustomers = [...customers];
        updatedCustomers[existingCustomerIndex] = customerData;
        setCustomers(updatedCustomers);
    } else {
        // Add new customer
        setCustomers([...customers, customerData]);
    }

    // 3. FINANCIAL SYNC LOGIC
    let revenueAmount = 0;
    if (newOrder.status === OrderStatus.PENDENTE_50) {
        revenueAmount = calculatedTotal / 2;
    } else if ([OrderStatus.PAGO_100, OrderStatus.FINALIZADO].includes(newOrder.status as OrderStatus)) {
        revenueAmount = calculatedTotal;
    }

    // Find existing transaction for this order
    const existingTransaction = transactions.find(t => t.orderId === savedOrderId);

    if (revenueAmount > 0) {
        const transactionData: Transaction = {
            id: existingTransaction ? existingTransaction.id : `t_${Date.now()}`,
            orderId: savedOrderId,
            date: newOrder.dueDate!, 
            type: 'INCOME',
            amount: revenueAmount,
            category: 'Venda',
            description: `Pedido: ${newOrder.customerName} (${newOrder.theme || 'Doces'})`
        };

        if (existingTransaction) {
             setTransactions(prev => prev.map(t => t.id === existingTransaction.id ? transactionData : t));
        } else {
             setTransactions(prev => [transactionData, ...prev]);
        }
    } else if (existingTransaction) {
        // If status implies no payment yet, remove existing transaction
        setTransactions(prev => prev.filter(t => t.id !== existingTransaction.id));
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
      setNewOrder({ 
          status: OrderStatus.ORCAMENTO, 
          productionStage: ProductionStage.PRE_PREPARO,
          items: [], 
          dueDate: new Date().toISOString().split('T')[0], 
          totalPrice: 0, 
          deliveryFee: 0,
          discount: 0,
          birthdayPersonName: '',
          birthdayPersonAge: undefined,
          dueTime: ''
      });
  };

  const handleDeleteOrder = (orderId: string) => {
      if (window.confirm('Tem certeza que deseja excluir este pedido permanentemente?')) {
          setOrders(prev => prev.filter(o => o.id !== orderId));
          setTransactions(prev => prev.filter(t => t.orderId !== orderId));
      }
  };

  const handleGenerateMessage = async (order: Order) => {
    const agg = new Map<string, OrderItem>();
    order.items.forEach(i => {
        const k = `${i.productId}-${i.details || ''}`;
        if (agg.has(k)) { agg.get(k)!.quantity += i.quantity; } 
        else { agg.set(k, { ...i }); }
    });
    const displayItems = Array.from(agg.values());

    const itemsList = displayItems.map(i => `${i.quantity}${i.measureUnit} ${i.name}`).join(', ');
    const msg = await generateWhatsappMessage(order.customerName, order.status, itemsList);
    const url = `https://wa.me/${order.customerWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePdfToWhatsapp = (order: Order) => {
      generateOrderPDF(order, logo);
      const msg = `Olá ${order.customerName}, segue em anexo o arquivo PDF com o ${order.status === OrderStatus.ORCAMENTO ? 'orçamento' : 'detalhamento do pedido'}.`;
      const phone = order.customerWhatsapp.replace(/\D/g, '');
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      alert(`O PDF foi baixado no seu dispositivo.\n\nO WhatsApp foi aberto. Por favor, arraste ou anexe o arquivo PDF baixado na conversa.`);
  };

  const getAggregatedItems = (items: OrderItem[]) => {
      const agg = new Map<string, OrderItem>();
      items.forEach(i => {
          const k = `${i.productId}-${i.details || ''}`;
          if (agg.has(k)) {
              const existing = agg.get(k)!;
              existing.quantity += i.quantity;
          } else {
              agg.set(k, { ...i });
          }
      });
      return Array.from(agg.values());
  };

  const statusColors: Record<string, string> = {
    [OrderStatus.ORCAMENTO]: 'bg-gray-100 text-gray-700',
    [OrderStatus.PENDENTE_100]: 'bg-red-100 text-red-700',
    [OrderStatus.PENDENTE_50]: 'bg-orange-100 text-orange-700',
    [OrderStatus.PAGO_100]: 'bg-green-100 text-green-700',
    [OrderStatus.FINALIZADO]: 'bg-blue-100 text-blue-700'
  };

  const filteredOrders = orders
    .filter(o => {
      const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            o.theme.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
        const dateA = new Date(a.dueDate + 'T00:00:00').getTime();
        const dateB = new Date(b.dueDate + 'T00:00:00').getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.dueTime || '00:00').localeCompare(b.dueTime || '00:00');
    });
    
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
             <button 
                onClick={onBack}
                className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"
                title="Voltar ao Painel"
             >
                <ArrowLeft size={24} />
             </button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Gestão de Pedidos</h1>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
        >
          <Plus size={20} /> Novo Pedido
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-rose-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por cliente ou tema..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
          <Filter size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-rose-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-rose-50 text-rose-800 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Pedido / Detalhes</th>
              <th className="p-4 font-semibold">Data / Local</th>
              <th className="p-4 font-semibold">Total</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map(order => {
              const displayItems = getAggregatedItems(order.items);
              return (
                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerWhatsapp}</div>
                  </td>
                  <td className="p-4">
                     <div className="text-sm font-medium text-gray-800">{order.theme}</div>
                     {displayItems.length > 0 && (
                       <div className="text-xs text-gray-500 mt-1">
                         {displayItems.slice(0, 5).map(i => `${i.quantity}${i.measureUnit || ''} ${i.name}`).join(', ')}
                         {displayItems.length > 5 && '...'}
                       </div>
                     )}
                     {order.birthdayPersonName && (
                       <div className="text-xs text-rose-600 font-semibold mt-1">
                         Aniver: {order.birthdayPersonName} ({order.birthdayPersonAge} anos)
                       </div>
                     )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                     <div>{new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {order.dueTime}</div>
                     <div className="text-xs text-gray-400 truncate max-w-[150px]" title={order.location}>{order.location}</div>
                  </td>
                  <td className="p-4 font-medium text-gray-900">R$ {order.totalPrice.toFixed(2).replace('.', ',')}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button 
                      onClick={() => handleEditOrder(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" 
                      title="Editar Pedido"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => generateOrderPDF(order, logo)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-full" 
                      title="Baixar PDF Orçamento"
                    >
                      <Printer size={18} />
                    </button>
                    <button 
                      onClick={() => handlePdfToWhatsapp(order)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-full relative group" 
                      title="PDF via WhatsApp"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleGenerateMessage(order)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full" 
                      title="Mensagem WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full" 
                      title="Excluir Pedido"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">Nenhum pedido encontrado.</div>
        )}
      </div>

      {/* Modal New Order */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">
                  {newOrder.id ? 'Editar Pedido / Orçamento' : 'Novo Pedido / Orçamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Customer & Details */}
              <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-rose-600 border-b pb-2 flex items-center gap-2">
                        <User size={18} />
                        Dados do Cliente e Local
                    </h3>
                    
                    <div>
                        <input 
                            list="customer-suggestions"
                            className="w-full p-2 border rounded-lg bg-gray-100" 
                            placeholder="Nome do Cliente (Pagante)"
                            value={newOrder.customerName || ''}
                            onChange={handleCustomerNameChange}
                        />
                        <datalist id="customer-suggestions">
                            {customers.map(customer => (
                                <option key={customer.id} value={customer.name} />
                            ))}
                        </datalist>
                    </div>

                    <input 
                        className="w-full p-2 border rounded-lg bg-gray-100" 
                        placeholder="WhatsApp (apenas números)"
                        value={newOrder.customerWhatsapp || ''}
                        onChange={e => setNewOrder({...newOrder, customerWhatsapp: e.target.value})}
                    />
                    <input 
                        className="w-full p-2 border rounded-lg bg-gray-100" 
                        placeholder="Local do Evento (Endereço / Salão)"
                        value={newOrder.location || ''}
                        onChange={e => setNewOrder({...newOrder, location: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Data do Evento</label>
                            <input 
                                type="date"
                                className="w-full p-2 border rounded-lg bg-gray-100" 
                                value={newOrder.dueDate || ''}
                                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Hora</label>
                            <input 
                                type="time"
                                className="w-full p-2 border rounded-lg bg-gray-100" 
                                value={newOrder.dueTime || ''}
                                onChange={e => setNewOrder({...newOrder, dueTime: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-rose-600 border-b pb-2">Detalhes da Festa</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Aniversariante</label>
                            <input 
                                className="w-full p-2 border rounded-lg bg-gray-100" 
                                placeholder="Nome"
                                value={newOrder.birthdayPersonName || ''}
                                onChange={e => setNewOrder({...newOrder, birthdayPersonName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600">Idade</label>
                            <input 
                                type="number"
                                className="w-full p-2 border rounded-lg bg-gray-100" 
                                placeholder="Anos"
                                value={newOrder.birthdayPersonAge || ''}
                                onChange={e => setNewOrder({...newOrder, birthdayPersonAge: e.target.value ? parseInt(e.target.value) : undefined})}
                            />
                        </div>
                    </div>
                    
                    <input 
                        className="w-full p-2 border rounded-lg bg-gray-100" 
                        placeholder="Tipo de Festa (Aniversário, Casamento...)"
                        value={newOrder.partyType || ''}
                        onChange={e => setNewOrder({...newOrder, partyType: e.target.value})}
                    />
                    
                    <div className="flex gap-2">
                    <input 
                        className="w-full p-2 border rounded-lg bg-gray-100" 
                        placeholder="Tema (Frozen, Harry Potter...)"
                        value={newOrder.theme || ''}
                        onChange={e => setNewOrder({...newOrder, theme: e.target.value})}
                    />
                    </div>
                    
                    <div className="flex gap-2 items-center mt-2">
                        <label className="text-sm font-semibold text-gray-700">Status:</label>
                        <select 
                            className="p-2 border rounded-lg flex-1 bg-gray-100"
                            value={newOrder.status}
                            onChange={e => setNewOrder({...newOrder, status: e.target.value as OrderStatus})}
                        >
                            {Object.values(OrderStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <textarea 
                    className="w-full p-2 border rounded-lg h-20 bg-gray-100" 
                    placeholder="Observações especiais (alergias, cores, etc.)"
                    value={newOrder.notes || ''}
                    onChange={e => setNewOrder({...newOrder, notes: e.target.value})}
                    />
                </div>
              </div>

              {/* Right Column: Items */}
              <div className="space-y-4 flex flex-col h-full">
                <h3 className="font-semibold text-rose-600 border-b pb-2">Itens da Encomenda</h3>
                
                {/* Add Item Form */}
                <div className="bg-rose-50 p-4 rounded-lg space-y-3 border border-rose-100">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600 font-medium">Selecione o Item</label>
                        <select 
                            className="w-full p-2 border rounded-md bg-gray-100 text-sm"
                            value={selectedProductId}
                            onChange={(e) => handleProductSelect(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.measureUnit})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                         <div className="flex-1">
                            <label className="text-xs text-gray-600 font-medium">
                                {selectedProduct?.measureUnit === 'kg' ? 'Peso (kg)' : selectedProduct?.measureUnit === 'g' ? 'Peso (g)' : 'Qtd'}
                            </label>
                            <input 
                                type="number"
                                step={selectedProduct?.measureUnit === 'kg' ? '0.1' : selectedProduct?.measureUnit === 'g' ? '10' : '1'}
                                className="w-full p-2 border rounded-md text-sm bg-gray-100"
                                placeholder="0"
                                value={itemQuantity === 0 ? '' : itemQuantity}
                                onChange={e => setItemQuantity(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-600 font-medium">
                                {selectedProduct?.measureUnit === 'kg' ? 'Preço (Kg)' : 'Preço Unit.'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-9 p-2 border rounded-md text-sm bg-gray-200 text-gray-600 cursor-not-allowed"
                                    placeholder="0,00"
                                    value={(itemPrice || 0).toFixed(2).replace('.', ',')}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddItem}
                        className="w-full py-2 bg-rose-500 text-white rounded-md text-sm font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Adicionar Item
                    </button>
                </div>

                {/* Added Items List */}
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-gray-50">
                   <div className="bg-gray-100 p-2 text-xs font-bold text-gray-500 flex justify-between">
                       <span>ITEM</span>
                       <span>TOTAL</span>
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
                       {(!newOrder.items || newOrder.items.length === 0) ? (
                           <p className="text-center text-gray-400 text-sm mt-10">Nenhum item adicionado.</p>
                       ) : (
                           newOrder.items.map((item, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                                   <div>
                                       <p className={`text-sm font-medium ${item.unitPrice === 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                                           {item.quantity}{item.measureUnit} x {item.name}
                                       </p>
                                       {item.unitPrice > 0 ? (
                                           <p className="text-xs text-gray-500">Unit: R$ {item.unitPrice.toFixed(2)}</p>
                                       ) : (
                                           <p className="text-[10px] bg-rose-100 text-rose-600 px-1 rounded inline-block">Item do Kit</p>
                                       )}
                                   </div>
                                   <div className="flex items-center gap-3">
                                       <span className="text-sm font-bold text-gray-700">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                                       <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                                           <Trash2 size={16} />
                                       </button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
                </div>

                {/* Totals & Actions */}
                <div className="border-t border-gray-100 pt-4 mt-auto">
                    {/* Subtotals Section */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Soma dos Itens:</span>
                            <span>R$ {(newOrder.items?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-800">
                            <span className="flex items-center gap-1 font-medium"><Truck size={14}/> Frete / Entrega:</span>
                            <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R$</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-6 p-1 text-right border rounded focus:outline-none focus:border-rose-500 bg-white"
                                    value={newOrder.deliveryFee === 0 ? '' : newOrder.deliveryFee}
                                    placeholder="0.00"
                                    onChange={e => handleDeliveryFeeChange(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-red-600">
                            <span className="flex items-center gap-1 font-medium"><Percent size={14}/> Desconto:</span>
                            <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-red-400 text-xs">- R$</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-8 p-1 text-right border rounded focus:outline-none focus:border-red-500 bg-white text-red-600"
                                    value={newOrder.discount === 0 ? '' : newOrder.discount}
                                    placeholder="0.00"
                                    onChange={e => handleDiscountChange(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <span className="text-gray-600 font-bold text-lg">Valor Total</span>
                        <span className="text-3xl font-bold text-rose-600">
                            R$ {(newOrder.totalPrice || 0).toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-transparent font-medium"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveOrder}
                            type="button"
                            className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Salvar Pedido
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
