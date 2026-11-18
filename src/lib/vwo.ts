import { init, type IVWOClient } from "vwo-fme-node-sdk";

/** Pre–June 14 accounts use this Contentful variable name. */
export const VWO_CONTENTFUL_VARIABLE = "vwoContentful";

let clientPromise: Promise<IVWOClient | null> | null = null;

function getCredentials() {
  const accountId =
    process.env.VWO_ACCOUNT_ID || process.env.WINGIFY_ACCOUNT_ID || "";
  const sdkKey =
    process.env.VWO_SDK_KEY ||
    process.env.WINGIFY_SDK_KEY ||
    process.env.sdkKey ||
    "";
  return { accountId, sdkKey };
}

export function isVwoConfigured() {
  const { accountId, sdkKey } = getCredentials();
  return Boolean(accountId && sdkKey);
}

export async function getVwoClient(): Promise<IVWOClient | null> {
  if (!isVwoConfigured()) return null;
  if (!clientPromise) {
    const { accountId, sdkKey } = getCredentials();
    clientPromise = init({
      accountId,
      sdkKey,
      // Keep settings fresh while rules are toggled during setup.
      pollInterval: 60_000,
      logger: { level: "ERROR" },
    }).catch((error: unknown) => {
      console.error("[vwo] init failed", error);
      clientPromise = null;
      return null;
    });
  }
  return clientPromise;
}

/**
 * Ask VWO which Contentful entry ID this visitor should see.
 * Falls back to `defaultEntryId` if the flag is off or the SDK fails.
 */
export async function resolveContentfulEntryId(
  featureKey: string,
  userId: string,
  defaultEntryId: string,
): Promise<string> {
  try {
    const client = await getVwoClient();
    if (!client) return defaultEntryId;

    const flag = await client.getFlag(featureKey, { id: userId });
    if (!flag.isEnabled()) return defaultEntryId;

    const entryId = flag.getVariable(VWO_CONTENTFUL_VARIABLE, defaultEntryId);
    return typeof entryId === "string" && entryId.length > 0 ? entryId : defaultEntryId;
  } catch (error) {
    console.error(`[vwo] getFlag failed for ${featureKey}`, error);
    return defaultEntryId;
  }
}
