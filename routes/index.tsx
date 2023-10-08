import { Chat } from "../islands/Chat.tsx";
import { Chatbox } from "../islands/Chatbox.tsx";
import { Login } from "../islands/Login.tsx";

export default function Home() {
  return (
    <>
      <Login />
      <Chat />
      <Chatbox />
    </>
  );
}
