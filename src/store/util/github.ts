import { Octokit } from "@octokit/rest";
import * as semver from "semver";

const FIRMWARE_REPO = {
  owner: "BossHobby",
  repo: "QUICKSILVER",
};

const CONFIGURATOR_REPO = {
  owner: "BossHobby",
  repo: "Configurator",
};

const CORS_PROXY = "https://cors.bubblesort.me/?";

class Github {
  private octokit = new Octokit();

  public async fetchReleases() {
    const resp = await this.octokit.rest.repos.listReleases(FIRMWARE_REPO);
    const data = resp.data.filter((r) => r.assets.length > 0);

    const releases: any = {};
    for (const r of data) {
      releases[r.tag_name] = r.assets;
    }
    return releases;
  }

  public async checkForUpdate(currentVersion: string) {
    const resp = await this.octokit.rest.repos.listReleases(CONFIGURATOR_REPO);
    const releases = resp.data.filter(
      (r) => r.assets.length > 0 && semver.valid(r.tag_name)
    );

    const version = semver.maxSatisfying(
      releases.map((r) => r.tag_name),
      ">" + currentVersion
    );
    if (!version) {
      return null;
    }
    return releases.find((r) => r.tag_name == version);
  }

  public fetchAsset(asset: any) {
    const headers = [
      ["Origin", "http://localhost"],
      ["X-Requested-With", "XMLHttpRequest"],
    ];
    const proxy = `${CORS_PROXY}${asset.browser_download_url}`;
    return fetch(proxy, { headers });
  }
}

export const github = new Github();
