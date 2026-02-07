import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-muted/50">
            <SignIn />
        </div>
    );
}
