import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { db, id } from '../lib/instant';
import { X, Users, Save, AlertCircle } from 'lucide-react';

interface CustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    identificacionFiscal: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        nombre: customer.nombre || '',
        email: customer.email || '',
        telefono: customer.telefono || '',
        direccion: customer.direccion || '',
        identificacionFiscal: customer.identificacionFiscal || '',
      });
    } else {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        identificacionFiscal: '',
      });
    }
    setError('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre o Razón Social del cliente es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (customer?.id) {
        // Update customer in InstantDB (clientes)
        await db.transact([
          db.tx.clientes[customer.id].update({
            nombre: formData.nombre.trim(),
            email: formData.email.trim(),
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim(),
            identificacionFiscal: formData.identificacionFiscal.trim(),
          }),
        ]);
      } else {
        // Create customer in InstantDB (clientes)
        const newCustId = id();
        await db.transact([
          db.tx.clientes[newCustId].update({
            nombre: formData.nombre.trim(),
            email: formData.email.trim(),
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim(),
            identificacionFiscal: formData.identificacionFiscal.trim() || 'XAXX010101000',
            fechaCreacion: new Date().toISOString(),
          }),
        ]);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la información del cliente.');
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
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg">
              {customer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombre Completo / Razón Social *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="Ej. Comercializadora Azteca S.A."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Identificación Fiscal (RFC/NIT/RUC)</label>
              <input
                type="text"
                value={formData.identificacionFiscal}
                onChange={(e) => setFormData({ ...formData, identificacionFiscal: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase placeholder-slate-500"
                placeholder="RFC/NIT/DNI"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
                placeholder="(55) 0000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Dirección / Domicilio Fiscal</label>
            <textarea
              rows={2}
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none placeholder-slate-500"
              placeholder="Av. Principal #123, Colonia Centro..."
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
              {isSubmitting ? 'Guardando...' : customer ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
