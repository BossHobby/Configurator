#! /bin/bash
set -ex

git checkout gh-pages
git rebase master
npm run build:gh-pages
echo 'config.bosshobby.com' > docs/CNAME
git add ./docs
git commit --amend --no-edit
git push -f

git checkout master