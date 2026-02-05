
import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, PaymentMethod, BusinessType } from '../types';
import { MOCK_ORDERS } from '../services/mockService';
import { printerService } from '../services/printerService';
import { Bell, Check, Volume2, Clock, Bike, AlertTriangle, CheckCircle2, History, X, MessageSquare, Package, CreditCard, Banknote, Loader2, ShoppingBag, ChefHat, Printer, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KitchenView: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(new Set());
  
  // Estado para forzar re-render y controlar el tiempo transcurrido
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sound effect simulation
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
  }, []);

  // Timer para verificar pedidos estancados cada 30 segundos
  useEffect(() => {
    const intervalId = setInterval(() => {
        setCurrentTime(new Date());
    }, 30000); // 30 segundos
    return () => clearInterval(intervalId);
  }, []);

  const playSound = () => {
    if (audioRef.current && isSoundOn) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  // --- LOGICA DE ACTUALIZACIÓN Y AUTOPRINT ---
  const handleProcessOrder = (orderId: string) => {
    // 1. Encontrar la orden
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // 2. Actualizar estado UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.COOKING } : o));

    // 3. AUTO-PRINT (Plug & Play)
    // Genera el ticket automáticamente al aceptar el pedido
    try {
        printerService.printOrder(order, user?.name || 'Comercio Local');
    } catch (e) {
        console.error("Error imprimiendo ticket:", e);
    }
  };

  const updateStatus = (orderId: string, newStatus: OrderStatus, additionalFields?: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...additionalFields } : o));
  };

  const handleNotifyCustomer = (orderId: string) => {
      const order = orders.find(o => o.id === orderId);
      if(!order) return;

      const now = new Date();
      let message = "";
      let newStatus = order.status;

      // --- CÁLCULO DE TIEMPO DE PREPARACIÓN (KPI) ---
      // Calcula diferencia en minutos entre CreatedAt y ahora (ReadyAt)
      const prepTimeMs = now.getTime() - new Date(order.createdAt).getTime();
      const prepTimeMinutes = Math.round(prepTimeMs / 60000); // Convert milliseconds to minutes

      // Logic based on delivery type
      if (order.deliveryType === 'DELIVERY') {
          // Si es delivery, pasa a 'en_camino' (ON_WAY)
          message = `📢 Notificación enviada a ${order.customerName}: "Tu pedido va en camino 🛵"`;
          newStatus = OrderStatus.ON_WAY; 
      } else {
          // Si es retiro, pasa a 'listo_para_retirar' (READY)
          message = `📢 Notificación enviada a ${order.customerName}: "Tu pedido está listo para retirar en el local 🛍️"`;
          newStatus = OrderStatus.READY;
      }

      alert(message);
      setNotifiedOrders(prev => new Set(prev).add(orderId));
      
      // Update status and save KPIs (readyAt and prepTime)
      // Incluso si el estado no cambia visualmente, guardamos los tiempos.
      updateStatus(orderId, newStatus, {
          readyAt: now,
          prepTime: prepTimeMinutes
      });
  };

  // --- REIMPRESIÓN MANUAL ---
  const handleReprint = (e: React.MouseEvent, order: Order) => {
      e.stopPropagation();
      try {
          // Reutiliza el servicio de impresión para generar el ticket
          printerService.printOrder(order, user?.name || 'Comercio Local');
      } catch (error) {
          console.error("Error al reimprimir:", error);
      }
  };

  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const cookingOrders = orders.filter(o => o.status === OrderStatus.COOKING);
  
  // Incluimos ON_WAY en la columna de listos para que no desaparezca de la pantalla hasta ser entregado
  const readyOrders = orders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.ON_WAY);
  
  const historyOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);

  // --- UI CONFIGURATION STRATEGY ---
  const getUIConfig = (type: BusinessType | undefined) => {
      switch(type) {
          case 'Restaurante':
          case 'Cafetería':
              return {
                  title: 'Monitor de Cocina (KDS)',
                  col1: { title: 'Comandas Nuevas', icon: <Bell size={20} /> },
                  col2: { title: 'En Fogones', icon: <ChefHat size={20} />, badge: 'Cocinando' }, 
                  col3: { title: 'Listos para Servir', icon: <UtensilsCrossedIcon />, badge: 'Pase' },
                  actionProcess: 'Marchar Platos',
                  actionReady: 'Aviso Camarero/Reparto'
              };
          case 'Farmacia':
          case 'Tienda de Ropa':
          case 'Supermercado':
          default:
              return {
                  title: 'Gestión de Pedidos & Logística',
                  col1: { title: 'Pedidos Entrantes', icon: <ShoppingBag size={20} /> },
                  col2: { title: 'Preparando / Packing', icon: <Package size={20} />, badge: 'Armando' }, 
                  col3: { title: 'Listos para Envío', icon: <CheckCircle2 size={20} />, badge: 'Listo' },
                  actionProcess: 'Aceptar y Armar',
                  actionReady: 'Etiquetar y Finalizar'
              };
      }
  };

  // Helper component for Icon inside function
  const UtensilsCrossedIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 5.5 5.5a2.5 2.5 0 0 1-3.5 0C9.7 16.3 8.1 12.5 7 10l-4 4"/></svg>
  );

  const ui = getUIConfig(user?.businessType);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 -m-8 relative"> 
      {/* Header */}
      <div className="flex justify-between items-center mb-8 px-4 py-2 bg-white rounded-xl shadow-sm mx-4 mt-4 border border-gray-100">
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
                {ui.title}
            </h2>
            <p className="text-sm text-gray-500 hidden md:block">
                {user?.businessType === 'Restaurante' ? 'Gestiona la marcha de platos y tiempos.' : 'Gestiona el stock y preparación de envíos.'}
            </p>
        </div>
        <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>ABIERTO</span>
            </button>
            <button 
                onClick={() => setShowHistory(true)}
                className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-indigo-100 transition-colors"
            >
                <History size={18} />
                <span>Historial</span>
            </button>
            <button 
                onClick={() => setIsSoundOn(!isSoundOn)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${isSoundOn ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-500'}`}
                title={isSoundOn ? 'Silenciar' : 'Activar Sonido'}
            >
                <Volume2 size={18} />
            </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
        
        {/* COLUMNA 1: PENDIENTES */}
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between bg-red-50 border border-red-100 p-3 rounded-t-xl mb-2">
                <div className="flex items-center space-x-2 text-red-600 font-black uppercase tracking-wider">
                    {ui.col1.icon}
                    <span>{ui.col1.title}</span>
                </div>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">{pendingOrders.length}</span>
            </div>

            <div className="space-y-4">
                {pendingOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden relative animate-in slide-in-from-left duration-300">
                        {/* Red Header Alert */}
                        <div className="bg-red-500 text-white px-4 py-2 flex justify-between items-center">
                            <span className="font-bold text-sm animate-pulse">¡NUEVO!</span>
                            <span className="font-mono text-sm bg-red-600 px-2 rounded opacity-90">00:34</span>
                        </div>
                        
                        <div className="p-5">
                            {/* Order Info */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-800">#{order.id.split('-')[1]}</h3>
                                    <p className="font-bold text-gray-600">{order.customerName}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {/* Manual Reprint Button & Price */}
                                    <div className="flex items-center space-x-2 mb-1">
                                        <button 
                                            onClick={(e) => handleReprint(e, order)}
                                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                            title="Reimprimir Comanda"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <p className="text-2xl font-black text-emerald-600">€{order.total.toFixed(2)}</p>
                                    </div>
                                    
                                    <p className={`text-xs font-bold flex items-center justify-end gap-1 uppercase tracking-wide ${order.paymentMethod === 'CASH' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {order.paymentMethod === 'CASH' ? <Banknote size={14}/> : <CreditCard size={14}/>}
                                        {order.paymentMethod === 'CASH' ? 'Efectivo' : 'Tarjeta'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                                    order.deliveryType === 'DELIVERY' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                    {order.deliveryType === 'DELIVERY' ? <Bike size={14} className="mr-1"/> : <ShoppingBag size={14} className="mr-1"/>} 
                                    {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Para Retirar'}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="text-gray-700 font-medium flex items-start">
                                        <span className="text-gray-400 font-normal mr-2">1x</span>
                                        <div className="flex-1">
                                            <span>{item.quantity}x {item.name}</span>
                                            {item.notes && (
                                                <div className="mt-1 bg-yellow-50 text-yellow-800 text-sm p-2 rounded border-l-4 border-yellow-400 flex items-start">
                                                    <AlertTriangle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                                                    <span className="font-bold">Nota: {item.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button className="border-2 border-red-100 text-red-500 font-bold py-3 rounded-lg hover:bg-red-50 transition-colors">
                                    Rechazar
                                </button>
                                <button 
                                    onClick={() => handleProcessOrder(order.id)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase py-3 rounded-lg shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <Printer size={18} className="mr-2" />
                                    {ui.actionProcess}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA 2: EN PROCESO */}
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-3 rounded-t-xl mb-2">
                <div className="flex items-center space-x-2 text-orange-600 font-black uppercase tracking-wider">
                    {ui.col2.icon}
                    <span>{ui.col2.title}</span>
                </div>
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">{cookingOrders.length}</span>
            </div>

            <div className="space-y-4">
                {cookingOrders.map((order, idx) => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border-2 border-orange-100 overflow-hidden relative">
                        <div className="p-5">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">#{order.id.split('-')[1]}</h3>
                                    <p className="text-gray-500 font-medium">{order.customerName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-lg flex items-center text-sm">
                                        <Clock size={14} className="mr-1"/> {idx === 0 ? '12 min' : '5 min'}
                                    </span>
                                    {/* Manual Reprint */}
                                    <button 
                                        onClick={(e) => handleReprint(e, order)}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50"
                                        title="Reimprimir"
                                    >
                                        <Printer size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Delivery Status Badge in Cooking */}
                            <div className="mb-2">
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                                    order.deliveryType === 'DELIVERY' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                    {order.deliveryType === 'DELIVERY' ? <Bike size={12} className="mr-1"/> : <ShoppingBag size={12} className="mr-1"/>} 
                                    {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retiro en Local'}
                                </span>
                            </div>

                            {/* Specific Delivery Status Mock for demo purposes */}
                            {idx === 1 && order.deliveryType === 'DELIVERY' && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">K</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Kevin R.</p>
                                            <p className="text-[10px] font-bold text-blue-600 uppercase">Moto • Llegando</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Llega en 3 min</span>
                                </div>
                            )}

                            <div className="space-y-2 mb-6 border-t border-gray-100 pt-3">
                                {order.items.map((item, i) => (
                                    <div key={i} className="text-gray-600 text-sm flex items-center">
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></span>
                                        <span>{item.quantity}x {item.name}</span>
                                    </div>
                                ))}
                            </div>

                             <div className="flex space-x-2">
                                <button 
                                    onClick={() => updateStatus(order.id, OrderStatus.READY)}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase py-3 rounded-lg shadow-sm transition-all"
                                >
                                    {ui.actionReady}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA 3: LISTOS/FINALIZADOS */}
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-t-xl mb-2">
                <div className="flex items-center space-x-2 text-emerald-600 font-black uppercase tracking-wider">
                    {ui.col3.icon}
                    <span>{ui.col3.title}</span>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-md">{readyOrders.length}</span>
            </div>

            <div className="space-y-4">
                {readyOrders.map(order => {
                    const isNotified = notifiedOrders.has(order.id);
                    const isDelivery = order.deliveryType === 'DELIVERY';
                    const isOnWay = order.status === OrderStatus.ON_WAY;

                    // --- LOGICA DE ALERTA POR ESTANCAMIENTO ---
                    // Calcular tiempo en minutos desde readyAt
                    let isStagnant = false;
                    let stagnantMinutes = 0;
                    
                    if (order.readyAt && order.status === OrderStatus.READY) {
                        const readyTime = new Date(order.readyAt).getTime();
                        stagnantMinutes = Math.floor((currentTime.getTime() - readyTime) / 60000);
                        if (stagnantMinutes > 10) {
                            isStagnant = true;
                        }
                    }

                    return (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden relative transition-all duration-300 ${
                            isStagnant 
                            ? 'border-red-500 border-2 bg-red-50 animate-pulse' 
                            : (isOnWay ? 'border-blue-200 bg-blue-50/20' : 'border-emerald-100')
                        }`}>
                            {isOnWay && (
                                <div className="bg-blue-100 text-blue-700 px-3 py-1 text-xs font-bold text-center border-b border-blue-200 flex justify-center items-center">
                                    <Bike size={12} className="mr-1" /> PEDIDO EN CAMINO
                                </div>
                            )}
                            
                            {/* ALERTA DE ESTANCAMIENTO */}
                            {isStagnant && (
                                <div className="bg-red-500 text-white px-3 py-1 text-xs font-bold text-center flex justify-center items-center">
                                    <AlertOctagon size={12} className="mr-1" /> TIEMPO EXCEDIDO (+{stagnantMinutes}m)
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            isDelivery ? 'bg-gray-100 text-gray-600' : 'bg-emerald-500 text-white'
                                        }`}>
                                            {isDelivery ? 'Delivery' : 'Para Retirar'}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-800 mt-1">#{order.id.split('-')[1]}</h3>
                                        <p className="text-gray-500 text-sm font-medium">{order.customerName}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {/* Manual Reprint */}
                                        <button 
                                            onClick={(e) => handleReprint(e, order)}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50"
                                            title="Reimprimir"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <div className={isStagnant ? 'text-red-500' : (isOnWay ? 'text-blue-500' : 'text-emerald-500')}>
                                            {isStagnant ? <AlertTriangle size={28}/> : <CheckCircle2 size={28} />}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-1 mb-4">
                                    {order.items.map((item, i) => (
                                        <p key={i} className="text-gray-400 text-xs">
                                            • {item.quantity}x {item.name}
                                        </p>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Botón de Notificación */}
                                    <button 
                                        onClick={() => handleNotifyCustomer(order.id)}
                                        className={`flex items-center justify-center space-x-1 py-2 rounded text-xs font-bold transition-all border ${
                                            isNotified || isOnWay
                                            ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                            : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                                        }`}
                                    >
                                        {isNotified || isOnWay ? (
                                            <>
                                                <Check size={14} /> <span>{isOnWay ? 'En Camino' : 'Avisado'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare size={14} /> <span>Avisar Cliente</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Botón de Archivar/Entregado - DESHABILITADO SI NO SE HA NOTIFICADO */}
                                    <button 
                                        onClick={() => updateStatus(order.id, OrderStatus.DELIVERED)}
                                        disabled={!isNotified && !isOnWay}
                                        className={`font-bold py-2 rounded text-xs transition-colors ${
                                            (!isNotified && !isOnWay)
                                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                    >
                                        {isDelivery ? 'Finalizar' : 'Entregar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>

      {/* HISTORY OVERLAY (SLIDE OVER) */}
      {showHistory && (
          <div className="absolute inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
              <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl transform transition-transform duration-300 flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center">
                          <History size={20} className="mr-2 text-indigo-600"/> Historial del Turno
                      </h3>
                      <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {historyOrders.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">
                              <p>Aún no has entregado ningún pedido en este turno.</p>
                          </div>
                      ) : (
                          historyOrders.slice().reverse().map(order => (
                              <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex justify-between items-center opacity-75 hover:opacity-100">
                                  <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-900">#{order.id.split('-')[1]}</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded font-bold">ENTREGADO</span>
                                      </div>
                                      <p className="text-sm text-gray-600">{order.customerName}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <p className="text-xs text-gray-400">{order.items.length} items • €{order.total.toFixed(2)}</p>
                                          {order.prepTime && (
                                              <span className="text-[10px] bg-orange-50 text-orange-600 px-1 rounded flex items-center" title="Tiempo de preparación">
                                                  <Clock size={10} className="mr-0.5" /> {order.prepTime}m
                                              </span>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs text-gray-400">{order.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
                      Mostrando pedidos marcados como entregados
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default KitchenView;
