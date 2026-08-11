export type MovementType = 'ENTRADA' | 'SALIDA';
export type UserRole = 'ADMIN' | 'CAJERO' | 'ALMACEN';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
export type InvoiceStatus = 'COMPLETADA' | 'ANULADA';

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  unidad: string;
  descripcion: string;
  fechaCreacion: string;
}

export interface Customer {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  identificacionFiscal: string; // RFC / RUC / NIT / DNI
  fechaCreacion: string;
}

export interface InventoryMovement {
  id: string;
  tipo: MovementType;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  stockAnterior: number;
  nuevoStock: number;
  motivo: string;
  referencia?: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface CartItem {
  producto: Product;
  cantidad: number;
  porcentajeDescuento: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  numeroFactura: string;
  clienteId: string;
  nombreCliente: string;
  identificacionCliente: string;
  itemsJson: string; // CartItem[] as JSON string
  subtotal: number;
  impuesto: number;
  total: number;
  metodoPago: PaymentMethod;
  estado: InvoiceStatus;
  vendedor: string;
  fechaCreacion: string;
}

export interface AppUser {
  id: string;
  nombreUsuario: string;
  email: string;
  rol: UserRole;
  passwordHash?: string;
  intentosFallidos: number;
  estaBloqueado: boolean;
  fechaCreacion: string;
}

export interface OTPRecord {
  id: string;
  nombreUsuario: string;
  email: string;
  codigo: string;
  fechaExpiracion: number;
  usado: boolean;
  fechaCreacion: string;
}

export interface PurchaseOrderItem {
  productoId: string;
  sku: string;
  nombreProducto: string;
  cantidadAOrdenar: number;
  costoUnitario: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  numeroOrden: string;
  proveedor: string;
  itemsJson: string; // PurchaseOrderItem[] JSON
  costoTotal: number;
  estado: 'PENDIENTE' | 'RECIBIDO' | 'CANCELADO';
  creadoPor: string;
  fechaCreacion: string;
  fechaRecepcion?: string;
}

export interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
}
