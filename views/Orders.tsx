
import React, { useState } from 'react';
import { Order, OrderStatus, ProductionStage, Product, OrderItem, Customer, Transaction } from '../types';
import { Plus, Search, Save, X, Trash2, ShoppingBag, Printer, Edit, ArrowLeft, Truck } from 'lucide-react';
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
}

// Definição da composição dos Kits para explosão automática de itens
const KITS_COMPOSITION: Record<string, { id: string, qty: number }[]> = {
  'prod_kit_1': [ // Kit P
    { id: 'prod_donut_mini', qty: 5 },
    { id: 'prod_pirulito', qty: 5 },
    { id: 'prod_trufa', qty: 5 }
  ],
  'prod_kit_2': [ // Kit M
    { id: 'prod_donut_mini', qty: 10 },
    { id: 'prod_pirulito', qty: 10 },
    { id: 'prod_cupcake', qty: 10 },
    { id: 'prod_pdm_med', qty: 5 }
  ],
  'prod_kit_3': [ // Kit G
    { id: 'prod_donut_mini', qty: 15 },
    { id: 'prod_pirulito', qty: 15 },
    { id: 'prod_cupcake', qty: 15 },
    { id: 'prod_trufa', qty: 10 },
    { id: 'prod_popscicle', qty: 10 }
  ]
};

