import { Handlers } from "$fresh/server.ts";
import { getLastMessages } from "@/lib/kv.ts";
import { encode } from "$std/msgpack/mod.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { channelId } = ctx.params;
    const params = new URL(req.url).searchParams;
    const from = params.get("from") ?? undefined;
    return new Response(encode(await getLastMessages(channelId, from)));
  },
};
