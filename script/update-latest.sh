#! /bin/bash
git push origin :refs/tags/latest
git tag -fa -m "latest" latest
git push origin master --tags
hub release -f "%T (%S) %n" --include-drafts | grep " (draft)" | awk '{print $1}' | xargs -t -n1 hub release delete