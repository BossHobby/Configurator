import { App, Octokit } from "octokit";
import { TextWriter, Uint8ArrayReader, ZipReader } from "@zip.js/zip.js";
import semver from "semver";

const FIRMWARE_REPO = {
  owner: "BossHobby",
  repo: "QUICKSILVER",
};

const CONFIGURATOR_REPO = {
  owner: "BossHobby",
  repo: "Configurator",
};

const CORS_PROXY = "https://cors.bubblesort.me/?";
const CORS_HEADERS: [string, string][] = [
  ["Origin", "http://localhost"],
  ["X-Requested-With", "XMLHttpRequest"],
];

const appId = 336407;
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCjm+/HBlaUmeHs
JuPNoLR/llQ+HmyZEdkP7ia6hF232WKRyGtwKAWWI1mAFle/m4L1I6FQQhh4uCqn
8uG01Ex+bBd6C6ecu214tx3xMTnmyh4MqUzjUYmEdcSZ3VjGJwU8J8yyXpfu7H8O
JgK5ibk6AX5qh45VvhjYRbZKLnILrMvOPJ6Y0H31FnucO6SZo7ZZnRK3C6O+Qi/w
0cHmtuQCVk4QOL+oCJIW0QNM2NYVrZY5OJc0lpbMuXmaEG8tIb2qUP0kwcX2oGMg
p68amMS3TXTH3Odc2mYhtLIoPhVyrVXyYHjcdp67vHJfomXcvW4E+TcxckBFwgI5
iHIDIr+XAgMBAAECggEAB8LtBA8L6m7GZfKOWgHmrirOgkflNPnAx12v3qdK3t7k
KzBL0H1FjpLMuyPUM9XHx6NSEsGf8ZIjC+acyHxNyK2OC48j+250ygY92GRSb91k
wYsCh8IlePAxTG9Qt83AFNN6hXexU3dKq7wn4u9ipxrNCXa2zOCAwznDZQ+A/4a2
jlIkMN9hqkwnTttkdGDo1gDO/U5lWIHO513vXhqvMXt76j2ekAShs2gGBpBvs+wn
/tyBJDIrSXcMCy4nwE4sDpPTpBcR2NF4wgxkjGBRphQzzBM2q0eNftlRmOlzNe/V
AdldCElnQNYvVmASMcKi+Iz6D7rgpCNU4AU/u8mGcQKBgQDX97mOPHM9Ox9a33RC
P10ifubVzQORBop2rkHsDGGWqTH/06ygUXF/OkPljVWJLhYGrXExiUnO9F7y0+lI
TsVLeqdgUwHqnrR+A78J+2kOQZHe2zD9dSgjrNhANL7lJfNMbat1d9m89a6Cc4cJ
gEpiShocw2T6DLs1+AQ2z0KPvwKBgQDB76as+S2IY9nYxR65E8LlTCAhPOrz7gzp
075MQb/+Ch7WnenX5UWpNtIAI5orXLGBTKoAP7x6eWLiJ4vxjj/C5szBI4nYjZT6
JkiGGRqhmD8DVWi+eG9Ah5FlK1IOLa4vQdCwlhBx7xtYM/UbfWZjKUu+ZWk4JB0x
luUAvLTGKQKBgDR3+Nq3kP/FR17afvJBVq00y3wR7NXlEuq2d0mT0Hm77WvLz1q7
rqlMTIaOicNkMPG6XY+9XPMsp4yzMy/gA0rNJ7DdOc/4cr1Sx6zzKZjPEVNlSUeq
mO/h5D/lEKO3Tp643jkRvxKLVbRXwOzsACZU/ncSeYvOYAVCljOCsxcdAoGBAI5a
A4UJ7gMkD96Oaku9lpxKsXbUST29qVrlItTEmlG1SgeMp/3h+60GYUTa3SohAuX+
yPYf0pAvk4afMpifKmw8j2ThWihLXGP1P9y2hpbAstgWlCjjK/44xF93WeawXx+u
9qj3raCDuxWWJb8E3+e/gyqBM6eS0p74vKU63pJpAoGBAJVWaujxxkojAoVwbs0R
n/vvwY6snT2EgTGFaHllXtQAHkhoonqPQ0W+4NoM7KnZPDQcKERNrYJQkK+YKTnl
p9r9s032bxaycq7WAPoQAisit0zIt0iZzS6xDew0PIq0g4DjH0GG/y25gtx5MFcr
zM39Lg5JAtecNMRkjep4XQdR
-----END PRIVATE KEY-----`;

class Github {
  private _octokit?: Octokit;
  public async kit(): Promise<Octokit> {
    if (this._octokit) {
      return this._octokit;
    }
    const app = new App({ appId, privateKey });
    const kit = await app.getInstallationOctokit(37707080);
    return (this._octokit = kit);
  }

  public async fetchReleases() {
    const octokit = await this.kit();
    const resp = await octokit.rest.repos.listReleases(FIRMWARE_REPO);
    const data = resp.data.filter((r) => r.assets.length > 0);

    const releases: any = {};
    for (const r of data) {
      releases[r.tag_name] = r.assets;
    }
    return releases;
  }

  private async fetchArtifacts(branch: string) {
    const octokit = await this.kit();
    return octokit.rest.actions
      .listWorkflowRunsForRepo({
        ...FIRMWARE_REPO,
        branch: branch,
        per_page: 1,
        status: "success",
        exclude_pull_requests: true,
      })
      .then((runs) => {
        if (runs.data.total_count == 0) {
          return [];
        }
        return octokit.rest.actions
          .listWorkflowRunArtifacts({
            ...FIRMWARE_REPO,
            run_id: runs.data.workflow_runs[0].id,
            per_page: 100,
          })
          .then((res) => {
            return res.data.artifacts;
          });
      });
  }

  private async fetchVersion(branch: string) {
    const octokit = await this.kit();
    return octokit.rest.repos
      .getContent({
        ...FIRMWARE_REPO,
        path: "VERSION",
        ref: branch,
      })
      .then((file: any) => {
        if (file?.data?.content) {
          return atob(file.data?.content).trim();
        }
        return "v0.0.0";
      })
      .catch(() => {
        return "v0.0.0";
      });
  }

  public async fetchBranches() {
    const octokit = await this.kit();
    const resp = await octokit.rest.repos.listBranches(FIRMWARE_REPO);

    const promises = resp.data
      .filter((b) => b.name != "master")
      .map((b) => {
        return Promise.all([
          this.fetchArtifacts(b.name),
          this.fetchVersion(b.name),
        ]).then(([artifacts, version]) => {
          return {
            name: b.name,
            version,
            artifacts,
          };
        });
      });

    const branches = {};
    for (const b of await Promise.all(promises)) {
      branches[b.name] = b;
    }
    return branches;
  }

  private findNewVersion(versions, current) {
    for (const v of versions) {
      if (semver.gt(v, current)) {
        return v;
      }
    }
    return null;
  }

  public async checkForUpdate(currentVersion: string) {
    const octokit = await this.kit();
    const resp = await octokit.rest.repos.listReleases(CONFIGURATOR_REPO);
    const releases = resp.data.filter(
      (r) => r.assets.length > 0 && semver.valid(r.tag_name)
    );

    const versions = releases.map((r) => r.tag_name);
    const version = this.findNewVersion(versions, currentVersion);
    if (!version) {
      return null;
    }
    return releases.find((r) => r.tag_name == version);
  }

  public fetchAsset(asset: any) {
    const proxy = `${CORS_PROXY}${asset.browser_download_url}`;
    return fetch(proxy, { headers: CORS_HEADERS });
  }

  public async fetchArtifact(asset: any) {
    const octokit = await this.kit();
    const response = await octokit.rest.actions.downloadArtifact({
      ...FIRMWARE_REPO,
      artifact_id: asset.id,
      archive_format: "zip",
    });

    const zip = new ZipReader(
      new Uint8ArrayReader(new Uint8Array(response.data as ArrayBuffer))
    );
    const entry = (await zip.getEntries()).shift();
    if (!entry) {
      return undefined;
    }

    const hexText = await entry.getData(new TextWriter());
    await zip.close();

    return hexText;
  }
}

export const github = new Github();
