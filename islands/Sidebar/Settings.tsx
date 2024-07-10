import type { SidebarMenuProps } from "./Sidebar.tsx";

export function Settings({ open }: SidebarMenuProps) {
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
      <button
        class="w-full bg-gray-700 p-2 rounded my-2"
        onClick={() => {
          const config = {
            pushKey:
              "BP_ILq2IIMHbagsa-wgfhK9c89qGFy_0oWl1orNlcIBHe1Ot2RnuGPizM8N85pBcxJF-6b_em8oYSe_1Q-6gEAs",
          };
          async function subscribe(topic: string) {
            const swReg = await navigator.serviceWorker.register("/sw.js");
            const subscription = await swReg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlB64ToUint8Array(config.pushKey),
            });
            console.log(JSON.stringify(subscription));
          }
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
          subscribe("news");
        }}
      >
        Enable Notifications
      </button>
    </>
  );
}
