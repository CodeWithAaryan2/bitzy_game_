import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bitzy.app",
  appName: "Bitzy",
  webDir: "dist",

  server: {
    androidScheme: "https",
  },
};

export default config;