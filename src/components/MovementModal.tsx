import React, { useState } from 'react';
import { Product, MovementType } from '../types';
import { db, id } from '../lib/instant';
import { useAuth } from '../context/AuthContext';
import { X, ArrowDownRight, ArrowUpRight, Save, AlertCircle } from 'lucide-react';

interface MovementModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  products,
  isOpen,
  onClose,
  preselectedProduct,
}) => {
  const { user } = useAuth();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [type, setType] = useState<MovementType>('ENTRADA');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Compra de proveedor');
  const [reference, setReference] = useState<string>('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || preselectedProduct || products[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setError('Por favor selecciona un producto válido.');
      return;
    }
    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    if (type === 'SALIDA' && quantity > currentProduct.stock) {
      setError(`Stock insuficiente. El producto solo cuenta con ${currentProduct.stock} ${currentProduct.unidad}.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const prevStock = currentProduct.stock;
    const newStock = type === 'ENTRADA' ? prevStock + quantity : prevStock - quantity;
    const movementId = id();

    try {
      await db.transact([
        // 1. Update product stock in InstantDB (productos)
        db.tx.productos[currentProduct.id].update({
          stock: newStock,
        }),
        // 2. Add movement record in InstantDB (movimientosInventario)
        db.tx.movimientosInventario[movementId].update({
          tipo: type,
          productoId: currentProduct.id,
          nombreProducto: currentProduct.nombre,
          cantidad: quantity,
          stockAnterior: prevStock,
          nuevoStock: newStock,
          motivo: reason,
          referencia: reference.trim() || undefined,
          creadoPor: user?.nombreUsuario || 'Usuario',
          fechaCreacion: new Date().toISOString(),
        }),
      ]);

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el movimiento de inventario en InstantDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/80 max-w-lg w-full overflow-hidden border border-slate-700/50 text-white transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 text-white">
          <div className="flex items-center gap-2.5">
            {type === 'ENTRADA' ? (
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            )}
            <h3 className="font-semibold text-lg">Registrar Movimiento de Inventario</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('ENTRADA');
                setReason('Compra de proveedor / Reabastecimiento');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer ${
                type === 'ENTRADA'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" /> ENTRADA (Aumento)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('SALIDA');
                setReason('Ajuste de inventario / Merma / Salida');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer ${
                type === 'SALIDA'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> SALIDA (Disminución)
            </button>
          </div>

          {/* Select Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Producto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.nombre} (SKU: {p.sku}) - Stock Actual: {p.stock} {p.unidad}
                </option>
              ))}
            </select>
          </div>

          {currentProduct && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400">Stock Actual en Base de Datos:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {currentProduct.stock} {currentProduct.unidad}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cantidad a Movilizar *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Documento / Referencia</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                placeholder="N° Factura o Folio..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Motivo / Causa del Movimiento</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="Ej. Reorganización de bodega, merma por daño, etc."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium transition shadow-sm cursor-pointer disabled:opacity-50 ${
                type === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Procesando...' : `Confirmar ${type}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
