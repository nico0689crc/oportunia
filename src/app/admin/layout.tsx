import { isAdmin } from "@/lib/auth/roles";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/dashboard");
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                {/* Por ahora reutilizamos la sidebar pero luego la personalizaremos */}
                <AppSidebar />
                <main className="flex-1 overflow-auto bg-muted/20">
                    <div className="p-4 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <SidebarTrigger />
                            <h1 className="text-2xl font-bold tracking-tight">Panel Administrador</h1>
                        </div>
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
