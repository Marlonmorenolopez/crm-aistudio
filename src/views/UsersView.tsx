import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { db, id } from '../lib/instant';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Shield,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface UsersViewProps {
  users: AppUser[];
}

export const UsersView: React.FC<UsersViewProps> = ({ users }) => {
  const { user: currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CAJERO');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (users.some((u) => {
      const uName = u.nombreUsuario || (u as any).username || '';
      return uName.toLowerCase() === username.trim().toLowerCase();
    })) {
      setError('El nombre de usuario ya está registrado.');
      return;
    }

    try {
      const newUserId = id();
      await db.transact([
        db.tx.usuariosApp[newUserId].update({
          nombreUsuario: username.trim(),
          email: email.trim(),
          rol: role,
          passwordHash: password, // In client applet simplified hash/pass
          intentosFallidos: 0,
          estaBloqueado: false,
          fechaCreacion: new Date().toISOString(),
        }),
      ]);

      setSuccess(`Usuario "${username}" creado exitosamente.`);
      setIsModalOpen(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Error al crear usuario.');
    }
  };

  const handleToggleLock = async (u: AppUser) => {
    try {
      const isLocked = u.estaBloqueado ?? (u as any).isLocked ?? false;
      const failedAttempts = u.intentosFallidos ?? (u as any).failedAttempts ?? 0;

      await db.transact([
        db.tx.usuariosApp[u.id].update({
          estaBloqueado: !isLocked,
          intentosFallidos: isLocked ? 0 : failedAttempts,
        }),
      ]);
    } catch (err: any) {
      alert(`Error al actualizar usuario: ${err?.message}`);
    }
  };

  const handleDeleteUser = async (u: AppUser) => {
    const uName = u.nombreUsuario || (u as any).username || '';
    const currentName = currentUser?.nombreUsuario || (currentUser as any)?.username || '';

    if (u.id === currentUser?.id || uName === 'admin') {
      alert('No puedes eliminar la cuenta de Administrador principal.');
      return;
    }

    if (!confirm(`¿Eliminar al usuario ${uName}?`)) return;

    try {
      await db.transact([db.tx.usuariosApp[u.id].delete()]);
    } catch (err: any) {
      alert(`Error al eliminar usuario: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Gestión de Equipo, Usuarios y Permisos ({users.length})
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Administración centralizada de cajeros, almacén y administradores con control de seguridad
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-950/40 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Registrar Usuario
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 overflow-hidden text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Correo</th>
                <th className="py-3.5 px-4 text-center">Rol de Acceso</th>
                <th className="py-3.5 px-4 text-center">Estado Cuenta</th>
                <th className="py-3.5 px-4 text-center">Intentos OTP</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {users.map((u) => {
                const uName = u.nombreUsuario || (u as any).username || '';
                const currentName = currentUser?.nombreUsuario || (currentUser as any)?.username || '';
                const isMe = u.id === currentUser?.id || uName === currentName;

                const role = u.rol || (u as any).role || 'CAJERO';
                const isLocked = u.estaBloqueado ?? (u as any).isLocked ?? false;
                const failedAttempts = u.intentosFallidos ?? (u as any).failedAttempts ?? 0;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center justify-center text-xs">
                        {uName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{uName}</div>
                        {isMe && <span className="text-[10px] text-indigo-400 font-normal">(Tu Cuenta)</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">{u.email}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : role === 'ALMACEN'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px] rounded-full">
                          <Lock className="w-3 h-3" /> BLOQUEADA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] rounded-full">
                          <UserCheck className="w-3 h-3" /> ACTIVA
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      {failedAttempts} / 3
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleLock(u)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isLocked
                              ? 'text-emerald-400 hover:bg-slate-800'
                              : 'text-amber-400 hover:bg-slate-800'
                          }`}
                          title={isLocked ? 'Desbloquear Cuenta' : 'Bloquear Cuenta'}
                        >
                          {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        {!isMe && uName !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-700/50 shadow-2xl shadow-slate-950/80 text-white">
            <h3 className="font-bold text-white text-base">Registrar Nuevo Usuario</h3>

            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  placeholder="ej. carlos_pos"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  placeholder="ej. carlos@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de Acceso</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CAJERO" className="bg-slate-900 text-white">CAJERO — Solo Cobros y Registro de Ventas</option>
                  <option value="ALMACEN" className="bg-slate-900 text-white">ALMACEN — Gestión de Inventario y Kardex</option>
                  <option value="ADMIN" className="bg-slate-900 text-white">ADMIN — Control Total y Reportes Financieros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
