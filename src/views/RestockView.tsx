import React, { useState } from 'react';
import { Product, PurchaseOrder, PurchaseOrderItem, Sale } from '../types';
import { db, id } from '../lib/instant';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  AlertTriangle,
  Plus,
  CheckCircle2,
  PackageCheck,
  FileText,
  Building,
  Sparkles,
  Brain,
  Loader2,
} from 'lucide-react';

interface RestockViewProps {
  products: Product[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
}

export const RestockView: React.FC<RestockViewProps> = ({ products, sales, purchaseOrders }) => {
  const { user } = useAuth();

  const [supplierName, setSupplierName] = useState('Proveedor Principal / Distribuidor');
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PurchaseOrder | null>(null);
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gemini AI Restock Predictor State
  const [aiResult, setAiResult] = useState<{
    summary: string;
    predictions: Array<{
      productId: string;
      sku: string;
      productName: string;
      suggestedQuantity: number;
      urgency: 'ALTA' | 'MEDIA' | 'BAJA' | string;
      reasoning: string;
    }>;
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleFetchAiRestock = async () => {
    setIsLoadingAi(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/predict-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products, sales }),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || 'No se pudo conectar con la IA de Gemini.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const applyAiSuggestionsToPO = () => {
    if (!aiResult || !aiResult.predictions) return;

    const itemsToOrder: PurchaseOrderItem[] = [];
    aiResult.predictions.forEach((pred) => {
      if (pred.suggestedQuantity > 0) {
        const prod = products.find((p) => p.id === pred.productId || p.sku === pred.sku);
        if (prod) {
          const name = prod.nombre || (prod as any).name || '';
          const cost = prod.costo ?? (prod as any).cost ?? 0;
          itemsToOrder.push({
            productoId: prod.id,
            sku: prod.sku,
            nombreProducto: name,
            cantidadAOrdenar: pred.suggestedQuantity,
            costoUnitario: cost,
            subtotal: pred.suggestedQuantity * cost,
          });
        }
      }
    });

    if (itemsToOrder.length === 0) {
      alert('La IA indica que ningún producto requiere pedido inmediato.');
      return;
    }

    setPoItems(itemsToOrder);
    setIsCreatingPO(true);
  };

  // Filter low stock products needing restock
  const lowStockProducts = products.filter((p) => {
    const minStk = p.stockMinimo ?? (p as any).minStock ?? 0;
    return p.stock <= minStk;
  });

  // Calculate default order items for low stock products
  const defaultPOItems: PurchaseOrderItem[] = lowStockProducts.map((p) => {
    const minStk = p.stockMinimo ?? (p as any).minStock ?? 0;
    const cost = p.costo ?? (p as any).cost ?? 0;
    const name = p.nombre || (p as any).name || '';
    const qtyNeeded = Math.max(1, minStk * 2 - p.stock);

    return {
      productoId: p.id,
      sku: p.sku,
      nombreProducto: name,
      cantidadAComprar: qtyNeeded,
      costoUnitario: cost,
      subtotal: qtyNeeded * cost,
    };
  });

  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>(defaultPOItems);

  // Update item quantity in PO draft
  const handleUpdateItemQty = (productId: string, newQty: number) => {
    const qty = Math.max(1, newQty);
    setPoItems((prev) =>
      prev.map((item) =>
        (item.productoId || (item as any).productId) === productId
          ? {
              ...item,
              cantidadAComprar: qty,
              subtotal: qty * (item.costoUnitario ?? (item as any).unitCost ?? 0),
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPoItems((prev) => prev.filter((i) => (i.productoId || (i as any).productId) !== productId));
  };

  const totalPOCost = poItems.reduce((acc, i) => acc + i.subtotal, 0);

  // Create Purchase Order in InstantDB
  const handleCreatePO = async () => {
    if (poItems.length === 0) {
      alert('La orden de compra no tiene productos.');
      return;
    }

    setIsProcessing(true);

    const poNum = `PO-${Date.now().toString().slice(-6)}`;
    const poId = id();

    const newPO: PurchaseOrder = {
      id: poId,
      numeroOrden: poNum,
      proveedor: supplierName,
      itemsJson: JSON.stringify(poItems),
      costoTotal: totalPOCost,
      estado: 'PENDIENTE',
      creadoPor: user?.nombreUsuario || 'Encargado Almacén',
      fechaCreacion: new Date().toISOString(),
    };

    try {
      await db.transact([
        db.tx.ordenesCompra[poId].update({
          ...newPO,
        }),
      ]);
      setIsCreatingPO(false);
      setSelectedPOForPrint(newPO);
    } catch (err: any) {
      alert(`Error al generar Orden de Compra: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Receive Purchase Order -> Adds stock to InstantDB and generates ENTRADA inventory movements
  const handleReceivePO = async (po: PurchaseOrder) => {
    const poNum = po.numeroOrden || (po as any).numeroOrdenCompra || (po as any).poNumber;
    if (!confirm(`¿Confirmas la recepción de la Orden de Compra ${poNum}? El stock se actualizará automáticamente.`)) {
      return;
    }

    try {
      let items: PurchaseOrderItem[] = [];
      try {
        items = JSON.parse(po.itemsJson || '[]');
      } catch (e) {
        console.error(e);
      }

      const transactions: any[] = [];

      // Update PO status
      transactions.push(
        db.tx.ordenesCompra[po.id].update({
          estado: 'RECIBIDO',
          fechaRecepcion: new Date().toISOString(),
        })
      );

      // Increase stock & record ENTRADA movement for each item
      items.forEach((item) => {
        const itemAny = item as any;
        const prodId = item.productoId || itemAny.productId;
        const qtyToOrder = item.cantidadAOrdenar ?? itemAny.cantidadAComprar ?? itemAny.quantityToOrder ?? 0;

        const prod = products.find((p) => p.id === prodId);
        if (prod) {
          const newStock = prod.stock + qtyToOrder;
          const prodName = prod.nombre || (prod as any).name || '';

          transactions.push(
            db.tx.productos[prod.id].update({
              stock: newStock,
            })
          );

          const mId = id();
          transactions.push(
            db.tx.movimientosInventario[mId].update({
              tipo: 'ENTRADA',
              productoId: prod.id,
              nombreProducto: prodName,
              cantidad: qtyToOrder,
              stockAnterior: prod.stock,
              nuevoStock: newStock,
              motivo: `Recepción Orden de Compra #${poNum}`,
              referencia: poNum,
              creadoPor: user?.nombreUsuario || 'Almacenista',
              fechaCreacion: new Date().toISOString(),
            })
          );
        }
      });

      await db.transact(transactions);
    } catch (err: any) {
      alert(`Error al recepcionar la Orden de Compra: ${err?.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-400" />
            Reabastecimiento y Órdenes de Compra ({lowStockProducts.length} bajo stock)
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Genera órdenes de compra automáticas para productos bajo stock mínimo y recepciona mercadería en 1 clic
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFetchAiRestock}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isLoadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            {isLoadingAi ? 'Analizando con Gemini...' : '🤖 Asistente Reabastecimiento IA'}
          </button>

          {lowStockProducts.length > 0 && !isCreatingPO && (
            <button
              onClick={() => {
                setPoItems(defaultPOItems);
                setIsCreatingPO(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Generar Orden Sugerida
            </button>
          )}
        </div>
      </div>

      {/* GEMINI AI PREDICTION CARD */}
      {aiResult && (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-700/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-700/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-500/30">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  Predicción Inteligente de Reabastecimiento (Gemini 3.6 Flash)
                </h3>
                <p className="text-purple-200 text-xs">Basado en velocidad de venta real y rotación de inventario</p>
              </div>
            </div>
            <button
              onClick={applyAiSuggestionsToPO}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition"
            >
              <Sparkles className="w-4 h-4" /> Cargar Sugerencias IA a la Orden
            </button>
          </div>

          <p className="text-xs text-indigo-100 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-700/40 leading-relaxed">
            {aiResult.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiResult.predictions.map((pred) => (
              <div
                key={pred.productId || pred.sku}
                className="p-3.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-purple-300 font-bold">{pred.sku}</span>
                    <h4 className="font-bold text-white text-sm">{pred.productName}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      pred.urgency === 'ALTA'
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                        : pred.urgency === 'MEDIA'
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                        : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    }`}
                  >
                    Prioridad: {pred.urgency}
                  </span>
                </div>

                <div className="text-purple-100 pt-1 flex justify-between">
                  <span>Sugerencia IA a Comprar:</span>
                  <span className="font-bold text-emerald-400 text-sm">+{pred.suggestedQuantity} unidades</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight italic bg-black/20 p-2 rounded">
                  "{pred.reasoning}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl">
          ⚠️ {aiError}
        </div>
      )}

      {/* DRAFT PO CREATOR SECTION */}
      {isCreatingPO && (
        <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-2xl border-2 border-indigo-500/50 shadow-xl space-y-4 text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Nueva Orden de Compra (Borrador)
            </h3>
            <button
              onClick={() => setIsCreatingPO(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Proveedor</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                placeholder="Ej. Distribuidora Mayorista S.A."
              />
            </div>
            <div className="flex items-center justify-end font-bold text-white text-lg">
              Total Inversión Estimada: <span className="text-emerald-400 ml-2">${totalPOCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Table of items to order */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-center">Cant. Pedir</th>
                  <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {poItems.map((item) => {
                  const prodId = item.productoId || (item as any).productId;
                  const name = item.nombreProducto || (item as any).productName;
                  const qty = item.cantidadAComprar ?? (item as any).quantityToOrder ?? 0;
                  const cost = item.costoUnitario ?? (item as any).unitCost ?? 0;

                  return (
                    <tr key={prodId} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => handleUpdateItemQty(prodId, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center font-bold text-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">${cost.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">${item.subtotal.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(prodId)}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreatingPO(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Descartar
            </button>
            <button
              onClick={handleCreatePO}
              disabled={isProcessing || poItems.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Emitir Orden de Compra
            </button>
          </div>
        </div>
      )}

      {/* LOW STOCK ALERT GRID */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-md space-y-4 text-white">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Productos con Alerta de Reabastecimiento ({lowStockProducts.length})
        </h3>

        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="text-sm font-semibold text-slate-200">¡Inventario en Niveles Óptimos!</p>
            <p className="text-xs text-slate-400">Todos los productos cuentan con stock superior al nivel mínimo configurable.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => {
              const name = p.nombre || (p as any).name;
              const minStk = p.stockMinimo ?? (p as any).minStock ?? 0;
              const cost = p.costo ?? (p as any).cost ?? 0;
              const unit = p.unidad || (p as any).unit || '';

              const suggestedOrder = Math.max(1, minStk * 2 - p.stock);

              return (
                <div key={p.id} className="p-4 bg-slate-950/60 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-amber-300 font-bold">{p.sku}</span>
                      <h4 className="font-bold text-white text-sm">{name}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                      Stock: {p.stock} / Min: {minStk}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 pt-1 flex justify-between">
                    <span>Sugerencia de Pedido:</span>
                    <span className="font-bold text-indigo-400">+{suggestedOrder} {unit}s</span>
                  </div>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Inversión Requerida:</span>
                    <span className="font-bold text-emerald-400">${(suggestedOrder * cost).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PURCHASE ORDERS HISTORY TABLE */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-md overflow-hidden space-y-4 p-6 text-white">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-400" />
          Historial de Órdenes de Compra ({purchaseOrders.length})
        </h3>

        {purchaseOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No hay órdenes de compra registradas aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Folio Orden</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4 text-right">Inversión</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {purchaseOrders.map((po) => {
                  const poNum = po.numeroOrdenCompra || (po as any).poNumber;
                  const supplier = po.proveedor || (po as any).supplier;
                  const cost = po.costoTotal ?? (po as any).totalCost ?? 0;
                  const status = po.estado || (po as any).status;
                  const date = po.fechaCreacion || (po as any).createdAt;

                  const isReceived = status === 'RECIBIDO';
                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{poNum}</td>
                      <td className="py-3 px-4 text-slate-300">{date ? new Date(date).toLocaleString('es-MX') : ''}</td>
                      <td className="py-3 px-4 font-medium text-white">{supplier}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">${cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        {isReceived ? (
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-full text-[10px]">
                            RECIBIDO EN STOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-full text-[10px]">
                            PENDIENTE RECEPCIÓN
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isReceived && (
                          <button
                            onClick={() => handleReceivePO(po)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer inline-flex items-center gap-1 transition"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Recepcionar Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
