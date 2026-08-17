import { prisma } from "@/lib/prisma";

// La app es de uso personal y libre: no hay login ni registro. Todo el
// progreso se guarda bajo un único usuario "dueño" que se crea solo la
// primera vez que hace falta (no requiere contraseña real, nunca se usa
// para autenticar a nadie).
const OWNER_EMAIL = "owner@idiomas.local";

let cachedUserId: string | null = null;

// Id de respaldo cuando todavía no hay una base de datos real conectada
// (por ejemplo en desarrollo local antes de configurar Neon). Así la app
// se puede seguir usando: simplemente el progreso no se guarda hasta que
// DATABASE_URL apunte a una base de verdad.
const OFFLINE_FALLBACK_ID = "offline-sin-base-de-datos";

export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  try {
    const user = await prisma.user.upsert({
      where: { email: OWNER_EMAIL },
      update: {},
      create: {
        email: OWNER_EMAIL,
        name: "Yo",
        passwordHash: "unused",
      },
    });

    cachedUserId = user.id;
    return user.id;
  } catch (error) {
    console.warn(
      "[currentUser] No se pudo conectar a la base de datos, se sigue sin guardar progreso:",
      error instanceof Error ? error.message : error
    );
    return OFFLINE_FALLBACK_ID;
  }
}
