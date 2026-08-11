import React, { useState } from 'react';
import { InventoryMovement } from '../types';
import { ArrowUpDown, Search, ArrowDownRight, ArrowUpRight, Plus } from 'lucide-react';

interface MovementsViewProps {
  movements: InventoryMovement[];
  onOpenMovementModal: () => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ movements, onOpenMovementModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ENTRADA' | 'SALIDA'>('ALL');

  const filteredMovements = movements
    .filter((m) => {
      const prodName = m.nombreProducto || (m as any).productName || '';
      const reason = m.motivo || (m as any).reason || '';
      const ref = m.referencia || (m as any).reference || '';
      const createdBy = m.creadoPor || (m as any).createdBy || '';
      const type = m.tipo || (m as any).type || 'ENTRADA';

      const matchesSearch =
        prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        createdBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || type === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = a.fechaCreacion || (a as any).createdAt;
      const dateB = b.fechaCreacion || (b as any).createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-indigo-400" />
            Kardex y Historial de Movimientos ({movements.length})
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Registro auditable de todas las Entradas y Salidas de inventario en la base de datos InstantDB
          </p>
        </div>

        <button
          onClick={onOpenMovementModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Movimiento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 grid grid-cols-1 md:grid-cols-3 gap-3 text-white">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
            placeholder="Buscar por producto, motivo, folio o usuario..."
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos los Movimientos</option>
            <option value="ENTRADA" className="bg-slate-900 text-white">🟢 Solo Entradas (Aumento)</option>
            <option value="SALIDA" className="bg-slate-900 text-white">🔴 Solo Salidas (Disminución)</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 overflow-hidden text-white">
        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ArrowUpDown className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No hay movimientos registrados con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-center">Cant.</th>
                  <th className="py-3 px-4 text-center">Stock Anter. → Nuevo</th>
                  <th className="py-3 px-4">Motivo / Referencia</th>
                  <th className="py-3 px-4">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredMovements.map((m) => {
                  const type = m.tipo || (m as any).type || 'ENTRADA';
                  const isEntrada = type === 'ENTRADA';
                  const prodName = m.nombreProducto || (m as any).productName || '';
                  const qty = m.cantidad ?? (m as any).quantity ?? 0;
                  const prevStk = m.stockAnterior ?? (m as any).previousStock ?? 0;
                  const newStk = m.nuevoStock ?? (m as any).newStock ?? 0;
                  const reason = m.motivo || (m as any).reason || '';
                  const ref = m.referencia || (m as any).reference || '';
                  const createdBy = m.creadoPor || (m as any).createdBy || '';
                  const date = m.fechaCreacion || (m as any).createdAt;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        {isEntrada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <ArrowDownRight className="w-3.5 h-3.5" /> ENTRADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <ArrowUpRight className="w-3.5 h-3.5" /> SALIDA
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300 font-medium">
                        {date ? new Date(date).toLocaleString('es-MX') : ''}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {prodName}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-base">
                        <span className={isEntrada ? 'text-emerald-400' : 'text-rose-400'}>
                          {isEntrada ? '+' : '-'}{qty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {prevStk} → <span className="font-bold text-white">{newStk}</span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        <div>{reason}</div>
                        {ref && <div className="text-slate-500 font-mono">Ref: {ref}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-300">
                        {createdBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
