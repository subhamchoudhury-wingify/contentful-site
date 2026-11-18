import { cookies } from "next/headers";
import { VISITOR_COOKIE } from "@/proxy";

/** Stable visitor id set by `src/proxy.ts`. Request-time only — call inside Suspense. */
export async function getVisitorId(): Promise<string> {
  const jar = await cookies();
  return jar.get(VISITOR_COOKIE)?.value ?? "anonymous";
}
