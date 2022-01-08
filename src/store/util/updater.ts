import { github } from './github';
import * as semver from 'semver';

function newNWUpdater() {
  const fs = nw.require('fs');
  const os = nw.require('os');

  const path = nw.require('path');
  const spawn = nw.require('child_process').spawn;

  const { https } = nw.require('follow-redirects');

  const extractZip = nw.require('extract-zip')

  class Updater {

    private preparing = false;

    public updatePreparing() {

      return this.preparing;
    }

    public updatePending() {
      return nw?.App.argv.includes("--finish-update");
    }

    public async checkForUpdate(currentVersion: string): Promise<any> {
      if (nw?.App === undefined) {
        return false;
      }
      return await github.checkForUpdate(currentVersion)
    }

    public async update(release: any) {
      if (nw?.App === undefined) {
        return;
      }

      this.preparing = true;

      const cleanVersion = semver.clean(release.tag_name);
      const filename = `quic-config-${cleanVersion}-${os.platform()}-x64.zip`;

      const asset = release.assets.find((v: any) => v.name = filename);
      const zipFile = path.join(os.tmpdir(), filename);
      await this.download(asset.browser_download_url, zipFile);

      const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "quic-config-"));
      await extractZip(zipFile, { dir: tmpDir });

      const childBin = path.join(tmpDir, 'quic-config');
      const tmpUserDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "quic-config-user-data-"));
      const currentBinDir = path.resolve(path.dirname(process.execPath));

      await fs.promises.chmod(childBin, 0o755);

      this.spawnConfig(
        childBin,
        ['--user-data-dir=' + tmpUserDataDir, '--finish-update', zipFile, currentBinDir]
      );
      nw.App.quit();
    }

    public async finishUpdate() {
      if (!this.updatePending()) {
        return;
      }

      const argIndex = nw?.App.argv.indexOf("--finish-update");
      const zipFile = nw?.App.argv[argIndex + 1];
      const installPath = nw?.App.argv[argIndex + 2];

      await extractZip(zipFile, { dir: installPath });

      const childBin = path.join(installPath, 'quic-config');
      await fs.promises.chmod(childBin, 0o755);

      this.spawnConfig(childBin, []);
      nw.App.quit();
    }

    private download(url: string, filename: string) {
      return new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        https.get(url, {}, (res: any) => {
          const { statusCode } = res;

          if (statusCode !== 200) {
            // Consume response data to free up memory
            res.resume();
            reject(new Error("status != 200"));
            return;
          }

          const stream = res.pipe(file);
          stream.on('finish', () => resolve());
        })
          .on('error', (e: Error) => reject(e));
      });
    }

    private spawnConfig(binary: string, args: any[]) {
      const child = spawn(
        binary,
        args, {
        detached: true,
        stdio: ['ignore']
      });

      child.on('error', (err: any) => {
        console.error('Failed to start subprocess.', err);
      });

      child.unref();
    }
  }

  return new Updater();
}

function newPWAUpdater() {
  class Updater {
    public updatePreparing() {
      return false;
    }

    public updatePending() {
      return false;
    }

    public async checkForUpdate(currentVersion: string): Promise<any> {
      return Promise.resolve(null);
    }

    public async update(release: any) {
    }

    public async finishUpdate() {
    }
  }

  return new Updater();
}

function newUpdater() {
  try {
    if (nw?.App) {
      return newNWUpdater();
    }
  } catch {
    return newPWAUpdater();
  }
}

export const updater = newUpdater();