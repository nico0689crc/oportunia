"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Zap, TrendingUp, DollarSign } from "lucide-react";

interface StatItemProps {
    title: string;
    value: string;
    description: string;
    icon: any;
    trend?: {
        value: string;
        positive: boolean;
    };
}

function StatItem({ title, value, description, icon: Icon, trend }: StatItemProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center gap-2 mt-1">
                    {trend && (
                        <span className={`text-xs font-medium flex items-center ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
                            <TrendingUp className={`h-3 w-3 mr-1 ${trend.positive ? '' : 'rotate-180'}`} />
                            {trend.value}
                        </span>
                    )}
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export function AdminStats() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatItem
                title="Búsquedas Totales"
                value="1,284"
                description="visto este mes"
                icon={Search}
                trend={{ value: "+12.5%", positive: true }}
            />
            <StatItem
                title="Usuarios Activos"
                value="86"
                description="en las últimas 24h"
                icon={Users}
                trend={{ value: "+4.2%", positive: true }}
            />
            <StatItem
                title="Créditos IA Usados"
                value="4,520"
                description="consumo de Gemini"
                icon={Zap}
                trend={{ value: "-2.4%", positive: false }}
            />
            <StatItem
                title="Ingresos Estimados"
                value="$1,240"
                description="proyección mensual"
                icon={DollarSign}
                trend={{ value: "+18%", positive: true }}
            />
        </div>
    );
}
