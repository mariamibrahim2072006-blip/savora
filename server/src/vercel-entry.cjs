const { createApp, boot } = require('./index');
let booted = null;
let app = null;
module.exports = async function handler(req, res) {
  await (booted ??= boot());
  app ??= createApp();
  return app(req, res);
};
