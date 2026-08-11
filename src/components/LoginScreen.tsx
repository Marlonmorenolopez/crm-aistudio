import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BRAND_LOGO_URL, BRAND_NAME } from '../lib/constants';
import { Lock, Mail, UserCheck, ShieldAlert, KeyRound, Sparkles, CheckCircle2, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import storeBg from '../assets/images/store_background_1785981695302.jpg';

export const LoginScreen: React.FC = () => {
  const {
    loginWithPassword,
    loginWithDemo,
    registerUser,
    sendMagicCode,
    verifyMagicCode,
    verifyOtpAndResetPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'password' | 'register' | 'instant_auth'>('password');

  // Password Login State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Lockout Reset State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpUserEmail, setOtpUserEmail] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'ADMIN' | 'CAJERO' | 'ALMACEN'>('ADMIN');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // InstantDB Magic Code State
  const [magicEmail, setMagicEmail] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [magicStep, setMagicStep] = useState<'email' | 'code'>('email');
  const [magicMsg, setMagicMsg] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setPasswordError('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setIsSubmitting(true);
    setPasswordError('');

    const res = await loginWithPassword(usernameInput, passwordInput);
    setIsSubmitting(false);

    if (res.success) {
      // Logged in successfully
    } else {
      setPasswordError(res.message);
      if (res.requiresOtp) {
        setOtpUserEmail(res.userEmail || usernameInput);
        setShowOtpModal(true);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword) {
      setRegError('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    setRegError('');
    setRegSuccess('');

    try {
      const res = await registerUser(regUsername, regEmail, regPassword, regRole);

      if (res.success) {
        setRegSuccess(res.message);
        setTimeout(() => {
          setActiveTab('password');
          setUsernameInput(regUsername);
          setPasswordInput(regPassword);
        }, 1500);
      } else {
        setRegError(res.message);
      }
    } catch (err: any) {
      setRegError(err?.message || 'Error inesperado al registrar usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail) return;
    setIsSubmitting(true);
    setMagicMsg('');

    const res = await sendMagicCode(magicEmail);
    setIsSubmitting(false);

    if (res.success) {
      setMagicStep('code');
      setMagicMsg(res.message);
    } else {
      setMagicMsg(res.message);
    }
  };

  const handleVerifyMagicCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicCode) return;
    setIsSubmitting(true);
    setMagicMsg('');

    const res = await verifyMagicCode(magicEmail, magicCode);
    setIsSubmitting(false);

    if (!res.success) {
      setMagicMsg(res.message);
    }
  };

  const handleOtpResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput || !newPasswordInput) {
      setOtpMessage('Por favor completa el código OTP y la nueva contraseña.');
      return;
    }

    setIsSubmitting(true);
    setOtpMessage('');

    const res = await verifyOtpAndResetPassword(otpUserEmail || usernameInput, otpCodeInput, newPasswordInput);
    setIsSubmitting(false);

    if (res.success) {
      setShowOtpModal(false);
      setPasswordError('Contraseña restablecida. Puedes iniciar sesión ahora.');
    } else {
      setOtpMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src={storeBg} 
          alt="Store background" 
          className="w-full h-full object-cover opacity-20 filter blur-[2px] scale-105" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" />
      </div>

      {/* Background Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Main Branding Card */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-1">
            <img 
              src={BRAND_LOGO_URL} 
              alt={BRAND_NAME} 
              className="h-28 sm:h-36 w-auto max-w-[320px] object-contain drop-shadow-2xl filter brightness-110 transition hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{BRAND_NAME}</h1>
          <p className="text-slate-300 text-xs">Sistema de Control de Inventarios & Punto de Venta</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contraseña
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registrarse
          </button>
          <button
            onClick={() => setActiveTab('instant_auth')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              activeTab === 'instant_auth'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Magic Code Auth
          </button>
        </div>

        {/* TAB 1: USERNAME & PASSWORD LOGIN */}
        {activeTab === 'password' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Inicio de Sesión Directo</h2>
              <p className="text-slate-400 text-xs">Introduce tu usuario o correo y contraseña a simple vista</p>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{passwordError}</span>
                  {showOtpModal && (
                    <button
                      onClick={() => setShowOtpModal(true)}
                      className="block underline font-bold text-rose-200 hover:text-white"
                    >
                      Verificar Código OTP / Restablecer Contraseña
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase">Nombre de Usuario o Correo</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="admin o tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Verificando...' : 'Ingresar al Sistema'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* MOCK DEMO LOGIN FAST ACCESS */}
            <div className="pt-4 border-t border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Acceso Demostrativo Inicial:</span>
                <span className="text-indigo-400 font-mono">1-Clic Mock Login</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loginWithDemo('ADMIN')}
                  className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-600/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Admin Demo
                </button>
                <button
                  type="button"
                  onClick={() => loginWithDemo('CAJERO')}
                  className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-600/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Cajero Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER NEW USER */}
        {activeTab === 'register' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Crear Usuario en InstantDB</h2>
              <p className="text-slate-400 text-xs">Crea tu propia cuenta con usuario y contraseña personalizados</p>
            </div>

            {regError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="ej. marlon_admin"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="marlon@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rol de Usuario</label>
                <select
                  value={regRole}
                  onChange={(e: any) => setRegRole(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="ADMIN">Administrador (Acceso Total)</option>
                  <option value="CAJERO">Cajero (Punto de Venta)</option>
                  <option value="ALMACEN">Almacén (Movimientos & Stock)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Registrar Usuario
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: INSTANTDB MAGIC CODE AUTH */}
        {activeTab === 'instant_auth' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">InstantDB Auth (Magic Code)</h2>
              <p className="text-slate-400 text-xs">Autenticación por correo electrónico sin contraseña utilizando InstantDB</p>
            </div>

            {magicMsg && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs rounded-xl">
                {magicMsg}
              </div>
            )}

            {magicStep === 'email' ? (
              <form onSubmit={handleSendMagicCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tu Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Enviar Código Magic por Correo
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyMagicCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Código de Verificación Recibido</label>
                  <input
                    type="text"
                    required
                    value={magicCode}
                    onChange={(e) => setMagicCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm tracking-widest text-center font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="123456"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Verificar e Iniciar Sesión
                </button>
              </form>
            )}
          </div>
        )}

      </div>

      {/* OTP LOCKOUT & PASSWORD RESET MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-white">Verificación OTP por Bloqueo</h3>
                <p className="text-slate-400 text-xs">Excediste 5 intentos fallidos de contraseña</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Se ha enviado un código de seguridad OTP a tu correo registrado ({otpUserEmail || usernameInput}). Introduce el código de 6 dígitos y tu nueva contraseña.
            </p>

            {otpMessage && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl">
                {otpMessage}
              </div>
            )}

            <form onSubmit={handleOtpResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Código OTP (6 dígitos)</label>
                <input
                  type="text"
                  required
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-center font-mono tracking-widest text-base focus:border-indigo-500 focus:outline-none"
                  placeholder="Ej. 123456"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Verificando...' : 'Restablecer y Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
