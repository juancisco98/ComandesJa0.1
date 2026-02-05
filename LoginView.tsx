
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2, Lock, Mail, User, ShoppingBag, Store } from 'lucide-react';

const LoginView: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  
  // State: Toggle between Login and Register view
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
        setError('Por favor completa todos los campos');
        return;
    }

    const success = await login(email);
    if (!success) {
        setError('Usuario no encontrado. Verifica tus datos o regístrate.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !name) {
        setError('Por favor completa todos los campos');
        return;
    }

    // HARDCODED: Registration is always for CUSTOMER role via public interface
    await register(email, name, 'CUSTOMER');
  };

  // Developer Quick Login Helper
  const devLoginLocal = () => {
      // Log in as the generic Retail Store (Pizzeria in this case, serves as General Template)
      login('local@demo.com');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-emerald-600 p-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">ComandesJa</h1>
                <p className="text-emerald-100">La plataforma para locales y vecinos.</p>
            </div>

            <div className="p-8">
                {/* LOGIN FORM */}
                {!isRegistering && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        <h2 className="text-xl font-bold text-gray-800">Iniciar Sesión</h2>
                        <p className="text-gray-500 text-sm mb-4">Accede a tu cuenta de Local o Cliente.</p>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    autoFocus
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'} <ArrowRight size={18} className="ml-2" />
                        </button>

                        <div className="text-center pt-2">
                            <button 
                                type="button" 
                                onClick={() => { setIsRegistering(true); setError(''); }}
                                className="text-sm text-emerald-600 font-bold hover:underline"
                            >
                                ¿No tienes cuenta? Regístrate como Cliente
                            </button>
                        </div>
                    </form>
                )}

                {/* REGISTER FORM */}
                {isRegistering && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-gray-800">Crear Cuenta Cliente</h2>
                        <p className="text-gray-500 text-sm mb-4">Regístrate para pedir en tus locales favoritos.</p>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    autoFocus
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="Ej: Maria García"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="nombre@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-gray-900"
                                    placeholder="Crea una contraseña segura"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex justify-center items-center disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Registrarme y Pedir'}
                        </button>

                        <div className="text-center pt-2">
                            <button 
                                type="button" 
                                onClick={() => { setIsRegistering(false); setError(''); }}
                                className="text-sm text-emerald-600 font-bold hover:underline"
                            >
                                ¿Ya tienes cuenta? Inicia Sesión
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>

        {/* Access Buttons */}
        <div className="flex flex-col gap-3 mt-6">
            <button 
                onClick={devLoginLocal}
                className="w-full bg-white text-gray-700 px-4 py-3 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center font-bold text-sm"
            >
                <Store size={18} className="mr-2" />
                Acceso Local (Demo)
            </button>
            
            <button 
                onClick={() => login('cliente@demo.com')}
                className="w-full bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center font-bold text-sm"
            >
                <ShoppingBag size={18} className="mr-2" />
                Acceso App Cliente (Demo)
            </button>
        </div>
        
        <div className="mt-8 text-center text-gray-400 text-xs w-full">
            <p>&copy; 2024 ComandesJa. Sistema Multi-Tenant.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
