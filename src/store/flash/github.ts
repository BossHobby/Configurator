import { Octokit } from '@octokit/rest';

const FIRMWARE_REPO = {
  owner: 'BossHobby',
  repo: 'QUICKSILVER',
}

const CORS_PROXY = 'https://cors.bubblesort.me/?';

class Github {
  private octokit = new Octokit();

  public async fetchReleases() {
    const resp = await this.octokit.rest.repos.listReleases(FIRMWARE_REPO);
    const data = resp.data.filter(r => r.assets.length > 0);

    const releases: any = {}
    for (const r of data) {
      releases[r.tag_name] = r.assets;
    }
    return releases;
  }

  public fetchAsset(asset: any) {
    const proxy = `${CORS_PROXY}${asset.browser_download_url}`;
    return fetch(proxy);
  }
}

export const github = new Github();