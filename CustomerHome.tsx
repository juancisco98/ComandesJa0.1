
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_STORES, MOCK_ORDERS } from '../services/mockService';
import { Search, MapPin, Star, Clock, Bike, Filter, Heart, User, Home, ShoppingBag, LayoutDashboard, Pill, Store, ArrowLeftRight, CheckCircle2, ChefHat, X, Coffee, ShoppingCart, Cross, LogOut, Flame, Timer, Bell, MessageSquare, Megaphone, Trash2, Phone, ThumbsUp, Send, RefreshCw, ChevronRight, Globe, ShieldAlert, FileText, ChevronLeft, Plus, Save, Loader2, Navigation, TicketPercent, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FlashSale, Order, OrderStatus } from '../types';

interface ActiveOrder {
    storeName: string;
    total: number;
    itemsCount: number;
    type: 'DELIVERY' | 'PICKUP';
    eta: string;
    status: 'PENDING' | 'COOKING' | 'READY' | 'DELIVERED';
    timestamp: number;
}

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    date: string;
}

interface SavedAddress {
    id: number;
    label: string;
    address: string;
}

type ViewState = 'HOME' | 'ORDERS' | 'PROFILE';
type ProfileViewState = 'MENU' | 'ADDRESSES' | 'TERMS';

const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchRole, logout } = useAuth();
  
  // --- GLOBAL NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  
  // --- PROFILE SUB-NAVIGATION STATE (Moved up to prevent re-mount bugs) ---
  const [profileSubView, setProfileSubView] = useState<ProfileViewState>('MENU');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // --- HOME / ORDER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filters
  const [showFreeDeliveryOnly, setShowFreeDeliveryOnly] = useState(false);
  const [showPromosOnly, setShowPromosOnly] = useState(false); // NEW STATE

  const [address, setAddress] = useState('Berga, Centre');
  const [isLoadingStores, setIsLoadingStores] = useState(false); 
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); 
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  
  // Tracker & Review State
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  
  // Flash Sale State
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Notifications Logic
  const [broadcastMessage, setBroadcastMessage] = useState<{title: string, message: string} | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings State
  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'ES');
  const [hasLangChanged, setHasLangChanged] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION EFFECTS ---
  useEffect(() => {
    const orderData = localStorage.getItem('active_order');
    if (orderData) {
        setActiveOrder(JSON.parse(orderData));
    }

    // Load Addresses Logic
    const storedAddr = JSON.parse(localStorage.getItem('user_addresses') || '[]');
    const historyAddresses: SavedAddress[] = [
        { id: 101, label: 'Casa (Historial)', address: 'Carrer Major 12, 2A, Berga' },
        { id: 102, label: 'Trabajo (Historial)', address: 'Plaça de Sant Pere 5, Berga' }
    ];
    // Merge addresses
    const merged = [...storedAddr];
    if (merged.length === 0) {
        setSavedAddresses(historyAddresses);
    } else {
        setSavedAddresses(merged);
    }

    const checkUpdates = () => {
        // 1. Check Flash Sale
        const savedFlash = localStorage.getItem('flash_sale');
        if (savedFlash) {
            const parsed: FlashSale = JSON.parse(savedFlash);
            if (parsed.endTime > Date.now()) {
                setFlashSale(parsed);
                const secondsLeft = Math.floor((parsed.endTime - Date.now()) / 1000);
                const m = Math.floor(secondsLeft / 60);
                const s = secondsLeft % 60;
                setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
            } else {
                setFlashSale(null);
                localStorage.removeItem('flash_sale');
            }
        } else {
            setFlashSale(null);
        }

        // 2. Check Broadcast Messages
        const savedBroadcast = localStorage.getItem('latest_broadcast');
        if (savedBroadcast) {
            const parsed = JSON.parse(savedBroadcast);
            if (Date.now() - parsed.timestamp < 3600000) { 
                 setBroadcastMessage(parsed);
            }
        }

        // 3. Check System Notifications
        const systemNotifs = JSON.parse(localStorage.getItem('system_notifications') || '[]');
        setNotifications(systemNotifs);
        
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const unread = systemNotifs.filter((n: any) => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 2000);
    return () => clearInterval(interval);

  }, []);

  // --- HANDLERS ---

  const closeTracking = () => {
      if (activeOrder?.status === 'DELIVERED') {
          localStorage.removeItem('active_order');
          setActiveOrder(null);
      }
      setIsTrackerOpen(false);
  }

  const handleLogout = () => {
      const confirmed = window.confirm("¿Seguro que quieres cerrar sesión?");
      if (confirmed) {
          // 1. Limpiar almacenamiento
          localStorage.removeItem('comandesja_session');
          
          // 2. Ejecutar logout del contexto
          logout(); 
          
          // 3. Redirigir explícitamente (Replace evita volver atrás)
          navigate('/login', { replace: true });
      }
  };

  const closeBroadcast = () => {
      setBroadcastMessage(null);
  };

  const handleOpenNotifications = () => {
      setIsNotificationsOpen(!isNotificationsOpen);
      if (!isNotificationsOpen && notifications.length > 0) {
          const allIds = notifications.map(n => n.id);
          localStorage.setItem('read_notifications', JSON.stringify(allIds));
          setUnreadCount(0);
      }
  };

  const clearNotifications = () => {
      if(window.confirm("¿Borrar todas las notificaciones?")) {
          localStorage.setItem('system_notifications', '[]');
          setNotifications([]);
      }
  };

  const handleSimulateDelivery = () => {
      if (activeOrder) {
          const updatedOrder = { ...activeOrder, status: 'DELIVERED' as const };
          setActiveOrder(updatedOrder);
          localStorage.setItem('active_order', JSON.stringify(updatedOrder));
      }
  };

  const handleSubmitReview = () => {
      if (reviewRating === 0) {
          alert("Por favor selecciona una calificación de estrellas.");
          return;
      }
      setIsReviewSubmitted(true);
      setTimeout(() => {
          localStorage.removeItem('active_order');
          setActiveOrder(null);
          setIsTrackerOpen(false);
          setReviewRating(0);
          setReviewComment('');
          setIsReviewSubmitted(false);
      }, 2500);
  };

  const handleCallRestaurant = () => {
      alert("📞 Teléfono del Local: 938 123 456");
  };

  const handleRepeatOrder = (order: Order) => {
      const store = MOCK_STORES.find(s => s.id === order.tenantId);
      if (!store) {
          alert("Lo sentimos, este local ya no está disponible.");
          return;
      }
      const cartItems = order.items.map(item => ({
          id: item.productId,
          qty: item.quantity
      }));
      localStorage.setItem('pending_cart', JSON.stringify(cartItems));
      navigate(`/store/${store.slug}`);
  };

  const handleDeleteAccount = () => {
      if (window.confirm("¿Estás SEGURO de que quieres eliminar tu cuenta?\n\nEsta acción es irreversible.")) {
          logout();
          localStorage.clear();
          navigate('/login', { replace: true });
      }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value);
      setHasLangChanged(true);
  };

  const saveLanguage = () => {
      localStorage.setItem('app_language', language);
      setHasLangChanged(false);
      alert("✅ Idioma guardado correctamente.");
  };

  // --- ADDRESS HANDLERS ---
  const handleRemoveAddress = (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("¿Eliminar dirección de la lista?")) {
          const updated = savedAddresses.filter(a => a.id !== id);
          setSavedAddresses(updated);
          localStorage.setItem('user_addresses', JSON.stringify(updated));
      }
  };

  const handleAddAddress = () => {
      const newAddr = prompt("Introduce la nueva dirección:");
      if (newAddr && newAddr.length > 5) {
          const newObj = { id: Date.now(), label: 'Nueva Dirección', address: newAddr };
          const updated = [...savedAddresses, newObj];
          setSavedAddresses(updated);
          localStorage.setItem('user_addresses', JSON.stringify(updated));
      }
  };

  const handleOpenAddressModal = () => {
      setIsAddressModalOpen(true);
  };

  const handleSelectAddress = (selectedAddr: string) => {
      setAddress(selectedAddr);
      setIsAddressModalOpen(false); // Close Modal
      setIsLoadingStores(true);
      setCurrentView('HOME');
      setProfileSubView('MENU');
      setTimeout(() => {
          setIsLoadingStores(false);
      }, 1200);
  };

  const handleBackToAdmin = () => {
      switchRole('TENANT');
      navigate('/admin/kitchen');
  };

  // --- RENDER HELPERS ---

  const businessCategories = [
    { name: 'Restaurante', icon: <ChefHat size={20}/>, label: 'Comida' },
    { name: 'Farmacia', icon: <Cross size={20}/>, label: 'Farmacia' },
    { name: 'Cafetería', icon: <Coffee size={20}/>, label: 'Café & Pan' },
    { name: 'Supermercado', icon: <ShoppingCart size={20}/>, label: 'Súper' },
    { name: 'Otro', icon: <Store size={20}/>, label: 'Otros' },
  ];

  const filteredStores = MOCK_STORES.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          store.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? store.businessType === selectedCategory : true;
    
    // Filters
    const matchesFreeDelivery = showFreeDeliveryOnly ? store.deliveryFee === 0 : true;
    // Mock Logic for Promos: Stores with tags including 'Oferta' OR high rating
    const matchesPromos = showPromosOnly ? (store.tags?.some(t => t.toLowerCase().includes('oferta')) || store.rating >= 4.8) : true;

    return matchesSearch && matchesCategory && matchesFreeDelivery && matchesPromos;
  });

  const discountPercent = flashSale ? Math.round(((flashSale.originalPrice - flashSale.discountedPrice) / flashSale.originalPrice) * 100) : 0;

  // --- SUB-COMPONENTS (INLINED TO AVOID REMOUNTING) ---

  const renderOrdersView = () => {
      const historyOrders = MOCK_ORDERS.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');
      return (
          <div className="max-w-2xl mx-auto px-4 py-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Pedidos</h2>
              {/* Active Order Card */}
              {activeOrder && (
                  <div className="mb-8 animate-in slide-in-from-top-2">
                      <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Pedido en Curso</h3>
                      <div className="bg-white rounded-2xl shadow-md border border-emerald-100 overflow-hidden">
                          <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <Clock className="animate-pulse" size={18} />
                                  <span className="font-bold">
                                      {activeOrder.status === 'DELIVERED' ? 'Entregado' : (activeOrder.type === 'DELIVERY' ? 'En camino' : 'En preparación')}
                                  </span>
                              </div>
                              <span className="text-xs bg-emerald-700 px-2 py-1 rounded font-mono">{activeOrder.eta}</span>
                          </div>
                          <div className="p-5">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-lg text-gray-900">{activeOrder.storeName}</h4>
                                  <span className="text-emerald-600 font-bold">€{activeOrder.total.toFixed(2)}</span>
                              </div>
                              <p className="text-gray-500 text-sm mb-4">{activeOrder.itemsCount} productos • {activeOrder.type === 'DELIVERY' ? 'A Domicilio' : 'Para Llevar'}</p>
                              <button onClick={() => setIsTrackerOpen(true)} className="w-full bg-emerald-50 text-emerald-700 font-bold py-3 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                  Ver Seguimiento
                              </button>
                          </div>
                      </div>
                  </div>
              )}
              {/* History */}
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Historial</h3>
              <div className="space-y-4">
                  {historyOrders.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                          <ShoppingBag size={40} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 font-medium">No tienes pedidos anteriores.</p>
                      </div>
                  ) : (
                      historyOrders.map(order => {
                          const store = MOCK_STORES.find(s => s.id === order.tenantId);
                          return (
                            <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                        <img src={store?.image} className="w-full h-full object-cover rounded-lg opacity-80" alt="" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900">{store?.name || 'Local Desconocido'}</h4>
                                            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </p>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-sm font-bold text-gray-900">€{order.total.toFixed(2)}</span>
                                            <button onClick={() => handleRepeatOrder(order)} className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                                <RefreshCw size={14} /> Repetir Pedido
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          );
                      })
                  )}
              </div>
          </div>
      );
  };

  const renderProfileView = () => {
     // ... (Existing Profile Code kept as is for brevity, no changes needed here) ...
      if (profileSubView === 'ADDRESSES') {
          return (
              <div className="max-w-2xl mx-auto px-4 py-6 animate-in slide-in-from-right duration-200">
                  <button onClick={() => setProfileSubView('MENU')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-bold text-sm">
                      <ChevronLeft size={20} className="mr-1" /> Volver al Perfil
                  </button>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Mis Direcciones</h2>
                      <button onClick={handleAddAddress} className="text-emerald-600 bg-emerald-50 p-2 rounded-full hover:bg-emerald-100">
                          <Plus size={20} />
                      </button>
                  </div>
                  <div className="space-y-3">
                      {savedAddresses.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No tienes direcciones guardadas.</p>
                          </div>
                      ) : (
                          savedAddresses.map(addr => (
                              <div 
                                key={addr.id} 
                                onClick={() => handleSelectAddress(addr.address)}
                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group hover:border-emerald-500 cursor-pointer transition-all"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-full ${address === addr.address ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                                          {address === addr.address ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
                                      </div>
                                      <div>
                                          <p className={`font-bold text-sm ${address === addr.address ? 'text-emerald-700' : 'text-gray-800'}`}>{addr.label} {address === addr.address && '(Activa)'}</p>
                                          <p className="text-xs text-gray-500">{addr.address}</p>
                                      </div>
                                  </div>
                                  <button onClick={(e) => handleRemoveAddress(addr.id, e)} className="text-gray-300 hover:text-red-500 p-2">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          );
      }
      if (profileSubView === 'TERMS') {
          return (
              <div className="max-w-2xl mx-auto px-4 py-6 animate-in slide-in-from-right duration-200">
                  <button onClick={() => setProfileSubView('MENU')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 font-bold text-sm">
                      <ChevronLeft size={20} className="mr-1" /> Volver al Perfil
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Términos y Condiciones</h2>
                  <div className="bg-white p-8 rounded-xl border border-gray-200 text-sm text-gray-600 leading-relaxed shadow-sm h-[70vh] overflow-y-auto custom-scrollbar">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">1. Introducción y Objeto</h3>
                      <p className="mb-4">Bienvenido a ComandesJa. Estos Términos y Condiciones regulan el acceso y uso de la plataforma ComandesJa.</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">2. Pedidos</h3>
                      <p className="mb-4">El Usuario puede cancelar el pedido sin coste siempre que el Establecimiento no haya aceptado o iniciado la preparación.</p>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">3. Pagos</h3>
                      <p className="mb-4">Los precios mostrados incluyen el IVA aplicable.</p>
                      <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">Última actualización: Febrero 2024</div>
                  </div>
              </div>
          );
      }
      return (
          <div className="max-w-2xl mx-auto px-4 py-6 animate-in fade-in duration-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-2xl font-bold">{user?.name.charAt(0)}</div>
                  <div><h3 className="font-bold text-xl text-gray-900">{user?.name}</h3><p className="text-gray-500 text-sm">{user?.email}</p><span className="inline-block mt-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-bold">Cliente</span></div>
              </div>
              <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3 mb-3"><Globe size={20} className="text-gray-400" /><div className="flex-1"><label className="text-sm font-bold text-gray-900 block">Idioma de la App</label><p className="text-xs text-gray-500">Selecciona tu preferencia</p></div></div>
                          <div className="flex gap-2">
                              <select value={language} onChange={handleLanguageChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
                                  <option value="ES">Español</option><option value="CA">Català</option><option value="EN">English</option>
                              </select>
                              {hasLangChanged && (<button onClick={saveLanguage} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 transition-all flex items-center animate-in fade-in slide-in-from-right"><Save size={16} className="mr-1" /> Guardar</button>)}
                          </div>
                      </div>
                      <button onClick={() => setProfileSubView('ADDRESSES')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left transition-colors"><div className="flex items-center gap-3"><MapPin size={20} className="text-gray-400" /><span className="text-sm font-medium text-gray-700">Mis Direcciones</span></div><ChevronRight size={16} className="text-gray-400" /></button>
                      <button onClick={() => setProfileSubView('TERMS')} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left border-t border-gray-100 transition-colors"><div className="flex items-center gap-3"><FileText size={20} className="text-gray-400" /><span className="text-sm font-medium text-gray-700">Términos y Condiciones</span></div><ChevronRight size={16} className="text-gray-400" /></button>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
                      <button onClick={handleLogout} className="w-full p-4 flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors cursor-pointer"><LogOut size={20} /><span className="font-bold text-sm">Cerrar Sesión</span></button>
                      <button onClick={handleDeleteAccount} className="w-full p-4 flex items-center gap-3 text-red-500 hover:bg-red-50 border-t border-gray-100 transition-colors cursor-pointer"><ShieldAlert size={20} /><span className="font-bold text-sm">Eliminar Cuenta</span></button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* DEVELOPER FLOATING BUTTON */}
      {user?.storeSlug && (
          <button 
            onClick={handleBackToAdmin}
            className="fixed bottom-20 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-full shadow-2xl flex items-center space-x-2 font-bold text-sm border-2 border-white hover:scale-105 transition-transform"
          >
              <LayoutDashboard size={18} />
              <span>VOLVER AL LOCAL</span>
          </button>
      )}

      {/* MARKETING BROADCAST POPUP */}
      {broadcastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[60] animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white border-l-4 border-indigo-600 rounded-lg shadow-2xl p-4 max-w-lg mx-auto flex items-start gap-4">
                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 shrink-0">
                    <MessageSquare size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{broadcastMessage.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{broadcastMessage.message}</p>
                    <button 
                        onClick={() => navigate('/store/la-pizzeria-de-berga')}
                        className="text-indigo-600 font-bold text-sm mt-3 hover:underline flex items-center"
                    >
                        Ver Detalles <ArrowLeftRight size={14} className="ml-1" />
                    </button>
                </div>
                <button onClick={closeBroadcast} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>
        </div>
      )}

      {/* ADDRESS SELECTOR MODAL (NEW) */}
      {isAddressModalOpen && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md md:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-900">¿Dónde entregamos?</h3>
                      <button onClick={() => setIsAddressModalOpen(false)} className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-600 shadow-sm">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-4 space-y-4 overflow-y-auto">
                        {/* New Address Input */}
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-emerald-600" size={20}/>
                            <input 
                                type="text" 
                                placeholder="Escribe una nueva dirección..." 
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        handleSelectAddress(e.currentTarget.value);
                                    }
                                }}
                            />
                        </div>

                        <button 
                            onClick={() => handleSelectAddress("Ubicación Actual (GPS)")}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-emerald-600 font-bold text-sm transition-colors border border-dashed border-emerald-200"
                        >
                            <Navigation size={18} className="fill-current" />
                            Usar mi ubicación actual
                        </button>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Direcciones Guardadas</p>
                            <div className="space-y-2">
                                {savedAddresses.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No tienes direcciones guardadas.</p>
                                ) : (
                                    savedAddresses.map(addr => (
                                        <button 
                                            key={addr.id}
                                            onClick={() => handleSelectAddress(addr.address)}
                                            className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${address === addr.address ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <div className={`p-2 rounded-full ${address === addr.address ? 'bg-white text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {address === addr.address ? <CheckCircle2 size={18}/> : <MapPin size={18}/>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{addr.label}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{addr.address}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}

      {/* TRACKING & REVIEW MODAL */}
      {isTrackerOpen && activeOrder && (
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                      <div>
                          <h3 className="font-bold text-lg">
                              {activeOrder.status === 'DELIVERED' ? 'Pedido Entregado' : 'Seguimiento de Pedido'}
                          </h3>
                          <p className="text-emerald-100 text-xs">
                             {activeOrder.storeName} • {activeOrder.itemsCount} items
                          </p>
                      </div>
                      <button onClick={() => setIsTrackerOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>
                  {/* Tracking Content ... (Kept as is) */}
                  <div className="overflow-y-auto p-6">
                      {isReviewSubmitted ? (
                          <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={48} className="text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reseña Enviada!</h3>
                                <p className="text-gray-500 text-center">Gracias por tu opinión.</p>
                          </div>
                      ) : activeOrder.status !== 'DELIVERED' ? (
                          <>
                            <div className="text-center mb-8">
                                <div className="inline-block p-4 bg-emerald-50 rounded-full mb-4 animate-bounce">
                                    {activeOrder.status === 'COOKING' && <ChefHat size={40} className="text-emerald-600" />}
                                    {activeOrder.status === 'READY' && (activeOrder.type === 'DELIVERY' ? <Bike size={40} className="text-emerald-600" /> : <ShoppingBag size={40} className="text-emerald-600" />)}
                                    {activeOrder.status === 'PENDING' && <Store size={40} className="text-emerald-600" />}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                    {activeOrder.status === 'PENDING' && "Confirmando Pedido..."}
                                    {activeOrder.status === 'COOKING' && "Preparando tu orden..."}
                                    {activeOrder.status === 'READY' && (activeOrder.type === 'DELIVERY' ? "¡En camino!" : "¡Listo para retirar!")}
                                </h2>
                                <p className="text-gray-500 font-medium">Llegada estimada: {activeOrder.eta}</p>
                            </div>
                            <div className="space-y-6 relative mb-8 pl-2">
                                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200 -z-10"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-md ring-4 ring-white">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div><h4 className="font-bold text-gray-900">Pedido Recibido</h4></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white transition-colors ${['COOKING', 'READY'].includes(activeOrder.status) ? 'bg-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                                        <ChefHat size={20} />
                                    </div>
                                    <div><h4 className="font-bold text-gray-900">En Cocina</h4></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white transition-colors ${activeOrder.status === 'READY' ? 'bg-emerald-600' : 'bg-gray-200 text-gray-400'}`}>
                                        {activeOrder.type === 'DELIVERY' ? <Bike size={20} /> : <ShoppingBag size={20} />}
                                    </div>
                                    <div><h4 className="font-bold text-gray-900">{activeOrder.type === 'DELIVERY' ? 'Repartidor en Camino' : 'Listo en Tienda'}</h4></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full border border-gray-200"><Phone size={20} className="text-gray-600" /></div>
                                    <div><p className="font-bold text-sm text-gray-800">¿Ayuda?</p></div>
                                </div>
                                <button onClick={handleCallRestaurant} className="text-emerald-600 font-bold text-sm hover:underline">Llamar</button>
                            </div>
                            <button onClick={handleSimulateDelivery} className="w-full border-2 border-emerald-600 text-emerald-600 font-bold py-3 rounded-xl hover:bg-emerald-50 transition-colors">Ya he recibido el pedido (Demo)</button>
                          </>
                      ) : (
                          <div className="text-center animate-in zoom-in duration-300">
                               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><ThumbsUp size={40} className="text-green-600" /></div>
                               <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Qué tal estuvo todo?</h2>
                               <div className="flex justify-center gap-2 mb-6">
                                   {[1, 2, 3, 4, 5].map((star) => (
                                       <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                                           <Star size={32} className={`${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-100'}`} />
                                       </button>
                                   ))}
                               </div>
                               <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-4 bg-gray-50 text-gray-900" placeholder="Comentario..." rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}></textarea>
                               <button onClick={handleSubmitReview} disabled={reviewRating === 0} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Send size={18} /> Enviar Reseña</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Header & Navigation */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
          {/* ... (Kept as is) ... */}
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Entregar en</span>
                    <div onClick={handleOpenAddressModal} className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1 transition-colors group">
                        <span className="text-emerald-600 font-bold flex items-center group-hover:text-emerald-700"><MapPin size={16} className="mr-1 fill-current" /> {address}</span>
                        <span className="text-gray-400 group-hover:text-gray-600">▾</span>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                     <div className="hidden md:flex items-center mr-4 gap-4">
                         <button onClick={() => { setCurrentView('HOME'); setProfileSubView('MENU'); }} className={`text-sm font-bold ${currentView === 'HOME' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'}`}>Inicio</button>
                         <button onClick={() => { setCurrentView('ORDERS'); setProfileSubView('MENU'); }} className={`text-sm font-bold ${currentView === 'ORDERS' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'}`}>Mis Pedidos</button>
                         <button onClick={() => { setCurrentView('PROFILE'); setProfileSubView('MENU'); }} className={`text-sm font-bold ${currentView === 'PROFILE' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-800'}`}>Perfil</button>
                     </div>
                    <div className="relative">
                        <button onClick={handleOpenNotifications} className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
                        </button>
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 text-sm">Notificaciones</h3>
                                    {notifications.length > 0 && <button onClick={clearNotifications} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 text-sm"><Bell size={24} className="mx-auto mb-2 opacity-50" />No tienes notificaciones nuevas.</div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {notifications.map(n => (
                                                <div key={n.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-start">
                                                        <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600 mt-0.5 shrink-0"><Megaphone size={14} /></div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-2">{new Date(n.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {user?.storeSlug ? (
                        <button onClick={handleBackToAdmin} className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center"><ArrowLeftRight size={14} className="mr-1" />Dueño</button>
                    ) : (
                        <div className="hidden md:block">
                             <button onClick={handleLogout} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
                        </div>
                    )}
                </div>
            </div>
            {currentView === 'HOME' && (
                <div className="relative max-w-2xl mx-auto">
                    <input ref={searchInputRef} type="text" placeholder="Buscar restaurantes, farmacias, tiendas..." className="w-full bg-gray-100 border-none rounded-xl py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <button className="absolute right-3 top-2.5 p-1 bg-white rounded-md shadow-sm text-gray-600 hover:text-emerald-600"><Filter size={16} /></button>
                </div>
            )}
          </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
          {currentView === 'HOME' && (
              <>
                  {/* LOADING STATE FOR ADDRESS CHANGE */}
                  {isLoadingStores ? (
                      <div className="py-24 text-center animate-in fade-in zoom-in duration-300">
                          <div className="relative w-16 h-16 mx-auto mb-6">
                              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                              <MapPin className="absolute inset-0 m-auto text-emerald-600" size={24} />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Actualizando ubicación...</h3>
                          <p className="text-gray-500">Buscando los mejores locales cerca de <strong>{address}</strong></p>
                      </div>
                  ) : (
                      <>
                        {flashSale && (
                            <div className="px-4 mt-4">
                                <div className="bg-red-600 text-white px-4 py-3 rounded-2xl shadow-lg animate-in slide-in-from-top duration-300 relative overflow-hidden cursor-pointer hover:bg-red-700 transition-colors" onClick={() => navigate('/store/la-pizzeria-de-berga')}>
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-white text-red-600 p-1.5 rounded-full animate-pulse"><Flame size={20} fill="currentColor" /></div>
                                            <div><p className="font-black text-sm md:text-base uppercase tracking-wide leading-none">Flash Sale: {discountPercent}% OFF</p><p className="text-xs text-red-100 font-medium">En {flashSale.productName}</p></div>
                                        </div>
                                        <div className="flex items-center bg-red-800/50 px-3 py-1 rounded-lg border border-red-500/30"><Timer size={16} className="mr-2" /><span className="font-mono font-bold text-lg">{timeLeft}</span></div>
                                    </div>
                                    <div className="absolute top-0 right-10 w-20 h-20 bg-white opacity-5 transform rotate-45"></div>
                                </div>
                            </div>
                        )}
                        <div className="py-6 px-4">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Categoría del Negocio</h2>
                            <div className="flex flex-wrap gap-3 justify-start overflow-x-auto pb-2 scrollbar-hide">
                                <button onClick={() => setSelectedCategory(null)} className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all ${!selectedCategory ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Home size={18} /><span className="font-bold text-sm">Todo</span></button>
                                {businessCategories.map(cat => (
                                    <button key={cat.name} onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)} className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all whitespace-nowrap ${selectedCategory === cat.name ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{cat.icon}<span className="font-bold text-sm">{cat.label}</span></button>
                                ))}
                            </div>
                        </div>
                        {activeOrder && (
                            <div className="px-4 mb-8">
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden max-w-5xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-2"><span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{activeOrder.status === 'DELIVERED' ? 'Entregado' : (activeOrder.type === 'DELIVERY' ? 'En camino' : 'Preparando')}</span><span className="text-emerald-200 text-xs">• Pedido Reciente</span></div>
                                                <h2 className="font-bold text-xl md:text-2xl mb-1">{activeOrder.status === 'DELIVERED' ? '¡Disfruta tu pedido!' : (activeOrder.type === 'DELIVERY' ? 'Tu pedido llega en' : 'Pasa a buscar en')}</h2>
                                                {activeOrder.status !== 'DELIVERED' && <p className="text-4xl font-black mb-2">{activeOrder.eta}</p>}
                                                <p className="text-emerald-100 text-sm mb-4">{activeOrder.itemsCount} productos de <strong>{activeOrder.storeName}</strong></p>
                                                <button onClick={() => setIsTrackerOpen(true)} className="bg-white text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-colors animate-pulse">{activeOrder.status === 'DELIVERED' ? 'Dejar Reseña' : 'Ver Detalles'}</button>
                                            </div>
                                            <button onClick={closeTracking} className="bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"><X size={16} className="text-white/70" /></button>
                                        </div>
                                        <div className="absolute right-[-10px] bottom-[-20px] opacity-20 transform rotate-12">{activeOrder.type === 'DELIVERY' ? <Bike size={160} /> : <ChefHat size={160} />}</div>
                                </div>
                            </div>
                        )}
                        {!activeOrder && (
                            <div className="mb-8">
                                <h2 className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Destacados para ti</h2>
                                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-6 scrollbar-hide">
                                    {/* CARD 1: ENVÍO GRATIS */}
                                    <div 
                                        className="snap-center shrink-0 w-[85%] md:w-[45%] bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                                        onClick={() => { setShowFreeDeliveryOnly(true); setShowPromosOnly(false); }}
                                    >
                                        <div className="relative z-10">
                                            <div className="bg-white/20 w-fit p-2 rounded-lg mb-2"><Bike size={20} className="text-white" /></div>
                                            <h2 className="font-bold text-lg leading-tight mb-1">Envíos GRATIS 🛵</h2>
                                            <p className="text-white/90 text-xs mb-3 max-w-[200px]">Locales con entrega a coste cero.</p>
                                            <span className="bg-white text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Ver Locales</span>
                                        </div>
                                        <div className="absolute right-[-10px] bottom-[-10px] opacity-20 transform rotate-12"><Bike size={100} /></div>
                                    </div>

                                    {/* CARD 2: PROMOCIONES */}
                                    <div 
                                        className="snap-center shrink-0 w-[85%] md:w-[45%] bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                                        onClick={() => { setShowPromosOnly(true); setShowFreeDeliveryOnly(false); }}
                                    >
                                        <div className="relative z-10">
                                            <div className="bg-white/20 w-fit p-2 rounded-lg mb-2"><TicketPercent size={20} className="text-white" /></div>
                                            <h2 className="font-bold text-lg leading-tight mb-1">Ofertas y Promos 🔥</h2>
                                            <p className="text-white/90 text-xs mb-3 max-w-[200px]">Descuentos exclusivos en locales top.</p>
                                            <span className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Ver Ofertas</span>
                                        </div>
                                        <div className="absolute right-[-10px] bottom-[-10px] opacity-20 transform rotate-12"><Zap size={100} /></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="px-4 pb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">Locales en Berga <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{filteredStores.length}</span></h2>
                                <div className="flex gap-2">
                                    {showFreeDeliveryOnly && <button onClick={() => setShowFreeDeliveryOnly(false)} className="flex items-center space-x-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-red-100 transition-colors border border-red-200"><span>Envío Gratis</span><X size={14} /></button>}
                                    {showPromosOnly && <button onClick={() => setShowPromosOnly(false)} className="flex items-center space-x-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"><span>Promos</span><X size={14} /></button>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredStores.map(store => (
                                    <div key={store.id} onClick={() => navigate(`/store/${store.slug}`)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                        <div className="h-48 relative bg-gray-200 overflow-hidden">
                                            <img src={store.banner} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute top-3 left-3 flex flex-wrap gap-1"><span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">{store.category}</span></div>
                                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center text-gray-800"><Clock size={12} className="mr-1 text-gray-500" />{store.deliveryTimeRange}</div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-1"><h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors">{store.name}</h3><div className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-bold flex items-center shrink-0 ml-2"><Star size={10} className="text-yellow-500 fill-current mr-1" />{store.rating}</div></div>
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-1">{store.businessType} • {store.address}</p>
                                            <div className="flex items-center text-xs text-gray-500 pt-4 border-t border-gray-50 justify-between">
                                                <div className="flex items-center"><Bike size={14} className="mr-1.5 text-gray-400" />{store.deliveryFee === 0 ? <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Envío Gratis</span> : `Envío: €${store.deliveryFee.toFixed(2)}`}</div>
                                                <div className="flex items-center"><ShoppingBag size={14} className="mr-1.5 text-gray-400" />Min. €{store.minOrder}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      </>
                  )}
              </>
          )}
          {currentView === 'ORDERS' && renderOrdersView()}
          {currentView === 'PROFILE' && renderProfileView()}
      </div>

      {/* Bottom Nav (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button onClick={() => { setCurrentView('HOME'); setProfileSubView('MENU'); }} className={`flex flex-col items-center ${currentView === 'HOME' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><Home size={22} className={currentView === 'HOME' ? 'fill-current' : ''} /><span className="text-[10px] font-bold mt-1">Inicio</span></button>
           <button onClick={() => { setCurrentView('HOME'); setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); searchInputRef.current?.focus(); }, 50); }} className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition-colors"><Search size={22} /><span className="text-[10px] font-bold mt-1">Buscar</span></button>
           <button onClick={() => { setCurrentView('ORDERS'); setProfileSubView('MENU'); }} className={`flex flex-col items-center ${currentView === 'ORDERS' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><ShoppingBag size={22} className={currentView === 'ORDERS' ? 'fill-current' : ''} /><span className="text-[10px] font-bold mt-1">Pedidos</span></button>
           <button onClick={() => { setCurrentView('PROFILE'); setProfileSubView('MENU'); }} className={`flex flex-col items-center ${currentView === 'PROFILE' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}><User size={22} className={currentView === 'PROFILE' ? 'fill-current' : ''} /><span className="text-[10px] font-bold mt-1">Perfil</span></button>
      </div>
    </div>
  );
};

export default CustomerHome;
