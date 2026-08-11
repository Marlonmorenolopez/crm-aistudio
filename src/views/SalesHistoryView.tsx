import React, { useState } from 'react';
import { Sale, CartItem } from '../types';
import { db } from '../lib/instant';
import { Receipt, Search, Printer, Ban, CheckCircle2, XCircle } from 'lucide-react';

interface SalesHistoryViewProps {
  sales: Sale[];
  products: any[];
  onSelectSaleForTicket: (sale: Sale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  products,
  onSelectSaleForTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);

  const filteredSales = sales
    .filter((s) => {
      const invoice = s.numeroFactura || (s as any).invoiceNumber || '';
      const client = s.nombreCliente || (s as any).customerName || '';
      const seller = s.vendedor || (s as any).seller || '';

      return (
        invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      const dateA = a.fechaCreacion || (a as any).createdAt;
      const dateB = b.fechaCreacion || (b as any).createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  // Cancel sale and reverse stock in InstantDB
  const handleCancelSale = async () => {
    if (!cancelModalSale) return;

    try {
      let items: CartItem[] = [];
      try {
        items = JSON.parse(cancelModalSale.itemsJson || '[]');
      } catch (e) {
        console.error(e);
      }

      const transactions: any[] = [];

      // Mark sale status as ANULADA in InstantDB (ventas)
      transactions.push(
        db.tx.ventas[cancelModalSale.id].update({
          estado: 'ANULADA',
        })
      );

      // Return items back to stock in InstantDB (productos)
      items.forEach((item) => {
        const itemAny = item as any;
        const prod = item.producto || itemAny.product;
        const qty = item.cantidad ?? itemAny.quantity ?? 0;

        if (prod?.id) {
          const existingProd = products.find((p) => p.id === prod.id);
          if (existingProd) {
            const newStock = existingProd.stock + qty;
            transactions.push(
              db.tx.productos[existingProd.id].update({
                stock: newStock,
              })
            );
          }
        }
      });

      await db.transact(transactions);
      setCancelModalSale(null);
    } catch (err: any) {
      alert(`Error al anular la venta: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            Historial de Ventas y Facturación ({sales.length})
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Consulta comprobantes de venta, re-imprime tickets o realiza anulaciones
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 relative text-white">
        <Search className="w-4 h-4 absolute left-7 top-6 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
          placeholder="Buscar por Folio/Factura, Nombre de Cliente o Vendedor..."
        />
      </div>

      {/* Sales Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 overflow-hidden text-white">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No hay registros de ventas para mostrar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Folio Ticket</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-center">Método Pago</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredSales.map((s) => {
                  const invoice = s.numeroFactura || (s as any).invoiceNumber || '';
                  const client = s.nombreCliente || (s as any).customerName || '';
                  const payMethod = s.metodoPago || (s as any).paymentMethod || '';
                  const status = s.estado || (s as any).status || '';
                  const date = s.fechaCreacion || (s as any).createdAt;

                  const isAnulada = status === 'ANULADA';
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-400">
                        {invoice}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {date ? new Date(date).toLocaleString('es-MX') : ''}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {client}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs uppercase text-slate-300">
                        {payMethod}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        ${s.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isAnulada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> Anulada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Completada
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectSaleForTicket(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Ver / Imprimir Ticket"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {!isAnulada && (
                            <button
                              onClick={() => setCancelModalSale(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Anular Factura y Devolver Stock"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CANCEL SALE CONFIRMATION MODAL */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-700/50 shadow-2xl shadow-slate-950/80 text-white">
            <h3 className="font-bold text-white text-base">Anular Venta {cancelModalSale.numeroFactura || (cancelModalSale as any).invoiceNumber}</h3>
            <p className="text-xs text-slate-300">
              Al anular esta venta, el estado cambiará a Anulada y el stock de los productos se devolverá automáticamente al inventario. ¿Deseas continuar?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalSale(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelSale}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                Sí, Anular Venta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
