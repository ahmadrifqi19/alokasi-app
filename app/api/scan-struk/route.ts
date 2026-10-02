import { GoogleGenAI } from "@google/genai";
import { COPY } from "@/lib/copy";

interface ScanRequest {
  base64?: unknown;
  mimeType?: unknown;
}

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash"];

function isFallbackError(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number(error.status);
    if ([404, 408, 429, 500, 502, 503, 504].includes(status)) return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return /high demand|resource_exhausted|rate.?limit|overloaded|temporarily unavailable|model.*not found/.test(message);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: COPY.errors.scan },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as ScanRequest;
    if (typeof body.base64 !== "string" || !body.base64.trim()) {
      return Response.json(
        { error: COPY.errors.scan },
        { status: 400 },
      );
    }

    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";
    const base64 = body.base64.replace(/^data:[^;,]+;base64,/i, "");
    const ai = new GoogleGenAI({ apiKey });
    let outputText: string | undefined;
    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.interactions.create({
          model,
          input: [
            {
              type: "text",
              text: "Analisis foto ini sebagai struk belanja. Ambil TOTAL AKHIR yang dibayar sebagai bilangan bulat dalam satuan mata uang struk, tanpa simbol atau pemisah ribuan. Kembalikan nama toko sebagai catatan dan satu kategori: 'Makanan & Kopi', 'Belanja', 'Transportasi', atau 'Tagihan'. Jika gambar bukan struk atau total tidak terbaca, isi total dengan 0.",
            },
            { type: "image", data: base64, mime_type: mimeType },
          ],
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: {
              type: "object",
              properties: {
                total: { type: "number" },
                kategori: { type: "string" },
                catatan: { type: "string" },
              },
              required: ["total"],
            },
          },
        });
        outputText = response.output_text;
        break;
      } catch (error) {
        lastError = error;
        if (!isFallbackError(error)) throw error;
        console.warn(`Model ${model} gagal, mencoba model cadangan:`, error);
      }
    }

    if (!outputText && lastError) throw lastError;
    const result: unknown = JSON.parse(outputText ?? "");
    if (
      typeof result !== "object" ||
      result === null ||
      !("total" in result) ||
      typeof result.total !== "number"
    ) {
      throw new Error(COPY.errors.scan);
    }

    return Response.json({
      total: result.total,
      ...( "kategori" in result && typeof result.kategori === "string"
        ? { kategori: result.kategori }
        : {}),
      ...( "catatan" in result && typeof result.catatan === "string"
        ? { catatan: result.catatan }
        : {}),
    });
  } catch (error) {
    console.error("API scan-struk error:", error);
    return Response.json(
      { error: COPY.errors.scan },
      { status: 500 },
    );
  }
}