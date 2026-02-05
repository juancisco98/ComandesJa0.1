
import React, { useState, useEffect } from 'react';
import { MOCK_CONFIG, MOCK_ORDERS } from '../services/mockService';
import { StoreConfig, OrderStatus } from '../types';
import { Clock, MapPin, Volume2, Save, AlertTriangle, Bell, Printer, Map, Bike, Power, Check, Sun, Moon, CalendarClock, Zap, Hourglass, Thermometer } from 'lucide-react';

const SettingsView: React.FC = () => {
  const [config, setConfig] = useState<StoreConfig>(MOCK_CONFIG);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Overload Logic State
  const [overloadDuration, setOverloadDuration] = useState(60); // Default 1 hour
  const [overloadMinutes, setOverloadMinutes] = useState(15); // Default +15 min

  // AI Prediction State
  const [aiSuggestion, setAiSuggestion] = useState<number | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  // Load Mock Data for AI
  useEffect(() => {
      const active = MOCK_ORDERS.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.COOKING).length;
      setActiveOrderCount(active);

      // Simple AI Logic: 
      // < 2 orders: Suggest normal time (0 offset)
      // 2 - 5 orders: Suggest +5 mins
      // > 5 orders: Suggest +15 mins
      if (active > 5) setAiSuggestion(15);
      else if (active >= 2) setAiSuggestion(5);
      else setAiSuggestion(0);

  }, []);

  const updatePrepTime = (minutes: number) => {
    setConfig({ ...config, prepTimeMinutes: minutes });
  };

  const toggleSound = (key: keyof typeof config.soundSettings) => {
    setConfig({
        ...config,
        soundSettings: {
            ...config.soundSettings,
            [key]: !config.soundSettings[key]
        }
    });
  };
  
  const toggleDeliveryService = () => {
      setConfig({ ...config, isDeliveryEnabled: !config.isDeliveryEnabled });
  };

  // --- NEW: PROGRESSIVE OVERLOAD LOGIC ---
  const activateOverload = () => {
      const endTime = Date.now() + (overloadDuration * 60 * 1000);
      setConfig({
          ...config,
          tempOverload: {
              isActive: true,
              extraMinutes: overloadMinutes,
              endTime: endTime
          }
      });
  };

  const cancelOverload = () => {
      setConfig({
          ...config,
          tempOverload: {
              isActive: false,
              extraMinutes: 0,
              endTime: 0
          }
      });
  };

  const applyAiSuggestion = () => {
      if (aiSuggestion !== null) {
          updatePrepTime(config.prepTimeMinutes + aiSuggestion);
          setAiSuggestion(null); // Clear suggestion after apply
      }
  };

  const updateShiftTime = (shift: 'morning' | 'night', type: 'start' | 'end', value: string) => {
    setConfig(prev => ({
        ...prev,
        shifts: {
            ...prev.shifts,
            [shift]: {
                ...prev.shifts[shift],
                [type]: value
            }
        }
    }));
  };

  const handleSaveChanges = () => {
      setIsSaving(true);
      // Simular petición al servidor
      Object.assign(MOCK_CONFIG, config);
      setTimeout(() => {
          setIsSaving(false);
          alert("✅ Configuración guardada correctamente.");
      }, 800);
  };

  const handlePrinterTest = () => {
    setIsPrinting(true);
    setTimeout(() => {
        window.print();
        setIsPrinting(false);
    }, 1000);
  };

  // Helper to format Time Left
  const getOverloadTimeLeft = () => {
      if (!config.tempOverload?.isActive) return '';
      const minLeft = Math.ceil((config.tempOverload.endTime - Date.now()) / 60000);
      return minLeft > 0 ? `${minLeft} min` : 'Expirado';
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8 flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-gray-900">Configuración Avanzada</h2>
            <p className="text-gray-500 mt-1">Controla tiempos, horarios, logística y dispositivos.</p>
        </div>
        <button 
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-md font-bold flex items-center space-x-2 hover:bg-emerald-700 disabled:opacity-70 transition-all"
        >
            {isSaving ? (
                <>
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                   <span>Guardando...</span>
                </>
            ) : (
                <>
                    <Save size={20} />
                    <span>Guardar Cambios</span>
                </>
            )}
        </button>
      </div>

      <div className="space-y-6">
      
        {/* TIME MANAGEMENT & AI PREDICTION (NEW) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="flex items-center mb-6 relative z-10">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg mr-3">
                    <Clock size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Gestión de Tiempos</h3>
                    <p className="text-sm text-gray-500">Base: {config.prepTimeMinutes} min. Total visible: {config.prepTimeMinutes + (config.tempOverload?.isActive ? config.tempOverload.extraMinutes : 0)} min.</p>
                </div>
            </div>

            {/* AI PREDICTION CARD */}
            {aiSuggestion !== null && aiSuggestion > 0 && !config.tempOverload?.isActive && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500 relative">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full shadow-sm animate-pulse">
                            <Zap size={20} className="text-blue-600 fill-current" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-800 text-sm uppercase tracking-wide">Predicción IA</h4>
                            <p className="text-blue-700 text-sm">
                                Detectamos <strong>{activeOrderCount} pedidos activos</strong>. 
                                Sugerimos subir el tiempo base <strong>+{aiSuggestion} min</strong>.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={applyAiSuggestion}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        Aplicar (+{aiSuggestion} min)
                    </button>
                </div>
            )}

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {[15, 20, 30, 45, 60].map(time => (
                    <button
                        key={time}
                        onClick={() => updatePrepTime(time)}
                        className={`flex-1 min-w-[80px] py-3 rounded-lg font-bold text-lg border-2 transition-all ${
                            config.prepTimeMinutes === time 
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                            : 'border-gray-100 text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {time}
                    </button>
                ))}
            </div>

            {/* PROGRESSIVE OVERLOAD MODE */}
            <div className={`border-t border-dashed border-gray-200 pt-6 ${config.tempOverload?.isActive ? 'bg-red-50 -mx-6 px-6 -mb-6 pb-6' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Thermometer size={20} className={config.tempOverload?.isActive ? 'text-red-600' : 'text-gray-400'} />
                        <h4 className={`font-bold ${config.tempOverload?.isActive ? 'text-red-700' : 'text-gray-700'}`}>
                            {config.tempOverload?.isActive ? 'Modo Colapso ACTIVO' : 'Modo "Cocina Colapsada"'}
                        </h4>
                    </div>
                    {config.tempOverload?.isActive && (
                        <span className="bg-red-200 text-red-800 text-xs font-mono font-bold px-2 py-1 rounded flex items-center">
                            <Hourglass size={12} className="mr-1" /> Expira en: {getOverloadTimeLeft()}
                        </span>
                    )}
                </div>

                {config.tempOverload?.isActive ? (
                    <div className="flex justify-between items-center">
                        <div className="text-red-800 text-sm">
                            Se están sumando <strong>+{config.tempOverload.extraMinutes} minutos</strong> a todos los pedidos automáticamente.
                        </div>
                        <button 
                            onClick={cancelOverload}
                            className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors shadow-sm"
                        >
                            Desactivar Ahora
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiempo Extra</label>
                            <select 
                                value={overloadMinutes}
                                onChange={(e) => setOverloadMinutes(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value={10}>+10 Minutos</option>
                                <option value={15}>+15 Minutos</option>
                                <option value={20}>+20 Minutos</option>
                                <option value={30}>+30 Minutos</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duración</label>
                            <select 
                                value={overloadDuration}
                                onChange={(e) => setOverloadDuration(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                <option value={30}>Durante 30 min</option>
                                <option value={60}>Durante 1 hora</option>
                                <option value={120}>Durante 2 horas</option>
                            </select>
                        </div>
                        <button 
                            onClick={activateOverload}
                            className="bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                            <AlertTriangle size={16} />
                            Activar Emergencia
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* SHIFT SCHEDULE CONFIGURATION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
                    <CalendarClock size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Horarios de Turno</h3>
                    <p className="text-sm text-gray-500">Define las horas de corte para los cierres de caja.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Morning Shift */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                    <div className="flex items-center space-x-2 mb-4 text-orange-700">
                        <Sun size={20} />
                        <h4 className="font-bold">Turno Mañana</h4>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                            <input 
                                type="time" 
                                value={config.shifts.morning.start}
                                onChange={(e) => updateShiftTime('morning', 'start', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                            />
                        </div>
                        <span className="text-gray-400 mt-5">-</span>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin</label>
                            <input 
                                type="time" 
                                value={config.shifts.morning.end}
                                onChange={(e) => updateShiftTime('morning', 'end', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Night Shift */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                    <div className="flex items-center space-x-2 mb-4 text-indigo-700">
                        <Moon size={20} />
                        <h4 className="font-bold">Turno Noche</h4>
                    </div>
                    <div className="flex items-center space-x-4">
                         <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                            <input 
                                type="time" 
                                value={config.shifts.night.start}
                                onChange={(e) => updateShiftTime('night', 'start', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                            />
                        </div>
                        <span className="text-gray-400 mt-5">-</span>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin</label>
                            <input 
                                type="time" 
                                value={config.shifts.night.end}
                                onChange={(e) => updateShiftTime('night', 'end', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* DELIVERY MASTER TOGGLE */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
                <div className={`p-3 rounded-lg mr-4 ${config.isDeliveryEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <Bike size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Servicio a Domicilio (Delivery)</h3>
                    <p className={`text-sm font-medium ${config.isDeliveryEnabled ? 'text-emerald-600' : 'text-red-600'}`}>
                        {config.isDeliveryEnabled ? 'Servicio ACTIVADO' : 'Servicio DESACTIVADO'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Desactívalo si no tienes repartidores disponibles.</p>
                </div>
            </div>
            
            <button 
                onClick={toggleDeliveryService}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold shadow-sm transition-all ${config.isDeliveryEnabled ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
                <Power size={18} />
                <span>{config.isDeliveryEnabled ? 'Desactivar Delivery' : 'Activar Delivery'}</span>
            </button>
        </div>

        {/* LOGISTICS & MAP */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${!config.isDeliveryEnabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Logística de Delivery</h3>
                        <p className="text-sm text-gray-500">Dibuja tu zona de reparto.</p>
                    </div>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:underline">Editar Mapa</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 space-y-4">
                     <label className="block text-sm font-medium text-gray-700">Radio de Entrega (Km)</label>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="0.5" 
                        value={config.deliveryRadiusKm}
                        onChange={(e) => setConfig({...config, deliveryRadiusKm: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>1 km (Barrio)</span>
                        <span className="font-bold text-blue-600 text-lg">{config.deliveryRadiusKm} km</span>
                        <span>10 km (Pueblos vecinos)</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Coste de Envío</label>
                        <div className="flex gap-2">
                             <input 
                                type="number" 
                                className="border border-gray-300 rounded-lg p-2 w-24 bg-white text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                                placeholder="2.50"
                                value={config.deliveryFee} 
                                onChange={(e) => setConfig({...config, deliveryFee: parseFloat(e.target.value)})}
                             />
                             <span className="self-center text-gray-500">€ por pedido</span>
                        </div>
                    </div>
                </div>

                {/* Actual Map Iframe */}
                <div className="w-full lg:w-1/2 h-48 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
                    <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11836.433876023246!2d1.8385675661453477!3d42.10266020526016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12a5ae4d67c51579%3A0x69687e8574673629!2s08600%20Berga%2C%20Barcelona!5e0!3m2!1ses!2ses!4v1708450000000!5m2!1ses!2ses" 
                        width="100%" 
                        height="100%" 
                        style={{border:0}} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        className="opacity-80 hover:opacity-100 transition-opacity"
                    ></iframe>
                    
                    {/* Radius Overlay Simulation */}
                    <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-blue-600 shadow-sm pointer-events-none">
                        Radio: {config.deliveryRadiusKm}km
                    </div>
                </div>
            </div>
        </div>

        {/* PRINTER SETTINGS */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="p-2 bg-gray-100 text-gray-700 rounded-lg mr-3">
                        <Printer size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Impresora Térmica</h3>
                        <p className="text-sm text-gray-500">Prueba de conexión y formato.</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                    <p className="font-medium text-gray-800">Estado: <span className="text-green-600">Lista</span></p>
                    <p className="text-xs text-gray-500">Ancho de papel: 80mm</p>
                </div>
                <button 
                    onClick={handlePrinterTest}
                    disabled={isPrinting}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                    {isPrinting ? 'Imprimiendo...' : '🖨️ Test de Impresión'}
                </button>
            </div>
        </div>

        {/* SOUNDS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3">
                    <Volume2 size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Sonidos</h3>
                    <p className="text-sm text-gray-500">Personaliza las alertas.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        <Bell size={20} className="text-gray-400 mr-3" />
                        <span className="font-medium text-gray-700">Nuevo Pedido</span>
                    </div>
                    <div 
                        onClick={() => toggleSound('newOrder')}
                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${config.soundSettings.newOrder ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.soundSettings.newOrder ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Hidden thermal test Receipt */}
       <div id="thermal-receipt" className="hidden">
        <div className="text-center font-mono">
            <h2 className="font-bold text-xl uppercase mb-2">TEST DE IMPRESION</h2>
            <p>ComandesJa - Sistema v1.0</p>
            <p>--------------------------------</p>
            <p className="my-4">Si puedes leer esto, tu impresora está configurada correctamente.</p>
             <p>--------------------------------</p>
             <p className="text-xs">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
