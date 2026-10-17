import { Capacitor } from "@capacitor/core";

function base64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Saves a file: a download in browsers, the share sheet in the apps. */
export async function exportFile(filename: string, data: Blob | string) {
  const blob = typeof data === "string" ? new Blob([data]) : data;
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { uri } = await Filesystem.writeFile({
      path: filename.replace(/[^a-zA-Z0-9._-]/g, "_"),
      data: await base64(blob),
      directory: Directory.Cache,
    });
    await Share.share({ title: filename, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Saves a worker-made object URL and releases it afterwards. */
export async function exportObjectUrl(filename: string, url: string) {
  try {
    await exportFile(filename, await (await fetch(url)).blob());
  } finally {
    URL.revokeObjectURL(url);
  }
}
