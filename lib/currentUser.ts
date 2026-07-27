import { prisma } from "@/lib/prisma";

// La app es de uso personal y libre: no hay login ni registro. Todo el
// progreso se guarda bajo un único usuario "dueño" que se crea solo la
// primera vez que hace falta (no requiere contraseña real, nunca se usa
// para autenticar a nadie).
const OWNER_EMAIL = "owner@idiomas.local";

let cachedUserId: string | null = null;

export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

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
}
