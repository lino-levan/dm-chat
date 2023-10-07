import IconSend from "https://deno.land/x/tabler_icons_tsx@0.0.5/tsx/send.tsx";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { signal } from "@preact/signals";
import { concat } from "$std/bytes/concat.ts";
import { decodeBase64, encodeBase64 } from "$std/encoding/base64.ts";

const name = signal(localStorage.getItem("name") ?? "Anonymous");
const key = signal(null);
const chat = signal<{ name: string; message: string }[]>([
  {
    name: "[SYSTEM]",
    message:
      'Welcome to the chat! This chat is fully E2E encrypted. They private key to get into this chat is in your clipboard. You can change your name by typing "/name <name>" in the chatbox. Have fun!',
  },
]);

if (IS_BROWSER) {
  const source = new EventSource("/api/message");
  source.onmessage = async (e) => {
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

async function sendMessage(message: string) {
  if (!key) return;

  if (message.startsWith("/")) {
    const [command, ...args] = message.slice(1).split(" ");
    if (command === "name") {
      name.value = args.join(" ");
      localStorage.setItem("name", name.value);
      chat.value = [...chat.value, {
        name: "[SYSTEM]",
        message: `Your name has been changed to ${name.value}`,
      }];
      return;
    } else if (command === "shrug") {
      message = `¯\\_(ツ)_/¯ ${args.join(" ")}`;
    }
  }

  message = JSON.stringify({
    name: name.value,
    message,
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

export function Chat() {
  if (!key.value) {
    return (
      <>
        <h1 class="text-xl p-4">
          Hello! To get started messaging someone, put a private key in the
          textbox below. Alternatively, generate a private key by click the
          button.
        </h1>
        <button
          class="p-4 bg-gray-800 rounded mb-4 text-xl"
          onClick={async () => {
            const cryptoKey = await crypto.subtle.generateKey(
              {
                name: "AES-GCM",
                length: 256,
              },
              true,
              ["encrypt", "decrypt"],
            );
            const exported = await crypto.subtle.exportKey("raw", cryptoKey);
            const exportedString = btoa(
              String.fromCharCode(...new Uint8Array(exported)),
            );

            await navigator.clipboard.writeText(exportedString);
            key.value = cryptoKey;
          }}
        >
          Generate Private Key
        </button>
        <textarea
          onInput={async (e) => {
            const textarea = e.target as HTMLTextAreaElement;
            const exportedString = textarea.value;
            const exported = decodeBase64(exportedString);
            const cryptoKey = await crypto.subtle.importKey(
              "raw",
              exported,
              "AES-GCM",
              true,
              ["encrypt", "decrypt"],
            );
            console.log(cryptoKey);
            key.value = cryptoKey;
          }}
          class="bg-gray-800 outline-none flex-grow rounded p-2"
        />
      </>
    );
  }

  return (
    <>
      <div class="flex-grow overflow-y-scroll" id="messages">
        {chat.value.map(({ name, message }) => {
          return (
            <div class="flex flex-col gap-1 p-2 w-full">
              <p class="text-gray-400 w-full">{name}</p>
              <p class="text-gray-100 w-full break-words">{message}</p>
            </div>
          );
        })}
      </div>
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
