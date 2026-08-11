import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BRAND_LOGO_URL, BRAND_NAME } from '../lib/constants';
import {
  LayoutDashboard,
  Package,
  Users,
  ArrowUpDown,
  ShoppingCart,
  Receipt,
  LogOut,
  AlertTriangle,
  User,
  Building2,
  BarChart3,
  Truck,
  Shield,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';

export type ThemeType = 'slate-mesh' | 'aurora-night' | 'dark-carbon' | 'soft-slate';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
  currentTheme: ThemeType;
  setCurrentTheme: (theme: ThemeType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  currentTheme,
  setCurrentTheme,
}) => {
  const { user, logout } = useAuth();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const themeOptions: { id: ThemeType; name: string; color: string }[] = [
    { id: 'slate-mesh', name: 'Gris Pizarra Mesh (Oscuro Elegante)', color: 'bg-indigo-900' },
    { id: 'aurora-night', name: 'Noche Aurora (Púrpura / Índigo)', color: 'bg-purple-900' },
    { id: 'dark-carbon', name: 'Carbón Mate (Negro Ejecutivo)', color: 'bg-zinc-900' },
    { id: 'soft-slate', name: 'Gris Pizarra Suave (Claro Anti-Reflejo)', color: 'bg-slate-300' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
    { id: 'products', label: 'Productos', icon: Package, alert: lowStockCount },
    { id: 'restock', label: 'Reabastecer', icon: Truck, alert: lowStockCount },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'movements', label: 'Kardex', icon: ArrowUpDown },
    { id: 'sales', label: 'Ventas', icon: Receipt },
    { id: 'users', label: 'Usuarios', icon: Shield },
    { id: 'landing', label: 'Presentación', icon: Sparkles },
  ];

  const displayUsername = user?.nombreUsuario || (user as any)?.username || 'Usuario';
  const displayRole = user?.rol || (user as any)?.role || 'ADMIN';

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 text-white print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="flex items-center justify-center py-1 transition group-hover:scale-105">
              <img 
                src={BRAND_LOGO_URL} 
                alt={BRAND_NAME} 
                className="h-12 sm:h-14 w-auto max-w-[180px] sm:max-w-[220px] object-contain filter drop-shadow-lg brightness-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white block leading-tight">{BRAND_NAME}</span>
              <span className="text-[10px] text-indigo-400 font-mono tracking-wide">Inventario & POS</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.alert && item.alert > 0 ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      {item.alert}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Theme Switcher & User Profile */}
          <div className="flex items-center gap-2.5">
            
            {/* Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-medium"
                title="Cambiar Tema de Fondo"
              >
                <Palette className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">Fondo</span>
              </button>

              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
                    Seleccionar Tema de Fondo
                  </div>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setCurrentTheme(opt.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        currentTheme === opt.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${opt.color} border border-white/20`} />
                        <span>{opt.name}</span>
                      </div>
                      {currentTheme === opt.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight">{displayUsername}</div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight">{displayRole}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
