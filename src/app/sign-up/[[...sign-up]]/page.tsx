'use client';

import { SignUp, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isSignedIn } = useUser();
    const plan = searchParams.get('plan');

    // Redirigir manualmente cuando el usuario se registra
    useEffect(() => {
        if (isSignedIn && plan && plan !== 'free') {
            console.log('[SignUp] User signed in, redirecting to billing with plan:', plan);
            router.push(`/dashboard/billing/redirect?plan=${plan}`);
        } else if (isSignedIn && (!plan || plan === 'free')) {
            console.log('[SignUp] User signed in, redirecting to dashboard');
            router.push('/dashboard');
        }
    }, [isSignedIn, plan, router]);

    // Si tiene plan, redirigimos al checkout automático post-registro
    const redirectUrl = plan
        ? `/dashboard/billing/redirect?plan=${plan}`
        : "/dashboard";

    console.log('[SignUp] Rendering with plan:', plan, 'redirectUrl:', redirectUrl);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-muted/50">
            <SignUp
                forceRedirectUrl={redirectUrl}
                signInForceRedirectUrl={redirectUrl}
                unsafeMetadata={plan ? { intendedPlan: plan } : undefined}
            />
        </div>
    );
}
