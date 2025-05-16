const { connect } = require("puppeteer-real-browser");

async function connectToBrowser() {
  return await connect({
    headless: false,
    args: [],
    ignoreAllFlags: false,
  });
}

module.exports = connectToBrowser;
