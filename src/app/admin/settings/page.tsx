import AdminSettingsForm from "@/components/admin/settings-form";

export default function AdminSettingsPage() {
    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Configuración Global</h2>
                <p className="text-muted-foreground">Administra las credenciales y parámetros clave del sistema Oportunia.</p>
            </div>

            <AdminSettingsForm />
        </div>
    );
}
