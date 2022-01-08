let publicPath = "/";

if (process.env.NODE_ENV === 'production') {
  if (process.env.DEPLOYMENT === 'gh-pages') {
    publicPath = '/Configurator/';
  } else {
    publicPath = '/dist/';
  }
}

process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  publicPath: publicPath,
  pwa: {
    name: 'QUICKSILVER',
    themeColor: '#3c7317',
  }
}