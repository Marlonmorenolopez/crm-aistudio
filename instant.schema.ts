import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    productos: i.entity({
      sku: i.string(),
      nombre: i.string(),
      categoria: i.string(),
      precio: i.number(),
      costo: i.number(),
      stock: i.number(),
      stockMinimo: i.number(),
      unidad: i.string(),
      descripcion: i.string(),
      fechaCreacion: i.string(),
    }),
    clientes: i.entity({
      nombre: i.string(),
      email: i.string(),
      telefono: i.string(),
      direccion: i.string(),
      identificacionFiscal: i.string(),
      fechaCreacion: i.string(),
    }),
    movimientosInventario: i.entity({
      tipo: i.string(), // "ENTRADA" | "SALIDA"
      productoId: i.string(),
      nombreProducto: i.string(),
      cantidad: i.number(),
      stockAnterior: i.number(),
      nuevoStock: i.number(),
      motivo: i.string(),
      referencia: i.string(),
      creadoPor: i.string(),
      fechaCreacion: i.string(),
    }),
    ventas: i.entity({
      numeroFactura: i.string(),
      clienteId: i.string(),
      nombreCliente: i.string(),
      identificacionCliente: i.string(),
      itemsJson: i.string(),
      subtotal: i.number(),
      impuesto: i.number(),
      total: i.number(),
      metodoPago: i.string(), // "EFECTIVO" | "TARJETA" | "TRANSFERENCIA"
      estado: i.string(),
      vendedor: i.string(),
      fechaCreacion: i.string(),
    }),
    usuariosApp: i.entity({
      nombreUsuario: i.string(),
      email: i.string(),
      rol: i.string(),
      passwordHash: i.string(),
      intentosFallidos: i.number(),
      estaBloqueado: i.boolean(),
      fechaCreacion: i.string(),
    }),
    codigosOtp: i.entity({
      nombreUsuario: i.string(),
      email: i.string(),
      codigo: i.string(),
      fechaExpiracion: i.number(),
      usado: i.boolean(),
      fechaCreacion: i.string(),
    }),
    ordenesCompra: i.entity({
      numeroOrden: i.string(),
      proveedor: i.string(),
      itemsJson: i.string(),
      costoTotal: i.number(),
      estado: i.string(), // "PENDIENTE" | "RECIBIDO" | "CANCELADO"
      creadoPor: i.string(),
      fechaCreacion: i.string(),
      fechaRecepcion: i.string(),
    }),
  },
});

export type AppSchema = typeof _schema;
export default _schema;
