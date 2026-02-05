
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MOCK_COUPONS, MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../services/mockService';
import { Coupon, Product, FlashSale, MarketingStats } from '../types';
import { Ticket, Star, Plus, Trash2, Sparkles, Check, Send, Zap, Bot, BarChart3, Flame, Package, X, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Campaign {
    id: string;
    title: string;
    message: string;
    audience: 'ALL' | 'VIP' | 'INACTIVE';
    sentAt: Date;
    status: 'SENT' | 'SCHEDULED';
    reach: number;
}

const MarketingView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPharmacy = user?.businessType === 'Farmacia';
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'AUTO' | 'FLASH'>('MANUAL');

  // State
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Marketing Stats (ROI)
  const [stats, setStats] = useState<MarketingStats>({
      revenueGenerated: 1250.50,
      discountCost: 185.20,
      campaignsSent: 12,
      activeAutomations: 1
  });

  // Flash Sale State
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSale | null>(null);
  const [isFlashSaleModalOpen, setIsFlashSaleModalOpen] = useState(false);
  const [flashSaleConfig, setFlashSaleConfig] = useState({
      discount: 50,
      durationHours: 1
  });

  // Automation State
  const [automations, setAutomations] = useState({
      abandonedCart: true,
      upselling: false,
      birthday: false
  });

  // Notifications
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

  // Modal State for Coupon (Edit & Create)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponFormData, setCouponFormData] = useState({ 
      code: '', 
      discount: 10, 
      maxUses: 100 
  });

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({ title: '', message: '', audience: 'ALL' });
  const [isSending, setIsSending] = useState(false);

  // Copy Config
  const copy = {
      flashTitle: isPharmacy ? '¿Stock Acumulado?' : '¿Noche Floja?',
      flashDesc: isPharmacy 
        ? 'Activa una oferta rápida para liberar productos próximos a caducar o con exceso de inventario.' 
        : 'Activa una oferta agresiva en tu plato estrella para llenar el local en 1 hora.',
      flashBtn: isPharmacy ? 'LIQUIDAR STOCK' : 'ACTIVAR MODO FLASH',
      autoUpsellTitle: isPharmacy ? 'Venta Cruzada (Salud)' : 'Venta Cruzada (Postres)',
      autoUpsellDesc: isPharmacy 
        ? 'Sugiere vitaminas o complementos automáticamente al comprar antibióticos o analgésicos.'
        : 'Sugiere bebidas o postres automáticamente si el pedido solo contiene platos principales.'
  };

  // --- EFFECTS ---
  
  useEffect(() => {
    // Check local storage for active flash sale on mount
    const savedFlash = localStorage.getItem('flash_sale');
    if (savedFlash) {
        const parsed = JSON.parse(savedFlash);
        // Check if expired
        if (parsed.endTime > Date.now()) {
            setActiveFlashSale(parsed);
        } else {
            localStorage.removeItem('flash_sale');
        }
    }

    // Auto-create from Analytics
    if (location.state && location.state.createOfferFor) {
        const { createOfferFor, suggestedDiscount, limit } = location.state;
        const generatedCode = `PROMO-${createOfferFor.substring(0, 4).toUpperCase()}${suggestedDiscount}`;
        
        setCoupons(prev => {
            if (prev.find(c => c.code === generatedCode)) return prev;
            
            const newCoupon: Coupon = {
                id: `CPN-AUTO-${Date.now()}`,
                code: generatedCode,
                discountPercent: suggestedDiscount,
                isActive: true,
                uses: 0,
                maxUses: limit // Apply the limit from Analytics
            };
            
            showNotification(`¡Oferta creada: ${generatedCode} (Límite: ${limit})!`, 'success');
            return [newCoupon, ...prev];
        });
        
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- HELPERS ---

  const showNotification = (msg: string, type: 'success' | 'info' = 'success') => {
      setNotification({ msg, type });
      setTimeout(() => setNotification(null), 4000);
  };

  // --- COUPON ACTIONS ---

  const openNewCouponModal = () => {
      setEditingCouponId(null);
      setCouponFormData({ code: '', discount: 10, maxUses: 100 });
      setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
      setEditingCouponId(coupon.id);
      setCouponFormData({
          code: coupon.code,
          discount: coupon.discountPercent,
          maxUses: coupon.maxUses || 100 // Default to 100 if undefined
      });
      setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = () => {
    if (!couponFormData.code) return;

    if (editingCouponId) {
        // UPDATE EXISTING
        setCoupons(coupons.map(c => c.id === editingCouponId ? {
            ...c,
            code: couponFormData.code.toUpperCase(),
            discountPercent: Number(couponFormData.discount),
            maxUses: Number(couponFormData.maxUses)
        } : c));
        showNotification("Cupón actualizado correctamente");
    } else {
        // CREATE NEW
        const newCoupon: Coupon = {
            id: `CPN-${Date.now()}`,
            code: couponFormData.code.toUpperCase(),
            discountPercent: Number(couponFormData.discount),
            isActive: true,
            uses: 0,
            maxUses: Number(couponFormData.maxUses)
        };
        setCoupons([newCoupon, ...coupons]);
        showNotification("Cupón creado exitosamente");
    }
    
    setIsCouponModalOpen(false);
  };

  // --- CAMPAIGN ACTIONS ---

  const handleSendCampaign = () => {
      if (!campaignForm.message || !campaignForm.title) return;
      setIsSending(true);
      setTimeout(() => {
          const audienceCount = campaignForm.audience === 'ALL' ? MOCK_CUSTOMERS.length : 5;
          const newCampaign: Campaign = {
              id: `CMP-${Date.now()}`,
              title: campaignForm.title,
              message: campaignForm.message,
              audience: campaignForm.audience as any,
              sentAt: new Date(),
              status: 'SENT',
              reach: audienceCount
          };
          setCampaigns([newCampaign, ...campaigns]);
          setStats(prev => ({...prev, campaignsSent: prev.campaignsSent + 1}));
          
          // 1. Broadcast para Popup Instantáneo
          const broadcastData = {
              id: `BCAST-${Date.now()}`,
              title: campaignForm.title,
              message: campaignForm.message,
              timestamp: Date.now()
          };
          localStorage.setItem('latest_broadcast', JSON.stringify(broadcastData));

          // 2. Guardar en Historial de Notificaciones Globales
          const notificationItem = {
             id: `NOTIF-${Date.now()}`,
             title: campaignForm.title,
             message: campaignForm.message,
             date: new Date().toISOString(),
             isRead: false
          };
          
          const existingNotifications = JSON.parse(localStorage.getItem('system_notifications') || '[]');
          localStorage.setItem('system_notifications', JSON.stringify([notificationItem, ...existingNotifications]));

          setIsSending(false);
          setCampaignForm({ title: '', message: '', audience: 'ALL' });
          showNotification(`Campaña enviada a ${audienceCount} clientes.`);
      }, 1500);
  };

  const toggleFeatured = (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product?.isFeatured) {
        const currentFeatured = products.filter(p => p.isFeatured).length;
        if (currentFeatured >= 3) {
            alert("Solo puedes destacar 3 productos a la vez.");
            return;
        }
    }
    setProducts(products.map(p => p.id === id ? { ...p, isFeatured: !p.isFeatured } : p));
  };

  // --- FLASH SALE LOGIC ---
  
  const handleActivateFlashSale = (selectedProduct: Product) => {
      const endTime = Date.now() + (flashSaleConfig.durationHours * 60 * 60 * 1000);

      const discountFactor = flashSaleConfig.discount / 100;
      const discountAmount = selectedProduct.price * discountFactor;
      const discountedPrice = Number((selectedProduct.price - discountAmount).toFixed(2));

      const sale: FlashSale = {
          isActive: true,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          originalPrice: selectedProduct.price,
          discountedPrice: discountedPrice,
          endTime
      };

      setActiveFlashSale(sale);
      localStorage.setItem('flash_sale', JSON.stringify(sale));
      setIsFlashSaleModalOpen(false);
      showNotification(`¡OFERTA ACTIVADA! ${selectedProduct.name} al ${flashSaleConfig.discount}% OFF`, "success");
  };

  const handleStopFlashSale = () => {
      setActiveFlashSale(null);
      localStorage.removeItem('flash_sale');
      showNotification("Oferta detenida.", "info");
  };

  const getMockStock = (id: string) => {
      const code = id.charCodeAt(0) + id.length;
      return (code * 7) % 50 + 5; 
  };

  const calculateDiscountPercent = (original: number, discounted: number) => {
      if (original === 0) return 0;
      return Math.round(((original - discounted) / original) * 100);
  };

  return (
    <div className="pb-10 relative">
      
      {/* Notification Toast */}
      {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
              {notification.type === 'success' ? <Check size={20} className="mr-2" /> : <Sparkles size={20} className="mr-2" />}
              <span className="font-bold">{notification.msg}</span>
          </div>
      )}

      {/* HEADER & ROI DASHBOARD */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Marketing & Crecimiento</h2>
        
        {/* ROI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-indigo-200 text-sm font-medium">Ingresos por Marketing</p>
                    <BarChart3 className="text-indigo-300" size={20}/>
                </div>
                <h3 className="text-3xl font-bold">€{stats.revenueGenerated.toLocaleString()}</h3>
                <p className="text-xs text-indigo-300 mt-2 flex items-center">
                    <Check size={12} className="mr-1"/> Ventas atribuidas a campañas
                </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-500 text-sm font-medium">Costo de Descuentos</p>
                    <Ticket className="text-orange-500" size={20}/>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">€{stats.discountCost.toLocaleString()}</h3>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-orange-500 h-1.5 rounded-full" style={{width: '25%'}}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">15% sobre ventas totales</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-500 text-sm font-medium">ROI (Retorno)</p>
                    <Sparkles className="text-emerald-500" size={20}/>
                </div>
                <h3 className="text-3xl font-bold text-emerald-600">6.7x</h3>
                <p className="text-xs text-gray-400 mt-2">
                    Por cada €1 invertido, recuperas €6.7
                </p>
            </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-6 space-x-6">
          <button 
            onClick={() => setActiveTab('MANUAL')}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'MANUAL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Ticket size={16} /> <span>Cupones y Destacados</span>
          </button>
          <button 
            onClick={() => setActiveTab('AUTO')}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'AUTO' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Bot size={16} /> <span>Automatizaciones</span>
          </button>
          <button 
            onClick={() => setActiveTab('FLASH')}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'FLASH' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Zap size={16} /> <span>Ofertas Flash</span>
          </button>
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in fade-in duration-300">
        
        {/* TAB 1: MANUAL (COUPONS & FEATURED & CAMPAIGNS) */}
        {activeTab === 'MANUAL' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                 {/* COUPON MANAGER */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800">Cupones Activos</h3>
                        <button onClick={openNewCouponModal} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg"><Plus size={20}/></button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-h-[400px] overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                            {coupons.map(coupon => (
                                <div 
                                    key={coupon.id} 
                                    onClick={() => openEditCouponModal(coupon)}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                                            <Ticket size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                                {coupon.code}
                                                <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {coupon.discountPercent}% OFF • {coupon.uses} {coupon.maxUses ? `/ ${coupon.maxUses}` : ''} usos
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setCoupons(coupons.filter(c => c.id !== coupon.id)); }} 
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Featured */}
                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Destacar {isPharmacy ? 'Productos' : 'Platos'}</h3>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {products.map(product => (
                                <div key={product.id} className={`flex items-center justify-between p-2 rounded-lg border mb-2 transition-all ${product.isFeatured ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'}`}>
                                    <div className="flex items-center overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-8 h-8 rounded-md object-cover mr-2" />
                                        <p className="font-bold text-gray-800 text-xs truncate">{product.name}</p>
                                    </div>
                                    <button onClick={() => toggleFeatured(product.id)} className={`p-1 rounded ${product.isFeatured ? 'text-yellow-600' : 'text-gray-300'}`}>
                                        <Star size={16} fill={product.isFeatured ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CAMPAIGN MANAGER */}
                <div className="xl:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Send size={18} className="mr-2 text-indigo-600"/> Enviar Difusión</h3>
                        <input 
                            type="text" 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
                            placeholder="Título (Ej: ¡Oferta 2x1 en Cremas!)"
                            value={campaignForm.title}
                            onChange={e => setCampaignForm({...campaignForm, title: e.target.value})}
                        />
                        <textarea 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
                            placeholder="Mensaje Push / SMS..."
                            value={campaignForm.message}
                            onChange={e => setCampaignForm({...campaignForm, message: e.target.value})}
                        ></textarea>
                        <div className="flex-1"></div>
                        <button 
                            onClick={handleSendCampaign}
                            disabled={isSending || !campaignForm.title}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {isSending ? 'Enviando...' : 'Enviar Notificación'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: AUTOMATION */}
        {activeTab === 'AUTO' && (
            <div className="max-w-4xl">
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex items-start">
                    <Bot className="text-emerald-600 mt-1 mr-3 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-emerald-800">Piloto Automático</h3>
                        <p className="text-emerald-600 text-sm">Estas reglas funcionan 24/7 para recuperar ventas y aumentar el ticket medio.</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                     {/* Rule 1: Abandoned Cart */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="flex items-center mb-1">
                                <h4 className="font-bold text-gray-900 text-lg">Recuperar Carritos Abandonados</h4>
                                <span className="ml-3 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">Trigger: 120 min inactivo</span>
                            </div>
                            <p className="text-gray-500 text-sm max-w-xl">
                                Envía automáticamente una notificación push con un cupón del <strong>10%</strong> si el cliente deja productos en la cesta sin comprar.
                            </p>
                        </div>
                        <button 
                            onClick={() => setAutomations({...automations, abandonedCart: !automations.abandonedCart})}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${automations.abandonedCart ? 'bg-emerald-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${automations.abandonedCart ? 'translate-x-7' : 'translate-x-1'}`}/>
                        </button>
                     </div>

                     {/* Rule 2: Upselling */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <div className="flex items-center mb-1">
                                <h4 className="font-bold text-gray-900 text-lg">{copy.autoUpsellTitle}</h4>
                                <span className="ml-3 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded font-mono">Trigger: Al pagar</span>
                            </div>
                            <p className="text-gray-500 text-sm max-w-xl">
                                {copy.autoUpsellDesc}
                            </p>
                        </div>
                         <button 
                            onClick={() => setAutomations({...automations, upselling: !automations.upselling})}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${automations.upselling ? 'bg-emerald-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${automations.upselling ? 'translate-x-7' : 'translate-x-1'}`}/>
                        </button>
                     </div>
                 </div>
            </div>
        )}

        {/* TAB 3: FLASH SALES (Customizable) */}
        {activeTab === 'FLASH' && (
            <div className="max-w-4xl mx-auto text-center py-8">
                
                {activeFlashSale ? (
                    <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-10 animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Flame size={40} className="text-red-600" />
                        </div>
                        <h2 className="text-3xl font-black text-red-600 uppercase tracking-tight mb-2">Oferta Flash Activa</h2>
                        <p className="text-gray-600 mb-6">
                            Oferta activa para <strong>{activeFlashSale.productName}</strong> al {calculateDiscountPercent(activeFlashSale.originalPrice, activeFlashSale.discountedPrice)}%.
                        </p>
                        <div className="text-4xl font-mono font-bold text-gray-900 mb-8">
                            00:59:32
                        </div>
                        <button 
                            onClick={handleStopFlashSale}
                            className="bg-white border-2 border-red-200 text-red-600 font-bold px-8 py-3 rounded-xl hover:bg-red-50 transition-colors"
                        >
                            Detener Oferta
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-3xl p-10 shadow-sm">
                         <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Zap size={40} className="text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{copy.flashTitle}</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            {copy.flashDesc}
                        </p>
                        <button 
                            onClick={() => setIsFlashSaleModalOpen(true)}
                            className="bg-red-600 text-white font-black text-lg px-10 py-4 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-105 transition-all flex items-center mx-auto"
                        >
                            <Flame size={24} className="mr-2" /> {copy.flashBtn}
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>

      {/* COUPON MODAL (Create & Edit) */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{editingCouponId ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
                    <button onClick={() => setIsCouponModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Código Promocional</label>
                        <input 
                            type="text" 
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 uppercase font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Ej: OFF50"
                            value={couponFormData.code}
                            onChange={e => setCouponFormData({...couponFormData, code: e.target.value})}
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Descuento (%)</label>
                            <input 
                                type="number" 
                                min="1"
                                max="100"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-gray-900"
                                value={couponFormData.discount}
                                onChange={e => setCouponFormData({...couponFormData, discount: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Límite Usos</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-gray-900"
                                placeholder="Ej: 100"
                                value={couponFormData.maxUses}
                                onChange={e => setCouponFormData({...couponFormData, maxUses: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                        El cupón se desactivará automáticamente después de {couponFormData.maxUses} usos.
                    </p>

                    <button 
                        onClick={handleSaveCoupon}
                        disabled={!couponFormData.code}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md mt-2 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {editingCouponId ? <Edit2 size={16}/> : <Plus size={16}/>}
                        {editingCouponId ? 'Guardar Cambios' : 'Crear Cupón'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* FLASH SALE MODAL */}
      {isFlashSaleModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                  <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-lg text-red-700 flex items-center">
                              <Zap size={20} className="mr-2 fill-current" /> Generar Oferta Flash
                          </h3>
                          <p className="text-xs text-red-500 mt-1">Elige el producto y el descuento a aplicar.</p>
                      </div>

                      {/* Global Discount Selector */}
                      <div className="flex items-center bg-white px-3 py-1 rounded-lg border border-red-200 shadow-sm mx-4">
                            <span className="text-xs font-bold text-red-800 uppercase mr-2">Descuento:</span>
                            <input 
                                type="number" 
                                min="5" 
                                max="95" 
                                step="5"
                                value={flashSaleConfig.discount}
                                onChange={(e) => setFlashSaleConfig({...flashSaleConfig, discount: Number(e.target.value)})}
                                className="w-12 text-center font-black text-red-600 border-b border-red-200 focus:outline-none focus:border-red-500"
                            />
                            <span className="text-red-600 font-bold ml-1">%</span>
                      </div>

                      <button onClick={() => setIsFlashSaleModalOpen(false)} className="text-red-400 hover:text-red-600 bg-white rounded-full p-1">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0">
                              <tr>
                                  <th className="px-4 py-2">Producto</th>
                                  <th className="px-4 py-2 text-center">Stock</th>
                                  <th className="px-4 py-2 text-right">P.V.P</th>
                                  <th className="px-4 py-2"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {[...products]
                                .sort((a,b) => b.price - a.price)
                                .map(product => (
                                  <tr key={product.id} className="hover:bg-red-50/50 transition-colors group">
                                      <td className="px-4 py-3">
                                          <div className="flex items-center">
                                              <img src={product.image} className="w-10 h-10 rounded-lg object-cover mr-3 bg-gray-100" alt={product.name} />
                                              <div>
                                                  <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                                                  <p className="text-xs text-gray-400">{product.category}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-3 text-center text-sm font-medium">
                                          {product.stock || getMockStock(product.id)}
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                                          €{product.price.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          <button 
                                              onClick={() => handleActivateFlashSale(product)}
                                              className="bg-white border-2 border-red-500 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                          >
                                              OFERTAR AL {flashSaleConfig.discount}%
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default MarketingView;
