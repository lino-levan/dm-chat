import { Handlers } from "$fresh/server.ts";
import { getChannelBuffer, setChannelBuffer } from "@/lib/kv.ts";
import { emitEvent } from "./gateway.ts";

export const handler: Handlers = {
  async GET(_, ctx) {
    const { channelId } = ctx.params;
    return new Response(await getChannelBuffer(channelId));
  },
  async POST(req, ctx) {
    const { channelId } = ctx.params;
    const buffer = new Uint8Array(await req.arrayBuffer());
    setChannelBuffer(channelId, buffer);
    emitEvent(channelId, { type: "channel_modify", buffer });
    return new Response();
  },
};
