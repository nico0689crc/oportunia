import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Separator } from "@/components/ui/separator";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionData, type SubscriptionData } from "@/lib/subscriptions";
import { SubscriptionBanner } from "./subscription-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth();
    const sub: SubscriptionData = userId ? await getSubscriptionData(userId) : { tier: 'free', status: 'inactive', usage_count: 0, usage_reset_at: new Date().toISOString() };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {userId && sub && <SubscriptionBanner subscription={sub} />}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Dashboard</span>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
