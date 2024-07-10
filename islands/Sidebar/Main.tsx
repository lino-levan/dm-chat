import IconChevronRight from "icons/chevron-right.tsx";
import type { SidebarMenuProps } from "./Sidebar.tsx";

export function Main({ open }: SidebarMenuProps) {
  return (
    <>
      <h1 class="font-bold text-3xl">Create a DM</h1>
      <p class="text-gray-200 max-w-sm pb-4">
        Your DM is where you and whoever you want can hang out. All messages are
        encrypted.
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
  );
}
