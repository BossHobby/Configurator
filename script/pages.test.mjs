import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { previewId, updateSite, deleteDeployment } from "./pages.mjs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "pages-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const site = join(root, "site");
  const artifact = join(root, "artifact");
  mkdirSync(site);
  mkdirSync(artifact);
  writeFileSync(join(artifact, "index.html"), "new build");
  return { site, artifact };
}

test("publisher pushes a preview and its deletion to a real Git remote", (t) => {
  const { site, artifact } = fixture(t);
  const remote = join(site, "..", "remote.git");
  const eventPath = join(site, "..", "event.json");
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: site,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "--bare", remote);
  git("init", "-b", "gh-pages");
  git("config", "user.name", "Pages Test");
  git("config", "user.email", "pages@example.com");
  writeFileSync(join(site, "CNAME"), "config.bosshobby.com");
  writeFileSync(join(site, "index.html"), "production");
  git("add", ".");
  git("commit", "-m", "initial site");
  git("remote", "add", "origin", remote);
  git("push", "origin", "HEAD:gh-pages", "HEAD:master", "HEAD:feature/a");
  const sha = git("rev-parse", "HEAD");
  writeFileSync(
    eventPath,
    JSON.stringify({
      workflow_run: { head_branch: "feature/a", head_sha: sha },
    }),
  );
  const publish = () =>
    execFileSync(
      process.execPath,
      [fileURLToPath(new URL("./pages.mjs", import.meta.url)), "publish"],
      {
        env: {
          ...process.env,
          PAGES_SITE: site,
          PAGES_ARTIFACT: artifact,
          GITHUB_EVENT_PATH: eventPath,
          GITHUB_STEP_SUMMARY: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
  publish();
  const preview = `${previewId("feature/a")}/index.html`;
  assert.equal(
    git("--git-dir", remote, "show", `gh-pages:${preview}`),
    "new build",
  );
  git("push", "origin", "--delete", "feature/a");
  // Replay the completed build after deletion, then the delete event itself.
  publish();
  writeFileSync(
    eventPath,
    JSON.stringify({ ref_type: "branch", ref: "feature/a" }),
  );
  publish();
  assert.equal(
    git(
      "--git-dir",
      remote,
      "ls-tree",
      "-r",
      "--name-only",
      "gh-pages",
      previewId("feature/a"),
    ),
    "",
  );
  assert.equal(
    git("--git-dir", remote, "show", "gh-pages:index.html"),
    "production",
  );
  for (const [tag, annotated] of [
    ["v1", false],
    ["v2", true],
  ]) {
    if (annotated) git("tag", "-a", tag, "-m", "release");
    else git("tag", tag);
    git("push", "origin", tag);
    writeFileSync(
      eventPath,
      JSON.stringify({
        workflow_run: {
          name: "build-master",
          head_branch: tag,
          head_sha: git("rev-parse", "HEAD"),
        },
      }),
    );
    writeFileSync(join(artifact, "index.html"), tag);
    publish();
    assert.equal(git("--git-dir", remote, "show", "gh-pages:index.html"), tag);
    git("push", "origin", "--delete", tag);
    writeFileSync(join(artifact, "index.html"), "deleted tag build");
    publish();
    assert.equal(git("--git-dir", remote, "show", "gh-pages:index.html"), tag);
  }
});

test("branch IDs distinguish slash, dash and case without path traversal", () => {
  const names = [
    "feature/foo",
    "feature-foo",
    "Feature/foo",
    "../../master",
    "feature~2f~foo",
  ];
  const ids = names.map(previewId);
  assert.equal(new Set(ids).size, names.length);
  for (const id of ids) assert.match(id, /^[a-zA-Z0-9_~-]+$/);
  assert.equal(previewId("feature-navigation"), "feature-navigation");
});

test("branch updates continuously replace the same URL", (t) => {
  const { site, artifact } = fixture(t);
  const branches = new Map([["feature-navigation", "first"]]);
  assert.equal(
    updateSite(site, artifact, branches, {
      branch: "feature-navigation",
      sha: "first",
    }),
    "/feature-navigation/",
  );
  const destination = join(site, "feature-navigation");
  writeFileSync(join(destination, "old.js"), "obsolete");
  branches.set("feature-navigation", "second");
  writeFileSync(join(artifact, "index.html"), "updated build");
  assert.equal(
    updateSite(site, artifact, branches, {
      branch: "feature-navigation",
      sha: "second",
    }),
    "/feature-navigation/",
  );
  assert.equal(
    readFileSync(join(destination, "index.html"), "utf8"),
    "updated build",
  );
  assert.equal(existsSync(join(destination, "old.js")), false);
});

test("deletion prunes only missing branches and a late build cannot restore them", (t) => {
  const { site, artifact } = fixture(t);
  const branches = new Map([
    ["feature/a", "a"],
    ["feature/b", "b"],
  ]);
  for (const [branch, sha] of branches)
    updateSite(site, artifact, branches, { branch, sha });
  writeFileSync(join(site, "index.html"), "production");
  branches.delete("feature/a");
  deleteDeployment(site, "feature/a", branches);
  assert.equal(
    updateSite(site, artifact, branches, { branch: "feature/a", sha: "a" }),
    null,
  );
  assert.equal(existsSync(join(site, previewId("feature/a"))), false);
  assert.equal(
    existsSync(join(site, previewId("feature/b"), "index.html")),
    true,
  );
  assert.equal(readFileSync(join(site, "index.html"), "utf8"), "production");
});

test("delete-event cleanup also handles develop and is idempotent", (t) => {
  const { site, artifact } = fixture(t);
  updateSite(site, artifact, new Map([["develop", "a"]]), {
    branch: "develop",
    sha: "a",
  });
  for (let i = 0; i < 2; i++) deleteDeployment(site, "develop", new Map());
  assert.equal(existsSync(join(site, "develop")), false);
});

test("stale builds cannot overwrite a newer branch or a recreated branch", (t) => {
  const { site, artifact } = fixture(t);
  const branches = new Map([["feature/a", "new"]]);
  updateSite(site, artifact, branches, { branch: "feature/a", sha: "new" });
  deleteDeployment(site, "feature/a", branches);
  writeFileSync(join(artifact, "index.html"), "old build");
  assert.equal(
    updateSite(site, artifact, branches, { branch: "feature/a", sha: "old" }),
    null,
  );
  assert.equal(
    readFileSync(join(site, previewId("feature/a"), "index.html"), "utf8"),
    "new build",
  );
});

test("production replaces its assets and preserves other branch deployments", (t) => {
  const { site, artifact } = fixture(t);
  const branches = new Map([
    ["master", "m"],
    ["develop", "d"],
    ["feature/a", "a"],
  ]);
  for (const [branch, sha] of branches)
    updateSite(site, artifact, branches, { branch, sha });
  mkdirSync(join(site, ".git"));
  writeFileSync(join(site, "CNAME"), "config.bosshobby.com");
  mkdirSync(join(site, "assets"));
  writeFileSync(join(site, "assets", "old.js"), "obsolete");
  mkdirSync(join(artifact, "assets"));
  writeFileSync(join(artifact, "assets", "new.js"), "current");
  updateSite(site, artifact, branches, { branch: "master", sha: "m" });
  for (const path of [
    ".git",
    "CNAME",
    "develop/index.html",
    `${previewId("feature/a")}/index.html`,
    "assets/new.js",
  ]) {
    assert.equal(existsSync(join(site, path)), true);
  }
  assert.equal(existsSync(join(site, "assets", "old.js")), false);
});

test("artifacts cannot write Git metadata, other deployments or symlinks", (t) => {
  const { site, artifact } = fixture(t);
  for (const name of [".git", "develop"]) {
    mkdirSync(join(artifact, name));
    assert.throws(
      () =>
        updateSite(
          site,
          artifact,
          new Map([
            ["master", "m"],
            ["develop", "d"],
          ]),
          {
            branch: "master",
            sha: "m",
          },
        ),
      /Reserved/,
    );
    rmSync(join(artifact, name), { recursive: true });
  }
  symlinkSync(site, join(artifact, "escape"));
  assert.throws(
    () =>
      updateSite(site, artifact, new Map([["master", "m"]]), {
        branch: "master",
        sha: "m",
      }),
    /regular file/,
  );
});

test("branch deployments and deletion cannot replace production assets", (t) => {
  const { site, artifact } = fixture(t);
  mkdirSync(join(site, "assets"));
  writeFileSync(join(site, "assets", "app.js"), "production");
  assert.throws(
    () =>
      updateSite(site, artifact, new Map([["assets", "a"]]), {
        branch: "assets",
        sha: "a",
      }),
    /Reserved deployment path/,
  );
  assert.throws(
    () => deleteDeployment(site, "assets", new Map()),
    /Reserved deployment path/,
  );
  assert.equal(
    readFileSync(join(site, "assets", "app.js"), "utf8"),
    "production",
  );
});
