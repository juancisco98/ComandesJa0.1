
import React, { useState, useRef } from 'react';
import { Product, BusinessType } from '../types';
import { Plus, Edit2, Trash2, Camera, ToggleLeft, ToggleRight, DollarSign, X, Save, Percent, Tag, Upload, Search, Package, AlertTriangle, Shirt, Utensils, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext'; // Import Data Hook

const MenuEditor: React.FC = () => {
  const { user } = useAuth();
  
  // Use Global Data Context instead of local state
  const { products, addProduct, updateProduct, deleteProduct, deleteCategory } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // File Input Ref for Card changes
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for form editing
  const [editingId, setEditingId] = useState<string | null>(null); // If null, new product. If set, editing.
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    stock: 50,
    suggestedProductId: ''
  });

  // --- LOGICA DE INTERFAZ DINÁMICA (RESTAURANTE VS RETAIL) ---
  const getTerms = (type: BusinessType | undefined) => {
      switch (type) {
          case 'Restaurante':
          case 'Cafetería':
              return {
                  title: 'Editor de Carta',
                  subtitle: 'Gestiona tus platos, precios y disponibilidad.',
                  newItem: 'Nuevo Plato',
                  itemName: 'Nombre del Plato',
                  descriptionLabel: 'Descripción / Ingredientes',
                  descriptionPlaceholder: 'Ej: Tomate, mozzarella, albahaca...',
                  price: 'Precio (€)',
                  stockLabel: 'Raciones Disponibles (Opcional)',
                  categoryPlaceholder: 'Ej: Entrantes, Postres...',
                  isRestaurant: true
              };
          case 'Tienda de Ropa':
          case 'Farmacia':
          case 'Supermercado':
          default:
              return {
                  title: 'Inventario / Catálogo',
                  subtitle: 'Gestiona tus productos, stock y variantes.',
                  newItem: 'Nuevo Artículo',
                  itemName: 'Nombre del Producto',
                  descriptionLabel: 'Detalles (Talles, Colores, Marca)',
                  descriptionPlaceholder: 'Ej: Talla M, Algodón 100%, Marca X...',
                  price: 'P.V.P (€)',
                  stockLabel: 'Unidades en Stock (Crítico)',
                  categoryPlaceholder: 'Ej: Camisetas, Medicamentos...',
                  isRestaurant: false
              };
      }
  };

  const terms = getTerms(user?.businessType);

  // Obtener categorías únicas dinámicamente de los productos existentes
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter Logic
  const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategoryFilter === 'TODOS' || p.category === activeCategoryFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  // Toggle Delivery Availability
  const toggleDelivery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const product = products.find(p => p.id === id);
    if (product) {
        updateProduct({ ...product, isDeliveryAvailable: !product.isDeliveryAvailable });
    }
  };

  // Handle Image Upload via input
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isForm: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (isForm) {
             setFormData({ ...formData, image: reader.result });
          } else if (editingId) {
             // Quick update just for image (if we were using the card button, but now we use modal mainly)
             const product = products.find(p => p.id === editingId);
             if (product) {
                 updateProduct({ ...product, image: reader.result as string });
             }
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openNewProductModal = () => {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: activeCategoryFilter !== 'TODOS' ? activeCategoryFilter : '', // Auto-fill category if filter active
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
        isDeliveryAvailable: true,
        stock: 50,
        suggestedProductId: ''
      });
      setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
      setEditingId(product.id);
      setFormData({ ...product });
      setIsModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
        alert("Por favor completa el nombre, precio y categoría.");
        return;
    }

    // Normalizar categoría (Capitalize)
    const cleanCategory = formData.category.trim(); 

    if (editingId) {
        // UPDATE EXISTING (Using Context)
        const originalProduct = products.find(p => p.id === editingId);
        if (originalProduct) {
            updateProduct({ ...originalProduct, ...formData, category: cleanCategory } as Product);
        }
    } else {
        // CREATE NEW (Using Context)
        const productToAdd: Product = {
            id: `PROD-${Date.now()}`,
            name: formData.name!,
            description: formData.description || '',
            price: Number(formData.price),
            category: cleanCategory, // This allows new categories
            image: formData.image!,
            isDeliveryAvailable: formData.isDeliveryAvailable ?? true,
            promotionalPrice: formData.promotionalPrice,
            stock: Number(formData.stock) || 0,
            suggestedProductId: formData.suggestedProductId
        };
        addProduct(productToAdd);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("¿Seguro que quieres eliminar este producto?")) {
          deleteProduct(id);
      }
  };

  // --- NUEVA FUNCIONALIDAD: ELIMINAR CATEGORÍA ---
  const handleDeleteCategory = () => {
      if (activeCategoryFilter === 'TODOS') return;
      
      const confirmMsg = `⚠️ ¿ELIMINAR CATEGORÍA "${activeCategoryFilter}"?\n\nEsto eliminará TODOS los productos dentro de esta categoría.\nEsta acción no se puede deshacer.`;
      
      if (window.confirm(confirmMsg)) {
          deleteCategory(activeCategoryFilter);
          // Resetear filtro
          setActiveCategoryFilter('TODOS');
      }
  };

  return (
    <div className="pb-20 relative min-h-screen">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => handleImageUpload(e)}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
            <div className="flex items-center gap-2 mb-1">
                {terms.isRestaurant ? <Utensils className="text-orange-500" /> : <Shirt className="text-indigo-500" />}
                <h2 className="text-3xl font-bold text-gray-900">{terms.title}</h2>
            </div>
            <p className="text-gray-500 mt-1">{terms.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={openNewProductModal}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-emerald-700 transition-colors"
            >
                <Plus size={20} />
                <span className="font-bold whitespace-nowrap">{terms.newItem}</span>
            </button>
        </div>
      </div>

      {/* CATEGORY TABS BAR */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          <div className="flex space-x-2">
            <button 
                onClick={() => setActiveCategoryFilter('TODOS')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategoryFilter === 'TODOS' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategoryFilter === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    {cat}
                </button>
            ))}
          </div>
          
          {/* DELETE CATEGORY BUTTON */}
          {activeCategoryFilter !== 'TODOS' && (
              <button 
                onClick={handleDeleteCategory}
                className="ml-4 flex items-center space-x-2 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-xs font-bold uppercase border border-transparent hover:border-red-100"
                title="Eliminar esta categoría y sus productos"
              >
                  <Trash2 size={16} />
                  <span>Eliminar Categoría</span>
              </button>
          )}
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={30} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No hay productos aquí</h3>
              <p className="text-gray-500 text-sm mt-1">Añade un nuevo item a esta categoría.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
            <div 
                key={product.id} 
                onClick={() => openEditProductModal(product)}
                className={`group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all flex flex-col cursor-pointer ${product.promotionalPrice ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200 hover:border-emerald-200'}`}
            >
                {/* Image Area */}
                <div className="relative h-48 bg-gray-100">
                <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {/* Status Badge */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm ${
                        product.isDeliveryAvailable 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                        {product.isDeliveryAvailable ? 'Activo' : 'Pausado'}
                    </span>
                    {product.promotionalPrice && (
                        <span className="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm bg-orange-500 text-white animate-pulse">
                            ¡OFERTA!
                        </span>
                    )}
                    <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center backdrop-blur-sm ${terms.isRestaurant ? 'bg-gray-900/50 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                        <Package size={10} className="mr-1"/> {product.stock}
                    </span>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg transform scale-95 group-hover:scale-100 transition-transform">
                        Click para Editar
                    </div>
                </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{product.category}</span>
                        <h4 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h4>
                    </div>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {product.description}
                </p>

                {/* Controls (Stop Propagation to prevent opening modal when clicking quick actions) */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            {product.promotionalPrice && <span className="text-xs text-gray-400 line-through">€{product.price.toFixed(2)}</span>}
                            <span className={`text-xl font-bold ${product.promotionalPrice ? 'text-orange-600' : 'text-gray-900'}`}>
                                €{(product.promotionalPrice || product.price).toFixed(2)}
                            </span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={(e) => toggleDelivery(product.id, e)}
                                className={`p-2 rounded-lg transition-colors border ${
                                    product.isDeliveryAvailable
                                    ? 'bg-white border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-300'
                                    : 'bg-red-50 border-red-200 text-red-500'
                                }`}
                                title="Pausar/Activar"
                            >
                                <ToggleRight size={20} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(product.id, e)} 
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* PRODUCT MODAL (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-xl text-gray-800">{editingId ? 'Editar' : terms.newItem}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Image Preview */}
                    <div className="flex justify-center mb-4">
                        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden relative group">
                             <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                                <p className="text-xs text-white opacity-0 group-hover:opacity-100 font-bold">Cambiar Imagen</p>
                             </div>
                             <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{terms.itemName}</label>
                        <input 
                            type="text" 
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder={terms.itemName}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <input 
                                list="categories-list" 
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                placeholder={terms.categoryPlaceholder}
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            />
                            <datalist id="categories-list">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{terms.price}</label>
                            <input 
                                type="number" 
                                step="0.10"
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={formData.price || ''}
                                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Stock & Promo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">{terms.stockLabel}</label>
                             <input 
                                type="number" 
                                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                value={formData.stock || ''}
                                onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                            />
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-orange-600 mb-1">Precio Oferta (Opcional)</label>
                             <input 
                                type="number" 
                                className="w-full bg-white text-gray-900 border border-orange-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                placeholder="Opcional"
                                value={formData.promotionalPrice || ''}
                                onChange={e => setFormData({...formData, promotionalPrice: e.target.value ? parseFloat(e.target.value) : undefined})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-600 mb-1 flex items-center">
                            <LinkIcon size={14} className="mr-1" /> Venta Sugerida (Upselling)
                        </label>
                        <select
                            className="w-full bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            value={formData.suggestedProductId || ''}
                            onChange={e => setFormData({...formData, suggestedProductId: e.target.value})}
                        >
                            <option value="">-- Ninguno --</option>
                            {products
                                .filter(p => p.id !== editingId)
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (€{p.price})</option>
                                ))
                            }
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">Se ofrecerá este producto al añadir el actual al carrito.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{terms.descriptionLabel}</label>
                        <textarea 
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder={terms.descriptionPlaceholder}
                        ></textarea>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveProduct}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-sm flex items-center space-x-2"
                    >
                        <Save size={18} />
                        <span>{editingId ? 'Guardar Cambios' : 'Crear'}</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MenuEditor;
