import webpush from "web-push";

webpush.setVapidDetails(
  Deno.env.get("VAPID_CONTACT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

/** Silently fails if unable to */
export async function sendNotification(subscription: string) {
  try {
    const details = await webpush.generateRequestDetails(
      JSON.parse(subscription),
    );
    await fetch(details.endpoint, {
      method: "POST",
      headers: details.headers,
      body: details.body,
    });
  } catch {
    // noop
  }
}
