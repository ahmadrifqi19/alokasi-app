import { GoogleGenAI } from "@google/genai";

interface InsightRequest {
  transaksiText?: unknown;
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
      { error: "GEMINI_API_KEY belum di-set di server" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as InsightRequest;
    if (typeof body.transaksiText !== "string") {
      return Response.json(
        { error: "transaksiText wajib berupa teks" },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    let insight: string | undefined;
    let lastError: unknown;
    for (const model of MODELS) {
      try {
        const response = await ai.interactions.create({
          model,
          input: `Kamu adalah asisten keuangan di aplikasi 'Alokasi'. Berdasarkan riwayat pengeluaran user berikut, berikan tepat 2 kalimat saran yang ramah, ringkas, dan memotivasi.\n${body.transaksiText}`,
        });
        insight = response.output_text?.trim();
        break;
      } catch (error) {
        lastError = error;
        if (!isFallbackError(error)) throw error;
        console.warn(`Model ${model} gagal, mencoba model cadangan:`, error);
      }
    }

    if (!insight && lastError) throw lastError;
    return Response.json({ insight: insight ?? "" });
  } catch (error) {
    console.error("API insight error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}