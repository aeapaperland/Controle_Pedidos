
import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Edit2, Share2, ArrowLeft, PackageX, Download, MessageCircle, X, FileText, Gift, Heart, Star, Sparkles, ShoppingBag, Trash2, Save, Image as ImageIcon, ExternalLink, Eye } from 'lucide-react';
import { generateCatalogPDF, generateChristmasCatalogPDF, generateEasterCatalogPDF, generateDonutCatalogPDF } from '../services/pdfService';

interface CatalogProps {
  products: Product[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onAdd: (product: Product) => void;
  onUpdate: (product: Product) => void;
}

type CatalogType = 'general' | 'christmas' | 'easter' | 'donuts';

interface CatalogCardData {
    id: string;
    type: CatalogType;
    title: string;
    description: string;
    containerClass: string;
    titleClass: string;
    btnClass: string;
    iconNode: React.ReactNode;
}

const Catalog: React.FC<CatalogProps> = ({ products, onBack, onDelete, onAdd, onUpdate }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConfig, setShareConfig] = useState<{type: CatalogType, fileName: string}>({
    type: 'general',
    fileName: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

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

  const [activeCatalogs, setActiveCatalogs] = useState<CatalogCardData[]>([
      {
          id: 'cat-donuts',
          type: 'donuts',
          title: 'Catálogo de Personalizados',
          description: 'Opções de Donuts e Doces Personalizados',
          containerClass: 'bg-gradient-to-br from-pink-200 to-rose-200 text-rose-900 border-pink-200',
          titleClass: 'text-rose-900',
          btnClass: 'bg-rose-600 text-white hover:bg-rose-700',
          iconNode: (
            <div className="absolute -bottom-5 -right-5 opacity-20 text-rose-600">
                <Heart size={100} fill="currentColor" />
            </div>
          )
      },
      {
          id: 'cat-christmas',
          type: 'christmas',
          title: 'Catálogo de Natal',
          description: 'Especial de Natal com opções deliciosas',
          containerClass: 'bg-gradient-to-br from-red-600 to-red-800 text-white border-transparent',
          titleClass: 'text-white',
          btnClass: 'bg-white text-red-700 hover:bg-gray-50',
          iconNode: (
            <div className="absolute -bottom-5 -right-5 opacity-20 rotate-12 text-white">
                <Gift size={100} fill="currentColor" />
            </div>
          )
      },
      {
          id: 'cat-easter',
          type: 'easter',
          title: 'Catálogo de Páscoa',
          description: 'Cardápio completo de Páscoa',
          containerClass: 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-900 border-amber-200',
          titleClass: 'text-amber-900',
          btnClass: 'bg-amber-800 text-white hover:bg-amber-900',
          iconNode: (
            <div className="absolute -top-2 -right-2 opacity-10">
                <div className="w-24 h-24 rounded-full bg-amber-900"></div>
            </div>
          )
      }
  ]);

  const handleRemoveCatalog = (id: string) => {
      if(window.confirm("Deseja remover este catálogo da visualização?")) {
          setActiveCatalogs(prev => prev.filter(c => c.id !== id));
      }
  };

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

      const productData: Product = {
          id: editingId || `prod_${Date.now()}`,
          name: formData.name,
          description: formData.description || '',
          basePrice: Number(formData.basePrice),
          costPrice: Number(formData.costPrice || 0),
          category: formData.category || 'Geral',
          imageUrl: formData.imageUrl || '',
          measureUnit: formData.measureUnit || 'un',
          productionTimeMinutes: formData.productionTimeMinutes || 0
      };

      if (editingId) {
          onUpdate(productData);
      } else {
          onAdd(productData);
      }
      setIsEditModalOpen(false);
  };

  const handleDownloadAndShare = async (type: CatalogType, forceWhatsApp: boolean = false) => {
    setIsGenerating(true);
    let fileName = '';
    let title = '';
    let text = '';
    // Type definition update to accept Promise return
    let generateFn: ((returnBlob: boolean) => Blob | void | Promise<Blob | void>) | null = null;

    switch (type) {
        case 'christmas':
            fileName = 'Catalogo_Natal.pdf';
            title = 'Catálogo de Natal A&A';
            text = "Olá! Confira nosso Catálogo Especial de Natal 🎅🎄 com opções deliciosas!";
            generateFn = generateChristmasCatalogPDF;
            break;
        case 'easter':
            fileName = 'Catalogo_Pascoa.pdf';
            title = 'Catálogo de Páscoa A&A';
            text = "Olá! Confira nosso Catálogo de Páscoa 🐰🍫!";
            generateFn = generateEasterCatalogPDF;
            break;
        case 'donuts':
            fileName = 'Catalogo_Personalizados.pdf';
            title = 'Catálogo de Personalizados A&A';
            text = "Olá! Veja nossas opções de Donuts e Doces Personalizados 🍩✨";
            generateFn = generateDonutCatalogPDF;
            break;
        default:
            fileName = 'catalogo_aea_delicias.pdf';
            title = 'Catálogo A&A Delícias';
            text = "Olá! Segue em anexo o nosso Catálogo Geral de Produtos.";
            generateFn = async (blob) => await generateCatalogPDF(products, blob);
            break;
    }

    try {
      // 1. Generate Blob
      const result = await generateFn(true);
      const blob = result as Blob; // Assertion safe here due to flag true

      // 2. Try Native Share
      if (!forceWhatsApp && blob && blob instanceof Blob && navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text });
          setIsGenerating(false);
          return;
        }
      }

