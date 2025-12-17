import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Edit2, ArrowLeft, PackageX, X, ShoppingBag, Trash2, Save, Image as ImageIcon } from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
}

const Catalog: React.FC<CatalogProps> = ({ products, onBack, onDelete, onAdd, onUpdate }) => {
  // Edit/Add Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    basePrice: 0,
    costPrice: 0,
    category: '',
    imageUrl: '',
    measureUnit: 'un',
    productionTimeMinutes: 30
  });

  const handleOpenAddModal = () => {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        basePrice: 0,
        costPrice: 0,
        category: 'Doces',
        imageUrl: '',
        measureUnit: 'un',
        productionTimeMinutes: 30
      });
      setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
      setEditingId(product.id);
      setFormData({ ...product });
      setIsEditModalOpen(true);
  };

  const handleSaveProduct = () => {
      if (!formData.name || formData.basePrice === undefined) {
          alert("Nome e Preço são obrigatórios.");
          return;
      }

      if (editingId) {
          // Update
          const updatedProduct: Product = {
              id: editingId,
              name: formData.name,
              description: formData.description || '',
              basePrice: Number(formData.basePrice),
              costPrice: Number(formData.costPrice || 0),
              category: formData.category || 'Geral',
              imageUrl: formData.imageUrl || '',
              measureUnit: formData.measureUnit || 'un',
              productionTimeMinutes: formData.productionTimeMinutes || 0
          };
          onUpdate(updatedProduct);
      } else {
          // Add
          const newProduct: Product = {
              id: `prod_${Date.now()}`,
              name: formData.name,
              description: formData.description || '',
              basePrice: Number(formData.basePrice),
              costPrice: Number(formData.costPrice || 0),
              category: formData.category || 'Geral',
              imageUrl: formData.imageUrl || '',
              measureUnit: formData.measureUnit || 'un',
              productionTimeMinutes: formData.productionTimeMinutes || 0
          };
          onAdd(newProduct);
      }
      setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors"
                title="Voltar ao Painel"
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Lista de Produtos</h1>
        </div>
      </div>

      {/* Product Grid Section - Modern Cards */}
      <section className="animate-fade-in">
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <ShoppingBag className="text-rose-500" size={22} />
               Produtos Cadastrados
            </h2>
            <button 
                onClick={handleOpenAddModal}
                className="text-rose-600 text-sm font-medium hover:underline flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition-colors"
            >
                <Plus size={16} /> Adicionar Novo
            </button>
         </div>
         
         {products.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                 <PackageX size={48} className="mx-auto text-gray-300 mb-3" />
                 <p className="text-gray-500 font-medium">Nenhum produto cadastrado.</p>
                 <p className="text-gray-400 text-sm">Utilize o botão "Adicionar Novo" para começar.</p>
             </div>
         ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                   <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden relative h-full">
                      {/* Modern Image Area */}
                      <div className="h-56 w-full bg-gradient-to-br from-rose-50 to-orange-50 relative flex items-center justify-center overflow-hidden group-hover:from-rose-100 group-hover:to-orange-100 transition-colors">
                          {product.imageUrl ? (
                              <img 
                                 src={product.imageUrl} 
                                 alt={product.name} 
                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                 onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                 }}
                              />
                          ) : null}
                          
                          {/* Fallback Icon (Only shown if no image or error) */}
                          <div className={`text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300 select-none grayscale group-hover:grayscale-0 filter ${product.imageUrl ? 'hidden' : ''}`}>
                                  {product.category.toLowerCase().includes('bolo') ? '🎂' : 
                                   product.category.toLowerCase().includes('donut') ? '🍩' :
                                   product.category.toLowerCase().includes('pão') ? '🍯' : 
                                   product.category.toLowerCase().includes('biscoito') ? '🍪' : 
                                   product.category.toLowerCase().includes('kit') ? '🎁' : '🍬'}
                          </div>
                          
                          {/* Category Tag (Floating) */}
                          <div className="absolute top-3 right-3">
                              <span className="px-3 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-gray-600 rounded-full shadow-sm uppercase tracking-wide border border-white">
                                  {product.category}
                              </span>
                          </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex-col">
                          <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-rose-600 transition-colors">
                                  {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed min-h-[2.5em]">
                                  {product.description || "Produto artesanal feito com ingredientes selecionados de alta qualidade."}
                              </p>
                          </div>

                          <div className="flex items-end justify-between pt-4 border-t border-gray-50 mt-auto">
                              <div>
                                  <p className="text-[10px] text-gray-400 font-medium mb-0.5 uppercase tracking-wider">Valor Unitário</p>
                                  <p className="text-xl font-bold text-rose-600 flex items-baseline gap-1">
                                      R$ {product.basePrice.toFixed(2)}
                                      <span className="text-xs text-gray-400 font-normal text-gray-500">/{product.measureUnit}</span>
                                  </p>
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => handleOpenEditModal(product)}
                                      className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95 group-hover:bg-rose-50 group-hover:text-rose-600 group-hover:hover:bg-rose-600 group-hover:hover:text-white"
                                      title="Editar Detalhes"
                                  >
                                      <Edit2 size={18} />
                                  </button>
                                  <button 
                                      onClick={() => onDelete(product.id)}
                                      className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                                      title="Excluir Produto"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      </div>
                   </div>
                ))}
             </div>
         )}
      </section>

      {/* Edit/Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-rose-500"/> : <Plus size={20} className="text-rose-500"/>}
                        {editingId ? 'Editar Produto' : 'Novo Produto'}
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Image Preview Area */}
                    <div className="flex justify-center mb-4">
                        <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon size={32} className="text-gray-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Preview</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex: Bolo de Chocolate"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-sm text-gray-600"
                            placeholder="https://..."
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        />
                        <p className="text-xs text-gray-400 mt-1">Cole o link de uma imagem da internet.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input 
                                type="text"
                                list="categories"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            />
                            <datalist id="categories">
                                <option value="Bolo" />
                                <option value="Donut" />
                                <option value="Cupcake" />
                                <option value="Pão de Mel" />
                                <option value="Kit" />
                                <option value="Kit Festa" />
                                <option value="Trufa" />
                                <option value="Popsicle" />
                                <option value="Pirulito" />
                                <option value="Modelagem" />
                                <option value="Biscoito" />
                            </datalist>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                             <select 
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                                value={formData.measureUnit}
                                onChange={(e) => setFormData({...formData, measureUnit: e.target.value as 'un'|'kg'|'g'})}
                             >
                                 <option value="un">Unidade (un)</option>
                                 <option value="kg">Quilo (kg)</option>
                                 <option value="g">Grama (g)</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                        <textarea 
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none h-24 resize-none"
                            placeholder="Descreva os ingredientes, sabor, decoração..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveProduct}
                        className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
