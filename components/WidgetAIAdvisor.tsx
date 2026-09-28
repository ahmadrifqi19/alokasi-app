"use client";

import React, { useState } from "react";
import { Sparkles, Camera, RefreshCw } from "lucide-react";
import { analyzeReceiptImage, getFinancialInsight } from "@/lib/gemini";

async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.85,
): Promise<{ base64: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Browser tidak dapat memproses gambar ini.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const [, base64] = canvas.toDataURL("image/jpeg", quality).split(",", 2);
    if (!base64) {
      throw new Error("Gagal menyiapkan gambar struk.");
    }

    return { base64, mimeType: "image/jpeg" };
  } finally {
    bitmap.close();
  }
}

interface Props {
  onScanResult: (data: { nominal: number; catatan: string }) => void;
  transaksiSummary: string;
}

export default function WidgetAIAdvisor({ onScanResult, transaksiSummary }: Props) {
  const [insight, setInsight] = useState<string>(
    "Ringkasan saran keuangan akan muncul di sini."
  );
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);

  // Handler Upload Foto Struk
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setLoadingOCR(true);
    try {
      const image = await compressImage(file);
      const result = await analyzeReceiptImage(image.base64, image.mimeType);
      onScanResult({
        nominal: result.total,
        catatan: result.catatan || result.kategori || "",
      });
    } catch (error) {
      console.error("Gagal membaca struk:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingOCR(false);
    }
  };

  // Handler Generate Insight
  const handleGenerateInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await getFinancialInsight(transaksiSummary);
      if (res) setInsight(res);
    } catch (error) {
      console.error("Gagal generate insight:", error);
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* CARD AI FINANCIAL ADVISOR */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-xs font-semibold tracking-tight text-slate-800">
              Insight keuangan
            </h3>
          </div>
          <button
            onClick={handleGenerateInsight}
            disabled={loadingInsight}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loadingInsight ? "animate-spin" : ""}`} />
            Analisis
          </button>
        </div>

        <p className="text-xs font-medium leading-relaxed text-slate-600">
          {insight}
        </p>
      </section>

      {/* BUTTON QUICK SCAN STRUK OCR */}
      <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 transition-colors hover:border-blue-400">
        <Camera className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-bold text-slate-700">
          {loadingOCR ? "Membaca Struk..." : "Scan Struk Belanja (Auto-Fill OCR)"}
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          disabled={loadingOCR}
          className="hidden"
        />
      </label>
    </div>
  );
}