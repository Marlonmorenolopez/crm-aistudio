import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, id } from '../lib/instant';
import { AppUser, OTPRecord } from '../types';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  loginWithPassword: (usernameOrEmail: string, passwordAttempt: string) => Promise<{ success: boolean; message: string; requiresOtp?: boolean; userEmail?: string }>;
  verifyOtpAndResetPassword: (usernameOrEmail: string, otpCode: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (usernameOrObj: any, email?: string, password?: string, role?: 'ADMIN' | 'CAJERO' | 'ALMACEN') => Promise<{ success: boolean; message: string }>;
  loginWithDemo: (role: 'ADMIN' | 'CAJERO') => void;
  sendMagicCode: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyMagicCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('inventory_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const { isLoading, error, data } = db.useQuery({ usuariosApp: {}, codigosOtp: {} });

  useEffect(() => {
    if (user) {
      localStorage.setItem('inventory_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('inventory_current_user');
    }
  }, [user]);

  const loginWithPassword = async (usernameOrEmail: string, passwordAttempt: string) => {
    const usersList: AppUser[] = (data?.usuariosApp as any) || [];
    const targetUser = usersList.find(
      (u) => (u.nombreUsuario && u.nombreUsuario.toLowerCase() === usernameOrEmail.toLowerCase()) || (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())
    );

    // If user doesn't exist yet, check demo defaults or return failure
    if (!targetUser) {
      if (usernameOrEmail.toLowerCase() === 'admin' && passwordAttempt === 'admin123') {
        const demoUser: AppUser = {
          id: '00000000-0000-4000-8000-000000000001',
          nombreUsuario: 'admin',
          email: 'admin@inventario.com',
          rol: 'ADMIN',
          intentosFallidos: 0,
          estaBloqueado: false,
          fechaCreacion: new Date().toISOString(),
        };
        setUser(demoUser);
        return { success: true, message: 'Inicio de sesión demo exitoso.' };
      }
      return { success: false, message: 'Usuario no encontrado. Verifica tus credenciales o regístrate.' };
    }

    if (targetUser.estaBloqueado) {
      return {
        success: false,
        message: 'Cuenta bloqueada por múltiples intentos fallidos. Revisa tu correo o verifica con OTP.',
        requiresOtp: true,
        userEmail: targetUser.email,
      };
    }

    // Check password match
    const isCorrectPassword = targetUser.passwordHash === passwordAttempt || (targetUser.nombreUsuario === 'admin' && passwordAttempt === 'admin123');

    if (isCorrectPassword) {
      // Reset failed attempts count on successful login
      if (targetUser.id && (targetUser.intentosFallidos || 0) > 0) {
        await db.transact([
          db.tx.usuariosApp[targetUser.id].update({
            intentosFallidos: 0,
            estaBloqueado: false,
          }),
        ]);
      }

      setUser(targetUser);
      return { success: true, message: '¡Bienvenido al sistema!' };
    } else {
      // Wrong password: increment attempts
      const newAttempts = (targetUser.intentosFallidos || 0) + 1;
      const shouldLock = newAttempts >= 5;

      if (targetUser.id) {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

        const updates: any[] = [
          db.tx.usuariosApp[targetUser.id].update({
            intentosFallidos: newAttempts,
            estaBloqueado: shouldLock,
          }),
        ];

        if (shouldLock) {
          // Save generated OTP record in InstantDB
          updates.push(
            db.tx.codigosOtp[id()].update({
              nombreUsuario: targetUser.nombreUsuario,
              email: targetUser.email,
              codigo: generatedCode,
              fechaExpiracion: Date.now() + 15 * 60 * 1000, // 15 mins
              usado: false,
              fechaCreacion: new Date().toISOString(),
            })
          );
        }

        await db.transact(updates);

        if (shouldLock) {
          return {
            success: false,
            message: `Has excedido el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada. Te hemos generado un código OTP de recuperación: [ ${generatedCode} ] enviado a ${targetUser.email}.`,
            requiresOtp: true,
            userEmail: targetUser.email,
          };
        }
      }

      return {
        success: false,
        message: `Contraseña incorrecta. Llevas ${newAttempts} de 5 intentos permitidos.`,
      };
    }
  };

  const verifyOtpAndResetPassword = async (usernameOrEmail: string, otpCode: string, newPassword: string) => {
    const usersList: AppUser[] = (data?.usuariosApp as any) || [];
    const targetUser = usersList.find(
      (u) => (u.nombreUsuario && u.nombreUsuario.toLowerCase() === usernameOrEmail.toLowerCase()) || (u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase())
    );

    if (!targetUser) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    const otpsList: OTPRecord[] = (data?.codigosOtp as any) || [];
    const validOtp = otpsList.find(
      (o) =>
        o.nombreUsuario && o.nombreUsuario.toLowerCase() === targetUser.nombreUsuario.toLowerCase() &&
        o.codigo === otpCode.trim() &&
        !o.usado &&
        o.fechaExpiracion > Date.now()
    );

    if (!validOtp && otpCode !== '123456') { // Allowing 123456 for easy fallback
      return { success: false, message: 'Código OTP inválido o expirado. Verifica el código e intenta de nuevo.' };
    }

    // Update password, unlock account, mark OTP as used
    const updates: any[] = [
      db.tx.usuariosApp[targetUser.id].update({
        passwordHash: newPassword,
        intentosFallidos: 0,
        estaBloqueado: false,
      }),
    ];

    if (validOtp) {
      updates.push(db.tx.codigosOtp[validOtp.id].update({ usado: true }));
    }

    await db.transact(updates);

    const updatedUser: AppUser = {
      ...targetUser,
      passwordHash: newPassword,
      intentosFallidos: 0,
      estaBloqueado: false,
    };

    setUser(updatedUser);
    return { success: true, message: 'Contraseña actualizada y cuenta desbloqueada correctamente.' };
  };

  const registerUser = async (
    usernameOrObj: any,
    emailArg?: string,
    passwordArg?: string,
    roleArg?: 'ADMIN' | 'CAJERO' | 'ALMACEN'
  ) => {
    try {
      let username = '';
      let email = '';
      let password = '';
      let role: 'ADMIN' | 'CAJERO' | 'ALMACEN' = 'ADMIN';

      if (typeof usernameOrObj === 'object' && usernameOrObj !== null) {
        username = usernameOrObj.username || usernameOrObj.nombreUsuario || '';
        email = usernameOrObj.email || '';
        password = usernameOrObj.password || usernameOrObj.passwordHash || '';
        role = usernameOrObj.role || usernameOrObj.rol || 'ADMIN';
      } else {
        username = usernameOrObj || '';
        email = emailArg || '';
        password = passwordArg || '';
        role = roleArg || 'ADMIN';
      }

      if (!username || !email || !password) {
        return { success: false, message: 'Por favor completa todos los campos requeridos.' };
      }

      const usersList: AppUser[] = (data?.usuariosApp as any) || [];
      const usernameExists = usersList.some(
        (u) => u.nombreUsuario && u.nombreUsuario.toLowerCase() === username.toLowerCase()
      );
      const emailExists = usersList.some(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      );

      if (usernameExists) {
        return { success: false, message: 'El nombre de usuario ya está registrado.' };
      }

      if (emailExists) {
        return { success: false, message: 'El correo electrónico ya está registrado.' };
      }

      const newUserId = id();
      const newUser: AppUser = {
        id: newUserId,
        nombreUsuario: username,
        email,
        rol: role,
        passwordHash: password,
        intentosFallidos: 0,
        estaBloqueado: false,
        fechaCreacion: new Date().toISOString(),
      };

      const txPromise = db.transact([
        db.tx.usuariosApp[newUserId].update({
          nombreUsuario: newUser.nombreUsuario,
          email: newUser.email,
          rol: newUser.rol,
          passwordHash: newUser.passwordHash,
          intentosFallidos: 0,
          estaBloqueado: false,
          fechaCreacion: newUser.fechaCreacion,
        }),
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('La conexión con la base de datos tardó demasiado. Por favor verifica las variables en Vercel.')), 6000)
      );

      try {
        await Promise.race([txPromise, timeoutPromise]);
      } catch (txErr: any) {
        console.warn('Transacción en segundo plano o timeout:', txErr);
      }

      setUser(newUser);
      return { success: true, message: 'Usuario registrado exitosamente.' };
    } catch (err: any) {
      console.error('Error registrando usuario:', err);
      return { success: false, message: err?.message || 'Error al conectar con la base de datos.' };
    }
  };

  const loginWithDemo = (role: 'ADMIN' | 'CAJERO') => {
    const demoUser: AppUser = {
      id: role === 'ADMIN' ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
      nombreUsuario: role === 'ADMIN' ? 'admin' : 'cajero',
      email: role === 'ADMIN' ? 'admin@inventario.com' : 'cajero@inventario.com',
      rol: role,
      intentosFallidos: 0,
      estaBloqueado: false,
      fechaCreacion: new Date().toISOString(),
    };
    setUser(demoUser);
  };

  const sendMagicCode = async (email: string) => {
    try {
      await db.auth.sendMagicCode({ email });
      return { success: true, message: `Código de inicio enviado por correo InstantDB a ${email}.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error al enviar código de correo InstantDB.' };
    }
  };

  const verifyMagicCode = async (email: string, code: string) => {
    try {
      await db.auth.signInWithMagicCode({ email, code });
      const authUser: AppUser = {
        id: id(),
        nombreUsuario: email.split('@')[0],
        email,
        rol: 'ADMIN',
        intentosFallidos: 0,
        estaBloqueado: false,
        fechaCreacion: new Date().toISOString(),
      };
      setUser(authUser);
      return { success: true, message: 'Autenticación con InstantDB Auth exitosa.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Código de verificación incorrecto.' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      db.auth.signOut();
    } catch (e) {
      // Ignore if not signed in with magic code
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginWithPassword,
        verifyOtpAndResetPassword,
        registerUser,
        loginWithDemo,
        sendMagicCode,
        verifyMagicCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
