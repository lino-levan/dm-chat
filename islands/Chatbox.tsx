import IconPlus from "icons/plus.tsx";
import { ulid } from "$std/ulid/mod.ts";
import { activeChannel, channels, chat } from "@/lib/signals.ts";
import type { Attachment, Message } from "../lib/types.ts";
import { encryptData } from "@/lib/crypto.ts";
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

function getBaseMessage() {
  return {
    color: localStorage.getItem("color") ?? "#3b82f6",
    name: localStorage.getItem("name") ?? "Anonymous",
  };
}

async function encryptAndSend(content: string, attachments: Attachment[]) {
  if (!activeChannel.value) return;
  const channel = channels.value.find((channel) =>
    channel.id === activeChannel.value
  )!;

  const id = ulid();
  const encrypted = await encryptData(
    channel.key,
    JSON.stringify(
      {
        ...getBaseMessage(),
        id,
        content,
        attachments,
      } satisfies Message,
    ),
  );
  await fetch(`/api/channel/${channel.id}/message/${id}`, {
    method: "POST",
    body: encrypted,
  });
}

async function sendMessage(content: string, attachments: Attachment[]) {
  content = content.trim();
  if (content.length === 0 && attachments.length === 0) return;
  if (content.startsWith("/")) {
    const [command, ...args] = content.slice(1).split(" ");
    if (command === "shrug") {
      content = `¯\\_(ツ)_/¯ ${args.join(" ")}`;
    }
  }

  await encryptAndSend(content, attachments);
}

export function Chatbox() {
  const attachments = useSignal<{
    data: string;
    attachment: Attachment;
  }[]>([]);

  function uploadFiles(files: FileList) {
    const channel = channels.value.find((channel) =>
      channel.id === activeChannel.value
    )!;
    Array.from(files).forEach(async (file: File) => {
      const buffer = new Uint8Array(await file.arrayBuffer());

      // upload encrypted file to CDN
      const encrypted = await encryptData(channel.key, buffer);
      const url = await (await fetch("/api/cdn/upload", {
        method: "PUT",
        body: encrypted,
      })).text();
      attachments.value = [
        ...attachments.value,
        {
          data: `data:${file.type};base64,${
            btoa(
              buffer.reduce(
                (data, byte) => data + String.fromCharCode(byte),
                "",
              ),
            )
          }`,
          attachment: {
            type: file.type,
            url,
          },
        },
      ];
    });
  }

  // if user types elsewhere on the page, focus the chatbox and replay the event
  useEffect(() => {
    const keyboardEventHandler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.target === document.body) {
        const chatbox = document.getElementById("chatbox")!;
        chatbox.focus();
        chatbox.dispatchEvent(
          new KeyboardEvent(e.type, {
            charCode: e.charCode,
            code: e.code,
            isComposing: e.isComposing,
            key: e.key,
            keyCode: e.keyCode,
            location: e.location,
            repeat: e.repeat,
          }),
        );
      }
    };
    document.addEventListener("keyup", keyboardEventHandler);
    document.addEventListener("keydown", keyboardEventHandler);
    document.addEventListener("keypress", keyboardEventHandler);
    document.addEventListener("paste", (e) => {
      const fileList = e.clipboardData?.files;
      if (fileList && fileList.length > 0) {
        uploadFiles(fileList);
      }
    });
  }, []);

  return (
    <div class="p-2">
      <div class="flex gap-2">
        {attachments.value.map((attachment) => {
          if (
            ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(
              attachment.attachment.type,
            )
          ) {
            return (
              <img
                src={attachment.data}
                class="h-48 rounded-lg mb-2"
              />
            );
          }
          return (
            <div class="h-48 w-48 rounded-lg text-white bg-gray-800 mb-2 text-center flex items-center">
              {`Can't display preview of file with mime type ${attachment.attachment.type}`}
            </div>
          );
        })}
      </div>
      <div class="w-full bg-gray-800 rounded py-2 px-2 flex items-center gap-2">
        <label
          for="file-upload"
          class="hover:cursor-pointer text-gray-300 hover:text-white"
        >
          <IconPlus />
        </label>
        <input
          id="file-upload"
          type="file"
          class="hidden"
          disabled={!activeChannel.value}
          onChange={(e) => {
            const files = e.currentTarget.files;
            if (!files) return;
            uploadFiles(files);
          }}
        />
        <input
          id="chatbox"
          class="bg-gray-800 outline-none flex-grow text-white"
          placeholder={activeChannel.value
            ? "Send a direct message"
            : "Select a channel to send a message..."}
          autocomplete="off"
          disabled={!activeChannel.value}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              const chatbox = e.currentTarget;
              sendMessage(
                chatbox.value,
                attachments.value.map((a) => a.attachment),
              );
              attachments.value = [];
              chatbox.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
