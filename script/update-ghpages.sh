#! /bin/bash
git stash

git checkout gh-pages
git rebase master
npm run build:gh-pages
git add ./docs
git commit --amend --no-edit
git push -f

git checkout master
git stash pop