'use client';

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');

    // Si tiene plan, redirigimos al checkout automático post-registro
    const redirectUrl = plan
        ? `/dashboard/billing/redirect?plan=${plan}`
        : "/dashboard";

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-muted/50">
            <SignUp
                forceRedirectUrl={redirectUrl}
                signInForceRedirectUrl={redirectUrl}
            />
        </div>
    );
}
