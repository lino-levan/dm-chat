import { Chat } from "@/islands/Chat.tsx";
import { Chatbox } from "@/islands/Chatbox.tsx";
import { Sidebar } from "@/islands/Sidebar.tsx";

export default function Home() {
  return (
    <div class="flex">
      <Sidebar />
      <div class="flex-grow flex flex-col h-screen">
        <Chat />
        <Chatbox />
      </div>
    </div>
  );
}
