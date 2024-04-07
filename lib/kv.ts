/// <reference lib="deno.unstable" />
const kv = await Deno.openKv();

export async function getChannelBuffer(channelId: string) {
  const result = await kv.get<Uint8Array>(["channels", channelId]);
  return result.value;
}

export async function setChannelBuffer(channelId: string, buffer: Uint8Array) {
  await kv.set(["channels", channelId], buffer);
}

export async function getLastMessages(channelId: string, from?: string) {
  const iter = kv.list<Uint8Array>({
    prefix: ["messages", channelId],
    start: from ? ["messages", channelId, from] : undefined,
  }, { reverse: true });
  const messages = [];
  for await (const { value } of iter) {
    messages.push(value);
  }
  return messages.reverse();
}

export async function getMessageBuffer(channelId: string, messageId: string) {
  const result = await kv.get<Uint8Array>(["messages", channelId, messageId]);
  return result.value;
}

export async function setMessageBuffer(
  channelId: string,
  messageId: string,
  buffer: Uint8Array,
) {
  await kv.set(["messages", channelId, messageId], buffer);
}
