import { Chat } from "@/islands/Chat.tsx";
import { Topbar } from "@/islands/Topbar.tsx";
import { Chatbox } from "@/islands/Chatbox.tsx";
import { Sidebar } from "@/islands/Sidebar/Sidebar.tsx";

export default function Home() {
  return (
    <div class="flex">
      <Sidebar pushKey={Deno.env.get("VAPID_PUBLIC_KEY")!} />
      <div class="flex-grow flex flex-col h-screen">
        <Topbar />
        <Chat />
        <Chatbox />
      </div>
    </div>
  );
}
