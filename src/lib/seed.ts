import { db, id } from './instant';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_USERS } from '../data/initialData';

export async function seedInitialDataIfNeeded(
  existingProductsCount: number,
  existingCustomersCount: number,
  existingUsersCount: number
) {
  const transactions: any[] = [];

  if (existingProductsCount === 0) {
    INITIAL_PRODUCTS.forEach((p) => {
      transactions.push(
        db.tx.productos[id()].update({
          ...p,
        })
      );
    });
  }

  if (existingCustomersCount === 0) {
    INITIAL_CUSTOMERS.forEach((c) => {
      transactions.push(
        db.tx.clientes[id()].update({
          ...c,
        })
      );
    });
  }

  if (existingUsersCount === 0) {
    INITIAL_USERS.forEach((u) => {
      const userId = u.id && u.id.includes('-') && u.id.length >= 32 ? u.id : id();
      transactions.push(
        db.tx.usuariosApp[userId].update({
          nombreUsuario: u.nombreUsuario,
          email: u.email,
          rol: u.rol,
          passwordHash: u.passwordHash,
          intentosFallidos: 0,
          estaBloqueado: false,
          fechaCreacion: u.fechaCreacion,
        })
      );
    });
  }

  if (transactions.length > 0) {
    try {
      await db.transact(transactions);
      console.log('InstantDB sembrado con datos iniciales en español exitosamente.');
    } catch (error) {
      console.error('Error sembrando datos en InstantDB:', error);
    }
  }
}
