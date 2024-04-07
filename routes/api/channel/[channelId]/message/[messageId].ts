import { Handlers } from "$fresh/server.ts";
import { getMessageBuffer, setMessageBuffer } from "@/lib/kv.ts";
import { emitEvent } from "@/routes/api/channel/[channelId]/gateway.ts";

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
    return new Response();
  },
};
