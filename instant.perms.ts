// InstantDB Permissions configuration (instant.perms.ts)
// Defines security and access control rules for InstantDB entities in Spanish.

export default {
  $files: {
    allow: {
      view: true,
      create: true,
      delete: true,
    },
  },
  attrs: {
    allow: {
      create: true,
    },
  },
  productos: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  clientes: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  movimientosInventario: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  ventas: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  usuariosApp: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  codigosOtp: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
  ordenesCompra: {
    allow: {
      view: true,
      create: true,
      update: true,
      delete: true,
    },
  },
};
