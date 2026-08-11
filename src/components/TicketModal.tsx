import React from 'react';
import { Sale, CartItem } from '../types';
import { BRAND_LOGO_URL, BRAND_NAME } from '../lib/constants';
import { Printer, X, CheckCircle2, Building2, Receipt } from 'lucide-react';

interface TicketModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  let items: CartItem[] = [];
  try {
    items = JSON.parse(sale.itemsJson || '[]');
  } catch (e) {
    console.error('Error parsing sale items JSON:', e);
  }

  const handlePrint = () => {
    window.print();
  };

  const invoiceNum = sale.numeroFactura || (sale as any).invoiceNumber || 'FACT-000';
  const customerName = sale.nombreCliente || (sale as any).customerName || 'Público General';
  const customerTaxId = sale.identificacionCliente || (sale as any).customerTaxId || '';
  const sellerName = sale.vendedor || (sale as any).seller || 'Cajero Principal';
  const payMethod = sale.metodoPago || (sale as any).paymentMethod || 'EFECTIVO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
      {/* Container - hide default UI on print */}
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-950/80 max-w-lg w-full overflow-hidden border border-slate-700/50 text-white print:shadow-none print:border-none print:max-w-full print:w-full print:p-0 print:bg-white print:text-slate-900">
        
        {/* Header - No Print */}
        <div className="flex items-center justify-between p-4 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">Comprobante de Venta / Factura</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ticket
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE TICKET CONTENT */}
        <div className="p-6 md:p-8 space-y-6 text-slate-100 text-sm print:p-0 print:text-xs print:text-slate-900">
          
          {/* Business Banner */}
          <div className="text-center border-b border-slate-800 print:border-slate-200 pb-5">
            <div className="inline-flex items-center justify-center mb-2">
              <img 
                src={BRAND_LOGO_URL} 
                alt={BRAND_NAME} 
                className="h-24 sm:h-28 w-auto max-w-[300px] object-contain mx-auto print:max-h-20"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-bold text-white print:text-slate-900 tracking-tight">{BRAND_NAME}</h1>
            <p className="text-slate-400 print:text-slate-500 text-xs mt-0.5">Sistemas de Inventario & Punto de Venta</p>
            <p className="text-slate-400 print:text-slate-500 text-xs">RFC: CMM990101XYZ • Tel: (55) 8000-1234</p>
            <p className="text-slate-400 print:text-slate-500 text-xs">Av. Central #100, Col. Centro, México</p>
          </div>

          {/* Sale Info Summary */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 print:border-none print:bg-transparent print:p-0">
            <div>
              <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Folio / Ticket</span>
              <span className="font-bold text-indigo-400 print:text-indigo-600 text-base">{invoiceNum}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Fecha y Hora</span>
              <span className="font-semibold text-slate-200 print:text-slate-700">{new Date(sale.fechaCreacion || (sale as any).createdAt).toLocaleString('es-MX')}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Cliente</span>
              <span className="font-semibold text-white print:text-slate-800">{customerName}</span>
              {customerTaxId && (
                <span className="block text-slate-400 print:text-slate-500 text-xs">RFC/ID: {customerTaxId}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Atendido por</span>
              <span className="font-medium text-slate-300 print:text-slate-700">{sellerName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white print:text-slate-900 border-b border-slate-800 print:border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Detalle de Productos</span>
              <span className="text-xs font-normal text-slate-400 print:text-slate-500">{items.length} artículo(s)</span>
            </h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 print:border-slate-200 text-slate-400 print:text-slate-500 text-xs uppercase">
                  <th className="py-2">Cant</th>
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-right">P.Unit</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-100">
                {items.map((item, idx) => {
                  const itemAny = item as any;
                  const prod = item.producto || itemAny.product;
                  const qty = item.cantidad ?? itemAny.quantity ?? 1;
                  const unitPrice = item.precioUnitario ?? itemAny.unitPrice ?? 0;
                  const subtotal = item.subtotal ?? 0;
                  return (
                    <tr key={idx} className="text-slate-200 print:text-slate-700">
                      <td className="py-2 font-medium text-white print:text-slate-900 align-top">{qty}x</td>
                      <td className="py-2 align-top">
                        <div className="font-medium text-white print:text-slate-900">{prod?.nombre || prod?.name || 'Producto'}</div>
                        <div className="text-xs text-slate-400">SKU: {prod?.sku || 'N/A'}</div>
                      </td>
                      <td className="py-2 text-right align-top">${unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold text-white print:text-slate-900 align-top">${subtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-slate-800 print:border-slate-200 pt-3 space-y-1.5 text-right">
            <div className="flex justify-between text-slate-400 print:text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-200 print:text-slate-900">${sale.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 print:text-slate-600">
              <span>Impuestos (IVA 16%):</span>
              <span className="font-medium text-slate-200 print:text-slate-900">${(sale.impuesto ?? (sale as any).tax ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white print:text-slate-900 font-bold text-lg pt-2 border-t border-slate-800 print:border-slate-200">
              <span>Total Pagado:</span>
              <span className="text-emerald-400 print:text-indigo-600">${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 print:text-slate-500 pt-1">
              <span>Método de Pago:</span>
              <span className="font-semibold text-indigo-300 print:text-slate-700 uppercase">{payMethod}</span>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="text-center pt-4 border-t border-dashed border-slate-800 print:border-slate-300 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 print:text-emerald-600 text-xs font-semibold bg-emerald-500/20 print:bg-transparent px-3 py-1 rounded-full border border-emerald-500/30 print:border-none">
              <CheckCircle2 className="w-3.5 h-3.5" /> Transacción Procesada con Éxito
            </div>
            <p className="text-slate-400 print:text-slate-500 text-xs italic">¡Gracias por su compra! Para cualquier aclaración o garantía conserve este ticket.</p>
            {/* Visual Barcode simulation */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="h-10 w-48 bg-white flex items-center justify-around px-2 rounded print:h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={`h-full ${i % 3 === 0 ? 'w-1 bg-slate-900' : i % 2 === 0 ? 'w-0.5 bg-slate-900' : 'w-1.5 bg-white'}`} />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest mt-1">{invoiceNum}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions - No Print */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">ID: {sale.id.slice(0, 8)}...</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
