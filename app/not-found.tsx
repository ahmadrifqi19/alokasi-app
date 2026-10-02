import Link from "next/link";
import { COPY } from "@/lib/copy";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Link href="/" className="text-sm font-semibold text-pink-500">
        {COPY.errors.notFound}
      </Link>
    </main>
  );
}