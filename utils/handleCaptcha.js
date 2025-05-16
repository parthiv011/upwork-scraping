async function waitForManualCaptcha(page, timeout = 60000) {
  console.log("🛑 Waiting for CAPTCHA to be solved manually...");
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const captchaExists = await page.$(".g-recaptcha");
    if (!captchaExists) {
      console.log("✅ CAPTCHA passed.");
      return;
    }
    await new Promise((res) => setTimeout(res, 2000));
  }

  throw new Error("CAPTCHA not resolved in time.");
}

module.exports = waitForManualCaptcha;
