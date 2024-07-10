import { Handlers } from "$fresh/server.ts";
import { setChannelSubscription } from "@/lib/kv.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const { channelId } = ctx.params;
    setChannelSubscription(channelId, await req.text());
    return new Response(null);
  },
};
