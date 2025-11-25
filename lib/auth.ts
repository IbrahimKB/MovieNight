import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { User, Session } from "@/types";

const SESSION_COOKIE_NAME = "movienight_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// -----------------------------------------------------
// Fetch session using the cookie
// -----------------------------------------------------
export async function getSessionFromCookie(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });

    if (!session || session.expires < new Date()) return null;
    return session as unknown as Session;
  } catch (err) {
    console.error("Error fetching session:", err);
    return null;
  }
}

// -----------------------------------------------------
// Fetch user from an existing session
// -----------------------------------------------------
export async function getUserFromSession(session: Session): Promise<User | null> {
  try {
    const user = await prisma.authUser.findUnique({
      where: { id: session.userId },
    });

    if (!user) return null;
    
    return user as unknown as User;
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
}

// -----------------------------------------------------
// Get current user (cookie + DB lookup)
// -----------------------------------------------------
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSessionFromCookie();
  if (!session) return null;
  return await getUserFromSession(session);
}

// -----------------------------------------------------
// Create new session
// -----------------------------------------------------
export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });

  return sessionToken;
}

// -----------------------------------------------------
// Delete session
// -----------------------------------------------------
export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.delete({
    where: { sessionToken },
  });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// -----------------------------------------------------
// Require logged-in user for protected routes
// -----------------------------------------------------
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function getUserExternalId(user: User): string {
  return user.puid || user.id;
}
