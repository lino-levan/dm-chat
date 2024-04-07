import { Handlers } from "$fresh/server.ts";
import { getChannelBuffer, setChannelBuffer } from "@/lib/kv.ts";

export const handler: Handlers = {
  async GET(_, ctx) {
    const { channelId } = ctx.params;
    return new Response(await getChannelBuffer(channelId));
  },
  async POST(req, ctx) {
    const { channelId } = ctx.params;
    setChannelBuffer(channelId, new Uint8Array(await req.arrayBuffer()));
    return new Response();
  },
};
