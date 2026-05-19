import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/** Run once on native app startup (permissions, listeners). */
export async function initNativeApp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener("backButton", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  });
}
