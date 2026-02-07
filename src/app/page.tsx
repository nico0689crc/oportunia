import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, TrendingUp, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center font-bold text-xl gap-2" href="#">
          <div className="bg-primary text-primary-foreground p-1 rounded">OP</div>
          <span>Oportunia</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Características
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Precios
          </Link>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Ingresar</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Empezar Gratis</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-muted/50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-7xl/none max-w-3xl">
                  Vende más en Mercado Libre con <span className="text-primary italic">IA</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl">
                  Descubre nichos rentables, analiza a la competencia y genera publicaciones optimizadas en segundos.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/sign-up">
                  <Button size="lg" className="px-8 h-12 text-lg">
                    Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="px-8 h-12 text-lg">
                    Ver Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Buscador de Nichos</h3>
                <p className="text-sm text-muted-foreground">Analizamos los Best Sellers por categoría para detectar huecos de mercado con baja competencia.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Niche Score</h3>
                <p className="text-sm text-muted-foreground">Sistema de puntuación inteligente basado en demanda, competencia y rentabilidad media.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Campaña IA</h3>
                <p className="text-sm text-muted-foreground">Genera títulos optimizados para SEO y descripciones persuasivas usando modelos de IA avanzados.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t font-medium text-muted-foreground">
        <p className="text-xs">© 2026 Oportunia. Todos los derechos reservados.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Términos
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  );
}
