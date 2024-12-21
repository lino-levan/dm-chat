import IconTrash from "icons/trash.tsx";
import IconEdit from "icons/edit.tsx";
import IconReply from "icons/corner-up-left.tsx";
import { decodeTime, ulid } from "$std/ulid/mod.ts";
import { activeChannel, channels, chat, replyTo } from "@/lib/signals.ts";
import type {
  Attachment,
  Channel,
  GatewayEvent,
  Message,
} from "@/lib/types.ts";
import { useEffect } from "preact/hooks";
import { type Signal, useSignal } from "@preact/signals";
import { decode } from "$std/msgpack/mod.ts";
import { decryptData, decryptDataAsJson, encryptData } from "@/lib/crypto.ts";

const timeFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const media: Record<string, string> = {};

function DateSeparator({ date }: { date: Date }) {
  return (
    <div class="flex items-center my-4">
      <div class="flex-grow h-px bg-gray-700"></div>
      <div class="px-4 text-sm text-gray-400">
        {dateFormatter.format(date)}
      </div>
      <div class="flex-grow h-px bg-gray-700"></div>
    </div>
  );
}

function ReplyPreview({ message }: { message: Message | undefined }) {
  return (
    <a
      href={`#${message?.id}`}
      className="flex items-center gap-2 text-sm text-gray-400 mb-1"
    >
      <div className="w-0.5 h-4 bg-gray-600 rounded-full" />
      <img
        src={`https://api.dicebear.com/8.x/initials/svg?seed=${
          encodeURIComponent(message?.name ?? "Unknown")
        }`}
        className="w-4 h-4 rounded-full"
      />
      <span style={{ color: message?.color }}>
        {message?.name ?? "Unable to load author"}
      </span>
      <span className="truncate">
        {message?.content ?? "Unable to load message"}
      </span>
    </a>
  );
}

function ChatMessageTooltip(
  { id, editing }: { id: string; editing: Signal<string | null> },
) {
  return (
    <div class="w-full absolute">
      <div class="absolute h-8 right-0 bottom-0 bg-gray-700 z-40 text-white hidden group-hover:flex items-center rounded shadow-sm ">
        <button
          onClick={() => {
            replyTo.value = id;
          }}
          class="hover:bg-gray-600 p-2 rounded-l"
        >
          <IconReply class="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            editing.value = id;
          }}
          class="hover:bg-gray-600 p-2 rounded-l"
        >
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

function ChatMessageAttachments(
  { attachments }: { attachments: Attachment[] },
) {
  const channel = channels.value.find((channel) =>
    channel.id === activeChannel.value
  )!;
  const loading = useSignal(true);
  useEffect(() => {
    attachments.forEach(async (attachment) => {
      // Don't double load the same image
      if (media[attachment.url]) {
        loading.value = false;
        return;
      }

      // Load the attachment
      const res = await fetch(attachment.url);
      const encrypted = new Uint8Array(await res.arrayBuffer());
      const decrypted = await decryptData(channel.key, encrypted);
      const url = URL.createObjectURL(
        new Blob([decrypted], {
          type: attachment.type,
        }),
      );
      media[attachment.url] = url;
      loading.value = false;
    });
  }, [attachments]);
  return (
    <>
      {!loading.value && attachments.map((attachment) => {
        if (
          ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
            attachment.type,
          )
        ) {
          return (
            <img
              src={media[attachment.url]}
              class="max-w-48 md:max-w-96"
            />
          );
        }
        if (
          ["video/mp4", "video/quicktime", "video/webm"].includes(
            attachment.type,
          )
        ) {
          return (
            <video
              controls
              src={media[attachment.url]}
              class="max-w-48 md:max-w-96"
            />
          );
        }
        if (
          ["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"].includes(
            attachment.type,
          )
        ) {
          return (
            <audio
              controls
              src={media[attachment.url]}
              class="max-w-48 md:max-w-96"
            />
          );
        }
        return (
          <a
            class="bg-gray-700 p-4 rounded-lg text-blue-500 md:w-max hover:underline"
            download={media[attachment.url]}
            href={media[attachment.url]}
          >
            Cannot show preview for file with type "{attachment.type}". Click to
            download.
          </a>
        );
      })}
    </>
  );
}

