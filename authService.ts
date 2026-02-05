
import { User, UserRole, BusinessType } from '../types';
import { MOCK_STORES } from './mockService';

const USERS_KEY = 'comandesja_users_db';
const SESSION_KEY = 'comandesja_session';

// Simulación de base de datos inicial con distintos rubros (SIN SERVICIOS)
const INITIAL_USERS: User[] = [
    { id: 'u1', email: 'local@demo.com', name: 'La Pizzeria de Berga', role: 'TENANT', storeSlug: 'la-pizzeria-de-berga', businessType: 'Restaurante' },
    { id: 'u2', email: 'farmacia@demo.com', name: 'Farmacia Berga Centre', role: 'TENANT', storeSlug: 'farmacia-berga-centro', businessType: 'Farmacia' },
    { id: 'u4', email: 'cliente@demo.com', name: 'Juan Cliente', role: 'CUSTOMER' },
    { id: 'u5', email: 'ropa@demo.com', name: 'Moda Casual Berga', role: 'TENANT', storeSlug: 'moda-casual', businessType: 'Tienda de Ropa' }
];

export const authService = {
    // Inicializar DB si está vacía
    init: () => {
        // Para forzar la actualización de los datos mockeados en esta demo, sobrescribimos siempre si es dev
        localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    },

    // Buscar usuario por email
    findUser: (email: string): User | undefined => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        return users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    },

    // Registrar usuario
    register: (email: string, name: string, role: UserRole): User => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        // El slug del local se genera automáticamente si es tenant
        const newUser: User = {
            id: `usr-${Date.now()}`,
            email,
            name,
            role,
            storeSlug: role === 'TENANT' ? name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') : undefined,
            businessType: role === 'TENANT' ? 'Restaurante' : undefined // Default for new registrations
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return newUser;
    },

    // Login (Simulado)
    login: (email: string): User | null => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        let user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // ENRICH USER DATA: Asegurarnos de que el businessType coincida con el Store Mock
            if (user.role === 'TENANT' && user.storeSlug) {
                const store = MOCK_STORES.find(s => s.slug === user.storeSlug);
                if (store) {
                    user.businessType = store.businessType;
                }
            }

            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        }
        return null;
    },

    // Logout
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
    },

    // Obtener sesión actual
    getCurrentUser: (): User | null => {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }
};

authService.init();
