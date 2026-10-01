import { Capacitor } from "@capacitor/core";

export async function exportText(
  filename: string,
  text: string,
  type = "text/plain",
) {
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } =
      await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export a worker-produced file and release its object URL afterwards. */
export async function exportObjectUrl(filename: string, url: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      const blob = await (await fetch(url)).blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const { uri } = await Filesystem.writeFile({
        path: filename.replace(/[^a-zA-Z0-9._-]/g, "_"),
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ title: filename, files: [uri] });
    } else {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
