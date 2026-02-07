import { getFavoritesAction } from "@/actions/favorites";
import { NicheCard } from "@/components/dashboard/niche-card";
import { Star, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function FavoritesPage() {
    const favorites = await getFavoritesAction();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                    Mis Favoritos
                </h2>
                <p className="text-muted-foreground">
                    Aquí encontrarás todos los nichos que has guardado para tu análisis posterior.
                </p>
            </div>

            {favorites.length === 0 ? (
                <Card className="border-dashed border-2 py-20">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                            <Inbox className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">No tienes favoritos aún</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Empieza a explorar nichos en el buscador y marca con una estrella los que más te interesen.
                            </p>
                        </div>
                        <Button asChild className="mt-4">
                            <Link href="/dashboard/niches">Ir al Buscador de Nichos</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((fav) => (
                        <NicheCard
                            key={fav.id}
                            niche={fav.niche_data}
                            initialIsFavorite={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