const Orders: React.FC<OrdersProps> = ({ 
  orders, products, customers, transactions, 
  setOrders, setCustomers, setTransactions, onBack 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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

    let itemsToAdd: OrderItem[] = [];
    const currentTimestamp = Date.now();
    const kitComposition = KITS_COMPOSITION[product.id];

    // Se for um Kit com composição definida
    if (kitComposition) {
        // 1. Adiciona o Item "Pai" (O Kit em si) com o preço cheio
        itemsToAdd.push({
            id: `${currentTimestamp}-kit`,
            productId: product.id,
            name: product.name,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            details: 'Kit Promocional',
            measureUnit: 'un'
        });

        // 2. Adiciona os componentes individuais com preço R$ 0 (inclusos)
        // Isso garante que apareçam na lista de produção e PDF
        kitComposition.forEach((comp, idx) => {
            const compProduct = products.find(p => p.id === comp.id);
            if (compProduct) {
                itemsToAdd.push({
                    id: `${currentTimestamp}-comp-${idx}`,
                    productId: compProduct.id,
                    name: `(Incluso no Kit) ${compProduct.name}`,
                    quantity: comp.qty * itemQuantity,
                    unitPrice: 0, // Preço zero pois já está pago no Kit
                    details: `Item integrante do ${product.name}`,
                    measureUnit: compProduct.measureUnit
                });
            }
        });
    } else {
        // Item padrão (não é kit)
        itemsToAdd.push({
            id: currentTimestamp.toString(),
            productId: product.id,
            name: product.name,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            details: '',
            measureUnit: product.measureUnit
        });
    }

    const currentItems = [...(newOrder.items || [])];
    
    // Lógica para mesclar itens iguais
    itemsToAdd.forEach(newItem => {
        const existingItemIndex = currentItems.findIndex(
            existing => 
                existing.productId === newItem.productId && 
                existing.unitPrice === newItem.unitPrice &&
                existing.details === newItem.details // Garante que componentes de kits não se misturem com itens avulsos se a descrição for diferente
        );

        if (existingItemIndex > -1) {
            // Se encontrou item igual, soma a quantidade
            currentItems[existingItemIndex] = {
                ...currentItems[existingItemIndex],
                quantity: currentItems[existingItemIndex].quantity + newItem.quantity
            };
        } else {
            // Se não encontrou, adiciona como novo
            currentItems.push(newItem);
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
    } else if ([OrderStatus.PAGO_100, OrderStatus.FINALIZADO, OrderStatus.ENTREGUE].includes(newOrder.status as OrderStatus)) {
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

  const handlePrintOrder = (order: Order) => {
      generateOrderPDF(order);
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  ).sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Gestão de Pedidos</h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar cliente ou pedido..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-rose-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button 
               onClick={() => { resetForm(); setIsModalOpen(true); }}
               className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 whitespace-nowrap"
             >
                <Plus size={20} /> Novo Pedido
             </button>
          </div>
       </div>

       {/* List */}
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pb-20">
          {filteredOrders.map(order => (
             <div key={order.id} className="bg-white rounded-xl shadow-sm border border-rose-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <h3 className="font-bold text-gray-800 text-lg">{order.customerName}</h3>
                         <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Truck size={12} /> {new Date(order.dueDate).toLocaleDateString('pt-BR')} às {order.dueTime}
                         </p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        order.status === OrderStatus.FINALIZADO ? 'bg-gray-100 text-gray-600' :
                        order.status === OrderStatus.ENTREGUE ? 'bg-green-100 text-green-700' :
                        order.status === OrderStatus.ORCAMENTO ? 'bg-yellow-100 text-yellow-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                         {order.status}
                      </span>
                   </div>
                   
                   <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-600 max-h-32 overflow-y-auto custom-scrollbar">
                      {order.items.length === 0 ? <p className="italic text-gray-400">Sem itens</p> : (
                         <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                               <li key={idx} className="flex justify-between">
                                  <span>{item.quantity}x {item.name}</span>
                               </li>
                            ))}
                         </ul>
                      )}
                      {order.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs italic">
                           Obs: {order.notes}
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                   <div className="text-lg font-bold text-gray-800">
                      R$ {order.totalPrice.toFixed(2)}
                   </div>
                   <div className="flex gap-2">
                      {/* Botão de impressão (Gera PDF) */}
                      <button 
                        onClick={() => handlePrintOrder(order)}
                        className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors"
                        title="Imprimir / PDF"
                      >
                         <Printer size={18} />
                      </button>
                      
                      <button 
                        onClick={() => handleEditOrder(order)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                         <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
             </div>
          ))}
          {filteredOrders.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhum pedido encontrado.</p>
             </div>
          )}
       </div>

       {/* Modal Code (Add/Edit) */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-800">
                       {newOrder.id ? 'Editar Pedido' : 'Novo Pedido'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Client Info */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.customerName || ''}
                                onChange={handleCustomerNameChange}
                                list="customers-list"
                            />
                            <datalist id="customers-list">
                                {customers.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.customerWhatsapp || ''}
                                onChange={e => setNewOrder({...newOrder, customerWhatsapp: e.target.value})}
                            />
                        </div>
                    </section>

                    {/* Event Info */}
                     <section className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-rose-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data da Festa</label>
                            <input 
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.dueDate || ''}
                                onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                            <input 
                                type="time"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.dueTime || ''}
                                onChange={e => setNewOrder({...newOrder, dueTime: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.theme || ''}
                                onChange={e => setNewOrder({...newOrder, theme: e.target.value})}
                            />
                        </div>
                        <div className="md:col-span-3">
                             <label className="block text-sm font-medium text-gray-700 mb-1">Local / Endereço</label>
                             <input 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.location || ''}
                                onChange={e => setNewOrder({...newOrder, location: e.target.value})}
                             />
                        </div>
                        {/* Birthday Person Info */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Aniversariante (Nome)</label>
                             <input 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.birthdayPersonName || ''}
                                onChange={e => setNewOrder({...newOrder, birthdayPersonName: e.target.value})}
                             />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Idade (Anos)</label>
                             <input 
                                type="number"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.birthdayPersonAge || ''}
                                onChange={e => setNewOrder({...newOrder, birthdayPersonAge: parseInt(e.target.value)})}
                             />
                        </div>
                    </section>

                    {/* Items Selection */}
                    <section>
                        <h3 className="font-bold text-gray-800 mb-3">Itens do Pedido</h3>
                        <div className="flex gap-2 mb-4 bg-gray-50 p-3 rounded-lg items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Produto</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={selectedProductId}
                                    onChange={e => handleProductSelect(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (R$ {p.basePrice.toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Qtd</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={itemQuantity}
                                    onChange={e => setItemQuantity(Number(e.target.value))}
                                />
                            </div>
                            <div className="w-28">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Preço Unit.</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-sm text-gray-500">R$</span>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full pl-8 p-2 border border-gray-300 rounded-lg"
                                        value={itemPrice}
                                        onChange={e => setItemPrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleAddItem}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 h-[42px] w-[42px] flex items-center justify-center"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-3">Qtd</th>
                                        <th className="p-3">Item</th>
                                        <th className="p-3 text-right">Unit.</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {newOrder.items?.map((item, idx) => (
                                        <tr key={idx} className={item.unitPrice === 0 ? 'bg-gray-50 text-gray-500 italic' : ''}>
                                            <td className="p-3">{item.quantity}</td>
                                            <td className="p-3">{item.name}</td>
                                            <td className="p-3 text-right">{item.unitPrice === 0 ? '-' : `R$ ${item.unitPrice.toFixed(2)}`}</td>
                                            <td className="p-3 text-right">{item.unitPrice === 0 ? '-' : `R$ ${(item.quantity * item.unitPrice).toFixed(2)}`}</td>
                                            <td className="p-3 text-right">
                                                {item.unitPrice > 0 && (
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Financials & Status */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Status do Pedido</label>
                             <select 
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={newOrder.status}
                                onChange={e => setNewOrder({...newOrder, status: e.target.value as OrderStatus})}
                             >
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                        <div className="flex flex-col justify-end text-right space-y-2">
                             <div className="flex justify-between items-center">
                                <span className="text-gray-600">Taxa de Entrega:</span>
                                <div className="flex items-center gap-1 justify-end w-32">
                                   <span className="text-gray-500">R$</span>
                                   <input 
                                     type="number"
                                     step="0.01"
                                     className="w-20 p-1 border rounded text-right bg-white"
                                     value={newOrder.deliveryFee || 0}
                                     onChange={e => handleDeliveryFeeChange(parseFloat(e.target.value))}
                                   />
                                </div>
                             </div>
                             
                             <div className="flex justify-between items-center text-red-600">
                                <span className="text-sm">Desconto:</span>
                                <div className="flex items-center gap-1 justify-end w-32">
                                   <span className="text-xs">- R$</span>
                                   <input 
                                     type="number"
                                     step="0.01"
                                     className="w-20 p-1 border rounded text-right bg-white text-red-600"
                                     value={newOrder.discount || 0}
                                     onChange={e => handleDiscountChange(parseFloat(e.target.value))}
                                   />
                                </div>
                             </div>

                             <div className="flex justify-between items-center text-xl font-bold text-rose-600 pt-2 border-t border-gray-200">
                                <span>Total:</span>
                                <span>R$ {(newOrder.totalPrice || 0).toFixed(2)}</span>
                             </div>
                        </div>
                    </section>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
                         <textarea 
                            className="w-full p-2 border border-gray-300 rounded-lg h-20"
                            value={newOrder.notes || ''}
                            onChange={e => setNewOrder({...newOrder, notes: e.target.value})}
                         />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                        Cancelar
                    </button>
                    <button onClick={handleSaveOrder} className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-md flex items-center gap-2">
                        <Save size={18} /> Salvar Pedido
                    </button>
                </div>
             </div>
         </div>
       )}
    </div>
  );
};

export default Orders;
