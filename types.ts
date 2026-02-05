
export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  ON_WAY = 'ON_WAY', // Estado "En Camino"
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD'
}

export type UserRole = 'TENANT' | 'CUSTOMER';

export type BusinessType = 'Restaurante' | 'Farmacia' | 'Cafetería' | 'Supermercado' | 'Tabaquería' | 'Tienda de Ropa' | 'Otro';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeSlug?: string; // Solo para tenants
  businessType?: BusinessType; // Nuevo: Para adaptar la UI
}

// Marketplace Stores
export interface StoreProfile {
  id: string;
  slug: string;
  name: string;
  businessType: BusinessType; // Rubro Principal
  category: string; // Especialidad (ej: Italiana, Salud, Panadería)
  rating: number;
  deliveryTimeRange: string; // "20-30 min"
  deliveryFee: number;
  minOrder: number;
  image: string;
  banner: string;
  isOpen: boolean;
  tags?: string[];
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isDeliveryAvailable: boolean;
  category: string;
  promotionalPrice?: number;
  isFeatured?: boolean; // New: Para platos destacados
  stock?: number; // New: Stock management
  suggestedProductId?: string; // NEW: Upselling logic
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  readyAt?: Date; // Nuevo: Para medir cuando se avisa al cliente
  prepTime?: number; // Nuevo: Tiempo de preparación en minutos
  paymentMethod: PaymentMethod;
  deliveryType: 'DELIVERY' | 'PICKUP'; // Nuevo campo para lógica de notificaciones
}

export interface ShiftSummary {
  startTime: Date;
  endTime: Date;
  totalOrders: number;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  orders: Order[];
}

// CRM
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  isVip: boolean;
  notes?: string; // "Cliente alérgico", "Timbre no funciona", etc.
  lastOrderDate: Date;
  favoriteDish?: string; // Nuevo campo solicitado
}

// Marketing
export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  uses: number;
  maxUses?: number; // Nuevo campo para límite de usos
}

export interface FlashSale {
    isActive: boolean;
    productId: string;
    productName: string;
    originalPrice: number;
    discountedPrice: number;
    endTime: number; // Timestamp
}

export interface MarketingStats {
    revenueGenerated: number; // Ventas atribuidas a marketing
    discountCost: number; // Dinero "perdido" en descuentos
    campaignsSent: number;
    activeAutomations: number;
}

// Settings
export interface ShiftSchedule {
    morning: { start: string; end: string };
    night: { start: string; end: string };
}

export interface TempOverload {
    isActive: boolean;
    extraMinutes: number;
    endTime: number; // Timestamp
}

export interface StoreConfig {
  prepTimeMinutes: number; // 20, 30, 45...
  deliveryRadiusKm: number;
  deliveryZoneColor?: string;
  deliveryFee: number;
  soundSettings: {
    newOrder: boolean;
    driverArrival: boolean;
    cancelled: boolean;
  };
  isOpen: boolean;
  isDeliveryEnabled: boolean;
  shifts: ShiftSchedule; // Nuevo: Configuración de horarios de turnos
  tempOverload?: TempOverload; // Nuevo: Modo Colapso
}

// Analytics & Finance
export interface DailySales {
    date: string;
    amount: number;
    orders: number;
}

export interface FinancialTransaction {
    id: string;
    date: string;
    type: 'PAYOUT' | 'FEE' | 'ADJUSTMENT';
    amount: number;
    status: 'COMPLETED' | 'PENDING';
}

export interface Review {
    id: string;
    customerName: string;
    rating: number; // 1-5
    comment: string;
    date: Date;
    response?: string; // NEW: AI Response
    responseDate?: Date;
}

export interface AnalyticsSummary {
    totalSalesWeek: number;
    salesGrowth: number; // Percentage vs last week
    avgTicket: number;
    cancelRate: number; // Percentage
    avgPrepTime: number; // Minutes
    topProducts: { name: string; quantity: number; revenue: number }[];
    peakHours: { hour: string; volume: number }[]; // 0-100 scale for heatmap
    balance: number;
    transactions: FinancialTransaction[];
    reviews: Review[];
}
