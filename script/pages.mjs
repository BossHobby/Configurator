import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export function previewId(branch) {
  // Keep ordinary branch names verbatim; escape path/URL characters uniquely.
  return branch.replace(
    /[^a-zA-Z0-9_-]/gu,
    (character) => `~${Buffer.from(character).toString("hex")}~`,
  );
}

const productionPaths = new Set([
  "assets",
  "preview",
  ...readdirSync(new URL("../public/", import.meta.url)),
]);

function deploymentDirectory(branch) {
  const directory = previewId(branch);
  if (
    ["master", "gh-pages"].includes(branch) ||
    productionPaths.has(directory)
  ) {
    throw new Error(`Reserved deployment path: ${directory}`);
  }
  return directory;
}

export function deleteDeployment(site, branch, branches) {
  if (
    !branch ||
    branches.has(branch) ||
    ["master", "gh-pages"].includes(branch)
  )
    return;
  const directory = deploymentDirectory(branch);
  rmSync(join(site, directory), { recursive: true, force: true });
}

// Artifacts are untrusted static files. Never let them replace Git metadata,
// another deployment, or introduce symlinks into the published tree.
function validateArtifact(directory, reserved = new Set()) {
  for (const name of readdirSync(directory)) {
    if (name.startsWith(".") || reserved.has(name)) {
      throw new Error(`Reserved artifact path: ${name}`);
    }
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) validateArtifact(path);
    else if (!stat.isFile()) throw new Error(`Not a regular file: ${path}`);
  }
}

export function updateSite(site, artifact, branches, build, tags = new Map()) {
  if (
    !build ||
    build.branch === "gh-pages" ||
    (build.tag ? tags.get(build.tag) : branches.get(build.branch)) !== build.sha
  ) {
    return null;
  }
  const relative =
    build.branch === "master" ? "" : deploymentDirectory(build.branch);
  const branchDirectories = new Set(
    [...branches.keys()]
      .filter((branch) => !["master", "gh-pages"].includes(branch))
      .map(previewId)
      .filter((directory) => !productionPaths.has(directory)),
  );
  validateArtifact(artifact, relative ? new Set() : branchDirectories);
  if (!existsSync(join(artifact, "index.html")))
    throw new Error("Missing index.html");
  const destination = join(site, relative);
  if (relative) {
    if (
      existsSync(destination) &&
      !existsSync(join(destination, "index.html"))
    ) {
      throw new Error(`Deployment path already in use: ${relative}`);
    }
    rmSync(destination, { recursive: true, force: true });
  }
  mkdirSync(destination, { recursive: true });
  for (const name of readdirSync(artifact)) {
    // Replace only this build's entries; other branch directories stay intact.
    rmSync(join(destination, name), { recursive: true, force: true });
    cpSync(join(artifact, name), join(destination, name), { recursive: true });
  }
  return `/${relative}${relative ? "/" : ""}`;
}

function publish() {
  const site = resolve(process.env.PAGES_SITE);
  const git = (...args) =>
    execFileSync("git", args, { cwd: site, encoding: "utf8" }).trim();
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const run = event.workflow_run;
  const refs = new Map(
    git("ls-remote", "--heads", "--tags", "origin")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, ref] = line.split("\t");
        return [ref, sha];
      }),
  );
  const branches = new Map();
  const tags = new Map();
  for (const [ref, sha] of refs) {
    if (ref.startsWith("refs/heads/")) branches.set(ref.slice(11), sha);
    if (ref.startsWith("refs/tags/") && !ref.endsWith("^{}")) {
      // Annotated tags point to a tag object; compare the peeled commit SHA.
      tags.set(ref.slice(10), refs.get(`${ref}^{}`) || sha);
    }
  }
  const releaseTag =
    run?.name === "build-master" &&
    run.head_branch.startsWith("v") &&
    tags.has(run.head_branch);
  const deletedBranch =
    event.ref_type === "branch" ? event.ref : event.inputs?.deleted_branch;
  deleteDeployment(site, deletedBranch, branches);
  // Retire the previous preview namespace now that branches live at the root.
  rmSync(join(site, "preview"), { recursive: true, force: true });
  const path = updateSite(
    site,
    resolve(process.env.PAGES_ARTIFACT),
    branches,
    run
      ? {
          branch: releaseTag ? "master" : run.head_branch,
          sha: run.head_sha,
          tag: releaseTag ? run.head_branch : undefined,
        }
      : null,
    tags,
  );
  writeFileSync(join(site, ".nojekyll"), "");
  git("config", "user.name", "github-actions[bot]");
  git(
    "config",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com",
  );
  git("add", "--all");
  if (git("status", "--porcelain")) {
    git("commit", "-m", "pages: update branch deployments");
    git("push", "origin", "HEAD:gh-pages");
  }
  if (path && process.env.GITHUB_STEP_SUMMARY) {
    const domain = readFileSync(join(site, "CNAME"), "utf8").trim();
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `Published build path: https://${domain}${path}\n`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv[2] === "base") {
    console.log(
      `PAGES_BASE=/${deploymentDirectory(process.env.GITHUB_REF_NAME)}/`,
    );
  } else if (process.argv[2] === "publish") {
    publish();
  } else {
    throw new Error("Usage: pages.mjs base|publish");
  }
}
