import { decodeBase64, encodeBase64 } from "$std/encoding/base64.ts";
import { concat } from "$std/bytes/concat.ts";

export async function generateCryptoKey() {
  const cryptoKey = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
  return cryptoKey;
}

export async function exportCryptoKeyAsString(cryptoKey: CryptoKey) {
  const exported = await crypto.subtle.exportKey("raw", cryptoKey);
  return btoa(
    String.fromCharCode(...new Uint8Array(exported)),
  );
}

export async function getCryptoKeyFromString(exportedString: string) {
  const exported = decodeBase64(exportedString);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    exported,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
  return cryptoKey;
}

export async function getChannelId(key: string | CryptoKey) {
  if (key instanceof CryptoKey) {
    key = await exportCryptoKeyAsString(key);
  }
  const bytes = decodeBase64(key);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return encodeURIComponent(encodeBase64(new Uint8Array(hash)));
}

export async function encryptData(key: CryptoKey, data: string | Uint8Array) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      typeof data === "string" ? new TextEncoder().encode(data) : data,
    ),
  );
  const concatenated = concat(iv, encrypted);
  return concatenated;
}

export async function decryptData(key: CryptoKey, data: Uint8Array) {
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return decrypted;
}

export async function decryptDataAsJson(key: CryptoKey, data: Uint8Array) {
  const decrypted = await decryptData(key, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}
