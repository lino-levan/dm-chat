/// <reference lib="deno.unstable" />
import { hashData } from "./crypto.ts";

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
  const messages: Uint8Array[] = [];
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

export async function deleteMessageBuffer(
  channelId: string,
  messageId: string,
) {
  await kv.delete(["messages", channelId, messageId]);
}

export async function getChannelSubscriptions(channelId: string) {
  const iter = kv.list<string>({
    prefix: ["subscriptions", channelId],
  });
  const subscriptions: string[] = [];
  for await (const { value } of iter) {
    subscriptions.push(value);
  }
  return subscriptions;
}

export async function setChannelSubscription(
  channelId: string,
  subscription: string,
) {
  const id = await hashData(subscription);
  await kv.set(["subscriptions", channelId, id], subscription);
}
