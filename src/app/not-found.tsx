import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-8xl font-extrabold text-terracotta-500">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">This thread led nowhere</h1>
        <p className="mt-3 max-w-md text-charcoal-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary btn-lg">
            <Home className="h-4 w-4" /> Back home
          </Link>
          <Link href="/shop" className="btn-outline btn-lg">
            <Search className="h-4 w-4" /> Browse the shop
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
