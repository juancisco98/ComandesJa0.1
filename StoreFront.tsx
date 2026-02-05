
import React, { useState, useEffect } from 'react';
import { MOCK_STORES, MOCK_CONFIG, MOCK_COUPONS, MOCK_ANALYTICS } from '../services/mockService';
import { ShoppingCart, Star, MapPin, Clock, Plus, Minus, Tag, LayoutDashboard, Eye, ArrowLeft, Bike, ShoppingBag, CreditCard, Banknote, X, CheckCircle2, Search, Heart, Share2, AlertOctagon, CalendarClock, TicketPercent, Trash2, ChevronLeft, ArrowRight, UtensilsCrossed, Navigation, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Coupon, Product } from '../types';
import { useData } from '../context/DataContext'; // Import Data Hook

const StoreFront: React.FC = () => {
  const [cart, setCart] = useState<{id: string, qty: number}[]>([]);
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();
  
  // Use Global Data Context
  const { products: allProducts } = useData();

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'DETAILS'>('CART'); // NEW: Step control

  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
  const [address, setAddress] = useState('Carrer Major 4, 2A, Berga'); 
  const [phone, setPhone] = useState('600 123 456');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  
  // Scheduling State
  const [orderTiming, setOrderTiming] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [scheduledTime, setScheduledTime] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // Navigation State
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Upsell State
  const [upsellProduct, setUpsellProduct] = useState<Product | null>(null);

  // Find store by slug or fallback to default for demo
  const store = MOCK_STORES.find(s => s.slug === slug) || MOCK_STORES[0];
  
  // Filter products for this view
  const products = allProducts.filter(p => p.isDeliveryAvailable);
  const isTenantPreview = user?.role === 'TENANT';

  // Check if store allows delivery
  const hasDelivery = store.deliveryFee >= 0;

  // Extract Categories (Unique)
  const uniqueCategories = Array.from(new Set(products.map(p => p.category)));

  // Calculate Best Sellers dynamically from Analytics
  const getBestSellers = () => {
      // In a real app, this would query backend. Here we use MOCK_ANALYTICS.topProducts
      const topNames = MOCK_ANALYTICS.topProducts.map(p => p.name);
      return products.filter(p => topNames.includes(p.name)).map(p => p.id);
  };
  const bestSellerIds = getBestSellers();

  // Initialize active category
  useEffect(() => {
      if (uniqueCategories.length > 0 && !activeCategory) {
          setActiveCategory(uniqueCategories[0]);
      }
  }, [uniqueCategories]);

  // --- EFFECT: LOAD REPEAT ORDER ---
  useEffect(() => {
      const pendingCart = localStorage.getItem('pending_cart');
      if (pendingCart) {
          try {
              const items = JSON.parse(pendingCart);
              if (Array.isArray(items) && items.length > 0) {
                  setCart(items);
              }
              localStorage.removeItem('pending_cart'); // Clear after load
          } catch (e) {
              console.error("Error parsing pending cart", e);
          }
      }
  }, []);

  const addToCart = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    
    // 1. Add Item Logic
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if(existing) return prev.map(i => i.id === id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {id, qty: 1}];
    });

    // 2. Upselling Logic Check
    const product = products.find(p => p.id === id);
    if (product?.suggestedProductId) {
        // Check if suggestion is already in cart
        const isSuggestionInCart = cart.some(i => i.id === product.suggestedProductId);
        if (!isSuggestionInCart) {
            const suggestion = products.find(p => p.id === product.suggestedProductId);
            if (suggestion) {
                setUpsellProduct(suggestion);
            }
        }
    }
  };

  const addUpsellItem = () => {
      if (upsellProduct) {
          addToCart(upsellProduct.id);
          setUpsellProduct(null); // Close modal
      }
  };

  const removeFromCart = (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setCart(prev => {
        const existing = prev.find(i => i.id === id);
        if(existing && existing.qty > 1) return prev.map(i => i.id === id ? {...i, qty: i.qty - 1} : i);
        return prev.filter(i => i.id !== id);
    });
  };

  // Remove entire line item
  const deleteFromCart = (id: string) => {
      setCart(prev => prev.filter(i => i.id !== id));
  };

  // --- SCROLL HANDLER ---
  const handleCategoryClick = (cat: string) => {
      setActiveCategory(cat);
      const element = document.getElementById(`category-${cat}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  // --- CALCULATIONS ---
  const cartSubTotal = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.id);
    if (!product) return acc;
    const price = product.promotionalPrice || product.price;
    return acc + (price * item.qty);
  }, 0);

  // Discount Calculation
  const discountAmount = appliedCoupon 
    ? (cartSubTotal * (appliedCoupon.discountPercent / 100)) 
    : 0;
  
  const totalAfterDiscount = cartSubTotal - discountAmount;

  // Final Total (Delivery Fee applies after discount)
  const finalTotal = totalAfterDiscount + (orderType === 'DELIVERY' ? store.deliveryFee : 0);

  // --- HANDLERS ---

  const handleApplyCoupon = () => {
      if (!couponCode) return;
      
      const found = MOCK_COUPONS.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
      
      if (found) {
          setAppliedCoupon(found);
      } else {
          alert("❌ Este cupón no es válido o ha expirado.");
          setAppliedCoupon(null);
      }
  };

  const handleRemoveCoupon = () => {
      setAppliedCoupon(null);
      setCouponCode('');
  };

  const handleOpenCheckout = (timing: 'ASAP' | 'SCHEDULED' = 'ASAP') => {
      setOrderTiming(timing);
      setCheckoutStep('CART'); // Always start at Cart Review
      setIsCheckoutOpen(true);
  };

  const handleContinueToDetails = () => {
      if (cart.length === 0) return;
      setCheckoutStep('DETAILS');
  };

  const handlePlaceOrder = () => {
      // 0. BUSINESS RULE: Check Closing Time
      const now = new Date();
      const closingTimeStr = MOCK_CONFIG.shifts.night.end; 
      const [closeH, closeM] = closingTimeStr.split(':').map(Number);
      const closingDate = new Date();
      closingDate.setHours(closeH, closeM, 0);
      const diffMs = closingDate.getTime() - now.getTime();
      const diffMins = diffMs / 1000 / 60;

      if (orderTiming === 'ASAP' && diffMins <= 15 && diffMins > -60) {
          alert(`⛔ EL LOCAL ESTÁ CERRANDO\n\nNo se aceptan pedidos inmediatos 15 minutos antes del cierre. Por favor, programa tu pedido.`);
          return;
      }

      if (orderTiming === 'SCHEDULED' && !scheduledTime) {
          alert("❌ Por favor selecciona una hora para tu pedido.");
          return;
      }

      // 1. Validaciones
      if (!phone || phone.length < 9) {
          alert("❌ Error: El número de teléfono es obligatorio.");
          return;
      }

      if (orderType === 'DELIVERY' && (!address || address.length < 5)) {
          alert("❌ Error: Dirección de entrega inválida.");
          return;
      }

      // 2. Simular envío exitoso
      setIsOrderPlaced(true);
      
      // 3. Guardar pedido en Memoria
      const activeOrderData = {
          storeName: store.name,
          total: finalTotal,
          itemsCount: cart.reduce((a,b) => a + b.qty, 0),
          type: orderType,
          eta: orderTiming === 'SCHEDULED' ? `Programado ${scheduledTime}` : (orderType === 'DELIVERY' ? '30-45 min' : '15-20 min'),
          status: 'PENDING', // Start as Pending for store to accept
          timestamp: new Date().getTime()
      };
      localStorage.setItem('active_order', JSON.stringify(activeOrderData));

      setTimeout(() => {
          setIsOrderPlaced(false);
          setIsCheckoutOpen(false);
          setCart([]);
          setAppliedCoupon(null);
          setCouponCode('');
          setCheckoutStep('CART');
          navigate('/store');
      }, 2000);
  };

  // Common Summary Component (used in Sidebar and Modal)
  const OrderSummary = ({ isModal = false, showItems = true }) => (
      <div className={`space-y-4 ${isModal ? '' : ''}`}>
           {/* Products List (Simplified for Sidebar) */}
           {showItems && !isModal && (
               <div className="max-h-60 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {cart.map(item => {
                    const product = products.find(p => p.id === item.id);
                    if(!product) return null;
                    const price = product.promotionalPrice || product.price;
                    return (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                            <div className="flex gap-2">
                                <div className="bg-gray-100 border border-gray-200 px-1.5 rounded text-xs font-bold text-gray-600 h-fit">
                                    {item.qty}x
                                </div>
                                <span className="text-gray-700 font-medium line-clamp-2 w-32">{product.name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-medium text-gray-900">€{(price * item.qty).toFixed(2)}</span>
                                <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => removeFromCart(item.id, e)} className="text-gray-400 hover:text-red-500"><Minus size={12}/></button>
                                        <button onClick={(e) => addToCart(item.id, e)} className="text-gray-400 hover:text-emerald-500"><Plus size={12}/></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
           )}
            
            {/* MATH */}
            <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>€{cartSubTotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                     <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Descuento ({appliedCoupon.discountPercent}%)</span>
                        <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                )}

                {(orderType === 'DELIVERY' && hasDelivery) && (
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Gastos de envío</span>
                        <span className="text-emerald-600 font-medium">{store.deliveryFee === 0 ? 'Gratis' : `€${store.deliveryFee}`}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>€{finalTotal.toFixed(2)}</span>
                </div>
            </div>
      </div>
  );

  return (
    <div className={`min-h-screen bg-[#F8F9FA] pb-24 relative ${isTenantPreview ? 'pt-12' : ''}`}>
      
      {/* BANNER MODO VISTA PREVIA */}
      {isTenantPreview && (
          <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white z-50 px-4 py-3 shadow-md flex justify-between items-center">
              <div className="flex items-center space-x-2">
                  <Eye size={20} className="animate-pulse" />
                  <span className="font-bold text-sm uppercase tracking-wide">Modo Vista Previa</span>
              </div>
              <button 
                onClick={() => navigate('/admin/menu')}
                className="bg-white text-indigo-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-indigo-50 transition-colors"
              >
                  Volver al Editor
              </button>
          </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate('/store')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div className="hidden md:block">
                    <h1 className="font-bold text-gray-900 text-lg leading-none">{store.name}</h1>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Star size={10} className="text-emerald-500 fill-current mr-1" />
                        <span className="font-bold text-emerald-600 mr-2">{store.rating}</span>
                        <span>• {store.category} • {store.deliveryTimeRange}</span>
                    </div>
                </div>
             </div>

             <div className="flex-1 max-w-lg hidden md:block">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={`Buscar en ${store.name}...`}
                        className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                </div>
             </div>

             <div className="flex items-center gap-2">
                 <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                    <Heart size={16} />
                    <span className="hidden sm:inline">Guardar</span>
                 </button>
                 <button className="p-2 rounded-full hover:bg-gray-100 text-gray-700 md:hidden">
                    <Search size={20} />
                 </button>
             </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (MENU) - Span 8 cols */}
        <div className="lg:col-span-8">
            
            {/* HERO BANNER */}
            <div className="relative rounded-3xl overflow-hidden h-48 md:h-64 mb-8 shadow-sm group">
                <img src={store.banner} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">Envío Gratis</span>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-1 shadow-black drop-shadow-lg">{store.name}</h1>
                    <p className="text-white/90 text-sm flex items-center">
                        <MapPin size={14} className="mr-1" /> {store.address}
                    </p>
                </div>
            </div>

            {/* CATEGORY NAV (Sticky underneath top nav) */}
            <div className="sticky top-16 bg-[#F8F9FA] z-30 py-3 -mx-4 px-4 md:mx-0 md:px-0 mb-4 overflow-x-auto scrollbar-hide border-b border-gray-200 md:border-none">
                <div className="flex space-x-2">
                    {uniqueCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                                activeCategory === cat 
                                ? 'bg-gray-900 text-white shadow-md transform scale-105' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* VERTICAL SECTIONS */}
            <div className="space-y-8">
                {uniqueCategories.map(category => (
                    <div key={category} id={`category-${category}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-40">
                        {/* Card Header */}
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-extrabold text-gray-900">{category}</h3>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                {products.filter(p => p.category === category).length} productos
                            </span>
                        </div>
                        
                        {/* List of Products (Vertical Rows) */}
                        <div className="divide-y divide-gray-100">
                            {products.filter(p => p.category === category).map(product => {
                                const inCart = cart.find(i => i.id === product.id);
                                const currentPrice = product.promotionalPrice || product.price;
                                const hasPromo = !!product.promotionalPrice;
                                const isBestSeller = bestSellerIds.includes(product.id);

                                return (
                                    <div 
                                        key={product.id} 
                                        className="p-4 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => addToCart(product.id)}
                                    >
                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900 text-base">{product.name}</h4>
                                                    {hasPromo && <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 rounded-md">OFERTA</span>}
                                                    {/* BEST SELLER BADGE */}
                                                    {isBestSeller && (
                                                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-[10px] font-bold px-2 rounded-md">
                                                            <Crown size={10} className="fill-current" /> TOP VENTAS
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                                            </div>
                                            <div className="mt-3 flex items-center">
                                                {hasPromo && <span className="text-xs text-gray-400 line-through mr-2">€{product.price.toFixed(2)}</span>}
                                                <span className={`font-bold text-lg ${hasPromo ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    €{currentPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Product Image */}
                                        <div className="relative w-28 h-28 flex-shrink-0">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl bg-gray-100 shadow-sm" />
                                            {inCart ? (
                                                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white shadow-lg rounded-full flex items-center justify-center min-w-[32px] h-[32px] text-xs font-bold px-2 ring-4 ring-white animate-in zoom-in">
                                                    {inCart.qty}
                                                </div>
                                            ) : (
                                                <button className="absolute -bottom-2 -right-2 bg-white text-emerald-600 shadow-md rounded-full p-2 border border-gray-100 hover:scale-110 transition-transform ring-4 ring-transparent group-hover:ring-white">
                                                    <Plus size={18} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

        </div>

        {/* RIGHT COLUMN (SIDEBAR - DESKTOP ONLY) - Span 4 cols */}
        <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-24 space-y-4">
                
                {/* DELIVERY CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Tiempo de entrega</h3>
                            <p className="text-xs text-gray-500">Estimado {store.deliveryTimeRange}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                         <div className="bg-emerald-500 w-1/3 h-1.5 rounded-full"></div>
                    </div>
                    <button 
                        onClick={() => handleOpenCheckout('SCHEDULED')} 
                        className="w-full border border-gray-300 text-gray-700 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                        Programar pedido
                    </button>
                </div>

                {/* CART SUMMARY CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-900">Tu Pedido</h3>
                        {cart.length > 0 && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{cart.reduce((a,b) => a+b.qty, 0)} items</span>}
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ShoppingBag className="text-gray-300" size={32} />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Tu cesta está vacía</p>
                            <p className="text-gray-300 text-xs mt-1">Añade productos para empezar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Reusable Summary Component */}
                            <OrderSummary />

                            <button 
                                onClick={() => handleOpenCheckout('ASAP')}
                                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all active:scale-95"
                            >
                                Ir a Pagar
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>

      </div>

      {/* MOBILE STICKY CART (Hidden on Desktop) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 lg:hidden">
            <button 
                onClick={() => handleOpenCheckout('ASAP')}
                className="max-w-3xl mx-auto w-full bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex justify-between items-center hover:bg-emerald-700 transition-transform active:scale-95"
            >
                <div className="flex items-center space-x-2">
                    <span className="bg-emerald-800 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">{cart.reduce((a,b) => a + b.qty, 0)}</span>
                    <span className="font-medium">Ver Pedido</span>
                </div>
                <span className="font-bold text-lg">€{finalTotal.toFixed(2)}</span>
            </button>
        </div>
      )}

      {/* UPSELL MODAL */}
      {upsellProduct && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                  <div className="bg-indigo-600 p-4 text-center">
                      <Sparkles className="text-yellow-300 fill-current mx-auto mb-1 animate-bounce" size={24} />
                      <h3 className="text-white font-bold text-lg">¿Acompañas tu pedido?</h3>
                  </div>
                  <div className="p-6 text-center">
                      <img src={upsellProduct.image} alt={upsellProduct.name} className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 shadow-md bg-gray-100" />
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{upsellProduct.name}</h4>
                      <p className="text-gray-500 text-sm mb-4">{upsellProduct.description}</p>
                      
                      <div className="flex gap-3">
                          <button 
                            onClick={() => setUpsellProduct(null)}
                            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                          >
                              No, gracias
                          </button>
                          <button 
                            onClick={addUpsellItem}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-colors"
                          >
                              Añadir +€{upsellProduct.price.toFixed(2)}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CHECKOUT MODAL (2 STEPS) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isOrderPlaced ? 'items-center justify-center' : ''}`}>
                
                {isOrderPlaced ? (
                    <div className="p-10 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={48} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Recibido!</h2>
                        <p className="text-gray-500">La cocina ya está preparando tu orden.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                {checkoutStep === 'DETAILS' && (
                                    <button onClick={() => setCheckoutStep('CART')} className="text-gray-400 hover:text-gray-700">
                                        <ChevronLeft size={24} />
                                    </button>
                                )}
                                <h3 className="font-bold text-lg text-gray-800">
                                    {checkoutStep === 'CART' ? 'Tu Carrito' : 'Finalizar Pedido'}
                                </h3>
                            </div>
                            <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {/* --- STEP 1: CART REVIEW --- */}
                        {checkoutStep === 'CART' && (
                            <>
                                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>El carrito está vacío.</p>
                                        </div>
                                    ) : (
                                        cart.map(item => {
                                            const product = products.find(p => p.id === item.id);
                                            if(!product) return null;
                                            const price = product.promotionalPrice || product.price;

                                            return (
                                                <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
                                                    <img src={product.image} className="w-16 h-16 rounded-lg object-cover bg-gray-100" alt={product.name} />
                                                    <div className="flex-1 flex flex-col justify-between">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</h4>
                                                            <button 
                                                                onClick={() => deleteFromCart(item.id)}
                                                                className="text-gray-300 hover:text-red-500 p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-1">
                                                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                                                <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-red-500 disabled:opacity-50">
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="w-8 text-center font-bold text-sm text-gray-900">{item.qty}</span>
                                                                <button onClick={() => addToCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-emerald-500">
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                            <span className="font-bold text-gray-900">€{(price * item.qty).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}

                                    {/* COUPON INPUT MOVED HERE */}
                                    <div className="pt-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Cupones</h4>
                                        {!appliedCoupon ? (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <TicketPercent className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                                    <input 
                                                        type="text" 
                                                        placeholder="Código de descuento" 
                                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 uppercase text-gray-900"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value)}
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponCode}
                                                    className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center animate-in zoom-in">
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <TicketPercent size={18} />
                                                    <span className="text-sm font-bold">CUPÓN: {appliedCoupon.code}</span>
                                                </div>
                                                <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 bg-white p-1 rounded shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* TOTALS */}
                                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                                        <div className="flex justify-between text-sm text-gray-500">
                                            <span>Subtotal</span>
                                            <span>€{cartSubTotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                                <span>Descuento ({appliedCoupon.discountPercent}%)</span>
                                                <span>-€{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                                            <span>Total (Sin envío)</span>
                                            <span>€{totalAfterDiscount.toFixed(2)}</span>
                                        </div>
                                    </div>

                                </div>
                                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                                    <button 
                                        onClick={() => setIsCheckoutOpen(false)}
                                        className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        Seguir Pidiendo
                                    </button>
                                    <button 
                                        onClick={handleContinueToDetails}
                                        disabled={cart.length === 0}
                                        className="flex-[2] bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        Continuar <ArrowRight size={20} />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* --- STEP 2: DETAILS --- */}
                        {checkoutStep === 'DETAILS' && (
                            <>
                                <div className="overflow-y-auto p-6 space-y-6 flex-1 animate-in slide-in-from-right-4 duration-300">
                                    
                                    {/* 1. Timing */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuándo lo quieres?</label>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <button 
                                                onClick={() => setOrderTiming('ASAP')}
                                                className={`py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all border ${orderTiming === 'ASAP' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <Clock size={16} />
                                                <span>Lo antes posible</span>
                                            </button>
                                            <button 
                                                onClick={() => setOrderTiming('SCHEDULED')}
                                                className={`py-3 px-2 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all border ${orderTiming === 'SCHEDULED' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                <CalendarClock size={16} />
                                                <span>Programar</span>
                                            </button>
                                        </div>
                                        
                                        {orderTiming === 'SCHEDULED' && (
                                            <div className="animate-in slide-in-from-top-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora de entrega</label>
                                                <input 
                                                    type="time" 
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg p-3 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Order Type Toggle */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">¿Cómo lo quieres?</label>
                                        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
                                            {hasDelivery && (
                                                <button 
                                                    onClick={() => setOrderType('DELIVERY')}
                                                    className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${orderType === 'DELIVERY' ? 'bg-white text-emerald-600 shadow-sm ring-2 ring-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    <Bike size={18} />
                                                    <span>A Domicilio</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setOrderType('PICKUP')}
                                                className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all ${orderType === 'PICKUP' || !hasDelivery ? 'bg-white text-emerald-600 shadow-sm ring-2 ring-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <ShoppingBag size={18} />
                                                <span>Para Llevar</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Details (Address/Phone) */}
                                    {orderType === 'DELIVERY' && hasDelivery && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dirección de Entrega <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                                    <input 
                                                        type="text" 
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                                                        placeholder="Calle, número, piso (Obligatorio)"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Teléfono de Contacto <span className="text-red-500">*</span></label>
                                        <input 
                                            type="tel" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                                            placeholder="600 000 000"
                                            required
                                        />
                                    </div>

                                    {/* 4. Payment Method */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Método de Pago</label>
                                        <div className="space-y-2">
                                            <button 
                                                onClick={() => setPaymentMethod('CARD')}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <CreditCard size={20} className={paymentMethod === 'CARD' ? 'text-emerald-600' : 'text-gray-400'} />
                                                    <span className={`font-medium ${paymentMethod === 'CARD' ? 'text-emerald-900' : 'text-gray-600'}`}>Tarjeta de Crédito / Débito</span>
                                                </div>
                                                {paymentMethod === 'CARD' && <div className="w-4 h-4 rounded-full bg-emerald-500"></div>}
                                            </button>

                                            <button 
                                                onClick={() => setPaymentMethod('CASH')}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Banknote size={20} className={paymentMethod === 'CASH' ? 'text-emerald-600' : 'text-gray-400'} />
                                                    <span className={`font-medium ${paymentMethod === 'CASH' ? 'text-emerald-900' : 'text-gray-600'}`}>Efectivo</span>
                                                </div>
                                                {paymentMethod === 'CASH' && <div className="w-4 h-4 rounded-full bg-emerald-500"></div>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Final Summary */}
                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-2">Resumen Final</h4>
                                        <OrderSummary isModal={true} showItems={false} />
                                    </div>
                                </div>

                                <div className="p-4 bg-white border-t border-gray-100">
                                    <button 
                                        onClick={handlePlaceOrder}
                                        className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg"
                                    >
                                        Confirmar Pedido • €{finalTotal.toFixed(2)}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default StoreFront;
