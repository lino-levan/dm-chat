import { Handlers } from "$fresh/server.ts";
import { EventSink } from "https://deno.land/x/event_sink@v2.0.0/mod.ts";

let channel = new BroadcastChannel("messages");

channel.onmessage = (event: MessageEvent) => {
  sendMessage(event.data);
};

let sinks = [];

async function sendMessage(content: string) {
  for (const sink of sinks) {
    try {
      await sink.dispatchEvent({
        name: "message",
        content,
      });
    } catch {
      // no-op
    }
  }
}

export const handler: Handlers = {
  GET(_req) {
    const sink = new EventSink();
    sinks.push(sink);
    return sink.getResponse();
  },
  async POST(req) {
    const body = await req.text();
    sendMessage(body);
    channel.postMessage(body);
    return new Response();
  },
};
