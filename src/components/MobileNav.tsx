import React from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ArrowUpDown,
  ShoppingCart,
  Receipt,
  BarChart3,
  Truck,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, lowStockCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
    { id: 'products', label: 'Stock', icon: Package, alert: lowStockCount },
    { id: 'restock', label: 'Pedir', icon: Truck, alert: lowStockCount },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'sales', label: 'Ventas', icon: Receipt },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around print:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer relative ${
              isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
            <span>{item.label}</span>
            {item.alert && item.alert > 0 ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
                {item.alert}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
