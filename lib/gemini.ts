export interface ReceiptResult {
  total: number;
  kategori?: string;
  catatan?: string;
}

const INSIGHT_FALLBACK =
  "Tetap jaga ritme pencatatan keuanganmu agar anggaran bulanan tetap aman!";

function toDataUrl(base64: string, mimeType: string) {
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType};base64,${base64}`;
}

async function compressBase64Image(
  base64Str: string,
  maxWidth = 800,
  quality = 0.7,
  mimeType = "image/jpeg",
): Promise<string> {
  const source = toDataUrl(base64Str, mimeType);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const width = Math.min(image.naturalWidth || image.width, maxWidth);
      const height = Math.max(
        1,
        Math.round(
          ((image.naturalHeight || image.height) * width) /
            (image.naturalWidth || image.width),
        ),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Browser tidak dapat memproses gambar struk."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        reject(new Error("Gagal mengompres gambar struk."));
      }
    };
    image.onerror = () =>
      reject(new Error("Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP."));
    image.src = source;
  });
}

function responseError(payload: unknown, status: number) {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string") return error;
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
  }
  return `HTTP ${status}`;
}

export async function analyzeReceiptImage(
  base64: string,
  mimeType = "image/jpeg",
): Promise<ReceiptResult> {
  const compressedDataUrl = await compressBase64Image(
    base64,
    800,
    0.7,
    mimeType,
  );
  const match = compressedDataUrl.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  if (!match) throw new Error("Format foto struk tidak valid.");

  const response = await fetch("/api/scan-struk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64: match[2], mimeType: match[1] }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const data =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  if (!response.ok) throw new Error(responseError(payload, response.status));

  const total =
    typeof data.total === "number"
      ? data.total
      : Number(String(data.total ?? 0).replace(/[^\d]/g, ""));
  if (!Number.isFinite(total) || total === 0) {
    throw new Error("Total tidak ditemukan. Pastikan foto struk jelas.");
  }

  return {
    total,
    ...(typeof data.kategori === "string" ? { kategori: data.kategori } : {}),
    ...(typeof data.catatan === "string" ? { catatan: data.catatan } : {}),
  };
}

export async function getFinancialInsight(
  transaksiText: string,
): Promise<string> {
  try {
    const response = await fetch("/api/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaksiText }),
    });
    const payload: unknown = await response.json().catch(() => null);
    const data =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : {};

    if (!response.ok) throw new Error(responseError(payload, response.status));
    if (typeof data.insight !== "string" || !data.insight.trim()) {
      throw new Error("Insight tidak tersedia.");
    }
    return data.insight;
  } catch (error) {
    console.error("Gagal generate insight:", error);
    return INSIGHT_FALLBACK;
  }
}