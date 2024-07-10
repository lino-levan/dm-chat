import { activeChannel, channels } from "@/lib/signals.ts";

export function Topbar() {
  if (!activeChannel.value) return null;

  const channel = channels.value.find((c) => c.id === activeChannel.value)!;

  return (
    <div class="w-full bg-gray-800 text-white p-2 font-extrabold">
      {channel.name}
    </div>
  );
}
