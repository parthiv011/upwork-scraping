const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const csv = require("csv-parser");

const { Parser } = require("json2csv");
const { spawn } = require("child_process");

const admin = require("./firebaseAdmin");
const connectToBrowser = require("./browser");
const loginToUpwork = require("./login");
const verifyFirebaseToken = require("./middlewares/firebaseAuth");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

function hasKeywordInDescription(description, keywords) {
  const lowerDesc = description.toLowerCase();
  return keywords.some((kw) => lowerDesc.includes(kw.toLowerCase()));
}

app.get("/", async (req, res) => {
  res.json("Welcome to the server");
});

app.post("/protected", verifyFirebaseToken, (req, res) => {
  res.send({
    message: "You are authenticated",
    uid: req.user.uid,
    email: req.user.email,
  });
});

app.get("/extract-jobs", verifyFirebaseToken, async (req, res) => {
  const keywords = req.query.keywords?.split(",") || ["aws lambda", "node.js"];
  const totalPages = Number(req.query.pages || 2);
  const allJobs = [];

  const { browser, page } = await connectToBrowser();
  await loginToUpwork(page);

  for (const keyword of keywords) {
    const encodedKeyword = encodeURIComponent(keyword);
    const baseURL = `https://www.upwork.com/nx/search/jobs/?amount=2000-&contractor_tier=3&from_recent_search=true&payment_verified=1&q=${encodedKeyword}&sort=client_total_charge%2Bdesc&t=0,1`;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const fullURL = `${baseURL}&page=${pageNum}`;
      try {
        await page.goto(fullURL, { waitUntil: "networkidle2", timeout: 30000 });
      } catch (error) {
        console.warn(`❌ Failed to load page ${pageNum}:`, error);
        continue;
      }

      await new Promise((r) => setTimeout(r, 8000));

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
          date: new Date().toISOString().split("T")[0],
          proposal: "",
        });
      }

      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  await browser.close();

  try {
    const fs = require("fs");
    const path = require("path");
    const { Parser } = require("json2csv");
    const csvParser = require("csv-parser");

    const outputPath = path.join(__dirname, "upwork_jobs.csv");

    // Read existing data if file exists
    let existingJobs = [];

    function readCSVAsync(filePath) {
      return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (data) => results.push(data))
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    }
    if (fs.existsSync(outputPath)) {
      existingJobs = await readCSVAsync(outputPath);
    }

    // console.log("------------------------", existingJobs);

    // Combine old and new jobs
    const combinedJobs = [...existingJobs, ...allJobs];
    // console.log(combinedJobs);

    // Deduplicate based on title + link + date
    const seen = new Set();
    const dedupedJobs = combinedJobs.filter((job) => {
      const key = `${job.title}-${job.link}-${job.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Convert to CSV and write
    const parser = new Parser({ withBOM: false });
    const csv = parser.parse(dedupedJobs);

    fs.writeFileSync(outputPath, csv, { encoding: "utf-8" });

    res.status(200).json({ message: "CSV file updated successfully." });
  } catch (err) {
    console.error("❌ Error writing CSV:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

app.get("/jobs", verifyFirebaseToken, (req, res) => {
  const filePath = path.join(__dirname, "upwork_jobs.csv");

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "CSV file not found" });
  }

  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "") }))
    .on("data", (data) => results.push(data))
    .on("end", () => {
      res.json(results);
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV:", err);
      res.status(500).json({ message: "Failed to read CSV" });
    });
});

app.post("/generate-proposal", verifyFirebaseToken, (req, res) => {
  const jobData = req.body;

  const py = spawn("py", ["python/job_proposal.py", JSON.stringify(jobData)]);

  let output = "";
  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  console.log(output);

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Failed to generate proposal" });
    }

    console.log("✅ Generated proposal:", output);
    res.json({ proposal: output.trim() });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
