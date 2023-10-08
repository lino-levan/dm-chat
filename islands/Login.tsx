import { decodeBase64 } from "$std/encoding/base64.ts";
import { key } from "@/lib/signals.ts";

export function Login() {
  if (key.value) return null;
  return (
    <>
      <h1 class="text-xl p-4">
        Hello! To get started messaging someone, put a private key in the
        textbox below. Alternatively, generate a private key by click the
        button.
      </h1>
      <button
        class="p-4 bg-gray-800 rounded mb-4 text-xl"
        onClick={async () => {
          const cryptoKey = await crypto.subtle.generateKey(
            {
              name: "AES-GCM",
              length: 256,
            },
            true,
            ["encrypt", "decrypt"],
          );
          const exported = await crypto.subtle.exportKey("raw", cryptoKey);
          const exportedString = btoa(
            String.fromCharCode(...new Uint8Array(exported)),
          );

          await navigator.clipboard.writeText(exportedString);
          key.value = cryptoKey;
        }}
      >
        Generate Private Key
      </button>
      <textarea
        onInput={async (e) => {
          const textarea = e.target as HTMLTextAreaElement;
          const exportedString = textarea.value;
          const exported = decodeBase64(exportedString);
          const cryptoKey = await crypto.subtle.importKey(
            "raw",
            exported,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"],
          );
          console.log(cryptoKey);
          key.value = cryptoKey;
        }}
        class="bg-gray-800 outline-none flex-grow rounded p-2"
      />
    </>
  );
}
