import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.API_SERVER_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const hasAccessToken = cookieStore.has("access_token");
    const hasRefreshToken = cookieStore.has("refresh_token");

    if (!hasAccessToken && !hasRefreshToken) {
      return null;
    }

    const cookieString = cookieStore.toString();


    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        cookie: cookieString,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    return await res.json();
  } catch (e) {
    console.log("ERROR IN FETCH:", e);
    return null;
  }
}
