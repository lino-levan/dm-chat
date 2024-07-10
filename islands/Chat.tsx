import IconTrash from "icons/trash.tsx";
import IconEdit from "icons/edit.tsx";
import { decodeTime, ulid } from "$std/ulid/mod.ts";
import { activeChannel, channels, chat } from "@/lib/signals.ts";
import type { GatewayEvent, Message } from "../lib/types.ts";
import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { decode } from "$std/msgpack/mod.ts";
import { decryptDataAsJson } from "@/lib/crypto.ts";

const dateFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });

function ChatMessageTooltip({ id }: { id: string }) {
  return (
    <div class="w-full absolute">
      <div class="absolute h-8 right-0 bottom-0 bg-gray-700 z-40 text-white hidden group-hover:flex items-center rounded shadow-sm ">
        <button class="hover:bg-gray-600 p-2 rounded-l">
          <IconEdit class="w-4 h-4" />
        </button>
        <button
          class="hover:bg-gray-600 p-2 rounded-r"
          onClick={() => {
            fetch(`/api/channel/${activeChannel.value}/message/${id}`, {
              method: "DELETE",
            });
          }}
        >
          <IconTrash class="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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
        } else if (event.type === "delete") {
          chat.value = chat.value.filter((msg) => msg.id !== event.messageId);
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
            res.map(async (encrypted: Uint8Array) => {
              try {
                return await decryptDataAsJson(
                  channel.key,
                  encrypted,
                ) as Promise<Message>;
              } catch {
                // error decrypting message
                return {
                  id: ulid(),
                  name: "[decryption error]",
                  color: "red",
                  content: "[decryption error]",
                  attachments: [],
                };
              }
            }),
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
    <div class="flex-grow overflow-y-scroll pb-2" id="messages">
      <h1 class="text-white text-5xl px-2 pb-2 pt-4 font-extrabold">
        {channels.value.find((channel) => channel.id === activeChannel.value)
          ?.name}
      </h1>
      <p class="text-gray-300 px-2">
        Welcome to the beginning of the{" "}
        <span class="font-extrabold text-white">
          {channels.value.find((channel) => channel.id === activeChannel.value)
            ?.name}
        </span>{" "}
        group.
      </p>
      {chat.value.map((message: Message, i) => {
        const { name, color, id } = message;
        if (i > 0) {
          const prev = chat.value[i - 1];
          if (
            prev.name === name && prev.color === color &&
            decodeTime(id) - decodeTime(prev.id) < 1000 * 60 * 5
          ) {
            return (
              <div class="group pl-16 px-2 w-full hover:bg-gray-800">
                <div class="flex flex-col relative">
                  <ChatMessageTooltip id={message.id} />
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
              </div>
            );
          }
        }
        return (
          <div class="flex-grow flex gap-4 pt-1 mt-1 px-2 hover:bg-gray-800 group">
            <img
              src={`https://api.dicebear.com/8.x/initials/svg?seed=${
                encodeURIComponent(name)
              }`}
              class="w-10 h-10 rounded-full"
            />
            <div class="flex flex-col gap-0 w-full flex-grow relative">
              <ChatMessageTooltip id={message.id} />
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
