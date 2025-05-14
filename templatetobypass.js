const { connect } = require("puppeteer-real-browser");

async function test() {
  const { browser, page } = await connect({
    headless: false,

    args: [],

    customConfig: {},

    turnstile: true,

    connectOption: {},

    disableXvfb: false,
    ignoreAllFlags: false,
    // proxy:{
    //     host:'<proxy-host>',
    //     port:'<proxy-port>',
    //     username:'<proxy-username>',
    //     password:'<proxy-password>'
    // }
  });
  await page.goto("https://www.upwork.com/nx/search/jobs/?from_recent_search=true&q=aws%20lambda");
}

test();