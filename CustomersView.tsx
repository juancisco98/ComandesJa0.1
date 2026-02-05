
import React, { useState } from 'react';
import { MOCK_CUSTOMERS } from '../services/mockService';
import { Customer } from '../types';
import { Search, MapPin, Phone, Crown, Edit, Save, Utensils, Pill, ShoppingBag, Shirt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CustomersView: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Lógica Dinámica para Etiquetas según el Rubro (SIN SERVICIOS)
  const getContextConfig = () => {
    switch (user?.businessType) {
        case 'Farmacia':
            return { label: 'Producto Habitual', icon: Pill };
        case 'Tienda de Ropa':
            return { label: 'Prenda Favorita', icon: Shirt };
        case 'Supermercado':
        case 'Tabaquería':
            return { label: 'Compra Frecuente', icon: ShoppingBag };
        default:
            return { label: 'Plato Favorito', icon: Utensils }; // Restaurante Default
    }
  };

  const { label: favoriteLabel, icon: FavoriteIcon } = getContextConfig();

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditNotes(c.notes || '');
  };

  const saveEdit = (id: string) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, notes: editNotes } : c));
    setEditingId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Base de Datos de Clientes</h2>
        <p className="text-gray-500 mt-1">Conoce a tus clientes, sus gustos y fidelízalos.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                {customer.isVip && (
                    <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center">
                        <Crown size={12} className="mr-1 fill-yellow-500 text-yellow-500" /> VIP
                    </div>
                )}
                
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                        {customer.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                        <p className="text-xs text-gray-400">Último pedido: {customer.lastOrderDate.toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                        <Phone size={16} className="mr-3 text-gray-400" />
                        {customer.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-3 text-gray-400" />
                        {customer.address}
                    </div>
                     {customer.favoriteDish && (
                        <div className="flex items-center text-sm text-orange-600 font-medium">
                            <FavoriteIcon size={16} className="mr-3 text-orange-400" />
                            {favoriteLabel}: {customer.favoriteDish}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-4 flex justify-between items-center text-sm">
                    <div>
                        <span className="block text-gray-400 text-xs uppercase font-bold">Pedidos</span>
                        <span className="font-bold text-gray-800">{customer.totalOrders}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-gray-400 text-xs uppercase font-bold">Total Gastado</span>
                        <span className="font-bold text-emerald-600">€{customer.totalSpent.toFixed(2)}</span>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Notas Internas</label>
                        {editingId === customer.id ? (
                            <button onClick={() => saveEdit(customer.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save size={14}/></button>
                        ) : (
                            <button onClick={() => startEdit(customer)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1 rounded"><Edit size={14}/></button>
                        )}
                    </div>
                    
                    {editingId === customer.id ? (
                        <textarea 
                            className="w-full text-sm bg-yellow-50 border border-yellow-200 rounded p-2 text-gray-700 focus:outline-none"
                            rows={2}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <p className={`text-sm ${customer.notes ? 'text-gray-600 italic' : 'text-gray-400 italic'}`}>
                            {customer.notes || "Sin notas adicionales."}
                        </p>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CustomersView;
