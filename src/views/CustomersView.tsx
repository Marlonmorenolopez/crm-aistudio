import React, { useState } from 'react';
import { Customer } from '../types';
import { db } from '../lib/instant';
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onOpenCustomerModal: (customer?: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, onOpenCustomerModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const name = c.nombre || (c as any).name || '';
    const tax = c.identificacionFiscal || (c as any).taxId || '';
    const email = c.email || '';
    const phone = c.telefono || (c as any).phone || '';

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDeleteCustomer = async (idToDelete: string) => {
    try {
      await db.transact([db.tx.clientes[idToDelete].delete()]);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Error al eliminar cliente: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Directorio de Clientes ({customers.length})
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Registro completo para facturación, comprobantes de venta y datos de contacto en la base de datos InstantDB
          </p>
        </div>

        <button
          onClick={() => onOpenCustomerModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-950/40 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 relative text-white">
        <Search className="w-4 h-4 absolute left-7 top-6 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
          placeholder="Buscar por Nombre, RFC/NIT, Correo o Teléfono..."
        />
      </div>

      {/* CUSTOMERS GRID */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-semibold text-slate-200 text-base">No se encontraron clientes</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-400">Prueba registrando un nuevo cliente o ajusta los criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const name = c.nombre || (c as any).name || 'Sin nombre';
            const tax = c.identificacionFiscal || (c as any).taxId || '';
            const phone = c.telefono || (c as any).phone || '';
            const address = c.direccion || (c as any).address || '';
            const date = c.fechaCreacion || (c as any).createdAt;

            return (
              <div key={c.id} className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 hover:border-slate-600/60 transition-all space-y-3 flex flex-col justify-between text-white">
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-white text-base leading-tight">{name}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md font-bold uppercase shrink-0">
                      {tax || 'SIN RFC'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-300">{c.email}</span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-300">{phone}</span>
                      </div>
                    )}
                    {address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-slate-400">{address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Alta: {date ? new Date(date).toLocaleDateString('es-MX') : 'Reciente'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenCustomerModal(c)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Editar Cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Eliminar Cliente"
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
            <h3 className="font-bold text-white text-base">Eliminar Cliente</h3>
            <p className="text-xs text-slate-300">
              ¿Confirmas que deseas eliminar este cliente de la base de datos?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCustomer(deleteConfirmId)}
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
