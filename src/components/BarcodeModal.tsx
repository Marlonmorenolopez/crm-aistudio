import React, { useState } from 'react';
import { Product } from '../types';
import { Barcode, Printer, X, Copy, Check } from 'lucide-react';

interface BarcodeModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ products, isOpen, onClose }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].id : ''
  );
  const [labelQuantity, setLabelQuantity] = useState<number>(12);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handlePrint = () => {
    window.print();
  };

  const handleCopySKU = () => {
    if (currentProduct) {
      navigator.clipboard.writeText(currentProduct.sku);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const prodName = currentProduct?.nombre || (currentProduct as any)?.name || 'Producto Demo';
  const prodPrice = currentProduct?.precio ?? (currentProduct as any)?.price ?? 0;
  const prodUnit = currentProduct?.unidad || (currentProduct as any)?.unit || 'PZA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-700/50 text-white shadow-2xl shadow-slate-950/80 relative print:p-0 print:border-none print:shadow-none print:max-w-none print:bg-white print:text-slate-900">
        
        {/* Header - Hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Generador e Impresor de Códigos de Barras</h3>
              <p className="text-slate-400 text-xs">Crea planillas de etiquetas térmicas/imprimibles para tus productos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar - Hidden during print */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 print:hidden">
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Seleccionar Producto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => {
                const name = p.nombre || (p as any).name;
                const price = p.precio ?? (p as any).price ?? 0;
                return (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {name} — SKU: {p.sku} (${price.toFixed(2)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Etiquetas por Planilla</label>
            <input
              type="number"
              min="1"
              max="48"
              value={labelQuantity}
              onChange={(e) => setLabelQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Product Details Bar - Hidden during print */}
        {currentProduct && (
          <div className="flex items-center justify-between text-xs bg-indigo-950/50 p-3 rounded-xl border border-indigo-800/60 print:hidden">
            <div>
              <span className="text-indigo-200 font-bold">{prodName}</span>
              <span className="text-slate-400 ml-2 font-mono">SKU: {currentProduct.sku}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400 text-sm">${prodPrice.toFixed(2)}</span>
              <button
                onClick={handleCopySKU}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-indigo-500/40 transition cursor-pointer flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar SKU'}
              </button>
            </div>
          </div>
        )}

        {/* PRINTABLE LABELS GRID */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider print:hidden">
            Vista Previa de Impresión ({labelQuantity} etiquetas)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800 print:grid-cols-3 print:gap-4 print:max-h-none print:p-0 print:bg-transparent print:border-none">
            {Array.from({ length: labelQuantity }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 shadow-2xs print:border-slate-800 print:shadow-none"
              >
                <div className="font-bold text-slate-900 text-xs line-clamp-1 leading-tight">
                  {prodName}
                </div>
                
                {/* Simulated SVG Barcode Lines */}
                <div className="w-full px-2 py-1 bg-white border border-slate-200 rounded flex flex-col items-center">
                  <div className="flex items-center justify-center gap-0.5 h-10 w-full overflow-hidden">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2].map((w, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 h-full"
                        style={{ width: `${w * 2.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-[10px] text-slate-800 font-bold tracking-widest mt-0.5">
                    *{currentProduct?.sku || 'PROD-001'}*
                  </div>
                </div>

                <div className="flex items-center justify-between w-full text-[10px] text-slate-600 font-semibold pt-0.5">
                  <span className="uppercase font-mono text-[9px]">{prodUnit}</span>
                  <span className="font-bold text-slate-900 text-xs">${prodPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Bar - Hidden during print */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
          >
            <Printer className="w-4 h-4" /> Imprimir Etiquetas
          </button>
        </div>

      </div>
    </div>
  );
};