function ChatMessageContent(
  { message, editing }: { message: Message; editing: Signal<string | null> },
) {
  const editingContent = useSignal(message.content);
  if (!message.content) return null;

  return editing.value === message.id
    ? (
      <input
        class="text-gray-100 bg-gray-700 w-full p-2 rounded"
        value={editingContent}
        onBlur={() => {
          editing.value = null;
        }}
        onKeyPress={async (e) => {
          if (e.key === "Enter") {
            const channel = channels.value.find((channel) =>
              channel.id === activeChannel.value
            )!;

            const encrypted = await encryptData(
              channel.key,
              JSON.stringify(
                {
                  ...message,
                  content: editingContent.value,
                } satisfies Message,
              ),
            );
            await fetch(`/api/channel/${channel.id}/message/${message.id}`, {
              method: "PATCH",
              body: encrypted,
            });
            editing.value = null;
          }
        }}
        onInput={(e) => {
          editingContent.value = e.currentTarget.value;
        }}
      />
    )
    : (
      <p class="text-gray-100 w-full break-words">
        {message.content}
      </p>
    );
}

export function Chat() {
  const editingMessage = useSignal<string | null>(null);
  const wsSignal = useSignal<null | WebSocket>(null);

  useEffect(() => {
    editingMessage.value = null;
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
        if (event.type === "message_modify") {
          const message: Message = await decryptDataAsJson(
            channel.key,
            event.buffer,
          );
          for (let i = 0; i < chat.value.length; i++) {
            if (chat.value[i].id === message.id) {
              chat.value[i] = message;
              chat.value = [...chat.value];
              return;
            }
          }
          chat.value = [...chat.value, message];
          setTimeout(() => {
            const messages = document.getElementById("messages")!;
            messages.scrollTop = messages.scrollHeight;
          }, 0);
        } else if (event.type === "message_delete") {
          chat.value = chat.value.filter((msg) => msg.id !== event.messageId);
        } else if (event.type === "channel_modify") {
          const message: Channel = await decryptDataAsJson(
            channel.key,
            event.buffer,
          );
          channel.name = message.name;
          channels.value = [...channels.value];
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
      const ws = createWebsocket();
      wsSignal.value = ws;
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

      return () => {
        ws.close();
      };
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
        const currentMessageDate = new Date(decodeTime(id));
        const prevMessageDate = i > 0
          ? new Date(decodeTime(chat.value[i - 1].id))
          : null;

        const showDateSeparator = prevMessageDate &&
          currentMessageDate.toDateString() !== prevMessageDate.toDateString();

        const messageContent = (
          <div class="group pl-16 px-2 w-full hover:bg-gray-800">
            <div class="flex flex-col relative">
              <ChatMessageTooltip
                id={message.id}
                editing={editingMessage}
              />
              <ChatMessageContent
                message={message}
                editing={editingMessage}
              />
              <ChatMessageAttachments attachments={message.attachments} />
            </div>
          </div>
        );

        if (i > 0) {
          const prev = chat.value[i - 1];
          if (
            prev.name === name &&
            prev.color === color &&
            !message.reply_to &&
            decodeTime(id) - decodeTime(prev.id) < 1000 * 60 * 5 &&
            !showDateSeparator
          ) {
            return messageContent;
          }
        }

        return (
          <>
            {showDateSeparator && <DateSeparator date={currentMessageDate} />}
            <div
              class="flex-grow flex gap-4 pt-1 mt-1 px-2 hover:bg-gray-800 group"
              id={message.id}
            >
              <img
                src={`https://api.dicebear.com/8.x/initials/svg?seed=${
                  encodeURIComponent(name)
                }`}
                class={`w-10 h-10 rounded-full ${
                  message.reply_to ? "mt-6" : ""
                }`}
              />
              <div class="flex flex-col gap-0 w-full flex-grow relative">
                {message.reply_to && (
                  <ReplyPreview
                    message={chat.value.find((msg) =>
                      msg.id === message.reply_to
                    )}
                  />
                )}
                <ChatMessageTooltip id={message.id} editing={editingMessage} />
                <div class="w-full flex gap-2">
                  <span style={{ color }}>{name}</span>
                  <span class="text-gray-400">
                    {timeFormatter.format(currentMessageDate)}
                  </span>
                </div>
                <ChatMessageContent
                  message={message}
                  editing={editingMessage}
                />
                <ChatMessageAttachments attachments={message.attachments} />
              </div>
            </div>
          </>
        );
      })}
    </div>
  );
}
