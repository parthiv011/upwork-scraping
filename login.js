require("dotenv").config();

async function loginToUpwork(page) {
  console.log("🔐 Navigating to Upwork login...");

  // Step 1: Go to login page and input email
  await page.goto("https://www.upwork.com/ab/account-security/login", {
    waitUntil: "networkidle2",
  });

  // Type email
  await page.waitForSelector("#login_username", { timeout: 10000 });
  await page.type("#login_username", process.env.UPWORK_EMAIL, { delay: 100 });

  // Click the first Continue button
  const continueBtn1 = await page.waitForSelector("#login_password_continue", {
    visible: true,
    timeout: 10000,
  });

  if (continueBtn1) {
    await continueBtn1.click();
    console.log("➡️ Clicked Continue after email.");
  }

  // Step 2: Wait for password input to appear
  await page.waitForSelector("#login_password", { visible: true, timeout: 10000 });
  await page.type("#login_password", process.env.UPWORK_PASSWORD, { delay: 100 });

  // Step 3: Click the final "Log in" button
  const loginBtn = await page.waitForSelector("#login_control_continue", {
    visible: true,
    timeout: 10000,
  });

  if (loginBtn) {
    await loginBtn.click();
    console.log("🔓 Clicked Log in.");
  }

  // Step 4: Wait for navigation to dashboard or jobs page
  try {
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 });
    console.log("✅ Login successful.");
  } catch (err) {
    console.warn("⚠️ Navigation after login took too long or failed. Proceeding anyway.");
  }
}

module.exports = loginToUpwork;
