
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Plus, AlertTriangle, ShoppingBag, Trash2, CheckSquare, ArrowLeft } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onBack: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, setInventory, onBack }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(0);
  const [newItemUnit, setNewItemUnit] = useState('un');

  const handleAddItem = () => {
    if (!newItemName) return;
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemQty,
      unit: newItemUnit,
      minStock: 5, // Default
    };
    setInventory([...inventory, newItem]);
    setNewItemName('');
    setNewItemQty(0);
  };

  const handleDelete = (id: string) => {
    setInventory(inventory.filter(i => i.id !== id));
  };

  const shoppingList = inventory.filter(i => i.quantity <= i.minStock);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"
                title="Voltar ao Painel"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Estoque e Insumos</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Inventory List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-rose-100 flex flex-col overflow-hidden">
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex gap-2">
            <input 
              className="flex-1 p-2 border rounded-lg text-sm bg-gray-100" 
              placeholder="Novo item..."
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
            <input 
              type="number"
              className="w-20 p-2 border rounded-lg text-sm bg-gray-100" 
              placeholder="Qtd"
              value={newItemQty === 0 ? '' : newItemQty}
              onChange={e => setNewItemQty(Number(e.target.value))}
            />
            <select 
              className="w-20 p-2 border rounded-lg text-sm bg-gray-100"
              value={newItemUnit}
              onChange={e => setNewItemUnit(e.target.value)}
            >
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
            </select>
            <button 
              onClick={handleAddItem}
              className="bg-rose-600 text-white p-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-0">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Quantidade</th>
                  <th className="px-6 py-3">Mínimo</th>
                  <th className="px-6 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${item.quantity <= item.minStock ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.minStock} {item.unit}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shopping List */}
        <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-rose-500" />
            Lista de Compras
          </h3>
          
          {shoppingList.length === 0 ? (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center">
              <CheckSquare size={48} className="mb-2 opacity-20" />
              <p>Tudo estocado!</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1">
              {shoppingList.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-yellow-600" />
                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-700 bg-yellow-200 px-2 py-1 rounded">
                    Repor
                  </span>
                </div>
              ))}
              
              <button 
                className="w-full mt-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                onClick={() => {
                  const text = shoppingList.map(i => `- ${i.name}`).join('\n');
                  window.open(`https://wa.me/?text=${encodeURIComponent("Lista de Compras:\n" + text)}`);
                }}
              >
                Enviar p/ WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
