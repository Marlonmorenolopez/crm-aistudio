import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper to initialize Gemini client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Routes FIRST

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// AI Restock Predictor Endpoint
app.post("/api/ai/predict-restock", async (req, res) => {
  try {
    const { products, sales } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Rule-based fallback if GEMINI_API_KEY is not configured
      const predictions = (products || []).map((p: any) => {
        const stock = p.stock ?? 0;
        const minStock = p.stockMinimo ?? p.minStock ?? 0;
        const name = p.nombre || p.name || 'Producto';

        const isLow = stock <= minStock;
        const suggested = isLow ? Math.max(5, minStock * 2 - stock) : 0;
        return {
          productId: p.id,
          sku: p.sku,
          productName: name,
          currentStock: stock,
          minStock: minStock,
          suggestedQuantity: suggested,
          urgency: isLow ? (stock === 0 ? "ALTA" : "MEDIA") : "BAJA",
          reasoning: isLow
            ? `El stock actual (${stock}) está por debajo del mínimo de seguridad (${minStock}).`
            : "Nivel de stock adecuado para la demanda actual.",
        };
      });

      return res.json({
        summary: "Análisis por reglas del sistema (sin API key de Gemini configurada).",
        predictions,
      });
    }

    const prompt = `
Eres un experto consultor de inteligencia en inventarios y cadena de suministro para negocios POS/Retail.
Analiza la siguiente lista de productos y ventas del negocio y predice las necesidades de reabastecimiento para las próximas 2 a 4 semanas.

Productos actuales:
${JSON.stringify((products || []).map((p: any) => ({
  id: p.id,
  sku: p.sku,
  name: p.nombre || p.name,
  category: p.categoria || p.category,
  stock: p.stock,
  minStock: p.stockMinimo ?? p.minStock,
  cost: p.costo ?? p.cost,
  price: p.precio ?? p.price,
})), null, 2)}

Historial de Ventas Recientes (${(sales || []).length} ventas):
${JSON.stringify((sales || []).slice(-30).map((s: any) => ({
  createdAt: s.fechaCreacion || s.createdAt,
  total: s.total,
  items: s.itemsJson ? JSON.parse(s.itemsJson) : [],
})), null, 2)}

Instrucciones:
Proporciona una respuesta strictly estructurada en JSON con:
1. 'summary': Un párrafo ejecutivo breve explicando las tendencias de rotación e inventario en ESPAÑOL.
2. 'predictions': Lista de objetos para cada producto analizado con:
   - 'productId': string (mismo ID del producto)
   - 'sku': string
   - 'productName': string
   - 'suggestedQuantity': number (cantidad exacta recomendada a comprar)
   - 'urgency': string ('ALTA' | 'MEDIA' | 'BAJA')
   - 'reasoning': string (explicación concisa basada en velocidad de venta y stock actual en ESPAÑOL)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  sku: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  suggestedQuantity: { type: Type.NUMBER },
                  urgency: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                },
                required: ["productId", "sku", "productName", "suggestedQuantity", "urgency", "reasoning"],
              },
            },
          },
          required: ["summary", "predictions"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (err: any) {
    console.error("Error in predict-restock:", err);
    return res.status(500).json({ error: err.message || "Error al generar predicción de inventario." });
  }
});

// AI Executive Business Analytics Endpoint
app.post("/api/ai/business-insights", async (req, res) => {
  try {
    const { sales, products, question } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        summary: "Análisis resumido estándar de negocio.",
        highlights: [
          "Producto con mayor rotación detectado en historial.",
          "Monitorear días de mayor flujo en caja.",
        ],
        answersToQuestion: question ? `Respuesta a "${question}": Para consultas en profundidad mediante IA activa el API key en configuración.` : undefined,
        recommendations: [
          "Mantén actualizado el costo unitario de los productos para reportes de margen exactos.",
          "Realiza conteos físicos periódicos en almacén.",
        ],
      });
    }

    const salesSummary = (sales || []).map((s: any) => ({
      date: s.fechaCreacion || s.createdAt,
      total: s.total,
      subtotal: s.subtotal,
      tax: s.impuesto ?? s.tax ?? 0,
      paymentMethod: s.metodoPago || s.paymentMethod,
      customer: s.nombreCliente || s.customerName,
      items: (s.itemsJson ? JSON.parse(s.itemsJson) : []).map((i: any) => {
        const prod = i.producto || i.product;
        return {
          sku: prod?.sku,
          name: prod?.nombre || prod?.name,
          qty: i.cantidad ?? i.quantity,
          price: i.precioUnitario ?? i.unitPrice,
          cost: prod?.costo ?? prod?.cost,
        };
      }),
    }));

    const prompt = `
Eres un Director Financiero (CFO) y Analista de Inteligencia de Negocios para tiendas y puntos de venta.
Analiza los siguientes datos de rendimiento comercial y responde detalladamente en ESPAÑOL:

Productos en Catálogo (${(products || []).length}):
${JSON.stringify((products || []).map((p: any) => ({
  sku: p.sku,
  name: p.nombre || p.name,
  category: p.categoria || p.category,
  stock: p.stock,
  cost: p.costo ?? p.cost,
  price: p.precio ?? p.price,
})), null, 2)}

Registro Completo de Ventas (${salesSummary.length}):
${JSON.stringify(salesSummary.slice(-50), null, 2)}

Pregunta o enfoque específico del usuario (si aplica): "${question || 'Realiza un análisis ejecutivo general del rendimiento comercial, productos más rentables y recomendaciones de crecimiento'}"

Instrucciones:
Responde estrictamente en formato JSON con la siguiente estructura (TODO EL TEXTO EN ESPAÑOL):
1. 'summary': Un análisis general ejecutivo de 2-3 párrafos profundos sobre la salud financiera del negocio, producto más rentable, margen bruto y patrones de venta por días/horas.
2. 'highlights': Lista de 3 a 5 datos clave cuantitativos destacados (ej. "El día de mayor venta fue viernes con $4,500 MXN", "El producto más rentable es X con un margen de 45%").
3. 'answersToQuestion': Si el usuario hizo una pregunta específica, responde directamente a ella con evidencia de los datos; si no hizo pregunta, incluye un resumen de rentabilidad por categorías.
4. 'recommendations': Lista de 3 a 4 acciones tácticas recomendadas para aumentar ganancias o reducir merma.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            answersToQuestion: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["summary", "highlights", "recommendations"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (err: any) {
    console.error("Error in business-insights:", err);
    return res.status(500).json({ error: err.message || "Error al procesar el análisis de IA." });
  }
});

// Vite Middleware for Development vs Production Static Serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
}

startServer();
