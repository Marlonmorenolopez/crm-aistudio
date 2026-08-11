import React, { useState } from 'react';
import { Product } from '../types';
import { db } from '../lib/instant';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertTriangle,
  LayoutGrid,
  List,
  CheckCircle2,
  XCircle,
  Barcode,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onOpenProductModal: (product?: Product) => void;
  onOpenMovementModal: (product?: Product) => void;
  onOpenBarcodeModal: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenProductModal,
  onOpenMovementModal,
  onOpenBarcodeModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const name = p.nombre || (p as any).name || '';
    const cat = p.categoria || (p as any).category || '';
    const sku = p.sku || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'TODAS' || cat === selectedCategory;

    const minStk = p.stockMinimo ?? (p as any).minStock ?? 5;
    let matchesStock = true;
    if (stockFilter === 'LOW') matchesStock = p.stock <= minStk && p.stock > 0;
    if (stockFilter === 'OUT') matchesStock = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = Array.from(
    new Set(products.map((p) => p.categoria || (p as any).category).filter(Boolean))
  );

  const handleDeleteProduct = async (idToDelete: string) => {
    try {
      await db.transact([db.tx.productos[idToDelete].delete()]);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Error al eliminar el producto: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Catálogo de Productos ({products.length})
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Consulta y gestiona el inventario almacenado en tiempo real en la base de datos InstantDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBarcodeModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer border border-slate-700/50"
          >
            <Barcode className="w-4 h-4 text-indigo-400" /> Imprimir Códigos Barras
          </button>
          <button
            onClick={() => onOpenProductModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Producto
          </button>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-3 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="Buscar por SKU, Nombre o Categoría..."
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="TODAS" className="bg-slate-900 text-white">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e: any) => setStockFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL" className="bg-slate-900 text-white">Todos los Niveles</option>
              <option value="LOW" className="bg-slate-900 text-white">⚠️ Solo Bajo Stock</option>
              <option value="OUT" className="bg-slate-900 text-white">❌ Agotados (Stock 0)</option>
            </select>
          </div>

        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista de Tabla"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista de Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-12 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-semibold text-slate-200 text-base">No se encontraron productos</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-400">Intenta ajustar la búsqueda o los filtros seleccionados.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 overflow-hidden text-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">SKU / Código</th>
                  <th className="py-3.5 px-4">Producto & Categoría</th>
                  <th className="py-3.5 px-4 text-right">Precio Venta</th>
                  <th className="py-3.5 px-4 text-right">Costo Unit.</th>
                  <th className="py-3.5 px-4 text-center">Stock Actual</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredProducts.map((p) => {
                  const name = p.nombre || (p as any).name || '';
                  const cat = p.categoria || (p as any).category || '';
                  const price = p.precio ?? (p as any).price ?? 0;
                  const cost = p.costo ?? (p as any).cost ?? 0;
                  const minStk = p.stockMinimo ?? (p as any).minStock ?? 5;
                  const unit = p.unidad || (p as any).unit || 'PZA';

                  const isLow = p.stock <= minStk && p.stock > 0;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-400">{p.sku}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{name}</div>
                        <div className="text-xs text-slate-400">{cat}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        ${price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        ${cost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-white">
                        {p.stock} <span className="text-xs font-normal text-slate-400">{unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> Agotado
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Bajo Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Disponible
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenMovementModal(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition cursor-pointer"
                            title="Entrada / Salida de Stock"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenProductModal(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition cursor-pointer"
                            title="Editar Producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                            title="Eliminar Producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const name = p.nombre || (p as any).name || '';
            const cat = p.categoria || (p as any).category || '';
            const price = p.precio ?? (p as any).price ?? 0;
            const minStk = p.stockMinimo ?? (p as any).minStock ?? 5;
            const unit = p.unidad || (p as any).unit || 'PZA';
            const desc = p.descripcion || (p as any).description || '';

            const isLow = p.stock <= minStk && p.stock > 0;
            const isOut = p.stock === 0;

            return (
              <div key={p.id} className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 hover:border-slate-600/60 transition-all space-y-4 flex flex-col justify-between text-white">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{p.sku}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-medium border border-slate-700">{cat}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{name}</h3>
                  <p className="text-slate-400 text-xs line-clamp-2">{desc || 'Sin descripción adicional.'}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Precio Venta</span>
                      <span className="font-bold text-emerald-400 text-base">${price.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Stock</span>
                      <span className={`font-bold ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                        {p.stock} {unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onOpenMovementModal(p)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" /> Ajustar Stock
                    </button>
                    <button
                      onClick={() => onOpenProductModal(p)}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition border border-slate-700 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition border border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-700/50 shadow-2xl shadow-slate-950/80 text-white">
            <h3 className="font-bold text-white text-base">Confirmar Eliminación</h3>
            <p className="text-xs text-slate-300">
              ¿Estás seguro de que deseas eliminar este producto de la base de datos? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
