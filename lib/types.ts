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
}

export type GatewayEvent = {
  type: "message";
  buffer: Uint8Array;
} | {
  type: "channel";
  buffer: Uint8Array;
} | {
  type: "delete";
  messageId: string;
};
