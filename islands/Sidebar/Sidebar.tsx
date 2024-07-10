import IconPlus from "icons/plus.tsx";
import IconSettings from "icons/settings.tsx";
import { type Signal, useSignal } from "@preact/signals";
import { activeChannel, channels } from "@/lib/signals.ts";
import { decryptDataAsJson, getCryptoKeyFromString } from "@/lib/crypto.ts";
import { getChannelId } from "@/lib/crypto.ts";
import { useEffect } from "preact/hooks";
import { getInitials } from "@/lib/initials.ts";

import { Main } from "./Main.tsx";
import { Create } from "./Create.tsx";
import { Join } from "./Join.tsx";
import { Settings } from "./Settings.tsx";

export interface SidebarMenuProps {
  open: Signal<string | null>;
}

interface SidebarProps {
  pushKey: string;
}

export function Sidebar({ pushKey }: SidebarProps) {
  const open = useSignal<string | null>(null);

  useEffect(() => {
    const dms = JSON.parse(localStorage.getItem("dms") || "[]") as string[];
    Promise.all(dms.map(async (code) => {
      const cryptoKey = await getCryptoKeyFromString(code);
      const channelId = await getChannelId(code);
      const req = await fetch(`/api/channel/${channelId}`);
      const encrypted = new Uint8Array(await req.arrayBuffer());
      const channel = await decryptDataAsJson(cryptoKey, encrypted);
      channels.value = [
        ...channels.value,
        {
          id: channelId,
          name: channel.name,
          key: cryptoKey,
        },
      ];
    })).then(() => {
      activeChannel.value = channels.value[0]?.id;
    });
  }, []);

  return (
    <>
      {open.value !== null && (
        <div
          class="bg-opacity-50 bg-black absolute top-0 left-0 w-screen h-screen z-10 flex justify-center items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              open.value = null;
            }
          }}
        >
          <div class="bg-gray-800 p-6 rounded-lg text-white flex flex-col items-center text-center w-max">
            {open.value === "main" && <Main open={open} />}
            {open.value === "create" && <Create open={open} />}
            {open.value === "join" && <Join open={open} />}
            {open.value === "settings" && (
              <Settings open={open} pushKey={pushKey} />
            )}
          </div>
        </div>
      )}
      <div class="bg-gray-800 h-screen flex flex-col items-center gap-4 px-2 py-4">
        {channels.value.map((channel) => (
          <button
            class={`${
              channel.id !== activeChannel.value
                ? "border-transparent"
                : "border-blue-500"
            } border bg-gray-700 text-green-500 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-600 transition-all`}
            onClick={() => {
              activeChannel.value = channel.id;
            }}
          >
            {getInitials(channel.name)}
          </button>
        ))}
        <button
          class="bg-gray-700 text-green-500 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-600 transition-all"
          onClick={() => {
            open.value = "main";
          }}
        >
          <IconPlus />
        </button>
        <button
          class="bg-gray-700 text-green-500 w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-600 transition-all mt-auto"
          onClick={() => {
            open.value = "settings";
          }}
        >
          <IconSettings />
        </button>
      </div>
    </>
  );
}
