import React, { useState } from 'react';
import { Product, Customer, CartItem, PaymentMethod, Sale } from '../types';
import { db, id } from '../lib/instant';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  DollarSign,
  CreditCard,
  Building2,
  Receipt,
  AlertCircle,
  Package,
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onOpenCustomerModal: () => void;
  onSaleCompleted: (sale: Sale) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  onOpenCustomerModal,
  onSaleCompleted,
}) => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers.length > 0 ? customers[0].id : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [cashTendered, setCashTendered] = useState<number>(0);

  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Categories
  const categories = Array.from(
    new Set(products.map((p) => p.categoria || (p as any).category).filter(Boolean))
  );

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const name = p.nombre || (p as any).name || '';
    const cat = p.categoria || (p as any).category || '';
    const sku = p.sku || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'TODAS' || cat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Cart Helpers
  const addToCart = (product: Product) => {
    const prodName = product.nombre || (product as any).name || 'Producto';
    const prodPrice = product.precio ?? (product as any).price ?? 0;

    if (product.stock <= 0) {
      setError(`El producto "${prodName}" está agotado.`);
      return;
    }

    setError('');
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.producto.id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) {
          setError(`No puedes añadir más de ${product.stock} unidades de este producto.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.producto.id === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            producto: product,
            cantidad: 1,
            descuentoPorcentaje: 0,
            precioUnitario: prodPrice,
            subtotal: prodPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setError('');
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.producto.id === productId) {
            const newQty = item.cantidad + delta;
            if (newQty <= 0) return null;
            if (newQty > item.producto.stock) {
              setError(`Stock máximo disponible: ${item.producto.stock}`);
              return item;
            }
            return {
              ...item,
              cantidad: newQty,
              subtotal: newQty * item.precioUnitario,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.producto.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError('');
  };

  // Financial Totals
  const subtotal = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const changeDue = paymentMethod === 'EFECTIVO' ? Math.max(0, cashTendered - total) : 0;

  // Selected Customer object
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) ||
    customers[0] || { id: '00000000-0000-4000-8000-000000000100', nombre: 'Público General', identificacionFiscal: 'XAXX010101000' };

  // Complete Sale
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío. Añade al menos un producto.');
      return;
    }

    if (paymentMethod === 'EFECTIVO' && cashTendered < total) {
      setError(`Monto entregado ($${cashTendered.toFixed(2)}) es menor al total a pagar ($${total.toFixed(2)}).`);
      return;
    }

    // Verify stock availability
    for (const item of cart) {
      const prodName = item.producto.nombre || (item.producto as any).name || 'Producto';
      if (item.cantidad > item.producto.stock) {
        setError(`Stock insuficiente para "${prodName}". Disponible: ${item.producto.stock}`);
        return;
      }
    }

    setIsProcessing(true);
    setError('');

    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const saleId = id();

    const transactions: any[] = [];

    // 1. Subtract product stock & add inventory SALIDA movement (productos & movimientosInventario)
    cart.forEach((item) => {
      const newStock = item.producto.stock - item.cantidad;
      const prodName = item.producto.nombre || (item.producto as any).name || 'Producto';

      transactions.push(
        db.tx.productos[item.producto.id].update({
          stock: newStock,
        })
      );

      const mId = id();
      transactions.push(
        db.tx.movimientosInventario[mId].update({
          tipo: 'SALIDA',
          productoId: item.producto.id,
          nombreProducto: prodName,
          cantidad: item.cantidad,
          stockAnterior: item.producto.stock,
          nuevoStock: newStock,
          motivo: `Venta POS #${invoiceNum}`,
          referencia: invoiceNum,
          creadoPor: user?.nombreUsuario || 'Cajero POS',
          fechaCreacion: new Date().toISOString(),
        })
      );
    });

    // 2. Save Sale Record in InstantDB (ventas)
    const custName = currentCustomer.nombre || (currentCustomer as any).name || 'Público General';
    const custTax = currentCustomer.identificacionFiscal || (currentCustomer as any).taxId || 'XAXX010101000';

    const newSale: Sale = {
      id: saleId,
      numeroFactura: invoiceNum,
      clienteId: currentCustomer.id,
      nombreCliente: custName,
      identificacionCliente: custTax,
      itemsJson: JSON.stringify(cart),
      subtotal,
      impuesto: tax,
      total,
      metodoPago: paymentMethod,
      estado: 'COMPLETADA',
      vendedor: user?.nombreUsuario || 'Cajero Principal',
      fechaCreacion: new Date().toISOString(),
    };

    transactions.push(
      db.tx.ventas[saleId].update({
        ...newSale,
      })
    );

    try {
      await db.transact(transactions);

      // Trigger printable ticket modal
      onSaleCompleted(newSale);

      // Reset POS Cart
      clearCart();
      setCashTendered(0);
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la venta en InstantDB.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Barcode quick scan on Enter
  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      // Exact match by SKU or exact name match first
      const exactMatch = products.find(
        (p) => {
          const name = (p.nombre || (p as any).name || '').toLowerCase();
          return p.sku.toLowerCase() === query || name === query;
        }
      ) || filteredProducts[0];

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 items-start">
      
      {/* LEFT SIDE (7 cols): PRODUCT CATALOG SEARCH */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search & Category Filter */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-3 text-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="Escanear lector USB / buscar producto por SKU o Nombre (Presiona Enter para agregar)..."
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('TODAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'TODAS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-900/70 backdrop-blur-xl p-12 rounded-2xl border border-slate-700/40 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No hay productos que coincidan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const isOut = p.stock === 0;
              const name = p.nombre || (p as any).name;
              const price = p.precio ?? (p as any).price ?? 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                    isOut
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-50 cursor-not-allowed'
                      : 'bg-slate-900/70 backdrop-blur-xl border-slate-700/40 shadow-lg hover:border-indigo-500 hover:shadow-indigo-950/30 cursor-pointer group'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{p.sku}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOut ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isOut ? 'Agotado' : `${p.stock} dispon.`}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-indigo-400 transition line-clamp-2">
                      {name}
                    </h4>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm">${price.toFixed(2)}</span>
                    <button
                      disabled={isOut}
                      className="p-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RIGHT SIDE (5 cols): SHOPPING CART & BILLING */}
      <div className="lg:col-span-5 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 p-5 space-y-4 text-white">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Carrito de Venta</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:underline cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer Selector */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase">
            <span>Cliente Factura</span>
            <button
              onClick={onOpenCustomerModal}
              className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Nuevo
            </button>
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {customers.map((c) => {
              const name = c.nombre || (c as any).name;
              const tax = c.identificacionFiscal || (c as any).taxId || 'Público General';
              return (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {name} ({tax})
                </option>
              );
            })}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-600 mb-1" />
              <p className="text-xs">Haz clic en los productos para agregarlos al carrito.</p>
            </div>
          ) : (
            cart.map((item) => {
              const name = item.producto.nombre || (item.producto as any).name;
              return (
                <div key={item.producto.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-white truncate">{name}</div>
                    <div className="text-slate-400 font-mono">${item.precioUnitario.toFixed(2)} c/u</div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.producto.id, -1)}
                      className="p-1 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-white px-1">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.producto.id, 1)}
                      className="p-1 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right w-16 pl-2 font-bold text-emerald-400">
                    ${item.subtotal.toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.producto.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Payment Method Picker */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 uppercase">Método de Pago</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('EFECTIVO')}
              className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border cursor-pointer transition ${
                paymentMethod === 'EFECTIVO'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('TARJETA')}
              className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border cursor-pointer transition ${
                paymentMethod === 'TARJETA'
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('TRANSFERENCIA')}
              className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border cursor-pointer transition ${
                paymentMethod === 'TRANSFERENCIA'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> Transferencia
            </button>
          </div>
        </div>

        {/* Cash Tendered Input */}
        {paymentMethod === 'EFECTIVO' && cart.length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/70 rounded-xl border border-emerald-500/30 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Monto Entregado ($)</label>
              <input
                type="number"
                step="0.01"
                value={cashTendered || ''}
                onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-emerald-500/40 rounded-lg text-white font-bold focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="text-right flex flex-col justify-center">
              <span className="text-slate-400">Cambio a Devolver:</span>
              <span className="text-base font-bold text-emerald-400">${changeDue.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Totals Summary */}
        <div className="space-y-1.5 pt-3 border-t border-slate-800 text-sm">
          <div className="flex justify-between text-slate-400 text-xs">
            <span>Subtotal</span>
            <span className="text-slate-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-xs">
            <span>Impuestos (IVA 16%)</span>
            <span className="text-slate-200">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-white text-lg pt-1 border-t border-slate-800">
            <span>Total Venta:</span>
            <span className="text-emerald-400">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Action */}
        <button
          onClick={handleProcessSale}
          disabled={cart.length === 0 || isProcessing}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Receipt className="w-5 h-5" />
          {isProcessing ? 'Procesando Venta...' : 'Completar Venta & Ticket'}
        </button>

      </div>

    </div>
  );
};
