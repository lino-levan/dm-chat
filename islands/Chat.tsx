import { decodeTime } from "$std/ulid/mod.ts";
import { activeChannel, channels, chat } from "@/lib/signals.ts";
import type { GatewayEvent, Message } from "../lib/types.ts";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { decode } from "$std/msgpack/mod.ts";
import { decryptDataAsJson } from "@/lib/crypto.ts";

const dateFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });

export function Chat() {
  const wsSignal = useSignal<null | WebSocket>(null);

  useEffect(() => {
    const channel = channels.value.find((channel) =>
      channel.id === activeChannel.value
    )!;
    function createWebsocket() {
      const url = new URL(
        `/api/channel/${activeChannel.value}/gateway`,
        location.href,
      );
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(url);
      ws.onmessage = async (e) => {
        const data = new Uint8Array(await e.data.arrayBuffer());
        const event = decode(data) as GatewayEvent;
        if (event.type === "message") {
          const message: Message = await decryptDataAsJson(
            channel.key,
            event.buffer,
          );
          chat.value = [...chat.value, message];
          setTimeout(() => {
            const messages = document.getElementById("messages")!;
            messages.scrollTop = messages.scrollHeight;
          }, 0);

          console.log(document.hidden);
          if (document.hidden) {
            console.log("hii");
            new Notification(message.name, {
              body: message.content,
              icon: `https://api.dicebear.com/8.x/initials/svg?seed=${
                encodeURIComponent(message.name)
              }`,
            });
          }
        }
        // TODO(lino-levan): handle other event types
      };
      ws.onclose = () => {
        wsSignal.value = createWebsocket();
      };
      return ws;
    }

    if (activeChannel.value) {
      // Create listener
      wsSignal.value = createWebsocket();
      // Fetch chat
      fetch(`/api/channel/${activeChannel.value}/messages`)
        .then((res) => res.arrayBuffer())
        .then((res) => decode(new Uint8Array(res)) as Uint8Array[])
        .then((res) =>
          Promise.all(
            res.map((encrypted: Uint8Array) =>
              decryptDataAsJson(channel.key, encrypted) as Promise<Message>
            ),
          )
        )
        .then((res) => {
          chat.value = res;
          setTimeout(() => {
            const messages = document.getElementById("messages")!;
            messages.scrollTop = messages.scrollHeight;
          }, 0);
        });
    }
  }, [activeChannel.value]);

  return (
    <div class="flex-grow overflow-y-scroll px-2 pb-2" id="messages">
      {chat.value.map((message: Message, i) => {
        const { name, color, id } = message;
        if (i > 0) {
          const prev = chat.value[i - 1];
          if (
            prev.name === name && prev.color === color &&
            decodeTime(id) - decodeTime(prev.id) < 1000 * 60 * 5
          ) {
            return (
              <div class="flex flex-col w-full pl-14">
                {message.content && (
                  <p class="text-gray-100 w-full break-words">
                    {message.content}
                  </p>
                )}
                {message.attachments.map((attachment) => {
                  if (["image/png", "image/jpeg"].includes(attachment.type)) {
                    return (
                      <img
                        src={attachment.url}
                        class="w-full max-w-screen-sm"
                      />
                    );
                  }
                  return null;
                })}
              </div>
            );
          }
        }
        return (
          <div class="flex-grow flex gap-4 pt-2">
            <img
              src={`https://api.dicebear.com/8.x/initials/svg?seed=${
                encodeURIComponent(name)
              }`}
              class="w-10 h-10 rounded-full"
            />
            <div class="flex flex-col gap-1 w-full flex-grow">
              <div class="w-full flex gap-2">
                <span style={{ color }}>{name}</span>
                <span class="text-gray-400">
                  {dateFormatter.format(new Date(decodeTime(id)))}
                </span>
              </div>
              {message.content && (
                <p class="text-gray-100 w-full break-words">
                  {message.content}
                </p>
              )}
              {message.attachments.map((attachment) => {
                if (attachment.type === "image") {
                  return (
                    <img src={attachment.url} class="w-full max-w-screen-sm" />
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
