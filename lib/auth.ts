import { cookies } from "next/headers";
import { query } from "./db";
import { User, Session } from "@/types";

const SESSION_COOKIE_NAME = "movienight_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// -----------------------------------------------------
// Fetch session using the cookie
// -----------------------------------------------------
export async function getSessionFromCookie(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  try {
    const result = await query(
      `SELECT id, "sessionToken", "userId", expires, "createdAt"
       FROM public.sessions
       WHERE "sessionToken" = $1 AND expires > NOW()`,
      [sessionToken]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0] as Session;
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
    const result = await query(
      `SELECT id, username, email, "passwordHash", "createdAt",
              "updatedAt", name, role, "joinedAt", puid
       FROM public.users
       WHERE id = $1`,
      [session.userId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0] as User;
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

  await query(
    `INSERT INTO public.sessions
       (id, "sessionToken", "userId", expires, "createdAt")
     VALUES ($1, $2, $3, $4, NOW())`,
    [crypto.randomUUID(), sessionToken, userId, expires.toISOString()]
  );

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
  await query(
    `DELETE FROM public.sessions WHERE "sessionToken" = $1`,
    [sessionToken]
  );

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
