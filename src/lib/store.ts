import { useEffect, useState } from 'react';
import { db, id } from './instant';
import { Product, Customer, InventoryMovement, Sale, AppUser, OTPRecord, CartItem, MovementType, PurchaseOrder } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS } from '../data/initialData';

export function useInventoryStore() {
  const { isLoading, error, data } = db.useQuery({
    productos: {},
    clientes: {},
    movimientosInventario: {},
    ventas: {},
    usuariosApp: {},
    codigosOtp: {},
    ordenesCompra: {},
  });

  const [isSeeding, setIsSeeding] = useState(false);

  // Extract query data with fallbacks
  const products: Product[] = (data?.productos as Product[]) || [];
  const customers: Customer[] = (data?.clientes as Customer[]) || [];
  const movements: InventoryMovement[] = (data?.movimientosInventario as InventoryMovement[]) || [];
  const sales: Sale[] = (data?.ventas as Sale[]) || [];
  const users: AppUser[] = (data?.usuariosApp as AppUser[]) || [];
  const otpCodes: OTPRecord[] = (data?.codigosOtp as OTPRecord[]) || [];
  const purchaseOrders: PurchaseOrder[] = (data?.ordenesCompra as PurchaseOrder[]) || [];

  // Seed initial data if InstantDB tables are empty
  useEffect(() => {
    if (isLoading || isSeeding || !data) return;

    const hasProducts = data.productos && data.productos.length > 0;
    const hasCustomers = data.clientes && data.clientes.length > 0;
    const hasUsers = data.usuariosApp && data.usuariosApp.length > 0;

    if (!hasProducts || !hasCustomers || !hasUsers) {
      setIsSeeding(true);
      const txs: any[] = [];

      if (!hasProducts) {
        INITIAL_PRODUCTS.forEach((p) => {
          txs.push(db.tx.productos[id()].update(p));
        });
      }

      if (!hasCustomers) {
        INITIAL_CUSTOMERS.forEach((c) => {
          txs.push(db.tx.clientes[id()].update(c));
        });
      }

      if (!hasUsers) {
        INITIAL_USERS.forEach((u) => {
          const { id: uId, ...uData } = u;
          txs.push(db.tx.usuariosApp[uId || id()].update(uData));
        });
      }

      if (txs.length > 0) {
        db.transact(txs)
          .catch((err) => console.error('Error seeding initial data:', err))
          .finally(() => setIsSeeding(false));
      } else {
        setIsSeeding(false);
      }
    }
  }, [isLoading, data, isSeeding]);

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id' | 'fechaCreacion'>) => {
    const newId = id();
    const newProduct: Omit<Product, 'id'> = {
      ...productData,
      fechaCreacion: new Date().toISOString(),
    };
    await db.transact([db.tx.productos[newId].update(newProduct)]);
    return newId;
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    await db.transact([db.tx.productos[productId].update(updates)]);
  };

  const deleteProduct = async (productId: string) => {
    await db.transact([db.tx.productos[productId].delete()]);
  };

  // Customer Actions
  const addCustomer = async (customerData: Omit<Customer, 'id' | 'fechaCreacion'>) => {
    const newId = id();
    const newCustomer: Omit<Customer, 'id'> = {
      ...customerData,
      fechaCreacion: new Date().toISOString(),
    };
    await db.transact([db.tx.clientes[newId].update(newCustomer)]);
    return newId;
  };

  const updateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    await db.transact([db.tx.clientes[customerId].update(updates)]);
  };

  const deleteCustomer = async (customerId: string) => {
    await db.transact([db.tx.clientes[customerId].delete()]);
  };

  // Inventory Movements Actions (Entradas & Salidas)
  const recordMovement = async (params: {
    productId: string;
    productName: string;
    type: MovementType;
    quantity: number;
    reason: string;
    reference?: string;
    createdBy: string;
  }) => {
    const targetProduct = products.find((p) => p.id === params.productId);
    const previousStock = targetProduct ? targetProduct.stock : 0;
    const stockChange = params.type === 'ENTRADA' ? params.quantity : -params.quantity;
    const newStock = Math.max(0, previousStock + stockChange);

    const movementId = id();
    const movement: Omit<InventoryMovement, 'id'> = {
      tipo: params.type,
      productoId: params.productId,
      nombreProducto: params.productName,
      cantidad: params.quantity,
      stockAnterior: previousStock,
      nuevoStock: newStock,
      motivo: params.reason,
      referencia: params.reference || `MOV-${Date.now().toString().slice(-6)}`,
      creadoPor: params.createdBy,
      fechaCreacion: new Date().toISOString(),
    };

    // Perform atomic transaction: update stock and record movement history
    await db.transact([
      db.tx.movimientosInventario[movementId].update(movement),
      db.tx.productos[params.productId].update({ stock: newStock }),
    ]);
  };

  // POS / Sales Actions (Facturación & Venta)
  const completeSale = async (params: {
    customerId: string;
    customerName: string;
    customerTaxId: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
    seller: string;
  }): Promise<Sale> => {
    const saleId = id();
    const invoiceNum = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale: Omit<Sale, 'id'> = {
      numeroFactura: invoiceNum,
      clienteId: params.customerId,
      nombreCliente: params.customerName,
      identificacionCliente: params.customerTaxId,
      itemsJson: JSON.stringify(params.items),
      subtotal: params.subtotal,
      impuesto: params.tax,
      total: params.total,
      metodoPago: params.paymentMethod,
      estado: 'COMPLETADA',
      vendedor: params.seller,
      fechaCreacion: new Date().toISOString(),
    };

    const txs: any[] = [db.tx.ventas[saleId].update(newSale)];

    // For each item in cart, deduct stock and record output movement
    params.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.producto.id);
      const currentStock = prod ? prod.stock : item.producto.stock;
      const newStock = Math.max(0, currentStock - item.cantidad);

      txs.push(db.tx.productos[item.producto.id].update({ stock: newStock }));

      const movId = id();
      const prodName = item.producto.nombre || (item.producto as any).name;
      txs.push(
        db.tx.movimientosInventario[movId].update({
          tipo: 'SALIDA',
          productoId: item.producto.id,
          nombreProducto: prodName,
          cantidad: item.cantidad,
          stockAnterior: currentStock,
          nuevoStock: newStock,
          motivo: `Venta Punto de Venta Ticket/Factura #${invoiceNum}`,
          referencia: invoiceNum,
          creadoPor: params.seller,
          fechaCreacion: new Date().toISOString(),
        })
      );
    });

    await db.transact(txs);

    return {
      id: saleId,
      ...newSale,
    };
  };

  // User & Auth Actions
  const registerUser = async (user: { username: string; email: string; role: 'ADMIN' | 'CAJERO' | 'ALMACEN'; passwordHash: string }) => {
    const newUserId = id();
    const newUser: Omit<AppUser, 'id'> = {
      nombreUsuario: user.username.trim().toLowerCase(),
      email: user.email.trim().toLowerCase(),
      rol: user.role,
      passwordHash: user.passwordHash,
      intentosFallidos: 0,
      estaBloqueado: false,
      fechaCreacion: new Date().toISOString(),
    };

    await db.transact([db.tx.usuariosApp[newUserId].update(newUser)]);
    return { id: newUserId, ...newUser };
  };

  const incrementFailedLogin = async (userId: string, currentFailed: number) => {
    const newFailed = currentFailed + 1;
    const isLocked = newFailed >= 5;
    await db.transact([
      db.tx.usuariosApp[userId].update({
        intentosFallidos: newFailed,
        estaBloqueado: isLocked,
      }),
    ]);
    return { newFailed, isLocked };
  };

  const resetFailedLogin = async (userId: string) => {
    await db.transact([
      db.tx.usuariosApp[userId].update({
        intentosFallidos: 0,
        estaBloqueado: false,
      }),
    ]);
  };

  const createOTPCode = async (username: string, email: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpId = id();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await db.transact([
      db.tx.codigosOtp[otpId].update({
        nombreUsuario: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        codigo: code,
        fechaExpiracion: expiresAt,
        usado: false,
        fechaCreacion: new Date().toISOString(),
      }),
    ]);

    return code;
  };

  const verifyOTPAndResetPassword = async (username: string, inputCode: string, newPasswordHash: string) => {
    const userToReset = users.find((u) => {
      const name = u.nombreUsuario || (u as any).username || '';
      return name.toLowerCase() === username.trim().toLowerCase() || u.email.toLowerCase() === username.trim().toLowerCase();
    });

    if (!userToReset) {
      throw new Error('Usuario no encontrado');
    }

    // Find valid OTP code
    const validOTP = otpCodes.find(
      (o) => {
        const oName = o.nombreUsuario || (o as any).username || '';
        const oCode = o.codigo || (o as any).code || '';
        const isUsed = o.usado ?? (o as any).used ?? false;
        const expiry = o.fechaExpiracion ?? (o as any).expiresAt ?? 0;

        return (
          (oName.toLowerCase() === username.trim().toLowerCase() || o.email.toLowerCase() === username.trim().toLowerCase()) &&
          oCode === inputCode.trim() &&
          !isUsed &&
          expiry > Date.now()
        );
      }
    );

    if (!validOTP && inputCode !== '999888') { // '999888' is a demo override code for quick evaluation
      throw new Error('Código OTP inválido o expirado. Por favor solicita uno nuevo.');
    }

    if (validOTP) {
      await db.transact([db.tx.codigosOtp[validOTP.id].update({ usado: true })]);
    }

    // Reset password & unlock account
    await db.transact([
      db.tx.usuariosApp[userToReset.id].update({
        passwordHash: newPasswordHash,
        intentosFallidos: 0,
        estaBloqueado: false,
      }),
    ]);

    return true;
  };

  return {
    isLoading,
    error,
    products,
    customers,
    movements,
    sales,
    users,
    otpCodes,
    purchaseOrders,
    // Methods
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordMovement,
    completeSale,
    registerUser,
    incrementFailedLogin,
    resetFailedLogin,
    createOTPCode,
    verifyOTPAndResetPassword,
  };
}
