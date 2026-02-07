import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, TrendingUp, Sparkles } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/subscriptions";
import { Check } from "lucide-react";

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
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-4">Planes Simples y Transparentes</h2>
              <p className="text-muted-foreground text-lg max-w-[600px] mx-auto">
                Elige el plan que mejor se adapte a tu volumen de ventas. Comienza hoy mismo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col bg-white rounded-3xl p-8 border-2 transition-all hover:shadow-xl ${plan.highlight ? "border-primary shadow-lg scale-105 z-10" : "border-slate-100"
                    }`}
                >
                  {plan.highlight && (
                    <div className="bg-primary text-primary-foreground text-[10px] font-bold py-1 px-3 rounded-full self-start mb-4">
                      MÁS POPULAR
                    </div>
                  )}
                  <div className="mb-6">
                    <plan.icon className={`h-10 w-10 ${plan.highlight ? "text-primary" : "text-slate-400"}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold">${plan.price.toLocaleString('es-AR')}</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    {plan.description}
                  </p>
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <div className="mt-1 h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5 text-green-600" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/sign-up?plan=${plan.tier}`} className="w-full">
                    <Button
                      className="w-full h-12 rounded-xl font-bold"
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.tier === 'free' ? 'Empezar Gratis' : `Elegir Plan ${plan.name}`}
                    </Button>
                  </Link>
                </div>
              ))}
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
