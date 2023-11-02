import { signal } from "@preact/signals";
import type { Message } from "./types.ts";

export const chat = signal<Message[]>([
  {
    color: "red",
    name: "[SYSTEM]",
    type: "message",
    message:
      'Welcome to the chat! This chat is fully E2E encrypted. They private key to get into this chat is in your clipboard. You can change your name by typing "/name <name>" in the chatbox. Have fun!',
    sent_at: new Date().getTime(),
  },
]);

export const key = signal(null);
