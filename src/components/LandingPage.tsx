import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { BRAND_LOGO_URL, BRAND_NAME } from '../lib/constants';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  ShieldCheck,
  Truck,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  RefreshCw,
  Printer,
  ChevronRight,
  Sliders,
  DollarSign,
  UserCheck,
  Building2,
  FileText,
  Scan,
  Database,
  Search,
  Plus,
  Minus,
  X,
  Eye,
  EyeOff,
  LogIn,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onAccessApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onAccessApp }) => {
  const { loginWithPassword, loginWithDemo, registerUser, sendMagicCode, verifyMagicCode } = useAuth();

  // Active Scrollytelling Chapter Index
  const [activeChapter, setActiveChapter] = useState(0);

  // Login Modal / Tab State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'password' | 'register' | 'demo'>('password');
  
  // Auth Form Fields
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration Fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'CAJERO' | 'ALMACEN'>('ADMIN');

  // Interactive POS Simulator State
  const [simCart, setSimCart] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([
    { id: '1', name: 'Martillo De Uña 16oz Pro', price: 185.00, qty: 1 },
    { id: '2', name: 'Cinta Métrica 5m Impacto', price: 95.50, qty: 2 }
  ]);
  const [simPaymentMethod, setSimPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [simCashGiven, setSimCashGiven] = useState<number>(500);
  const [simTicketGenerated, setSimTicketGenerated] = useState(false);

  // Interactive ROI Calculator State
  const [roiSalesVolume, setRoiSalesVolume] = useState<number>(150000); // MXN / month
  const [roiLossRate, setRoiLossRate] = useState<number>(4); // 4% stock loss before system

  // Demo Product List for Interactive Terminal
  const demoProductsList = [
    { id: '1', name: 'Martillo De Uña 16oz Pro', price: 185.00, category: 'Herramientas' },
    { id: '2', name: 'Cinta Métrica 5m Impacto', price: 95.50, category: 'Herramientas' },
    { id: '3', name: 'Taladro Percutor 750W', price: 1250.00, category: 'Eléctrico' },
    { id: '4', name: 'Juego Llaves Allen 9Pzs', price: 210.00, category: 'Herramientas' },
    { id: '5', name: 'Foco LED 12W Luz Fría', price: 45.00, category: 'Iluminación' },
    { id: '6', name: 'Pintura Vinílica 19L Blanco', price: 1680.00, category: 'Pinturas' }
  ];

  // Calculated SIM Cart total
  const simSubtotal = simCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const simTax = simSubtotal * 0.16;
  const simTotal = simSubtotal + simTax;
  const simChange = Math.max(0, simCashGiven - simTotal);

  // Handlers for Interactive POS Simulator
  const handleAddSimItem = (item: { id: string; name: string; price: number }) => {
    setSimCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setSimTicketGenerated(false);
  };

  const handleUpdateSimQty = (id: string, delta: number) => {
    setSimCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean) as any);
    setSimTicketGenerated(false);
  };

  // Auth Submit Handlers
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setAuthError('Por favor ingresa tu usuario y contraseña.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');

    const res = await loginWithPassword(usernameInput, passwordInput);
    setIsSubmitting(false);

    if (res.success) {
      setIsLoginModalOpen(false);
      if (onAccessApp) onAccessApp();
    } else {
      setAuthError(res.message || 'Credenciales inválidas');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword) {
      setAuthError('Completa todos los campos obligatorios.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await registerUser(regUsername, regEmail, regPassword, regRole);

      if (res.success) {
        setAuthSuccess('¡Usuario registrado con éxito! Redirigiendo...');
        setTimeout(() => {
          setIsLoginModalOpen(false);
          if (onAccessApp) onAccessApp();
        }, 1200);
      } else {
        setAuthError(res.message || 'Error al registrar usuario');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Error inesperado al registrar usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoAccess = async (role: 'ADMIN' | 'CAJERO' | 'ALMACEN') => {
    setIsSubmitting(true);
    await loginWithDemo(role);
    setIsSubmitting(false);
    setIsLoginModalOpen(false);
    if (onAccessApp) onAccessApp();
  };

  // Scrollytelling Chapter Definitions
  const chapters = [
    {
      id: 0,
      title: '01. Terminal POS & Facturación en Tiempo Real',
      subtitle: 'Cobros ultrarrápidos y tickets inmediatos',
      description: 'Experimenta una interfaz de cobro diseñada para cero latencia. Escanea código de barras, selecciona cliente, aplica descuentos y genera tickets impresos o digitales con un clic.',
      icon: ShoppingCart,
      color: 'from-indigo-500 to-cyan-400',
      tag: 'PUNTO DE VENTA'
    },
    {
      id: 1,
      title: '02. Control de Inventarios & Kardex Automatizado',
      subtitle: 'Sincronización instantánea de stock',
      description: 'Cada venta o ajuste de inventario se sincroniza en vivo a través del motor InstantDB. Alertas automáticas de stock mínimo previenen desabastos e interrupciones operativas.',
      icon: Package,
      color: 'from-emerald-400 to-teal-500',
      tag: 'INVENTARIO VIVO'
    },
    {
      id: 2,
      title: '03. Reabastecimiento Predictivo Inteligente',
      subtitle: 'Algoritmos de predicción de demanda',
      description: 'El sistema analiza la velocidad de venta histórica de cada producto, calcula el punto de reorden ideal y borrador automático de Órdenes de Compra a proveedores.',
      icon: Truck,
      color: 'from-purple-500 to-pink-500',
      tag: 'ALGORITMO REABASTECER'
    },
    {
      id: 3,
      title: '04. Analítica Financiera Executiva',
      subtitle: 'Métricas de utilidad, margen e impuestos',
      description: 'Reportes ejecutivos en tiempo real sobre ingresos brutos, utilidad neta, productos con mayor margen de ganancia e historial de ventas exportable.',
      icon: BarChart3,
      color: 'from-amber-400 to-orange-500',
      tag: 'DASHBOARD FINANCIERO'
    },
    {
      id: 4,
      title: '05. Seguridad Multiusuario & Múltiples Roles',
      subtitle: 'Control total de permisos y accesos',
      description: 'Asigna permisos específicos a Administradores, Cajeros y Personal de Almacén. Bloqueo automático ante intentos fallidos y recuperación de cuenta con OTP seguro.',
      icon: ShieldCheck,
      color: 'from-blue-500 to-indigo-600',
      tag: 'SEGURIDAD EMPRESARIAL'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Animated Glassmorphism Background Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Floating Glassmorphism Sticky Navbar */}
      <nav className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 my-2">
        <div className="backdrop-blur-2xl bg-slate-900/70 border border-slate-700/60 rounded-2xl px-4 sm:px-6 py-3 shadow-2xl flex items-center justify-between transition-all">
          
          {/* Logo Showcase (Clean, unframed, large) */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src={BRAND_LOGO_URL} 
              alt={BRAND_NAME} 
              className="h-12 sm:h-16 w-auto max-w-[200px] sm:max-w-[260px] object-contain filter drop-shadow-xl brightness-110 group-hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapter(ch.id);
                  const el = document.getElementById(`scrolly-chapter-${ch.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeChapter === ch.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {ch.tag}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoginTab('demo');
                setIsLoginModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/80 transition shadow-lg backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
              Demo Rápida
            </button>

            <button
              onClick={() => {
                setLoginTab('password');
                setIsLoginModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Acceso al Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Glassmorphism Cards & Dynamic Visual Elements */}
      <section className="relative z-10 pt-8 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        {/* InstantDB Real-time Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 backdrop-blur-xl shadow-xl text-xs text-indigo-300 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>Motor InstantDB • Sincronización en Tiempo Real Activa</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight max-w-5xl mx-auto"
        >
          Plataforma de Control de <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Inventarios & Punto de Venta
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Diseñado para negocios que exigen máxima precisión operativa, cobro en punto de venta instantáneo, reabastecimiento inteligente y seguridad multiusuario respaldada por la nube.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => {
              const el = document.getElementById('interactive-sandbox');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40 transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Probar Terminal POS Interactiva
          </button>

          <button
            onClick={() => {
              setLoginTab('password');
              setIsLoginModalOpen(true);
            }}
            className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-200 bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 backdrop-blur-xl transition shadow-xl flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-indigo-400" />
            Ingresar al Sistema
          </button>
        </motion.div>

        {/* Glassmorphism Feature Highlights Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {[
            { label: 'Tiempo de Respuesta', value: '< 50 ms', desc: 'Motor InstantDB' },
            { label: 'Control de Stock', value: '100% Vivo', desc: 'Alertas automáticas' },
            { label: 'Métodos de Pago', value: 'Efectivo / POS', desc: 'Desglose IVA 16%' },
            { label: 'Seguridad', value: 'Multiusuario', desc: 'Recuperación OTP' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl backdrop-blur-xl bg-slate-900/50 border border-slate-800/80 shadow-xl hover:border-indigo-500/40 transition">
              <div className="text-2xl sm:text-3xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1">{stat.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{stat.desc}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* SCROLLEYTELLING INTERACTIVE SECTION */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-mono mb-3">
            <Layers className="w-3.5 h-3.5" />
            RECORRIDO INTERACTIVO • SCROLLEYTELLING
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Descubre la Potencia de <span className="text-indigo-400">{BRAND_NAME}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Desplázate hacia abajo para ver en acción cada módulo clave del sistema.
          </p>
        </div>

        {/* Split Grid: Left = Scrolly Chapters Story, Right = Sticky Live Preview Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Chapters Story List */}
          <div className="lg:col-span-5 space-y-8">
            {chapters.map((ch) => {
              const IconComp = ch.icon;
              const isActive = activeChapter === ch.id;

              return (
                <div
                  id={`scrolly-chapter-${ch.id}`}
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`p-6 rounded-3xl backdrop-blur-2xl transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-slate-900/90 border-indigo-500/80 shadow-2xl shadow-indigo-950/60 ring-1 ring-indigo-500/40 scale-[1.02]' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold text-indigo-300">
                      {ch.tag}
                    </span>
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${ch.color} text-white shadow-md`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{ch.title}</h3>
                  <p className="text-xs font-medium text-indigo-400 mb-2">{ch.subtitle}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{ch.description}</p>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>Haz clic para ver la demostración interactiva</span>
                    <ChevronRight className={`w-4 h-4 transition ${isActive ? 'translate-x-1 text-indigo-400' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Glassmorphism Interactive Live Demonstration Sandbox */}
          <div className="lg:col-span-7 sticky top-24">
            <div className="p-6 rounded-3xl backdrop-blur-3xl bg-slate-900/80 border border-slate-700/80 shadow-2xl relative overflow-hidden">
              
              {/* Decorative Glass glow header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">DEMOSTRADOR VIVO • {chapters[activeChapter].tag}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVO EN VIVO
                </div>
              </div>

              {/* Dynamic View based on Active Chapter */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChapter}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* CHAPTER 0: POS SIMULATOR */}
                  {activeChapter === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-indigo-400" />
                          Simulador de Terminal Punto de Venta
                        </h4>
                        <span className="text-xs text-slate-400">Toca productos para agregar</span>
                      </div>

                      {/* Demo Product Catalog Selection */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {demoProductsList.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => handleAddSimItem(prod)}
                            className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800 text-left transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-white truncate">{prod.name}</div>
                              <div className="text-[10px] text-slate-400">{prod.category}</div>
                            </div>
                            <div className="text-xs font-mono font-bold text-indigo-300 mt-2">
                              ${prod.price.toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Live Shopping Cart & Calculation */}
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                          <span>Carrito de Venta Demo ({simCart.reduce((a, b) => a + b.qty, 0)} ítems)</span>
                          <button onClick={() => setSimCart([])} className="text-[10px] text-rose-400 hover:underline">Limpiar</button>
                        </div>

                        {simCart.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">El carrito está vacío. Haz clic en productos arriba para agregar.</p>
                        ) : (
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {simCart.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
                                <div className="truncate pr-2">
                                  <div className="font-semibold text-white truncate">{item.name}</div>
                                  <div className="text-[10px] text-slate-400">${item.price.toFixed(2)} c/u</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleUpdateSimQty(item.id, -1)} className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"><Minus className="w-3 h-3" /></button>
                                  <span className="w-5 text-center font-bold text-white">{item.qty}</span>
                                  <button onClick={() => handleAddSimItem(item)} className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"><Plus className="w-3 h-3" /></button>
                                  <span className="font-mono text-indigo-300 font-bold ml-2">${(item.price * item.qty).toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Payment Totals Breakdown */}
                        <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                          <div className="flex justify-between text-slate-400"><span>Subtotal:</span><span className="font-mono">${simSubtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between text-slate-400"><span>IVA (16%):</span><span className="font-mono">${simTax.toFixed(2)}</span></div>
                          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                            <span>TOTAL:</span>
                            <span className="font-mono text-emerald-400">${simTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment Button */}
                        <button
                          disabled={simCart.length === 0}
                          onClick={() => setSimTicketGenerated(true)}
                          className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          Generar Ticket Demo Imprimible
                        </button>
                      </div>

                      {/* Ticket Preview Modal Popup */}
                      {simTicketGenerated && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                          <div className="flex items-center justify-between text-amber-300 font-bold">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Ticket Simulado Generado</span>
                            <button onClick={() => setSimTicketGenerated(false)}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button>
                          </div>
                          <p className="text-slate-300 text-[11px]">Venta completada por ${simTotal.toFixed(2)} MXN con ticket listo para impresión térmica.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHAPTER 1: INVENTORY KARDEX */}
                  {activeChapter === 1 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-400" />
                        Monitoreo de Stock en Tiempo Real & Kardex
                      </h4>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                        <div className="text-xs text-slate-300">
                          Sincronización instantánea con el backend de InstantDB para evitar desabastos:
                        </div>

                        <div className="space-y-2">
                          {[
                            { name: 'Taladro Percutor 750W', stock: 12, min: 5, status: 'SUFICIENTE', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' },
                            { name: 'Cinta Métrica 5m Impacto', stock: 3, min: 10, status: 'ALERTA BAJO STOCK', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40 animate-pulse' },
                            { name: 'Disco Corte Metal 4 1/2"', stock: 0, min: 15, status: 'AGOTADO', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                              <div>
                                <div className="font-bold text-white">{item.name}</div>
                                <div className="text-[10px] text-slate-400">Mínimo sugerido: {item.min} unidades</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-white">{item.stock} pzs</div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono font-bold ${item.color}`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHAPTER 2: RESTOCK ALGORITHM */}
                  {activeChapter === 2 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Truck className="w-4 h-4 text-purple-400" />
                        Motor de Reabastecimiento Automatizado
                      </h4>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                        <div className="text-slate-300">
                          El algoritmo evalúa la rotación diaria de productos y proyecta cuándo se agotará el stock.
                        </div>

                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                          <div className="flex justify-between font-bold text-purple-300">
                            <span>Proyección Orden de Compra Autogenerada</span>
                            <span className="font-mono">OC-2026-004</span>
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            Proveedor: <strong className="text-white">Truper Ferretera Central</strong>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300">
                            • 25x Cinta Métrica 5m Impacto ($45.00/u = $1,125.00)<br />
                            • 40x Disco Corte Metal 4 1/2" ($18.00/u = $720.00)
                          </div>
                          <div className="text-right font-bold text-white text-xs">
                            Costo Estimado: <span className="text-emerald-400 font-mono">$1,845.00 MXN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHAPTER 3: FINANCIAL REPORTS */}
                  {activeChapter === 3 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        Resumen Ejecutivo & Reportes
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                          <span className="text-slate-400 block text-[10px]">Ventas de Hoy</span>
                          <span className="text-xl font-bold font-mono text-emerald-400">$18,450.00</span>
                          <span className="text-[10px] text-emerald-500 block mt-1">+14.2% vs ayer</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                          <span className="text-slate-400 block text-[10px]">Utilidad Estimada</span>
                          <span className="text-xl font-bold font-mono text-indigo-400">$5,820.00</span>
                          <span className="text-[10px] text-indigo-300 block mt-1">Margen promedio 31.5%</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div className="font-bold text-white">Exportación en 1 Clic</div>
                        <p className="text-[11px] text-slate-400">Descarga estados de cuenta, reportes de IVA trasladado y resumenes diarios en PDF o CSV para tu contabilidad.</p>
                      </div>
                    </div>
                  )}

                  {/* CHAPTER 4: SECURITY & ROLES */}
                  {activeChapter === 4 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        Matriz de Permisos & Control de Usuarios
                      </h4>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { role: 'ADMINISTRADOR', badge: 'Acceso Total', desc: 'Precios, usuarios, reportes e inventarios' },
                            { role: 'CAJERO', badge: 'POS & Vistas', desc: 'Módulo de ventas, tickets y cobro' },
                            { role: 'ALMACÉN', badge: 'Stock & Kardex', desc: 'Entradas, salidas y recepciones de OC' }
                          ].map((r, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                              <span className="font-bold text-indigo-300 text-[10px] block">{r.role}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono inline-block">{r.badge}</span>
                              <p className="text-[10px] text-slate-400 leading-tight">{r.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE ROI CALCULATOR SECTION */}
      <section id="interactive-sandbox" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 rounded-3xl backdrop-blur-3xl bg-slate-900/80 border border-slate-700/80 shadow-2xl relative overflow-hidden">
          
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              CALCULADORA DE RETORNO DE INVERSIÓN (ROI)
            </span>
            <h3 className="text-2xl font-bold text-white mt-3">Calcula el Ahorro Estimado para tu Negocio</h3>
            <p className="text-slate-400 text-xs mt-1">Ajusta los valores para visualizar cómo evitar pérdidas por robo o desabastos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Venta Mensual Aproximada (MXN):</span>
                  <span className="font-mono text-emerald-400 font-bold">${roiSalesVolume.toLocaleString()} MXN</span>
                </div>
                <input 
                  type="range" 
                  min="30000" 
                  max="1000000" 
                  step="10000"
                  value={roiSalesVolume}
                  onChange={(e) => setRoiSalesVolume(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span>Pérdida/Descuadre Actual de Stock Estimado:</span>
                  <span className="font-mono text-amber-400 font-bold">{roiLossRate}% mensual</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5"
                  value={roiLossRate}
                  onChange={(e) => setRoiLossRate(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated ROI Glass Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl space-y-4 text-center">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block">Ahorro Mensual Estimado</span>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                ${((roiSalesVolume * (roiLossRate / 100)) * 0.85).toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN / mes
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al recuperar el control total de entradas/salidas y prevenir faltantes de inventario con alertas en tiempo real.
              </p>
              <button
                onClick={() => {
                  setLoginTab('password');
                  setIsLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg"
              >
                Comenzar a Ahorrar Ahora
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 px-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO_URL} alt={BRAND_NAME} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
            <span className="font-bold text-slate-300">{BRAND_NAME}</span>
          </div>
          <div>© {new Date().getFullYear()} {BRAND_NAME} • Sistema de Inventario & POS</div>
        </div>
      </footer>

      {/* GLASSMORPHISM AUTHENTICATION MODAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-2xl relative"
            >
              {/* Close Modal Button */}
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo Header */}
              <div className="text-center mb-6">
                <img src={BRAND_LOGO_URL} alt={BRAND_NAME} className="h-16 w-auto mx-auto object-contain mb-2" referrerPolicy="no-referrer" />
                <h3 className="text-xl font-bold text-white">{BRAND_NAME}</h3>
                <p className="text-xs text-slate-400">Acceso seguro al Sistema de Inventario & POS</p>
              </div>

              {/* Modal Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
                <button
                  onClick={() => { setLoginTab('password'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${loginTab === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Ingresar
                </button>
                <button
                  onClick={() => { setLoginTab('demo'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${loginTab === 'demo' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Demo
                </button>
                <button
                  onClick={() => { setLoginTab('register'); setAuthError(''); }}
                  className={`py-2 rounded-lg transition ${loginTab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Registro
                </button>
              </div>

              {/* Alerts */}
              {authError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
                  {authSuccess}
                </div>
              )}

              {/* FORM: PASSWORD LOGIN */}
              {loginTab === 'password' && (
                <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Usuario o Email</label>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
                  </button>
                </form>
              )}

              {/* FORM: DEMO ACCESS */}
              {loginTab === 'demo' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center mb-2">Ingresa instantáneamente en cualquier rol para evaluar el sistema:</p>
                  
                  <button
                    onClick={() => handleQuickDemoAccess('ADMIN')}
                    className="w-full p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-900/80 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Rol Administrador</div>
                      <div className="text-[10px] text-indigo-300">Acceso total a reportes, inventario y usuarios</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoAccess('CAJERO')}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Rol Cajero</div>
                      <div className="text-[10px] text-slate-400">Terminal POS y cobro ultrarrápido</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => handleQuickDemoAccess('ALMACEN')}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-left transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Rol Personal de Almacén</div>
                      <div className="text-[10px] text-slate-400">Control de Kardex y recepciones</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}

              {/* FORM: REGISTER */}
              {loginTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de Usuario</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="ej. carlos_admin"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="carlos@ejemplo.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Rol Inicial</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ADMIN">ADMINISTRADOR</option>
                      <option value="CAJERO">CAJERO</option>
                      <option value="ALMACEN">ALMACÉN</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg"
                  >
                    {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
