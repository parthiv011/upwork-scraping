const waitForManualCaptcha = require("./utils/handleCaptcha");

require("dotenv").config();

async function loginToUpwork(page) {
  console.log("🔐 Navigating to Upwork login...");

  await page.goto("https://www.upwork.com/ab/account-security/login", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#login_username", { timeout: 10000 });
  await page.type("#login_username", process.env.UPWORK_EMAIL, { delay: 100 });

  const continueBtn1 = await page.waitForSelector("#login_password_continue", {
    visible: true,
    timeout: 10000,
  });

  if (continueBtn1) {
    await continueBtn1.click();
    console.log("➡️ Clicked Continue after email.");
  }

  await page.waitForSelector("#login_password", {
    visible: true,
    timeout: 10000,
  });
  await page.type("#login_password", process.env.UPWORK_PASSWORD, {
    delay: 100,
  });

  const loginBtn = await page.waitForSelector("#login_control_continue", {
    visible: true,
    timeout: 10000,
  });

  if (loginBtn) {
    await page.evaluate((selector) => {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.scrollIntoView();
        btn.click();
      }
    }, "#login_control_continue");
    console.log("🔓 Clicked Log in.");

    await new Promise((res) => setTimeout(res, 5000));
  }
}

module.exports = loginToUpwork;
