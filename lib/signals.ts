import { signal } from "@preact/signals";
import type { Channel, Message } from "./types.ts";

export const chat = signal<Message[]>([]);

export const activeChannel = signal<string | null>(null);

export const channels = signal<Channel[]>([]);

// export const key = signal(null);
