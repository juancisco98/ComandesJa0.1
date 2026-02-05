
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ANALYTICS } from '../services/mockService';
import { TrendingUp, TrendingDown, Users, Clock, AlertCircle, DollarSign, Star, Lightbulb, ArrowRight, CreditCard, Tag, X, Rocket, Sparkles, Send } from 'lucide-react';
import { Review } from '../types';

const AnalyticsView: React.FC = () => {
  const [data, setData] = useState(MOCK_ANALYTICS);
  const navigate = useNavigate();

  // State for AI Review Response
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // State for Offer Modal
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerConfig, setOfferConfig] = useState({
      discount: 15,
      limit: 50
  });

  // 1. Calcular dinámicamente el producto estrella
  const topProduct = data.topProducts.reduce((prev, current) => 
    (prev.quantity > current.quantity) ? prev : current
  , data.topProducts[0]);

  // 2. Calcular el valor máximo para escalar las barras correctamente (evita desbordamiento)
  const maxQuantity = Math.max(...data.topProducts.map(p => p.quantity));

  const handleOpenOfferModal = () => {
      setIsOfferModalOpen(true);
  };

  const handleConfirmOffer = () => {
    // Redirigir a Marketing enviando datos YA editados
    navigate('/admin/marketing', {
        state: {
            createOfferFor: topProduct.name,
            suggestedDiscount: offerConfig.discount,
            limit: offerConfig.limit
        }
    });
  };

  // --- AI REVIEW LOGIC ---
  const generateAIResponse = (review: Review) => {
    setReplyingToId(review.id);
    setIsGeneratingAI(true);
    setAiResponseText('');

    // Mock AI Generation Logic based on rating
    setTimeout(() => {
        let generated = "";
        if (review.rating >= 4) {
            generated = `¡Hola ${review.customerName.split(' ')[0]}! Muchas gracias por tus palabras y por elegirnos. Nos alegra muchísimo que hayas disfrutado de tu experiencia. ¡Esperamos verte pronto de nuevo por ComandesJa! 😊`;
        } else if (review.rating === 3) {
             generated = `Hola ${review.customerName.split(' ')[0]}, gracias por tu visita. Tomamos nota de tus comentarios para mejorar. Nos esforzamos cada día para ofrecer el mejor servicio. ¡Esperamos que la próxima vez sea de 5 estrellas!`;
        } else {
             generated = `Hola ${review.customerName.split(' ')[0]}, lamentamos que tu experiencia no haya sido la esperada. Nos gustaría entender mejor qué sucedió para solucionarlo. Por favor, contáctanos directamente. Un saludo.`;
        }
        setAiResponseText(generated);
        setIsGeneratingAI(false);
    }, 1500);
  };

  const saveResponse = (reviewId: string) => {
      const updatedReviews = data.reviews.map(r => r.id === reviewId ? { ...r, response: aiResponseText, responseDate: new Date() } : r);
      setData({...data, reviews: updatedReviews});
      setReplyingToId(null);
      setAiResponseText('');
  };

  return (
    <div className="pb-10 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-bold text-gray-900">Analítica & Insights</h2>
            <p className="text-gray-500 mt-1">Cómo va tu negocio esta semana.</p>
        </div>
        <div className="text-sm font-medium bg-white px-4 py-2 rounded-lg border shadow-sm text-gray-600">
            Últimos 7 días
        </div>
      </div>

      {/* Smart AI Insight */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
                <Lightbulb size={24} className="text-yellow-300 fill-current" />
            </div>
            <div>
                <h3 className="font-bold text-lg mb-1">Sugerencia Inteligente</h3>
                <p className="text-blue-100 mb-4 max-w-2xl">
                    Hemos detectado que <strong>{topProduct.name}</strong> es tu producto estrella esta semana con <strong>{topProduct.quantity} ventas</strong>. 
                    Si activas una promoción especial para este plato, podrías aumentar tu facturación un <strong>15%</strong>.
                </p>
                <button 
                    onClick={handleOpenOfferModal}
                    className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm active:scale-95 transform"
                >
                    Crear Oferta Ahora
                </button>
            </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <TrendingUp size={200} />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Sales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <DollarSign size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${data.salesGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {data.salesGrowth > 0 ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                    {Math.abs(data.salesGrowth)}%
                </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ventas Semanales</p>
            <h3 className="text-2xl font-bold text-gray-900">€{data.totalSalesWeek.toLocaleString()}</h3>
        </div>

        {/* Avg Ticket */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <CreditCard size={20} />
                </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ticket Medio</p>
            <h3 className="text-2xl font-bold text-gray-900">€{data.avgTicket.toFixed(2)}</h3>
        </div>

        {/* Prep Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Clock size={20} />
                </div>
                {data.avgPrepTime > 30 && (
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Alto</span>
                )}
            </div>
            <p className="text-gray-500 text-sm font-medium">Tiempo Prep. Medio</p>
            <h3 className="text-2xl font-bold text-gray-900">{data.avgPrepTime} min</h3>
        </div>

        {/* Cancel Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <AlertCircle size={20} />
                </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ratio Cancelación</p>
            <h3 className="text-2xl font-bold text-gray-900">{data.cancelRate}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
            <h3 className="font-bold text-gray-900 mb-6">Top 5 Productos</h3>
            <div className="space-y-5">
                {data.topProducts.sort((a,b) => b.quantity - a.quantity).map((product, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 truncate pr-2">{idx + 1}. {product.name}</span>
                            <span className="text-gray-500 whitespace-nowrap">{product.quantity} uds.</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            {/* Width calculation strictly capped at 100% */}
                            <div 
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min((product.quantity / maxQuantity) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Heatmap / Peak Hours */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-6">Mapa de Calor (Horas Punta)</h3>
            <div className="flex items-end justify-between h-56 space-x-2 pt-4"> {/* Increased height and added pt-4 */}
                {data.peakHours.map((slot, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group"> {/* Wrapper now has h-full */}
                        <div 
                            className="w-full bg-emerald-100 rounded-t-md relative hover:bg-emerald-200 transition-all duration-500 ease-out min-h-[4px]" // Animation & min-height
                            style={{ height: `${slot.volume}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {slot.volume}% Vol.
                            </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-3 transform -rotate-45 origin-top-left w-full text-center">
                            {slot.hour}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Opiniones de Clientes</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {data.reviews.map(review => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-sm text-gray-800">{review.customerName}</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={14} 
                                        className={`${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} 
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm italic mb-3">"{review.comment}"</p>
                        
                        {/* AI Response Section */}
                        {review.response ? (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mt-3 relative">
                                <p className="text-indigo-800 text-xs font-bold mb-1 flex items-center">
                                    <Sparkles size={10} className="mr-1" /> Respuesta del Local
                                </p>
                                <p className="text-indigo-700 text-sm leading-relaxed">
                                    {review.response}
                                </p>
                            </div>
                        ) : (
                            <div>
                                {replyingToId === review.id ? (
                                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
                                        {isGeneratingAI ? (
                                            <div className="flex items-center text-indigo-600 text-sm py-2">
                                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Redactando respuesta personalizada...
                                            </div>
                                        ) : (
                                            <>
                                                <textarea 
                                                    value={aiResponseText}
                                                    onChange={(e) => setAiResponseText(e.target.value)}
                                                    className="w-full text-sm p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 bg-white mb-2 shadow-sm"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => setReplyingToId(null)} className="text-gray-500 text-xs font-bold px-3 py-1 hover:bg-gray-200 rounded">Cancelar</button>
                                                    <button onClick={() => saveResponse(review.id)} className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-indigo-700 flex items-center">
                                                        <Send size={12} className="mr-1" /> Publicar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{review.date.toLocaleDateString()}</span>
                                        <button 
                                            onClick={() => generateAIResponse(review)}
                                            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition-colors"
                                        >
                                            <Sparkles size={12} className="mr-1" /> Generar Respuesta IA
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-white flex items-center">
                        <Rocket size={20} className="mr-2" /> Configurar Oferta
                    </h3>
                    <button onClick={() => setIsOfferModalOpen(false)} className="text-indigo-200 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="flex items-center space-x-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                         <div className="bg-indigo-200 p-2 rounded text-indigo-700">
                            <Tag size={20} />
                         </div>
                         <div>
                             <p className="text-xs text-indigo-600 font-bold uppercase">Producto Seleccionado</p>
                             <p className="font-bold text-gray-800">{topProduct.name}</p>
                         </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descuento (%)</label>
                        <input 
                            type="number" 
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={offerConfig.discount}
                            onChange={e => setOfferConfig({...offerConfig, discount: Number(e.target.value)})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Recomendado: 15%</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Límite de Usos</label>
                        <input 
                            type="number" 
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={offerConfig.limit}
                            onChange={e => setOfferConfig({...offerConfig, limit: Number(e.target.value)})}
                        />
                        <p className="text-xs text-gray-500 mt-1">La oferta se desactivará tras {offerConfig.limit} usos.</p>
                    </div>

                    <div className="pt-2 flex gap-3">
                         <button 
                            onClick={() => setIsOfferModalOpen(false)}
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmOffer}
                            className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-colors flex justify-center items-center"
                        >
                            Crear Campaña <ArrowRight size={18} className="ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsView;
