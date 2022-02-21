const glob = require("glob");
const fs = require('fs');

const regex = /<tooltip\sentry="([\w_.]+)".*>/gm;
const whitelist = ['channel.'];
const tooltips = {};

glob("src/**/*.vue", (err, files) => {
  if (err)  {
    throw err
  }

  for (const f of files) {
    const data = fs.readFileSync(f, 'utf8');
    var match;
    while((match = regex.exec(data))) {
      tooltips[match[1]] = {};
    }
  }

  const existing = JSON.parse(fs.readFileSync('src/assets/tooltips.json', 'utf8'));
  for(const key of Object.keys(tooltips)) {
    tooltips[key] = {
      ...existing[key]
    }
  }
  for (const w of whitelist) {
    for(const key of Object.keys(existing)) {
      if (key.startsWith(w)) {
        tooltips[key] = {
          ...existing[key]
        }
      }
    }
  }

  const ordered = Object.keys(tooltips).sort().reduce(
    (obj, key) => { 
      obj[key] = tooltips[key]; 
      return obj;
    },
    {}
  );
  fs.writeFileSync('src/assets/tooltips.json', JSON.stringify(ordered, null, 2));
});



