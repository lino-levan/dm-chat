import IconPlus from "icons/plus.tsx";
import IconChevronRight from "icons/chevron-right.tsx";
import IconSettings from "icons/settings.tsx";
import { useSignal } from "@preact/signals";
import { activeChannel, channels } from "@/lib/signals.ts";
import {
  decryptDataAsJson,
  encryptData,
  exportCryptoKeyAsString,
  generateCryptoKey,
  getCryptoKeyFromString,
} from "@/lib/crypto.ts";
import { getChannelId } from "@/lib/crypto.ts";
import { useEffect } from "preact/hooks";
import { getInitials } from "@/lib/initials.ts";

export function Sidebar() {
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
  }

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
    const req = await fetch(`/api/channel/${channelId}`, {
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
            {open.value === "main" && (
              <>
                <h1 class="font-bold text-3xl">Create a DM</h1>
                <p class="text-gray-200 max-w-sm pb-4">
                  Your DM is where you and whoever you want can hang out. All
                  messages are encrypted.
                </p>
                <button
                  onClick={() => {
                    open.value = "create";
                  }}
                  class="w-full border border-gray-500 hover:bg-gray-600 rounded p-4 flex justify-between font-semibold"
                >
                  <span>Create My Own</span>
                  <IconChevronRight />
                </button>
                <p class="pt-4 pb-2">Have an invite already?</p>
                <button
                  onClick={() => {
                    open.value = "join";
                  }}
                  class="w-full bg-gray-600 hover:bg-gray-500 rounded p-2"
                >
                  Join a DM
                </button>
              </>
            )}
            {open.value === "create" && (
              <>
                <h1 class="font-bold text-3xl">Create a DM</h1>
                <p class="text-gray-200 max-w-sm text-sm pb-4">
                  Give your DM a personality with a name! You can always change
                  it later.
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
            )}
            {open.value === "join" && (
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
            )}
            {open.value === "settings" && (
              <>
                <h1 class="font-bold text-3xl pb-4">Settings</h1>
                <p class="uppercase font-semibold text-left w-full text-sm">
                  Name
                </p>
                <input
                  type="text"
                  class="w-full bg-gray-700 p-2 rounded my-2"
                  placeholder="Your Name"
                  value={localStorage.getItem("name") ?? "Anonymous"}
                  onInput={(e) => {
                    localStorage.setItem("name", e.currentTarget.value);
                  }}
                />
                <p class="uppercase font-semibold text-left w-full text-sm">
                  Color
                </p>
                <input
                  type="color"
                  class="my-2 w-full"
                  value={localStorage.getItem("color") ?? "#3b82f6"}
                  onInput={(e) => {
                    localStorage.setItem("color", e.currentTarget.value);
                  }}
                />
                <p class="uppercase font-semibold text-left w-full text-sm">
                  Notifications
                </p>
                <button
                  class="w-full bg-gray-700 p-2 rounded my-2"
                  onClick={() => {
                    Notification.requestPermission();
                  }}
                >
                  Enable Notifications
                </button>
              </>
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
