import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-muted/50">
            <SignUp />
        </div>
    );
}
