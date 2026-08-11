import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { db, id } from '../lib/instant';
import { X, Package, Save, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    categoria: 'Electrónica',
    precio: 0,
    costo: 0,
    stock: 0,
    stockMinimo: 5,
    unidad: 'Piezas',
    descripcion: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        nombre: product.nombre || '',
        categoria: product.categoria || 'Electrónica',
        precio: product.precio || 0,
        costo: product.costo || 0,
        stock: product.stock || 0,
        stockMinimo: product.stockMinimo || 5,
        unidad: product.unidad || 'Piezas',
        descripcion: product.descripcion || '',
      });
    } else {
      setFormData({
        sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
        nombre: '',
        categoria: 'Electrónica',
        precio: 0,
        costo: 0,
        stock: 0,
        stockMinimo: 5,
        unidad: 'Piezas',
        descripcion: '',
      });
    }
    setError('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (!formData.sku.trim()) {
      setError('El SKU es obligatorio.');
      return;
    }
    if (formData.precio < 0 || formData.costo < 0) {
      setError('El precio y costo deben ser valores positivos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (product?.id) {
        // Update existing product in InstantDB (productos)
        await db.transact([
          db.tx.productos[product.id].update({
            sku: formData.sku.trim(),
            nombre: formData.nombre.trim(),
            categoria: formData.categoria,
            precio: Number(formData.precio),
            costo: Number(formData.costo),
            stock: Number(formData.stock),
            stockMinimo: Number(formData.stockMinimo),
            unidad: formData.unidad,
            descripcion: formData.descripcion.trim(),
          }),
        ]);
      } else {
        // Create new product in InstantDB (productos)
        const newProdId = id();
        await db.transact([
          db.tx.productos[newProdId].update({
            sku: formData.sku.trim(),
            nombre: formData.nombre.trim(),
            categoria: formData.categoria,
            precio: Number(formData.precio),
            costo: Number(formData.costo),
            stock: Number(formData.stock),
            stockMinimo: Number(formData.stockMinimo),
            unidad: formData.unidad,
            descripcion: formData.descripcion.trim(),
            fechaCreacion: new Date().toISOString(),
          }),
        ]);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el producto en InstantDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/80 max-w-xl w-full overflow-hidden border border-slate-700/50 text-white transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU / Código</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                placeholder="PROD-001"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Electrónica" className="bg-slate-900 text-white">Electrónica</option>
                <option value="Accesorios" className="bg-slate-900 text-white">Accesorios</option>
                <option value="Almacenamiento" className="bg-slate-900 text-white">Almacenamiento</option>
                <option value="Oficina" className="bg-slate-900 text-white">Oficina</option>
                <option value="Mobiliario" className="bg-slate-900 text-white">Mobiliario</option>
                <option value="Punto de Venta" className="bg-slate-900 text-white">Punto de Venta</option>
                <option value="General" className="bg-slate-900 text-white">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombre del Producto</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="Ej. Teclado Inalámbrico Logi Pro"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Precio de Venta ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-emerald-400 font-semibold text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Costo Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.costo}
                onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock Actual</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Stock Mínimo Alerta</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stockMinimo}
                onChange={(e) => setFormData({ ...formData, stockMinimo: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-amber-400 font-medium text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unidad de Medida</label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Piezas" className="bg-slate-900 text-white">Piezas</option>
                <option value="Cajas" className="bg-slate-900 text-white">Cajas</option>
                <option value="Kg" className="bg-slate-900 text-white">Kilos (Kg)</option>
                <option value="Metros" className="bg-slate-900 text-white">Metros</option>
                <option value="Paquetes" className="bg-slate-900 text-white">Paquetes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Descripción / Notas</label>
            <textarea
              rows={2}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-slate-500"
              placeholder="Especificaciones técnicas o detalles adicionales..."
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
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
