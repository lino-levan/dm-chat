import { signal } from "@preact/signals";

export const chat = signal<
  { name: string; color: string; message: string; sent_at: number }[]
>([
  {
    color: "red",
    name: "[SYSTEM]",
    message:
      'Welcome to the chat! This chat is fully E2E encrypted. They private key to get into this chat is in your clipboard. You can change your name by typing "/name <name>" in the chatbox. Have fun!',
    sent_at: new Date().getTime(),
  },
]);

export const key = signal(null);
