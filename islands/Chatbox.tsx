import IconSend from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/send.tsx";
import { concat } from "$std/bytes/concat.ts";
import { encodeBase64 } from "$std/encoding/base64.ts";
import { chat, key } from "@/lib/signals.ts";

async function sendMessage(message: string) {
  if (!key) return;

  if (message.startsWith("/")) {
    const [command, ...args] = message.slice(1).split(" ");
    if (command === "name") {
      const name = args.join(" ");
      localStorage.setItem("name", name);
      chat.value = [...chat.value, {
        color: "red",
        name: "[SYSTEM]",
        message: `Your name has been changed to ${name}`,
        sent_at: new Date().getTime(),
      }];
      return;
    } else if (command === "color") {
      const color = args.join(" ");
      localStorage.setItem("color", color);
      chat.value = [...chat.value, {
        color: "red",
        name: "[SYSTEM]",
        message: `Your color has been changed to ${color}`,
        sent_at: new Date().getTime(),
      }];
      return;
    } else if (command === "shrug") {
      message = `¯\\_(ツ)_/¯ ${args.join(" ")}`;
    }
  }

  message = JSON.stringify({
    color: localStorage.getItem("color") ?? "#3b82f6",
    name: localStorage.getItem("name") ?? "Anonymous",
    message,
    sent_at: new Date().getTime(),
  });

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = new Uint8Array(
    await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key.value,
      new TextEncoder().encode(message),
    ),
  );

  const concatenated = concat(iv, encrypted);
  const encoded = encodeBase64(concatenated);

  await fetch("/api/message", {
    method: "POST",
    body: encoded,
  });
}

export function Chatbox() {
  if (!key.value) return null;

  return (
    <>
      <div class="w-full bg-gray-800 rounded py-2 px-2 flex items-center gap-2">
        <input
          id="chatbox"
          class="bg-gray-800 outline-none flex-grow"
          placeholder="Send a direct message"
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              const chatbox = document.getElementById("chatbox");
              sendMessage(chatbox.value);
              chatbox.value = "";
            }
          }}
        />
        <button
          onClick={() => {
            const chatbox = document.getElementById("chatbox");
            sendMessage(chatbox.value);
            chatbox.value = "";
          }}
        >
          <IconSend />
        </button>
      </div>
    </>
  );
}
