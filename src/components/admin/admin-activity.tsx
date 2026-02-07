"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const activities = [
    {
        id: "1",
        user: { name: "Nico Torres", email: "nico@example.com", initial: "NT" },
        action: "Cambio Configuración ML",
        type: "config",
        time: "Hace 5 min",
        status: "success"
    },
    {
        id: "2",
        user: { name: "Juan Perez", email: "juan@example.com", initial: "JP" },
        action: "Error Gemini API",
        type: "error",
        time: "Hace 15 min",
        status: "error"
    },
    {
        id: "3",
        user: { name: "Maria Garcia", email: "maria@example.com", initial: "MG" },
        action: "Nuevo Usuario Registrado",
        type: "user",
        time: "Hace 2h",
        status: "info"
    },
    {
        id: "4",
        user: { name: "System", email: "system@oportunia.com", initial: "SY" },
        action: "Refresco Automático Token ML",
        type: "system",
        time: "Hace 4h",
        status: "success"
    }
];

export function AdminActivity() {
    return (
        <div className="rounded-md border bg-card">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg leading-none tracking-tight">Actividad del Sistema</h3>
                <p className="text-sm text-muted-foreground mt-1">Monitoreo en tiempo real de eventos clave.</p>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Tiempo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activities.map((activity) => (
                        <TableRow key={activity.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-[10px]">{activity.user.initial}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">{activity.user.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{activity.user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">{activity.action}</TableCell>
                            <TableCell>
                                <Badge variant={activity.status === 'error' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">
                                    {activity.type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">{activity.time}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
