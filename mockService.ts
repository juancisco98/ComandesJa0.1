
import { Order, OrderStatus, PaymentMethod, Product, Customer, Coupon, StoreConfig, AnalyticsSummary, StoreProfile } from '../types';

// Mock Stores - REMOVED BARBER SHOP
export const MOCK_STORES: StoreProfile[] = [
  {
    id: 'store-1',
    slug: 'la-pizzeria-de-berga',
    name: 'La Pizzeria de Berga',
    businessType: 'Restaurante',
    category: 'Italiana',
    rating: 4.8,
    deliveryTimeRange: '20-30 min',
    deliveryFee: 1.50,
    minOrder: 10,
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=80',
    banner: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    isOpen: true,
    tags: ['Oferta 2x1', 'Pizzas', 'Pastas'],
    address: 'Carrer Major, 12'
  },
  {
    id: 'store-10',
    slug: 'moda-casual',
    name: 'Moda Casual Berga',
    businessType: 'Tienda de Ropa',
    category: 'Moda',
    rating: 4.7,
    deliveryTimeRange: '24h',
    deliveryFee: 3.50,
    minOrder: 20,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=500&q=80',
    banner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=80',
    isOpen: true,
    tags: ['Mujer', 'Hombre', 'Accesorios'],
    address: 'Carrer del Roser, 45'
  },
  {
    id: 'store-5',
    slug: 'farmacia-berga-centro',
    name: 'Farmacia Berga Centre',
    businessType: 'Farmacia',
    category: 'Salud',
    rating: 5.0,
    deliveryTimeRange: '15-20 min',
    deliveryFee: 1.90,
    minOrder: 5,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=500&q=80',
    banner: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1000&q=80',
    isOpen: true,
    tags: ['Salud', 'Parafarmacia', 'Urgencias'],
    address: 'Gran Via, 5'
  }
];

// MOCK PRODUCTS - REMOVED SERVICES
export const MOCK_PRODUCTS: Product[] = [
  // FOOD ITEMS
  {
    id: '101',
    name: 'Pizza Margarita',
    description: 'Tomate, mozzarella fior di latte y albahaca fresca.',
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    category: 'Pizzas',
    promotionalPrice: 7.99,
    stock: 50,
    isFeatured: true,
    suggestedProductId: '105' // Upsells Coke
  },
  {
    id: '102',
    name: 'Pasta Carbonara',
    description: 'Espaguetis con guanciale, pecorino, huevo y pimienta negra.',
    price: 11.00,
    image: 'https://images.unsplash.com/photo-1612874742237-98280d2074d6?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    category: 'Pastas',
    stock: 30
  },
  {
    id: '105',
    name: 'Coca Cola Zero 33cl',
    description: 'Refresco sin azúcar.',
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    category: 'Bebidas',
    stock: 100
  },
  // PHARMACY ITEMS
  {
    id: '301',
    name: 'Paracetamol 500mg',
    description: 'Analgésico y antipirético. Caja de 20 comprimidos.',
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    category: 'Medicamentos',
    stock: 100
  },
  // CLOTHING ITEMS
  {
    id: '401',
    name: 'Camiseta Básica Algodón',
    description: '100% Algodón orgánico. Color Blanco. Talla M.',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    isDeliveryAvailable: true,
    category: 'Hombre',
    stock: 15
  }
];

