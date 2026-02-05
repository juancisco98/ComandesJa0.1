
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, UtensilsCrossed, ExternalLink, LogOut, Receipt, Users, Megaphone, Settings, BarChart2, Repeat, Store, ShoppingBag, Calendar, Scissors, Package, ChefHat, Tags } from 'lucide-react';
import { BusinessType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, switchRole } = useAuth();

  // If we are in the public storefront or login, don't show the admin sidebar
  if (location.pathname.startsWith('/store') || location.pathname === '/login') {
    return <>{children}</>;
  }

  // --- CONFIGURACIÓN DINÁMICA DE NAVEGACIÓN ---
  // Escalable: Para añadir otro rubro, solo agrega un case más.
  const getNavConfig = (type: BusinessType | undefined) => {
      switch (type) {
          case 'Restaurante':
          case 'Cafetería':
              return {
                  main: { name: 'Cocina (KDS)', icon: <ChefHat size={20} /> },
                  catalog: { name: 'Menú Digital', icon: <UtensilsCrossed size={20} /> }
              };
          case 'Tienda de Ropa':
          case 'Farmacia':
          case 'Supermercado':
          case 'Tabaquería':
          case 'Otro':
          default:
              return {
                  main: { name: 'Pedidos & Envíos', icon: <Package size={20} /> },
                  catalog: { name: 'Catálogo & Stock', icon: <Tags size={20} /> }
              };
      }
  };

  const navConfig = getNavConfig(user?.businessType);

  const navItems = [
    { name: navConfig.main.name, path: '/admin/kitchen', icon: navConfig.main.icon },
    { name: navConfig.catalog.name, path: '/admin/menu', icon: navConfig.catalog.icon },
    { name: 'Clientes (CRM)', path: '/admin/customers', icon: <Users size={20} /> },
    { name: 'Analítica', path: '/admin/analytics', icon: <BarChart2 size={20} /> },
    { name: 'Marketing', path: '/admin/marketing', icon: <Megaphone size={20} /> },
    { name: 'Configuración', path: '/admin/settings', icon: <Settings size={20} /> },
    { name: 'Cierre de Turno', path: '/admin/shift', icon: <Receipt size={20} /> },
  ];

  // 1. Vista Previa Tienda: El dueño ve su tienda SIN dejar de ser dueño.
  const handlePreviewStore = () => {
    if (user?.storeSlug) {
        navigate(`/store/${user.storeSlug}`);
    } else {
        alert("No tienes una tienda configurada.");
    }
  };

  // 2. Simular Rol Cliente: Cambia el permiso global para testear la app como usuario final.
  const handleSimulateCustomer = () => {
    // Cambio instantáneo para desarrollo
    switchRole('CUSTOMER');
    navigate('/store');
  };

  // 3. Trancar Sessió: Cierre definitivo del día.
  const handleLogout = () => {
    if(window.confirm("¿Seguro que quieres finalizar el día y cerrar sesión?")) {
        logout();
        navigate('/login'); // Redirección explícita para asegurar el cambio de vista
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 no-print">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center justify-center flex-col">
          <div className="bg-emerald-100 p-2 rounded-full mb-2">
            <Store className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-emerald-600 tracking-tight">ComandesJa</h1>
          {user && (
            <div className="text-center mt-1">
                <span className="block text-xs font-bold text-gray-800 truncate max-w-[200px]">{user.name}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{user.businessType || 'Comercio'}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
            {/* Botón 1: Vista Previa */}
            <button 
                onClick={handlePreviewStore}
                className="flex items-center justify-center w-full space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors font-bold text-xs uppercase tracking-wide border border-indigo-200"
                title="Ver como queda mi tienda"
            >
                <ExternalLink size={14} />
                <span>Vista Previa Tienda</span>
            </button>
            
            {/* Botón 2: Simular Cliente */}
            <button 
                onClick={handleSimulateCustomer}
                className="flex items-center justify-center w-full space-x-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 shadow-md transition-all font-bold text-xs"
                title="Cambiar a rol Cliente para pruebas"
            >
                <Repeat size={14} />
                <span>IR A APP CLIENTE</span>
            </button>

            {/* Botón 3: Cerrar Sesión */}
            <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full space-x-2 text-gray-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 text-sm transition-colors rounded-lg border border-transparent hover:border-red-100 mt-2"
            >
                <LogOut size={16} />
                <span>Trancar Sessió</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
