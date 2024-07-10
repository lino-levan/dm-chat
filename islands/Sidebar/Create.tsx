import { channels } from "@/lib/signals.ts";
import {
  encryptData,
  exportCryptoKeyAsString,
  generateCryptoKey,
} from "@/lib/crypto.ts";
import { getChannelId } from "@/lib/crypto.ts";

import type { SidebarMenuProps } from "./Sidebar.tsx";

async function create(name: string) {
  const cryptoKey = await generateCryptoKey();
  const code = await exportCryptoKeyAsString(cryptoKey);
  localStorage.setItem(
    "dms",
    JSON.stringify([
      ...(JSON.parse(localStorage.getItem("dms") || "[]") as string[]),
      code,
    ]),
  );
  const channelId = await getChannelId(code);
  await fetch(`/api/channel/${channelId}`, {
    method: "POST",
    body: await encryptData(cryptoKey, JSON.stringify({ name })),
  });
  channels.value = [
    ...channels.value,
    {
      id: channelId,
      name,
      key: cryptoKey,
    },
  ];
}

export function Create({ open }: SidebarMenuProps) {
  return (
    <>
      <h1 class="font-bold text-3xl">Create a DM</h1>
      <p class="text-gray-200 max-w-sm text-sm pb-4">
        Give your DM a personality with a name! You can always change it later.
      </p>
      <p class="uppercase font-semibold text-left w-full text-sm pb-1">
        DM Name
      </p>
      <input
        id="dm-name"
        type="text"
        class="w-screen bg-gray-700 p-2 rounded max-w-sm"
        placeholder="Schmorg's DM Chat"
      />
      <button
        onClick={() => {
          create(
            (document.getElementById("dm-name") as HTMLInputElement)
              .value,
          ).then(() => {
            open.value = null;
          });
        }}
        class="w-full bg-gray-600 hover:bg-gray-500 rounded p-2 mt-2"
      >
        Create
      </button>
    </>
  );
}
