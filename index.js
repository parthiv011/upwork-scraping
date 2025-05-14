const { connect } = require("puppeteer-real-browser");
const fs = require("fs");
const { Parser } = require("json2csv");

async function test() {

  const { browser, page } = await connect({
    headless: false,
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
  });

  console.log("✅ Connected to browser");
  debugger;

  const baseURL =
    "https://www.upwork.com/nx/search/jobs/?contractor_tier=3&from_recent_search=true&payment_verified=1&q=aws%20lambda&sort=recency";

  const totalPages = 2;
  const allJobs = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const fullURL = `${baseURL}&page=${pageNum}`;
    console.log(`\n🔎 Navigating to page ${pageNum}: ${fullURL}`);
    debugger;

    await page.goto(fullURL, { waitUntil: "networkidle2" });
    console.log("⏳ Page loaded. Waiting 8 seconds for dynamic content...");
    await new Promise((res) => setTimeout(res, 8000));

    console.log("📦 Extracting job data...");
    debugger;

    const jobs = await page.$$eval("article", (articles) => {
      return articles.map((article) => {
        const titleElem = article.querySelector("h2 a");
        const title = titleElem?.innerText.trim() || "N/A";
        const link = titleElem?.href || "N/A";

        const text = article.innerText;

        // Extract client's total spend e.g. "$100K+ spent"
        const spentMatch = text.match(/\$\d+[kK]?\+?\s+spent/);
        const clientSpent = spentMatch ? spentMatch[0] : "Not listed";

        // Extract estimated job budget e.g. "Hourly: $20 – $30" or "Fixed-price: $500"
        const budgetMatch = text.match(/(?:Hourly|Fixed-price):\s+\$[\d,.]+(?:\s+–\s+\$[\d,.]+)?/);
        const estimatedBudget = budgetMatch ? budgetMatch[0] : "Not listed";

        const paymentVerified = text.includes("Payment verified") ? "Yes" : "No";

        return { title, link, clientSpent, estimatedBudget, paymentVerified };
      });
    });

    console.log(`✅ Found ${jobs.length} jobs on page ${pageNum}`);
    debugger;
    allJobs.push(...jobs);
  }

  console.log("\n🎯 All collected jobs:", allJobs.length);
  console.table(allJobs);
  debugger;

  // ✅ Save as CSV
  try {
    console.log("📁 Writing to CSV...");
    debugger;

    const parser = new Parser();
    const csv = parser.parse(allJobs);
    fs.writeFileSync("upwork_jobs.csv", csv);

    console.log("✅ Saved to upwork_jobs.csv");
  } catch (err) {
    console.error("❌ Error writing CSV:", err);
    debugger;
  }

  console.log("🧹 Closing browser...");
  await browser.close();
  console.log("🚪 Browser closed. Done!");
}

test();