      // 3. Fallback: Force download
      if (blob && blob instanceof Blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
      }

      setShareConfig({ type, fileName });
      setShowShareModal(true);

    } catch (error) {
      console.error("Share failed:", error);
      // Fallback download attempt if blob failed
      try { await generateFn(false); } catch(e) {}
      setShareConfig({ type, fileName });
      setShowShareModal(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsApp = () => {
    let msg = "";
    switch(shareConfig.type) {
        case 'christmas': msg = "Olá! Confira nosso Catálogo Especial de Natal 🎅🎄."; break;
        case 'easter': msg = "Olá! Já viu nosso cardápio de Páscoa? 🐰🍫"; break;
        case 'donuts': msg = "Olá! Segue nosso catálogo de Doces Personalizados 🍩✨."; break;
        default: msg = "Olá! Segue em anexo o nosso Catálogo Geral de Produtos.";
    }
      
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setShowShareModal(false);
  };

  return (
    <div className="space-y-8 pb-8">
      {isGenerating && (
        <div className="fixed inset-0 bg-white/80 z-[60] flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                <p className="text-rose-600 font-bold animate-pulse">Gerando PDF...</p>
                <p className="text-xs text-gray-400">Isso pode levar alguns segundos (imagens)</p>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-rose-100 rounded-full text-rose-600 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800 font-script">Catálogo de Produtos</h1>
        </div>
      </div>

      {/* Campaigns Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-rose-500" />
            Catálogos Digitais (PDF/Link)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {activeCatalogs.map(cat => (
                <div key={cat.id} className={`rounded-2xl p-6 shadow-md relative overflow-hidden border hover:shadow-lg transition-shadow flex flex-col justify-between min-h-[200px] ${cat.containerClass}`}>
                     <div>
                        <h3 className={`text-2xl font-bold font-script ${cat.titleClass}`}>{cat.title}</h3>
                        <p className="text-sm mt-2 opacity-80">{cat.description}</p>
                     </div>
                     
                     <div className="mt-6 flex flex-col gap-2 z-10">
                         {/* Botão Principal: Compartilhar PDF (Requisito: Sempre enviar PDF) */}
                         <button 
                            onClick={() => handleDownloadAndShare(cat.type)}
                            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm transition-transform hover:scale-105 ${cat.btnClass}`}
                         >
                            <Share2 size={18} /> Compartilhar PDF
                         </button>
                     </div>
                     
                     {cat.iconNode}
                </div>
            ))}
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="animate-fade-in mt-8">
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
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group flex flex-col overflow-hidden relative h-full">
                    {/* Image Area */}
                    <div className="h-48 w-full bg-gray-50 relative flex items-center justify-center overflow-hidden group-hover:bg-gray-100 transition-colors">
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
                        
                        <div className={`text-4xl opacity-20 group-hover:scale-110 transition-transform duration-300 select-none grayscale group-hover:grayscale-0 filter ${product.imageUrl ? 'hidden' : ''}`}>
                            {product.category.includes('Kit') ? '🎁' : '🍬'}
                        </div>
                        
                        <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-bold text-gray-600 rounded-md shadow-sm uppercase tracking-wide border border-gray-100">
                                {product.category}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 mb-1 group-hover:text-rose-600 transition-colors line-clamp-1">
                                {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">
                                {product.description || "Sem descrição definida."}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase">Valor</span>
                                <span className="text-lg font-bold text-rose-600">{product.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenEditModal(product)} className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => onDelete(product.id)} className="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
         </div>
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
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto</label>
                        <input 
                            type="text" 
                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                            placeholder="Cole o link da imagem aqui..."
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                            <input 
                                type="number" step="0.01"
                                className="w-full p-2.5 border border-gray-200 rounded-lg"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                             <select 
                                className="w-full p-2.5 border border-gray-200 rounded-lg bg-white"
                                value={formData.measureUnit}
                                onChange={(e) => setFormData({...formData, measureUnit: e.target.value as any})}
                             >
                                 <option value="un">Unidade (un)</option>
                                 <option value="kg">Quilo (kg)</option>
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea 
                            className="w-full p-2.5 border border-gray-200 rounded-lg h-24 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <input 
                            list="cats"
                            className="w-full p-2.5 border border-gray-200 rounded-lg"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        />
                        <datalist id="cats">
                            <option value="Bolo"/><option value="Doces"/><option value="Kit Festa"/>
                        </datalist>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl">Cancelar</button>
                    <button onClick={handleSaveProduct} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-bold shadow-md">Salvar</button>
                </div>
            </div>
        </div>
      )}

      {/* Share Instructions Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 text-green-600">
                        <Download size={24} />
                        <h3 className="text-xl font-bold text-gray-800">Download Concluído!</h3>
                    </div>
                    <button onClick={() => setShowShareModal(false)}><X size={24}/></button>
                </div>
                <p className="text-sm text-gray-600 mb-6">O arquivo <strong>{shareConfig.fileName}</strong> foi baixado. Envie-o via WhatsApp Web.</p>
                <button onClick={openWhatsApp} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <MessageCircle size={20} /> Abrir WhatsApp
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
