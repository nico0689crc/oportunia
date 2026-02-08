import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, TrendingUp, FileText, Users } from "lucide-react";
import { SubscriptionStatus } from "@/components/subscriptions/subscription-status";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSubscriptionData } from "@/lib/subscriptions";
import { redirect } from "next/navigation";

interface Props {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: Props) {
    const { userId } = await auth();
    const user = await currentUser();

    // Next.js 15+: searchParams is now async
    const params = await searchParams;

    // Note: Removed automatic redirect logic to prevent infinite loops
    // The redirect to billing happens from sign-up page via useEffect
    // If user lands here with a plan param, the banner will handle it

    const stats = [
        { title: "Búsquedas", val: "12", icon: Search },
        { title: "Nichos Top", val: "5", icon: TrendingUp },
        { title: "Campañas", val: "3", icon: FileText },
        { title: "Competencia", val: "Media", icon: Users },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Vendedor</h1>
                    <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad en Oportunia.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <Card key={s.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
                                <s.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{s.val}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Últimas Búsquedas</CardTitle>
                            <CardDescription>Nichos detectados recientemente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                Próximamente: Lista de búsquedas recientes
                            </div>
                        </CardContent>
                    </Card>
                    <div className="col-span-3 flex flex-col gap-4">
                        <SubscriptionStatus />
                        <Card>
                            <CardHeader>
                                <CardTitle>Pro Tips</CardTitle>
                                <CardDescription>Mejora tus ventas con IA.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4 text-sm">
                                    <li className="flex gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                                        <p>Optimizamos títulos usando palabras clave de alta conversión.</p>
                                    </li>
                                    <li className="flex gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                                        <p>Analiza a tu competencia para encontrar gaps de mercado.</p>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
