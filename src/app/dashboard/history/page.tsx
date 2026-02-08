import { getSearchHistoryAction } from "@/actions/history";
import { History, Search, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
    const history = await getSearchHistoryAction();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <History className="h-8 w-8 text-primary" />
                    Historial de Búsquedas
                </h2>
                <p className="text-muted-foreground">
                    Revisa las categorías que has analizado anteriormente.
                </p>
            </div>

            {history.length === 0 ? (
                <Card className="border-dashed border-2 py-20 text-center">
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Tu historial está vacío</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Las categorías que analices en el buscador aparecerán aquí automáticamente.
                            </p>
                        </div>
                        <Button asChild className="mt-2">
                            <Link href="/dashboard/niches">Ir al Buscador</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {history.map((item: any) => (
                        <Card key={item.id} className="group hover:border-primary/50 transition-colors shadow-sm overflow-hidden border-2">
                            <CardHeader className="p-4 sm:p-6 flex-row items-center justify-between space-y-0 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-base sm:text-lg capitalize">{item.category_name}</span>
                                            <Badge variant="secondary" className="text-[10px] font-mono">{item.category_id}</Badge>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(item.created_at).toLocaleString('es-ES', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <Button asChild size="sm" className="hidden sm:flex font-bold">
                                    <Link href={`/dashboard/niches`}>
                                        Volver a Analizar <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild size="icon" className="sm:hidden">
                                    <Link href={`/dashboard/niches`}><ArrowRight className="h-4 w-4" /></Link>
                                </Button>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
