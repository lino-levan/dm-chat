import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { activeChannel, channels } from "@/lib/signals.ts";
import { encryptData } from "@/lib/crypto.ts";

export function Topbar() {
  const channelName = useSignal("");
  const editing = useSignal(false);

  useEffect(() => {
    editing.value = false;
  }, [activeChannel.value]);
  if (!activeChannel.value) return null;

  const channel = channels.value.find((c) => c.id === activeChannel.value)!;

  return (
    <div
      class="w-full bg-gray-800 text-white p-2 font-extrabold"
      onClick={() => {
        channelName.value = channel.name;
        editing.value = true;
      }}
    >
      {editing.value
        ? (
          <input
            class="bg-gray-600"
            value={channelName}
            onKeyPress={async (e) => {
              if (e.key === "Enter" && channelName.value.length > 0) {
                await fetch(`/api/channel/${channel.id}`, {
                  method: "POST",
                  body: await encryptData(
                    channel.key,
                    JSON.stringify({ name: channelName.value }),
                  ),
                });
                editing.value = false;
              }
            }}
            onInput={(e) => {
              channelName.value = e.currentTarget.value;
            }}
          />
        )
        : <p>{channel.name}</p>}
    </div>
  );
}
