
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_ORDERS, MOCK_CONFIG } from '../services/mockService';
import { OrderStatus, PaymentMethod } from '../types';
import { Printer, Calendar, DollarSign, CreditCard, LogOut, Sun, Moon, CheckCircle2 } from 'lucide-react';

const ShiftClose: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Shift Selection State
  const [selectedShift, setSelectedShift] = useState<'MORNING' | 'NIGHT' | null>(null);
  
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [filteredOrders, setFilteredOrders] = useState(MOCK_ORDERS);

  // Helper: parse "HH:mm" to Date object for today
  const getTimeDate = (timeStr: string) => {
      const now = new Date();
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return date;
  };

  const handleShiftSelect = (shift: 'MORNING' | 'NIGHT') => {
      setSelectedShift(shift);
      const schedule = MOCK_CONFIG.shifts[shift.toLowerCase() as 'morning' | 'night'];
      setStartTime(schedule.start);
      setEndTime(schedule.end);
  };

  // Filter orders whenever time or selection changes
  useEffect(() => {
    if (!selectedShift || !startTime || !endTime) {
        setFilteredOrders([]);
        return;
    }

    const start = getTimeDate(startTime);
    const end = getTimeDate(endTime);

    // Filter Logic
    const filtered = MOCK_ORDERS.filter(order => {
        // 1. Must be DELIVERED/COMPLETED
        if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.READY) return false;
        
        // 2. Must be within time range
        // Note: MOCK_ORDERS dates are relative to now, so this works for the demo
        return order.createdAt >= start && order.createdAt <= end;
    });

    // Mock enhancement for demo
    if (filtered.length === 0) {
        const demoFiltered = MOCK_ORDERS.filter(o => o.status === OrderStatus.DELIVERED);
        setFilteredOrders(demoFiltered); 
    } else {
        setFilteredOrders(filtered);
    }
    
  }, [selectedShift, startTime, endTime]);


  // Calculations based on FILTERED orders
  const totalSales = filteredOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalCash = filteredOrders.filter(o => o.paymentMethod === PaymentMethod.CASH).reduce((acc, curr) => acc + curr.total, 0);
  const totalCard = filteredOrders.filter(o => o.paymentMethod === PaymentMethod.CARD).reduce((acc, curr) => acc + curr.total, 0);
  const totalOrders = filteredOrders.length;

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedShift) {
        setTimeout(() => window.print(), 100);
    }
  };

  const handleFinalizeAndLogout = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!selectedShift) return;
      
      const confirmMsg = `¿Estás seguro de cerrar el TURNO ${selectedShift === 'MORNING' ? 'MAÑANA' : 'NOCHE'}?\n\nTotal Caja: €${totalCash.toFixed(2)}`;
      
      if(window.confirm(confirmMsg)) {
          logout();
          navigate('/login');
      }
  };

  return (
    <>
      <div className="no-print pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Cierre de Turno</h2>
                <p className="text-gray-500 mt-1">Selecciona el turno para cuadrar caja.</p>
            </div>
            {selectedShift && (
                <div className="flex space-x-3 animate-in fade-in slide-in-from-right duration-300">
                    <button 
                        type="button"
                        onClick={handleFinalizeAndLogout}
                        className="flex items-center space-x-2 bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-lg hover:bg-red-100 transition-all font-bold shadow-sm cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span>Finalizar y Salir</span>
                    </button>
                    <button 
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-black transition-all font-bold cursor-pointer"
                    >
                        <Printer size={20} />
                        <span>Imprimir Z-Report</span>
                    </button>
                </div>
            )}
        </div>

        {/* SHIFT SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button 
                onClick={() => handleShiftSelect('MORNING')}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${selectedShift === 'MORNING' ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100' : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'}`}
            >
                <div className="flex items-center">
                    <div className={`p-4 rounded-full mr-4 ${selectedShift === 'MORNING' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                        <Sun size={32} />
                    </div>
                    <div className="text-left">
                        <h3 className={`text-xl font-bold ${selectedShift === 'MORNING' ? 'text-orange-700' : 'text-gray-700'}`}>Turno Mañana</h3>
                        <p className="text-sm text-gray-500">{MOCK_CONFIG.shifts.morning.start} - {MOCK_CONFIG.shifts.morning.end}</p>
                    </div>
                </div>
                {selectedShift === 'MORNING' && <CheckCircle2 size={32} className="text-orange-500 fill-orange-100" />}
            </button>

            <button 
                onClick={() => handleShiftSelect('NIGHT')}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${selectedShift === 'NIGHT' ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'}`}
            >
                <div className="flex items-center">
                    <div className={`p-4 rounded-full mr-4 ${selectedShift === 'NIGHT' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-500'}`}>
                        <Moon size={32} />
                    </div>
                    <div className="text-left">
                        <h3 className={`text-xl font-bold ${selectedShift === 'NIGHT' ? 'text-indigo-700' : 'text-gray-700'}`}>Turno Noche</h3>
                        <p className="text-sm text-gray-500">{MOCK_CONFIG.shifts.night.start} - {MOCK_CONFIG.shifts.night.end}</p>
                    </div>
                </div>
                {selectedShift === 'NIGHT' && <CheckCircle2 size={32} className="text-indigo-500 fill-indigo-100" />}
            </button>
        </div>

        {/* RESULTS AREA */}
        {selectedShift ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg shadow-emerald-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium">Ventas Totales</p>
                                <h3 className="text-3xl font-bold mt-1">€{totalSales.toFixed(2)}</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <DollarSign size={24} />
                            </div>
                        </div>
                        <div className="text-sm text-emerald-100 opacity-80">
                            {totalOrders} pedidos cerrados
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Efectivo (Cash)</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900">€{totalCash.toFixed(2)}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <DollarSign size={20} />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                             <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(totalCash / (totalSales || 1)) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Tarjeta (Card)</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900">€{totalCard.toFixed(2)}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <CreditCard size={20} />
                            </div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                             <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(totalCard / (totalSales || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Detalle de Pedidos ({selectedShift === 'MORNING' ? 'Mañana' : 'Noche'})</h3>
                    </div>
                    {filteredOrders.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.split('-')[1]}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{order.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {order.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">€{order.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            <p>No hay pedidos cerrados en este turno todavía.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
                <p className="text-lg font-medium">Selecciona un turno arriba para ver el reporte.</p>
            </div>
        )}
      </div>

      {/* Hidden Thermal Receipt Structure */}
      <div id="thermal-receipt" className="hidden">
        <div className="text-center mb-4">
            <h1 className="font-bold text-xl uppercase">Farmacia Berga Centre</h1>
            <p className="text-sm">Gran Via, 5, Berga</p>
            <p className="text-sm">CIF: B-12345678</p>
            <br />
            <h2 className="font-bold text-lg uppercase border-t border-b border-black py-1">CIERRE DE CAJA</h2>
            <h3 className="font-bold uppercase text-sm mt-1">{selectedShift === 'MORNING' ? 'TURNO MAÑANA' : 'TURNO NOCHE'}</h3>
        </div>
        <div className="text-sm mb-2">
            <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
                <span>Horario:</span>
                <span>{startTime} - {endTime}</span>
            </div>
        </div>
        <br />
        <div className="border-b border-dashed border-black mb-2"></div>
        <div className="space-y-1 text-sm">
             <div className="flex justify-between font-bold text-base">
                <span>VENTAS TOTALES:</span>
                <span>€{totalSales.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span>Pedidos Cerrados:</span>
                <span>{totalOrders}</span>
            </div>
             <div className="flex justify-between">
                <span>Media Ticket:</span>
                <span>€{(totalSales / (totalOrders || 1)).toFixed(2)}</span>
            </div>
        </div>
        <br />
        <h3 className="font-bold text-sm uppercase mb-1">Desglose de Cobros</h3>
        <div className="space-y-1 text-sm border-t border-black pt-1">
             <div className="flex justify-between">
                <span>Efectivo (Caja):</span>
                <span>€{totalCash.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
                <span>Tarjeta (Banco):</span>
                <span>€{totalCard.toFixed(2)}</span>
            </div>
        </div>
        <br />
        <br />
        <div className="text-center text-xs">
            <p>Firma del Responsable</p>
            <br />
            <br />
            <p>_____________________</p>
            <p>{new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </>
  );
};

export default ShiftClose;
