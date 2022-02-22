process.env.VUE_APP_VERSION = require('./package.json').version

module.exports = {
  publicPath: "/",
  pwa: {
    name: 'QUICKSILVER',
    themeColor: '#3c7317',
  }
}