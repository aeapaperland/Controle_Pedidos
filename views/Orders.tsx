
import React, { useState } from 'react';
import { Order, OrderStatus, ProductionStage, Product, OrderItem, Customer, Transaction } from '../types';
import { Plus, Search, Filter, Sparkles, Save, X, Trash2, FileText, ShoppingBag, Printer, Edit, ArrowLeft, User, Share2, Truck, Percent } from 'lucide-react';
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
        setItemQuantity(product.measureUnit === 'g' ? 100 : 1);
    } else {
        setItemPrice(0);
        setItemQuantity(1);
    }
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewOrder(prev => ({ ...prev, customerName: name }));
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
    let candidates: Omit<OrderItem, 'id'>[] = [];
    if (kitComposition) {
        candidates.push({
            productId: product.id, name: product.name, quantity: itemQuantity, unitPrice: itemPrice, details: 'Kit Promocional', measureUnit: 'un'
        });
        kitComposition.forEach((comp) => {
            const compProduct = products.find(p => p.id === comp.id);
            if (compProduct) {
                candidates.push({
                    productId: compProduct.id, name: `(Incluso no Kit) ${compProduct.name}`, quantity: comp.qty * itemQuantity, unitPrice: 0, details: `Item integrante do ${product.name}`, measureUnit: compProduct.measureUnit
                });
            }
        });
    } else {
        candidates.push({
            productId: product.id, name: product.name, quantity: itemQuantity, unitPrice: itemPrice, details: '', measureUnit: product.measureUnit
        });
    }
    const currentItems = [...(newOrder.items || [])];
    candidates.forEach((candidate) => {
        const existingIndex = currentItems.findIndex(item => item.productId === candidate.productId && Math.abs(item.unitPrice - candidate.unitPrice) < 0.001 && (item.details || '').trim() === (candidate.details || '').trim());
        if (existingIndex >= 0) {
            currentItems[existingIndex] = { ...currentItems[existingIndex], quantity: currentItems[existingIndex].quantity + candidate.quantity };
        } else {
            currentItems.push({ ...candidate, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` });
        }
    });
    setNewOrder({ ...newOrder, items: currentItems, totalPrice: calculateTotal(currentItems, newOrder.deliveryFee || 0, newOrder.discount || 0) });
    setSelectedProductId(''); setItemQuantity(1); setItemPrice(0);
  };

  const handleRemoveItem = (itemId: string) => {
      const updatedItems = (newOrder.items || []).filter(i => i.id !== itemId);
      setNewOrder({ ...newOrder, items: updatedItems, totalPrice: calculateTotal(updatedItems, newOrder.deliveryFee || 0, newOrder.discount || 0) });
  };

  const handleDeliveryFeeChange = (val: number) => {
      const fee = isNaN(val) ? 0 : val;
      setNewOrder({ ...newOrder, deliveryFee: fee, totalPrice: calculateTotal(newOrder.items || [], fee, newOrder.discount || 0) });
  };

  const handleDiscountChange = (val: number) => {
      const discount = isNaN(val) ? 0 : val;
      setNewOrder({ ...newOrder, discount: discount, totalPrice: calculateTotal(newOrder.items || [], newOrder.deliveryFee || 0, discount) });
  };

  const handleEditOrder = (order: Order) => {
    setNewOrder({ ...order, deliveryFee: order.deliveryFee || 0, discount: order.discount || 0 });
    setIsModalOpen(true);
  };

  const handleSaveOrder = () => {
    if (!newOrder.customerName || !newOrder.dueDate) { alert("Nome e Data são obrigatórios."); return; }
    const itemsTotal = newOrder.items?.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) || 0;
    const calculatedTotal = Math.max(0, itemsTotal + (newOrder.deliveryFee || 0) - (newOrder.discount || 0));
    let savedOrderId = newOrder.id;
    const safeOrderData = {
        customerName: newOrder.customerName, customerWhatsapp: newOrder.customerWhatsapp || '', partyType: newOrder.partyType || '', theme: newOrder.theme || '', items: newOrder.items || [], dueDate: newOrder.dueDate, dueTime: newOrder.dueTime || '00:00', location: newOrder.location || '', deliveryFee: newOrder.deliveryFee || 0, discount: newOrder.discount || 0, totalPrice: calculatedTotal, status: newOrder.status || OrderStatus.ORCAMENTO, productionStage: newOrder.productionStage || ProductionStage.PRE_PREPARO, notes: newOrder.notes || '', birthdayPersonName: newOrder.birthdayPersonName, birthdayPersonAge: newOrder.birthdayPersonAge
    };
    if (newOrder.id) {
        const originalOrder = orders.find(o => o.id === newOrder.id);
        const updatedOrder: Order = { id: newOrder.id, createdAt: originalOrder?.createdAt || new Date().toISOString(), ...safeOrderData };
        setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } else {
        savedOrderId = Math.random().toString(36).substring(2, 9);
        const order: Order = { id: savedOrderId, createdAt: new Date().toISOString(), ...safeOrderData };
        setOrders([order, ...orders]);
    }
    const existingIdx = customers.findIndex(c => c.name.toLowerCase() === newOrder.customerName?.toLowerCase());
    const customerData: Customer = { id: existingIdx >= 0 ? customers[existingIdx].id : Math.random().toString(36).substring(2, 9), name: newOrder.customerName!, whatsapp: newOrder.customerWhatsapp || '', address: newOrder.location, birthdayPersonName: newOrder.birthdayPersonName, birthdayPersonAge: newOrder.birthdayPersonAge, lastOrderDate: new Date().toISOString() };
    if (existingIdx >= 0) { const updated = [...customers]; updated[existingIdx] = customerData; setCustomers(updated); } else { setCustomers([...customers, customerData]); }
    let rev = 0; if (newOrder.status === OrderStatus.PENDENTE_50) rev = calculatedTotal / 2; else if ([OrderStatus.PAGO_100, OrderStatus.FINALIZADO].includes(newOrder.status as OrderStatus)) rev = calculatedTotal;
    const existingTrans = transactions.find(t => t.orderId === savedOrderId);
    if (rev > 0) {
        const trans: Transaction = { id: existingTrans ? existingTrans.id : `t_${Date.now()}`, orderId: savedOrderId, date: newOrder.dueDate!, type: 'INCOME', amount: rev, category: 'Venda', description: `Pedido: ${newOrder.customerName} (${newOrder.theme || 'Doces'})` };
        if (existingTrans) setTransactions(prev => prev.map(t => t.id === existingTrans.id ? trans : t)); else setTransactions(prev => [trans, ...prev]);
    } else if (existingTrans) { setTransactions(prev => prev.filter(t => t.id !== existingTrans.id)); }
    setIsModalOpen(false); resetForm();
  };

  const resetForm = () => {
      setNewOrder({ status: OrderStatus.ORCAMENTO, productionStage: ProductionStage.PRE_PREPARO, items: [], dueDate: new Date().toISOString().split('T')[0], totalPrice: 0, deliveryFee: 0, discount: 0, birthdayPersonName: '', birthdayPersonAge: undefined, dueTime: '' });
  };

  const handleDeleteOrder = (orderId: string) => {
      if (window.confirm('Excluir permanentemente?')) { setOrders(prev => prev.filter(o => o.id !== orderId)); setTransactions(prev => prev.filter(t => t.orderId !== orderId)); }
  };

  const handlePdfToWhatsapp = async (order: Order) => {
      const fileName = `AEA_Orcamento_${order.customerName.replace(/\s+/g, '_')}.pdf`;
      const pdfBlob = generateOrderPDF(order, logo, true) as Blob;
      
      // Tentativa de compartilhamento nativo (Permite anexar o arquivo diretamente no WhatsApp em celulares)
      if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
          try {
              const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
              await navigator.share({
                  files: [file],
                  title: 'A&A Delícias - Pedido',
                  text: `Olá ${order.customerName}! Segue o detalhamento do seu pedido/orçamento. 🎂🍬`
              });
              return;
          } catch (err) {
              console.log("Share API falhou ou cancelada, usando fallback", err);
          }
      }

      // Fallback: Download padrão + link do WhatsApp
      generateOrderPDF(order, logo);
      const msg = `Olá ${order.customerName}, segue em anexo o arquivo PDF com o detalhamento do pedido.`;
      const phone = order.customerWhatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      alert(`O PDF foi baixado.\n\nPor favor, anexe o arquivo baixado na conversa do WhatsApp que foi aberta.`);
  };

  const statusColors: Record<string, string> = {
    [OrderStatus.ORCAMENTO]: 'bg-gray-100 text-gray-700',
    [OrderStatus.PENDENTE_100]: 'bg-red-100 text-red-700',
    [OrderStatus.PENDENTE_50]: 'bg-orange-100 text-orange-700',
    [OrderStatus.PAGO_100]: 'bg-green-100 text-green-700',
    [OrderStatus.FINALIZADO]: 'bg-blue-100 text-blue-700'
  };

  const filteredOrders = orders.filter(o => o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.theme.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
      const dateA = new Date(a.dueDate + 'T00:00:00').getTime();
      const dateB = new Date(b.dueDate + 'T00:00:00').getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (a.dueTime || '00:00').localeCompare(b.dueTime || '00:00');
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"><ArrowLeft size={24} /></button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Gestão de Pedidos</h1>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors"><Plus size={20} /> Novo Pedido</button>
      </div>
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-rose-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar por cliente ou tema..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-gray-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><Filter size={20} /></button>
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
            {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-rose-50/30 transition-colors">
                  <td className="p-4"><div className="font-medium">{order.customerName}</div><div className="text-xs text-gray-500">{order.customerWhatsapp}</div></td>
                  <td className="p-4"><div className="text-sm font-medium">{order.theme}</div>{order.birthdayPersonName && <div className="text-xs text-rose-600 font-semibold mt-1">Aniver: {order.birthdayPersonName} ({order.birthdayPersonAge} anos)</div>}</td>
                  <td className="p-4 text-sm text-gray-600"><div>{new Date(order.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')} - {order.dueTime}</div></td>
                  <td className="p-4 font-medium">R$ {order.totalPrice.toFixed(2).replace('.', ',')}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>{order.status}</span></td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => handleEditOrder(order)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Editar"><Edit size={18} /></button>
                    <button onClick={() => generateOrderPDF(order, logo)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-full" title="Imprimir PDF"><Printer size={18} /></button>
                    <button onClick={() => handlePdfToWhatsapp(order)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full" title="Enviar PDF WhatsApp"><Share2 size={18} /></button>
                    <button onClick={() => handleDeleteOrder(order.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Excluir"><Trash2 size={18} /></button>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">{newOrder.id ? 'Editar Pedido' : 'Novo Pedido'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-rose-600 border-b pb-2 flex items-center gap-2"><User size={18} /> Dados do Cliente</h3>
                    <input list="customer-suggestions" className="w-full p-2 border rounded-lg bg-gray-100" placeholder="Nome do Cliente" value={newOrder.customerName || ''} onChange={handleCustomerNameChange} />
                    <datalist id="customer-suggestions">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    <input className="w-full p-2 border rounded-lg bg-gray-100" placeholder="WhatsApp" value={newOrder.customerWhatsapp || ''} onChange={e => setNewOrder({...newOrder, customerWhatsapp: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs">Data</label><input type="date" className="w-full p-2 border rounded-lg bg-gray-100" value={newOrder.dueDate || ''} onChange={e => setNewOrder({...newOrder, dueDate: e.target.value})} /></div>
                        <div><label className="text-xs">Hora</label><input type="time" className="w-full p-2 border rounded-lg bg-gray-100" value={newOrder.dueTime || ''} onChange={e => setNewOrder({...newOrder, dueTime: e.target.value})} /></div>
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="font-semibold text-rose-600 border-b pb-2">Detalhes</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <input className="w-full p-2 border rounded-lg bg-gray-100" placeholder="Aniversariante" value={newOrder.birthdayPersonName || ''} onChange={e => setNewOrder({...newOrder, birthdayPersonName: e.target.value})} />
                        <input type="number" className="w-full p-2 border rounded-lg bg-gray-100" placeholder="Anos" value={newOrder.birthdayPersonAge || ''} onChange={e => setNewOrder({...newOrder, birthdayPersonAge: e.target.value ? parseInt(e.target.value) : undefined})} />
                    </div>
                    <input className="w-full p-2 border rounded-lg bg-gray-100" placeholder="Tema" value={newOrder.theme || ''} onChange={e => setNewOrder({...newOrder, theme: e.target.value})} />
                    <select className="w-full p-2 border rounded-lg bg-gray-100" value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value as OrderStatus})}>{Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
              </div>
              <div className="space-y-4 flex flex-col h-full">
                <h3 className="font-semibold text-rose-600 border-b pb-2">Itens</h3>
                <div className="bg-rose-50 p-4 rounded-lg space-y-3 border border-rose-100">
                    <select className="w-full p-2 border rounded-md bg-white text-sm" value={selectedProductId} onChange={(e) => handleProductSelect(e.target.value)}>
                        <option value="">Selecione...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <input type="number" className="w-full p-2 border rounded-md text-sm bg-white" placeholder="Qtd" value={itemQuantity} onChange={e => setItemQuantity(parseFloat(e.target.value))} />
                        <button onClick={handleAddItem} className="w-full py-2 bg-rose-500 text-white rounded-md text-sm font-semibold hover:bg-rose-600">Adicionar</button>
                    </div>
                </div>
                <div className="flex-1 border rounded-lg overflow-y-auto p-2 bg-gray-50 min-h-[150px]">
                    {newOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border mb-2">
                            <span className="text-sm font-medium">{item.quantity}x {item.name}</span>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-bold">Total</span>
                        <span className="text-3xl font-bold text-rose-600">R$ {calculateTotal(newOrder.items || [], newOrder.deliveryFee || 0, newOrder.discount || 0).toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button onClick={handleSaveOrder} className="w-full py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-md">Salvar Pedido</button>
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
