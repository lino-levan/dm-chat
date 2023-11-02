export type BaseMessage = {
  color: string;
  name: string;
  sent_at: number;
};

export type Message =
  & BaseMessage
  & ({
    type: "message";
    message: string;
  } | {
    type: "image";
    image: string;
  });
