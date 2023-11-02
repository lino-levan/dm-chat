import { decodeBase64 } from "$std/encoding/base64.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { chat, key } from "@/lib/signals.ts";
import type { Message } from "../lib/types.ts";

const dateFormatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" });

if (IS_BROWSER) {
  const source = new EventSource("/api/message");
  source.onmessage = async (e) => {
    if (!key.value) return;
    try {
      const decoded = decodeBase64(e.data);
      const iv = decoded.slice(0, 12);
      const ciphertext = decoded.slice(12);

      const decrypted = JSON.parse(new TextDecoder().decode(
        await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key.value,
          ciphertext,
        ),
      ));
      chat.value = [...chat.value, decrypted];
      setTimeout(() => {
        const messages = document.getElementById("messages")!;
        messages.scrollTop = messages.scrollHeight;
      }, 0);
    } catch {
      // not a valid message
    }
  };
}

export function Chat() {
  if (!key.value) return null;

  return (
    <div class="flex-grow overflow-y-scroll px-2 pb-2" id="messages">
      {chat.value.map((message: Message, i) => {
        const { name, color, sent_at } = message;
        if (i > 0) {
          const prev = chat.value[i - 1];
          if (
            prev.name === name && prev.color === color &&
            sent_at - prev.sent_at < 1000 * 60 * 5
          ) {
            if (message.type === "message") {
              return (
                <div class="flex flex-col w-full">
                  <p class="text-gray-100 w-full break-words">
                    {message.message}
                  </p>
                </div>
              );
            } else if (message.type === "image") {
              return (
                <div class="flex flex-col w-full">
                  <img src={message.image} class="w-full max-w-screen-sm" />
                </div>
              );
            }
          }
        }
        return (
          <div class="flex flex-col gap-1 pt-2 w-full">
            <div class="w-full flex gap-2">
              <span style={{ color }}>{name}</span>
              <span class="text-gray-400">
                {dateFormatter.format(new Date(sent_at))}
              </span>
            </div>
            {message.type === "message"
              ? (
                <p class="text-gray-100 w-full break-words">
                  {message.message}
                </p>
              )
              : <img src={message.image} class="w-full max-w-screen-sm" />}
          </div>
        );
      })}
    </div>
  );
}
