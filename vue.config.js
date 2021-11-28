let publicPath = "/";

if (process.env.NODE_ENV === 'production') {
  if (process.env.DEPLOYMENT === 'gh-pages') {
    publicPath = '/Configurator/';
  } else {
    publicPath = '/dist/';
  }
}

module.exports = {
  publicPath: publicPath,
}