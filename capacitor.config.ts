import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bosshobby.configurator",
  appName: "QUICKSILVER",
  webDir: "dist-mobile",
  // Local radio bridges commonly expose unencrypted ws:// endpoints.
  android: { allowMixedContent: true },
  // `CAP_SERVER_URL=http://<lan-ip>:8080 npx cap sync` loads the app from
  // `npm run serve:mobile` for live reload on a device.
  ...(process.env.CAP_SERVER_URL && {
    server: { url: process.env.CAP_SERVER_URL, cleartext: true },
  }),
};

export default config;
