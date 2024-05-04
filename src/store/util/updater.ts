function newElectronUpdater() {
  // TODO: electron
}

function newPWAUpdater() {
  class Updater {
    private hasUpdate = false;
    private updateSW?: (reloadPage?: boolean) => Promise<void>;
    private updateCallback?: (v: any) => Promise<any>;

    constructor() {}

    public updatePreparing() {
      return false;
    }

    public updatePending() {
      return false;
    }

    public async checkForUpdate(
      currentVersion: string,
      updateCallback: (v: any) => Promise<any>,
    ) {
      this.updateCallback = updateCallback;
      if (this.updateSW) {
        return;
      }

      try {
        const updater = this;
        const { registerSW } = await import("virtual:pwa-register");
        this.updateSW = registerSW({
          immediate: true,
          onOfflineReady() {
            console.log("PWA offline ready");
          },
          onNeedRefresh() {
            updater.hasUpdate = true;

            if (updater.updateCallback) {
              updater.updateCallback(updater.hasUpdate);
            }
          },
          onRegistered(swRegistration) {},
          onRegisterError(e) {},
        });
      } catch {
        console.log("PWA disabled");
      }
    }

    public async update(release: any) {
      if (this.hasUpdate) {
        this.hasUpdate = false;
        this.updateSW && this.updateSW(true);
      }
    }

    public async finishUpdate() {}
  }

  return new Updater();
}

function newUpdater() {
  try {
    throw new Error("new.App undefined");
    return newElectronUpdater();
  } catch {
    console.log("Registering PWA updater");
    return newPWAUpdater();
  }
}

export const updater = newUpdater();