// MOCK ORDERS - REMOVED APPOINTMENTS
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    tenantId: 'store-1',
    customerName: 'Juan Pérez',
    items: [
      { productId: '101', name: 'Pizza Margarita', quantity: 2, price: 9.50, notes: 'Sin albahaca' },
      { productId: '102', name: 'Pasta Carbonara', quantity: 1, price: 11.00 }
    ],
    status: OrderStatus.PENDING,
    total: 30.00,
    createdAt: new Date(),
    paymentMethod: PaymentMethod.CARD,
    deliveryType: 'DELIVERY'
  },
  {
    id: 'ORD-002',
    tenantId: 'store-1',
    customerName: 'Ana Gomez',
    items: [
      { productId: '101', name: 'Pizza Margarita', quantity: 1, price: 9.50 }
    ],
    status: OrderStatus.COOKING,
    total: 9.50,
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 15), // 15 min ago
    paymentMethod: PaymentMethod.CASH,
    deliveryType: 'PICKUP'
  },
  {
    id: 'ORD-003',
    tenantId: 'store-1',
    customerName: 'Carlos Ruiz',
    items: [
      { productId: '102', name: 'Pasta Carbonara', quantity: 2, price: 11.00 }
    ],
    status: OrderStatus.READY,
    total: 22.00,
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 40), // 40 min ago
    readyAt: new Date(new Date().getTime() - 1000 * 60 * 10), // Ready 10 min ago (took 30 min)
    prepTime: 30,
    paymentMethod: PaymentMethod.CARD,
    deliveryType: 'DELIVERY'
  },
   {
    id: 'ORD-004',
    tenantId: 'store-1',
    customerName: 'Maria V.',
    items: [
      { productId: '101', name: 'Pizza Margarita', quantity: 1, price: 9.50 }
    ],
    status: OrderStatus.DELIVERED,
    total: 9.50,
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 120), // 2 hours ago
    readyAt: new Date(new Date().getTime() - 1000 * 60 * 90), // Ready 90 min ago (took 30 min)
    prepTime: 30,
    paymentMethod: PaymentMethod.CASH,
    deliveryType: 'PICKUP'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-1',
    name: 'Juan Pérez',
    phone: '600 123 456',
    address: 'Carrer Major 12, 2A',
    totalOrders: 5,
    totalSpent: 120.50,
    isVip: true,
    notes: 'Cliente habitual. Suele pedir los viernes.',
    lastOrderDate: new Date(),
    favoriteDish: 'Pizza Margarita' 
  },
  {
    id: 'CUST-2',
    name: 'Ana Gomez',
    phone: '611 222 333',
    address: 'Av. Diagonal 4',
    totalOrders: 2,
    totalSpent: 45.00,
    isVip: false,
    notes: 'Alergia a los frutos secos.',
    lastOrderDate: new Date(),
    favoriteDish: 'Pasta Carbonara'
  }
];

export const MOCK_COUPONS: Coupon[] = [
  { id: '1', code: 'PIZZA10', discountPercent: 10, isActive: true, uses: 5 },
  { id: '2', code: 'WELCOME20', discountPercent: 20, isActive: true, uses: 12 }
];

export const MOCK_CONFIG: StoreConfig = {
  prepTimeMinutes: 20,
  deliveryRadiusKm: 5,
  deliveryZoneColor: '#3b82f6',
  deliveryFee: 1.50,
  soundSettings: {
    newOrder: true,
    driverArrival: false,
    cancelled: true
  },
  isOpen: true,
  isDeliveryEnabled: true,
  shifts: {
      morning: { start: '12:00', end: '16:00' },
      night: { start: '20:00', end: '23:30' }
  },
  tempOverload: {
      isActive: false,
      extraMinutes: 0,
      endTime: 0
  }
};

export const MOCK_ANALYTICS: AnalyticsSummary = {
    totalSalesWeek: 1250.00,
    salesGrowth: 15,
    avgTicket: 25.50,
    cancelRate: 1.2,
    avgPrepTime: 18,
    topProducts: [
        { name: 'Pizza Margarita', quantity: 45, revenue: 427.5 },
        { name: 'Pasta Carbonara', quantity: 30, revenue: 330 },
        { name: 'Coca Cola Zero 33cl', quantity: 60, revenue: 150 },
        { name: 'Tiramisú', quantity: 20, revenue: 100 },
        { name: 'Paracetamol 500mg', quantity: 15, revenue: 37.5 }
    ],
    peakHours: [
        { hour: '13:00', volume: 60 },
        { hour: '14:00', volume: 80 },
        { hour: '20:00', volume: 90 },
        { hour: '21:00', volume: 100 },
        { hour: '22:00', volume: 70 },
    ],
    balance: 1250.00,
    transactions: [],
    reviews: [
        { id: 'RV-1', customerName: 'Juan P.', rating: 5, comment: 'La mejor pizza de Berga!', date: new Date() },
        { id: 'RV-2', customerName: 'Ana G.', rating: 4, comment: 'Muy rica pero tardó un poco.', date: new Date() }
    ]
};
