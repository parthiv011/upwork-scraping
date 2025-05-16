const connectToBrowser = require("./browser");
const loginToUpwork = require("./login");
const fs = require("fs");
const { Parser } = require("json2csv");

async function fetchJobs() {
  const { browser, page } = await connectToBrowser();

  await loginToUpwork(page);

  const baseURL =
    "https://www.upwork.com/nx/search/jobs/?contractor_tier=3&from_recent_search=true&payment_verified=1&q=aws%20lambda&sort=recency";

  const totalPages = 2;
  const allJobs = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const fullURL = `${baseURL}&page=${pageNum}`;
    console.log(`\n🔎 Navigating to page ${pageNum}: ${fullURL}`);

    await page.goto(fullURL, { waitUntil: "networkidle2" });
    await new Promise((res) => setTimeout(res, 8000));

    const jobs = await page.$$eval("article", (articles) => {
      return articles.map((article) => {
        const titleElem = article.querySelector("h2 a");
        const title = titleElem?.innerText.trim() || "N/A";
        const link = titleElem?.href || "N/A";

        // Client spent
        const spentElem = article.querySelector('[data-test="total-spent"]');
        const clientSpent = spentElem
          ? spentElem.innerText.trim()
          : "Not listed";

        // Estimated budget or job info block
        const jobInfoBlock = article.querySelector('[data-test="JobInfo"]');
        const estimatedBudget = jobInfoBlock
          ? jobInfoBlock.innerText.trim().replace(/\s+/g, " ")
          : "Not listed";

        // Job description
        const descElem = article.querySelector(
          '[data-test="UpCLineClamp JobDescription"]'
        );
        const jobDescription = descElem
          ? descElem.innerText.trim().replace(/\s+/g, " ")
          : "Not listed";

        // Payment verified
        const paymentVerified = article.innerText.includes("Payment verified")
          ? "Yes"
          : "No";

        return {
          title,
          link,
          clientSpent,
          estimatedBudget,
          jobDescription,
          paymentVerified,
        };
      });
    });

    allJobs.push(...jobs);
  }

  try {
    const parser = new Parser();
    const csv = parser.parse(allJobs);
    fs.writeFileSync("upwork_jobs.csv", csv);

    console.log("✅ Saved to upwork_jobs.csv");
  } catch (err) {
    console.error("❌ Error writing CSV:", err);
  }

  await browser.close();
}

fetchJobs();
