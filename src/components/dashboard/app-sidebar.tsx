"use client";

import { LayoutDashboard, Search, FileText, Settings, HelpCircle, PackageSearch, Star, History } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Buscador de Nichos",
        url: "/dashboard/niches",
        icon: Search,
    },
    {
        title: "Mis Favoritos",
        url: "/dashboard/favorites",
        icon: Star,
    },
    {
        title: "Historial de Búsquedas",
        url: "/dashboard/history",
        icon: History,
    },
    {
        title: "Analizador",
        url: "/dashboard/analyzer",
        icon: PackageSearch,
    },
    {
        title: "Mis Campañas",
        url: "/dashboard/campaigns",
        icon: FileText,
    },
];

const adminItems = [
    {
        title: "Admin Panel",
        url: "/admin",
        icon: ShieldAlert,
    },
    {
        title: "Configuración ML",
        url: "/admin/settings",
        icon: Settings,
    },
];

const secondaryItems = [
    {
        title: "Configuración",
        url: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Ayuda",
        url: "/dashboard/help",
        icon: HelpCircle,
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const isAdmin = user?.publicMetadata?.role === 'admin';

    const isAdminRoute = pathname.startsWith('/admin');
    const isDashboardRoute = pathname.startsWith('/dashboard');

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex items-center justify-between p-4">
                <Link href={isAdminRoute ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-bold text-xl">
                    <div className="bg-primary text-primary-foreground p-1 rounded">OP</div>
                    <span className="group-data-[collapsible=icon]:hidden">
                        {isAdminRoute ? "Admin Oportunia" : "Oportunia"}
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {/* Menú de Usuario (Solo en rutas /dashboard) */}
                {isDashboardRoute && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Principal</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Menú de Administración (Solo en rutas /admin) */}
                {isAdminRoute && (
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-primary font-bold">Gestión de Sistema</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {adminItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}>
                                                <item.icon className="text-primary" />
                                                <span className="font-semibold">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                {/* Botón para volver al Panel de Usuario */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href="/dashboard" className="mt-4 border-t pt-4 text-muted-foreground hover:text-primary">
                                            <LayoutDashboard className="h-4 w-4" />
                                            <span>Ir a App Usuario</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Botón de acceso Admin desde Dashboard (Si es admin) */}
                {isDashboardRoute && isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 hover:text-yellow-800">
                                        <Link href="/admin">
                                            <ShieldAlert className="h-4 w-4" />
                                            <span className="font-bold text-xs uppercase tracking-wider">Acceso Administrador</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Items Secundarios (Solo en Dashboard) */}
                {isDashboardRoute && (
                    <SidebarGroup className="mt-auto">
                        <SidebarGroupLabel>Sistema</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {secondaryItems.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="p-4 border-t">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <UserButton showName={false} />
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium">Mi Cuenta</span>
                        <span className="text-xs text-muted-foreground">Pro Plan</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
