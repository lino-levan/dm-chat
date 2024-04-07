import { Handlers } from "$fresh/server.ts";
import type { GatewayEvent } from "@/lib/types.ts";
import { encode } from "$std/msgpack/mod.ts";

const channels: Record<string, {
  sockets: WebSocket[];
  channel: BroadcastChannel;
}> = {};

function broadcastToConnectedClients(
  channelId: string,
  gatewayEvent: GatewayEvent,
) {
  for (const socket of channels[channelId].sockets) {
    socket.send(encode(gatewayEvent));
  }
}

export function emitEvent(channelId: string, gatewayEvent: GatewayEvent) {
  broadcastToConnectedClients(channelId, gatewayEvent);
  channels[channelId].channel.postMessage(gatewayEvent);
}

export const handler: Handlers = {
  GET(req, ctx) {
    const { channelId } = ctx.params;
    if (!(channelId in channels)) {
      channels[channelId] = {
        sockets: [],
        channel: new BroadcastChannel(channelId),
      };
      channels[channelId].channel.onmessage = (e: MessageEvent) => {
        broadcastToConnectedClients(channelId, e.data);
      };
    }
    if (req.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      socket.onopen = () => {
        channels[channelId].sockets.push(socket);
      };
      socket.onmessage = (event) => {
        // Clients can't send messages
        console.error("Unexpected message from client", event.data);
      };
      socket.onclose = () => {
        channels[channelId].sockets.splice(
          channels[channelId].sockets.indexOf(socket),
          1,
        );
      };

      return response;
    }
    return new Response("Not found", { status: 404 });
  },
};
