import React, { useState } from 'react';
import { Product, Sale, InventoryMovement } from '../types';
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Package,
  ArrowUpDown,
  CreditCard,
  Building2,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Sparkles,
  Brain,
  MessageSquare,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Send,
} from 'lucide-react';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  movements: InventoryMovement[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sales, products, movements }) => {
  // Gemini AI Executive Analytics State
  const [aiQuestion, setAiQuestion] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiInsights, setAiInsights] = useState<{
    summary: string;
    highlights: string[];
    answersToQuestion?: string;
    recommendations: string[];
  } | null>(null);

  const sampleQuestions = [
    '¿Cuál fue mi producto más rentable este mes?',
    '¿Qué días de la semana hay mayor volumen de ventas?',
    '¿Qué categorías generan el mejor margen bruto?',
  ];

  const handleRunAiAnalysis = async (queryOverride?: string) => {
    const questionToAsk = queryOverride !== undefined ? queryOverride : aiQuestion;
    setIsLoadingAi(true);
    setAiError('');

    try {
      const res = await fetch('/api/ai/business-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales, products, question: questionToAsk }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setAiInsights(data);
    } catch (err: any) {
      setAiError(err.message || 'Error al conectar con Gemini AI.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Filter completed sales
  const completedSales = sales.filter((s) => {
    const status = s.estado || (s as any).status;
    return status === 'COMPLETADA';
  });

  // Calculate COGS (Cost of Goods Sold) and Gross Profit
  let totalGrossRevenue = 0;
  let totalTaxCollected = 0;
  let estimatedCOGS = 0;

  completedSales.forEach((sale) => {
    const total = sale.total ?? 0;
    const tax = sale.impuesto ?? (sale as any).tax ?? 0;
    const subtotal = sale.subtotal ?? 0;

    totalGrossRevenue += total;
    totalTaxCollected += tax;

    try {
      const items = JSON.parse(sale.itemsJson || '[]');
      items.forEach((item: any) => {
        const prodObj = item.producto || item.product;
        const prod = products.find((p) => p.id === prodObj?.id || p.sku === prodObj?.sku);
        const cost = prod ? (prod.costo ?? (prod as any).cost ?? 0) : ((prodObj?.costo ?? prodObj?.cost) || (item.precioUnitario || item.unitPrice || 0) * 0.6);
        const qty = item.cantidad ?? item.quantity ?? 1;
        estimatedCOGS += cost * qty;
      });
    } catch (e) {
      estimatedCOGS += subtotal * 0.6; // Fallback 60% cost estimate if json parse fails
    }
  });

  const netProfit = totalGrossRevenue - totalTaxCollected - estimatedCOGS;
  const profitMarginPercent = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;

  // Breakdown by payment method
  const cashTotal = completedSales
    .filter((s) => (s.metodoPago || (s as any).paymentMethod) === 'EFECTIVO')
    .reduce((acc, s) => acc + s.total, 0);
  const cardTotal = completedSales
    .filter((s) => (s.metodoPago || (s as any).paymentMethod) === 'TARJETA')
    .reduce((acc, s) => acc + s.total, 0);
  const transferTotal = completedSales
    .filter((s) => (s.metodoPago || (s as any).paymentMethod) === 'TRANSFERENCIA')
    .reduce((acc, s) => acc + s.total, 0);

  // Total Inventory Value
  const totalInventoryCost = products.reduce((acc, p) => {
    const cost = p.costo ?? (p as any).cost ?? 0;
    return acc + cost * p.stock;
  }, 0);

  const totalInventoryRetailValue = products.reduce((acc, p) => {
    const price = p.precio ?? (p as any).price ?? 0;
    return acc + price * p.stock;
  }, 0);

  // CSV EXPORTERS
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesCSV = () => {
    const headers = ['Folio Ticket', 'Fecha', 'Cliente', 'RFC/TaxID', 'Subtotal', 'IVA', 'Total', 'Metodo Pago', 'Estado', 'Vendedor'];
    const rows = sales.map((s) => {
      const invoice = s.numeroFactura || (s as any).invoiceNumber || '';
      const date = s.fechaCreacion || (s as any).createdAt;
      const client = s.nombreCliente || (s as any).customerName || '';
      const taxId = s.identificacionCliente || (s as any).customerTaxId || 'N/A';
      const sub = s.subtotal ?? 0;
      const tax = s.impuesto ?? (s as any).tax ?? 0;
      const tot = s.total ?? 0;
      const pay = s.metodoPago || (s as any).paymentMethod || '';
      const status = s.estado || (s as any).status || '';
      const seller = s.vendedor || (s as any).seller || '';

      return [
        invoice,
        date ? new Date(date).toLocaleString('es-MX') : '',
        client,
        taxId,
        sub.toFixed(2),
        tax.toFixed(2),
        tot.toFixed(2),
        pay,
        status,
        seller,
      ];
    });
    downloadCSV(`Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const exportInventoryCSV = () => {
    const headers = ['SKU', 'Producto', 'Categoria', 'Costo Unit.', 'Precio Venta', 'Stock Actual', 'Stock Minimo', 'Unidad', 'Valor Total Costo', 'Valor Total Venta'];
    const rows = products.map((p) => {
      const name = p.nombre || (p as any).name || '';
      const cat = p.categoria || (p as any).category || '';
      const cost = p.costo ?? (p as any).cost ?? 0;
      const price = p.precio ?? (p as any).price ?? 0;
      const minStock = p.stockMinimo ?? (p as any).minStock ?? 0;
      const unit = p.unidad || (p as any).unit || '';

      return [
        p.sku,
        name,
        cat,
        cost.toFixed(2),
        price.toFixed(2),
        p.stock,
        minStock,
        unit,
        (cost * p.stock).toFixed(2),
        (price * p.stock).toFixed(2),
      ];
    });
    downloadCSV(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const exportMovementsCSV = () => {
    const headers = ['Fecha Hora', 'Tipo', 'Producto', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Motivo', 'Referencia', 'Usuario'];
    const rows = movements.map((m) => {
      const date = m.fechaCreacion || (m as any).createdAt;
      const type = m.tipo || (m as any).type || '';
      const prodName = m.nombreProducto || (m as any).productName || '';
      const qty = m.cantidad ?? (m as any).quantity ?? 0;
      const prevStk = m.stockAnterior ?? (m as any).previousStock ?? 0;
      const newStk = m.nuevoStock ?? (m as any).newStock ?? 0;
      const reason = m.motivo || (m as any).reason || '';
      const ref = m.referencia || (m as any).reference || '';
      const user = m.creadoPor || (m as any).createdBy || '';

      return [
        date ? new Date(date).toLocaleString('es-MX') : '',
        type,
        prodName,
        qty,
        prevStk,
        newStk,
        reason,
        ref,
        user,
      ];
    });
    downloadCSV(`Reporte_Kardex_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 text-white">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Análisis Financiero y Reportes Ejecutivos
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Cálculo de utilidad neta, costos COGS, desglose por métodos de pago y exportación a Excel/CSV
          </p>
        </div>

        {/* Export Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Ventas
          </button>
          <button
            onClick={exportInventoryCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar Stock
          </button>
          <button
            onClick={exportMovementsCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" /> Exportar Kardex
          </button>
        </div>
      </div>

      {/* FINANCIAL CARDS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-2 text-white">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Totales</span>
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">${totalGrossRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">
            {completedSales.length} comprobantes emitidos
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-2 text-white">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Costo Mercadería (COGS)</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">${estimatedCOGS.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">Inversión directa en productos vendidos</div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-2 text-white">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Neta (Ganancia)</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">${netProfit.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> {profitMarginPercent.toFixed(1)}% Margen Promedio
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-2 text-white">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Valor Inventario (Costo)</span>
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">${totalInventoryCost.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400">
            Valor Venta Estimado: <span className="font-bold text-slate-200">${totalInventoryRetailValue.toFixed(2)}</span>
          </div>
        </div>

      </div>

      {/* PAYMENT METHOD BREAKDOWN & TAX SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Payment Methods Breakdown */}
        <div className="md:col-span-2 bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-4 text-white">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
            Distribución por Método de Pago
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
                <span>Efectivo</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-emerald-300">${cashTotal.toFixed(2)}</div>
              <div className="text-[10px] text-emerald-400/80 font-medium">
                {totalGrossRevenue > 0 ? ((cashTotal / totalGrossRevenue) * 100).toFixed(1) : 0}% del total
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-indigo-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase">
                <span>Tarjeta</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-indigo-300">${cardTotal.toFixed(2)}</div>
              <div className="text-[10px] text-indigo-400/80 font-medium">
                {totalGrossRevenue > 0 ? ((cardTotal / totalGrossRevenue) * 100).toFixed(1) : 0}% del total
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-sky-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400 uppercase">
                <span>Transferencia</span>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-sky-300">${transferTotal.toFixed(2)}</div>
              <div className="text-[10px] text-sky-400/80 font-medium">
                {totalGrossRevenue > 0 ? ((transferTotal / totalGrossRevenue) * 100).toFixed(1) : 0}% del total
              </div>
            </div>
          </div>
        </div>

        {/* Taxes and Audit summary */}
        <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/40 shadow-xl shadow-slate-950/30 space-y-4 text-white">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            Impuestos y Fiscal
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">IVA 16% Recaudado:</span>
              <span className="font-bold text-white">${totalTaxCollected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Subtotal Ventas (Sin IVA):</span>
              <span className="font-bold text-white">${(totalGrossRevenue - totalTaxCollected).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Ticket Promedio Venta:</span>
              <span className="font-bold text-emerald-400">
                ${completedSales.length > 0 ? (totalGrossRevenue / completedSales.length).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* GEMINI AI EXECUTIVE BUSINESS ANALYSIS SECTION */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-6 sm:p-8 rounded-3xl border border-indigo-700/50 shadow-2xl space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-700/50 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-400 to-purple-600 rounded-2xl shadow-lg text-slate-950 font-black">
              <Brain className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🤖 Análisis Ejecutivo de Negocio (Gemini 3.6 AI)
              </h2>
              <p className="text-xs text-indigo-200">
                Consulta inteligencia artificial sobre tu rentabilidad, productos estrella y tendencias de venta
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRunAiAnalysis()}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            {isLoadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoadingAi ? 'Generando Informe...' : 'Generar Informe Ejecutivo IA'}
          </button>
        </div>

        {/* CUSTOM QUESTION QUERY BOX */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-amber-300" /> Hazle una pregunta a la IA sobre tu negocio:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunAiAnalysis();
              }}
              placeholder="Ej: ¿Cuál fue mi producto más rentable este mes? o ¿Qué días vendemos más?"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => handleRunAiAnalysis()}
              disabled={isLoadingAi}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Consultar
            </button>
          </div>

          {/* Quick sample question chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-indigo-300 font-medium">Sugerencias rápidas:</span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiQuestion(q);
                  handleRunAiAnalysis(q);
                }}
                className="text-[11px] px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-indigo-100 transition cursor-pointer"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {aiError && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-xl">
            ⚠️ {aiError}
          </div>
        )}

        {/* AI INSIGHTS RESULT DISPLAY */}
        {aiInsights && (
          <div className="space-y-6 pt-2">
            
            {/* Direct Answer to Question (if asked) */}
            {aiInsights.answersToQuestion && (
              <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4" /> Respuesta al Enfoque Seleccionado:
                </div>
                <p className="text-xs text-amber-100 leading-relaxed font-medium">
                  {aiInsights.answersToQuestion}
                </p>
              </div>
            )}

            {/* Executive Summary */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-indigo-300">
                <Brain className="w-4 h-4 text-purple-400" /> Resumen Ejecutivo Financiero y Operativo
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {aiInsights.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Highlights */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Datos Clave Destacados
                </h4>
                <ul className="space-y-2">
                  {aiInsights.highlights?.map((h, i) => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strategic Recommendations */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <h4 className="font-bold text-purple-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Recomendaciones Estratégicas
                </h4>
                <ul className="space-y-2">
                  {aiInsights.recommendations?.map((r, i) => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <span className="text-purple-400 font-bold">💡</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
