import { auth } from '@clerk/nextjs/server';

/**
 * Verifica si el usuario actual tiene el rol de administrador
 */
export async function isAdmin() {
    const { sessionClaims } = await auth();

    // Casting para acceder a los metadatos personalizados en el JWT de Clerk
    const metadata = (sessionClaims?.metadata || {}) as { role?: string };
    return metadata.role === 'admin';
}

/**
 * Tipo para los metadatos de Clerk que usaremos
 */
export interface UserMetadata {
    role?: 'admin' | 'user';
}
