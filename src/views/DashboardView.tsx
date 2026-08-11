import React from 'react';
import { Product, Customer, InventoryMovement, Sale } from '../types';
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
  TrendingUp,
  Boxes,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  customers: Customer[];
  movements: InventoryMovement[];
  sales: Sale[];
  onOpenProductModal: (product?: Product) => void;
  onOpenMovementModal: (product?: Product) => void;
  onOpenPos: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  customers,
  movements,
  sales,
  onOpenProductModal,
  onOpenMovementModal,
  onOpenPos,
}) => {
  // Metric Calculations
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= (p.stockMinimo ?? 5));
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  
  const totalInventoryCost = products.reduce((acc, p) => acc + (p.stock || 0) * (p.costo || (p as any).cost || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.precio || (p as any).price || 0), 0);
  
  const totalSalesAmount = sales
    .filter((s) => s.estado !== 'ANULADA' && (s as any).status !== 'ANULADA')
    .reduce((acc, s) => acc + (s.total || 0), 0);

  const salesCount = sales.filter((s) => s.estado !== 'ANULADA' && (s as any).status !== 'ANULADA').length;

  const recentMovements = [...movements]
    .sort((a, b) => new Date(b.fechaCreacion || (b as any).createdAt).getTime() - new Date(a.fechaCreacion || (a as any).createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/40 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/30">
            <Boxes className="w-3.5 h-3.5" /> Base de Datos InstantDB Activa (Español)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel Principal de Inventario</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
            Monitoreo en tiempo real de productos, valor del inventario, alertas de bajo stock y registro de ventas.
          </p>
        </div>
        <div className="flex gap-2.5 z-10 w-full sm:w-auto">
          <button
            onClick={onOpenPos}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> Ir al Punto de Venta
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Products & Units */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 transition-all space-y-3 text-white hover:border-slate-600/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos Registrados</span>
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{totalProducts}</div>
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-semibold text-indigo-300">{totalStockUnits}</span> unidades en stock
            </p>
          </div>
        </div>

        {/* Card 2: Valor del Inventario */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 transition-all space-y-3 text-white hover:border-slate-600/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor de Inventario (Venta)</span>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">${totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">
              Costo total almacenado: <span className="font-semibold text-slate-300">${totalInventoryCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Ventas Registradas */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 transition-all space-y-3 text-white hover:border-slate-600/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Ventas POS</span>
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">${totalSalesAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-semibold text-sky-300">{salesCount}</span> transacciones completadas
            </p>
          </div>
        </div>

        {/* Card 4: Alerta Bajo Stock */}
        <div className={`p-5 rounded-2xl border transition-all space-y-3 backdrop-blur-xl shadow-xl shadow-slate-950/30 ${
          lowStockProducts.length > 0
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:border-amber-500/60'
            : 'bg-slate-900/70 border-slate-700/40 text-white hover:border-slate-600/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alerta de Stock Mínimo</span>
            <div className={`p-2.5 rounded-xl ${lowStockProducts.length > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{lowStockProducts.length}</div>
            <p className="text-xs text-slate-400 mt-1">
              {lowStockProducts.length > 0 ? (
                <span className="font-semibold text-amber-400">Requieren reabastecimiento urgente</span>
              ) : (
                'Todos los productos con stock adecuado'
              )}
            </p>
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Low Stock Alerts */}
        <div className="lg:col-span-2 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 p-5 space-y-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Productos con Bajo Stock ({lowStockProducts.length})</h3>
            </div>
            <button
              onClick={() => onOpenProductModal()}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Producto
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
              <p className="text-sm">¡Excelente! Ningún producto ha alcanzado el límite de stock mínimo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-center">Stock Actual</th>
                    <th className="py-2.5 px-3 text-center">Stock Mín.</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {lowStockProducts.map((p) => {
                    const name = p.nombre || (p as any).name;
                    const cat = p.categoria || (p as any).category;
                    const minStk = p.stockMinimo ?? (p as any).minStock ?? 5;
                    const unit = p.unidad || (p as any).unit || 'PZA';
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3 px-3 font-mono text-xs font-bold text-slate-400">{p.sku}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{name}</div>
                          <div className="text-xs text-slate-400">{cat}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {p.stock} {unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-400">{minStk}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenMovementModal(p)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm inline-flex items-center gap-1"
                          >
                            <ArrowDownRight className="w-3.5 h-3.5" /> Reabastecer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Recent Movements Timeline */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 p-5 space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Últimos Movimientos</h3>
            <span className="text-xs text-slate-400 font-mono">InstantDB Log</span>
          </div>

          {recentMovements.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((m) => {
                const prodName = m.nombreProducto || (m as any).productName || 'Producto';
                const type = m.tipo || (m as any).type || 'ENTRADA';
                const qty = m.cantidad ?? (m as any).quantity ?? 0;
                const reason = m.motivo || (m as any).reason || '';
                const date = m.fechaCreacion || (m as any).createdAt;
                return (
                  <div key={m.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start justify-between text-xs">
                    <div className="flex items-start gap-2.5">
                      {type === 'ENTRADA' ? (
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5 border border-emerald-500/30">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5 border border-rose-500/30">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white">{prodName}</div>
                        <div className="text-slate-400 mt-0.5">{reason}</div>
                        <div className="text-slate-500 text-[10px] mt-1">{date ? new Date(date).toLocaleString('es-MX') : ''}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${type === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {type === 'ENTRADA' ? '+' : '-'}{qty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
