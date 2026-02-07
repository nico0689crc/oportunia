import { auth } from '@clerk/nextjs/server';

/**
 * Verifica si el usuario actual tiene el rol de administrador
 */
export async function isAdmin() {
    const { sessionClaims } = await auth();

    // Casting para acceder a los metadatos personalizados en el JWT de Clerk
    const metadata = (sessionClaims?.metadata || {}) as { role?: string };

    if (metadata.role !== 'admin') {
        console.warn(`Access denied: User does not have admin role. Current role: ${metadata.role || 'none'}`);
    }

    return metadata.role === 'admin';
}

/**
 * Tipo para los metadatos de Clerk que usaremos
 */
export interface UserMetadata {
    role?: 'admin' | 'user';
}
