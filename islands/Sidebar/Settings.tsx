import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { SidebarMenuProps } from "./Sidebar.tsx";
import { channels } from "@/lib/signals.ts";

type SettingsProps = SidebarMenuProps & {
  pushKey: string;
};

export function Settings({ open, pushKey }: SettingsProps) {
  const swReg = useSignal<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    navigator.serviceWorker.register("/sw.js")
      .then((reg) => {
        swReg.value = reg;
      });
  }, []);

  return (
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
      {localStorage.getItem("subscription") === null
        ? (
          <button
            class="w-full bg-gray-700 disabled:text-gray-400 p-2 rounded my-2"
            disabled={swReg.value === null}
            onClick={async () => {
              function urlB64ToUint8Array(base64String: string) {
                const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
                const base64 = (base64String + padding)
                  .replace(/\-/g, "+")
                  .replace(/_/g, "/");

                const rawData = atob(base64);
                const outputArray = new Uint8Array(rawData.length);

                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              }
              const subscription = await swReg.value!.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(pushKey),
              });
              const encodedSubscription = JSON.stringify(subscription);
              localStorage.setItem("subscription", encodedSubscription);
              for (const channel of channels.value) {
                fetch(`/api/channel/${channel.id}/subscribe`, {
                  method: "POST",
                  body: encodedSubscription,
                });
              }
              open.value = null;
            }}
          >
            Enable Notifications
          </button>
        )
        : (
          <div class="w-full bg-gray-700 text-center p-2 rounded my-2">
            Notifications enabled!
          </div>
        )}
    </>
  );
}
