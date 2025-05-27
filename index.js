const connectToBrowser = require("./browser");
const loginToUpwork = require("./login");
const fs = require("fs");
const { Parser } = require("json2csv");

function hasKeywordInDescription(description, keywords) {
  const lowerDesc = description.toLowerCase();
  return keywords.some((kw) => lowerDesc.includes(kw.toLowerCase()));
}

async function fetchJobs() {
  const { browser, page } = await connectToBrowser();
  await loginToUpwork(page);

  const keywords = ["aws lambda", "node.js"];
  const totalPages = 2;
  const allJobs = [];

  for (const keyword of keywords) {
    const encodedKeyword = encodeURIComponent(keyword);
    const baseURL = `https://www.upwork.com/nx/search/jobs/?amount=2000-&contractor_tier=3&from_recent_search=true&payment_verified=1&q=${encodedKeyword}&sort=client_total_charge%2Bdesc&t=0,1`;

    console.log(`\n🔍 Searching for keyword: "${keyword}"`);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const fullURL = `${baseURL}&page=${pageNum}`;
      console.log(`➡️ Navigating to page ${pageNum}: ${fullURL}`);

      try {
        await page.goto(fullURL, { waitUntil: "networkidle2", timeout: 30000 });
      } catch (error) {
        console.warn(
          `❌ Failed to load page ${pageNum} for "${keyword}":`,
          error
        );
        continue;
      }

      await new Promise((res) => setTimeout(res, 8000));

      const jobs = await page.$$eval("article", (articles) => {
        return articles.map((article) => {
          const titleElem = article.querySelector("h2 a");
          const title = titleElem?.innerText.trim() || "N/A";
          const link = titleElem?.href || "N/A";

          const spentElem = article.querySelector('[data-test="total-spent"]');
          const clientSpent = spentElem
            ? spentElem.innerText.trim()
            : "Not listed";

          const jobInfoBlock = article.querySelector('[data-test="JobInfo"]');
          const estimatedBudget = jobInfoBlock
            ? jobInfoBlock.innerText.trim().replace(/\s+/g, " ")
            : "Not listed";

          const descElem = article.querySelector(
            '[data-test="UpCLineClamp JobDescription"]'
          );
          const jobDescription = descElem
            ? descElem.innerText.trim().replace(/\s+/g, " ")
            : "Not listed";

          const paymentVerified = article.innerText.includes("Payment verified")
            ? "Yes"
            : "No";

          const techStackContainer = article.querySelector(
            ".air3-token-container"
          );
          const techStack = Array.from(
            techStackContainer?.querySelectorAll(".air3-token-wrap button") ||
              []
          ).map((btn) => btn.innerText.trim());

          return {
            title,
            clientSpent,
            estimatedBudget,
            paymentVerified,
            techStack:
              techStack.length > 0 ? techStack.join(", ") : "Not listed",
            link,
            jobDescription,
          };
        });
      });

      for (const job of jobs) {
        job.matchesInDescription = hasKeywordInDescription(job.jobDescription, [
          keyword,
        ])
          ? "Yes"
          : "No";
        job.keyword = keyword;

        const { link, jobDescription, ...rest } = job;
        allJobs.push({
          ...rest,
          link,
          jobDescription,
        });
      }

      await new Promise((res) => setTimeout(res, 5000)); // throttle between pages
    }
  }

  try {
    const parser = new Parser();
    const csv = parser.parse(allJobs);
    fs.writeFileSync("upwork_jobs.csv", "\uFEFF" + csv, { encoding: "utf-8" });

    console.log("✅ Saved to upwork_jobs.csv");
  } catch (err) {
    console.error("❌ Error writing CSV:", err);
  }

  await browser.close();
}

fetchJobs();
