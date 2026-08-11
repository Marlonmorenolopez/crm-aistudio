import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './lib/instant';
import { seedInitialDataIfNeeded } from './lib/seed';
import storeBg from './assets/images/store_background_1785981695302.jpg';

import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './components/LandingPage';
import { Navbar, ThemeType } from './components/Navbar';
import { MobileNav } from './components/MobileNav';

import { DashboardView } from './views/DashboardView';
import { ProductsView } from './views/ProductsView';
import { CustomersView } from './views/CustomersView';
import { MovementsView } from './views/MovementsView';
import { PosView } from './views/PosView';
import { SalesHistoryView } from './views/SalesHistoryView';
import { ReportsView } from './views/ReportsView';
import { RestockView } from './views/RestockView';
import { UsersView } from './views/UsersView';

import { ProductModal } from './components/ProductModal';
import { CustomerModal } from './components/CustomerModal';
import { MovementModal } from './components/MovementModal';
import { TicketModal } from './components/TicketModal';
import { BarcodeModal } from './components/BarcodeModal';

import { Product, Customer, Sale, PurchaseOrder, AppUser } from './types';
import { Loader2 } from 'lucide-react';

function MainAppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('app_theme') as ThemeType) || 'slate-mesh';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', currentTheme);
  }, [currentTheme]);

  const getThemeClass = (theme: ThemeType) => {
    switch (theme) {
      case 'slate-mesh':
        return 'bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950/50 to-slate-950';
      case 'aurora-night':
        return 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white';
      case 'dark-carbon':
        return 'bg-zinc-950 text-zinc-100';
      case 'soft-slate':
        return 'bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100/40 text-slate-900';
      default:
        return 'bg-slate-950 text-slate-100';
    }
  };

  // InstantDB Real-Time Query
  const { isLoading, error, data } = db.useQuery({
    productos: {},
    clientes: {},
    movimientosInventario: {},
    ventas: {},
    usuariosApp: {},
    ordenesCompra: {},
  });

  const products: Product[] = (data?.productos as any) || [];
  const customers: Customer[] = (data?.clientes as any) || [];
  const movements = (data?.movimientosInventario as any) || [];
  const sales: Sale[] = (data?.ventas as any) || [];
  const appUsers: AppUser[] = (data?.usuariosApp as any) || [];
  const purchaseOrders: PurchaseOrder[] = (data?.ordenesCompra as any) || [];

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<Customer | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  const [selectedSaleForTicket, setSelectedSaleForTicket] = useState<Sale | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Auto Seed Initial Data if InstantDB is empty
  useEffect(() => {
    if (!isLoading && data) {
      seedInitialDataIfNeeded(products.length, customers.length, appUsers.length);
    }
  }, [isLoading, data, products.length, customers.length, appUsers.length]);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Cargando base de datos InstantDB...</p>
      </div>
    );
  }

  // Count low stock products for navigation alerts
  const lowStockCount = products.filter((p) => p.stock <= (p.stockMinimo ?? 0)).length;

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col transition-colors duration-300 relative ${getThemeClass(currentTheme)}`}>
      
      {/* Subtle Transparent Background Image Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src={storeBg} 
          alt="Store environment background" 
          className="w-full h-full object-cover opacity-15 filter blur-[1.5px] scale-105" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header Navigation */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
        />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            customers={customers}
            movements={movements}
            sales={sales}
            onOpenProductModal={(p) => {
              setSelectedProductForModal(p || null);
              setIsProductModalOpen(true);
            }}
            onOpenMovementModal={(p) => {
              setSelectedProductForMovement(p || null);
              setIsMovementModalOpen(true);
            }}
            onOpenPos={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            onOpenProductModal={(p) => {
              setSelectedProductForModal(p || null);
              setIsProductModalOpen(true);
            }}
            onOpenMovementModal={(p) => {
              setSelectedProductForMovement(p || null);
              setIsMovementModalOpen(true);
            }}
            onOpenBarcodeModal={() => setIsBarcodeModalOpen(true)}
          />
        )}

        {activeTab === 'restock' && (
          <RestockView
            products={products}
            sales={sales}
            purchaseOrders={purchaseOrders}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            sales={sales}
            products={products}
            movements={movements}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            onOpenCustomerModal={(c) => {
              setSelectedCustomerForModal(c || null);
              setIsCustomerModalOpen(true);
            }}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            onOpenMovementModal={() => {
              setSelectedProductForMovement(null);
              setIsMovementModalOpen(true);
            }}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            products={products}
            customers={customers}
            onOpenCustomerModal={() => {
              setSelectedCustomerForModal(null);
              setIsCustomerModalOpen(true);
            }}
            onSaleCompleted={(sale) => {
              setSelectedSaleForTicket(sale);
            }}
          />
        )}

        {activeTab === 'sales' && (
          <SalesHistoryView
            sales={sales}
            products={products}
            onSelectSaleForTicket={(sale) => setSelectedSaleForTicket(sale)}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={appUsers}
          />
        )}

        {activeTab === 'landing' && (
          <LandingPage onAccessApp={() => setActiveTab('dashboard')} />
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

      {/* MODALS */}
      <ProductModal
        product={selectedProductForModal}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductForModal(null);
        }}
      />

      <CustomerModal
        customer={selectedCustomerForModal}
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setSelectedCustomerForModal(null);
        }}
      />

      <MovementModal
        products={products}
        preselectedProduct={selectedProductForMovement}
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedProductForMovement(null);
        }}
      />

      <TicketModal
        sale={selectedSaleForTicket}
        onClose={() => setSelectedSaleForTicket(null)}
      />

      <BarcodeModal
        products={products}
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />

      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
