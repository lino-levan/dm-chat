export interface Channel {
  id: string;
  name: string;
  key: CryptoKey;
}

export interface Attachment {
  type: string;
  url: string;
}

export interface Message {
  id: string;
  color: string;
  name: string;
  content: string;
  attachments: Attachment[];
  reply_to?: string;
}

export type GatewayEvent = {
  type: "message_modify";
  buffer: Uint8Array;
} | {
  type: "channel_modify";
  buffer: Uint8Array;
} | {
  type: "message_delete";
  messageId: string;
};
