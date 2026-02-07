import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/subscriptions";
import { redirect } from "next/navigation";

interface FeatureGateProps {
    children: React.ReactNode;
    tier?: "free" | "pro" | "elite";
    fallback?: React.ReactNode;
}

/**
 * Componente para proteger funcionalidades Premium
 */
export async function FeatureGate({
    children,
    tier = "pro",
    fallback = null,
}: FeatureGateProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const currentTier = await getUserTier(userId);

    // Mapeo de niveles para validación jerárquica
    const tierWeight = {
        free: 0,
        pro: 1,
        elite: 2,
    };

    const hasAccess = tierWeight[currentTier] >= tierWeight[tier];

    if (!hasAccess) {
        return fallback;
    }

    return <>{children}</>;
}
