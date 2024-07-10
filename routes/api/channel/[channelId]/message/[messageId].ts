import { Handlers } from "$fresh/server.ts";
import {
  getChannelSubscriptions,
  getMessageBuffer,
  setMessageBuffer,
} from "@/lib/kv.ts";
import { sendNotification } from "@/lib/notification.ts";
import { emitEvent } from "@/routes/api/channel/[channelId]/gateway.ts";

async function notifySubscribers(channelId: string) {
  const subscriptions = await getChannelSubscriptions(channelId);
  for (const subscription of subscriptions) {
    sendNotification(subscription);
  }
}

export const handler: Handlers = {
  async GET(_, ctx) {
    const { channelId, messageId } = ctx.params;
    return new Response(await getMessageBuffer(channelId, messageId));
  },
  async POST(req, ctx) {
    const { channelId, messageId } = ctx.params;
    const buffer = new Uint8Array(await req.arrayBuffer());
    setMessageBuffer(channelId, messageId, buffer);
    emitEvent(channelId, { type: "message", buffer });
    notifySubscribers(channelId);
    return new Response();
  },
};
