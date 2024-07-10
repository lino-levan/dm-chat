import { activeChannel, channels } from "@/lib/signals.ts";
import { decryptDataAsJson, getCryptoKeyFromString } from "@/lib/crypto.ts";
import { getChannelId } from "@/lib/crypto.ts";

import type { SidebarMenuProps } from "./Sidebar.tsx";

async function join(code: string) {
  const cryptoKey = await getCryptoKeyFromString(code);
  localStorage.setItem(
    "dms",
    JSON.stringify([
      ...(JSON.parse(localStorage.getItem("dms") || "[]") as string[]),
      code,
    ]),
  );
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
  activeChannel.value = channelId;

  const subscription = localStorage.getItem("subscription");
  if (subscription) {
    await fetch(`/api/channel/${channelId}/subscribe`, {
      method: "POST",
      body: subscription,
    });
  }
}

export function Join({ open }: SidebarMenuProps) {
  return (
    <>
      <h1 class="font-bold text-3xl">Join a DM</h1>
      <p class="text-gray-200 max-w-sm text-sm pb-4">
        Enter an invite below to join an existing DM
      </p>
      <p class="uppercase font-semibold text-left w-full text-sm pb-1">
        Invite
      </p>
      <input
        id="join-code"
        type="text"
        class="w-screen bg-gray-700 p-2 rounded max-w-sm"
        placeholder="Ex: ac3ace8agyeru30x9rhwauhduashgd8ydsa"
      />
      <button
        onClick={() => {
          join(
            (document.getElementById("join-code") as HTMLInputElement)
              .value,
          ).then(() => {
            open.value = null;
          });
        }}
        class="w-full bg-gray-600 hover:bg-gray-500 rounded p-2 mt-2"
      >
        Join
      </button>
    </>
  );
}
