const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const csv = require("csv-parser");

const { Parser } = require("json2csv");
const { spawn } = require("child_process");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

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
    const db = require("./db");
    const seen = new Set();
    const dedupedJobs = allJobs.filter((job) => {
      const key = `${job.title}-${job.link}-${job.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let savedCount = 0;

    for (const job of dedupedJobs) {
      const rawKey = `${job.title}-${job.date}`;
      const docKey = rawKey.replace(/[^\w]/gi, "_").slice(0, 100);

      try {
        const docRef = db.collection("jobs").doc(docKey);
        const existing = await docRef.get();

        if (!existing.exists) {
          await docRef.set({
            ...job,
            userId: req.user.uid,
            createdAt: new Date(),
          });
          savedCount++;
          console.log(`✅ Saved job: ${job.title}`);
        } else {
          console.log(`ℹ️ Job already exists: ${job.title}`);
        }
      } catch (error) {
        console.error(
          `❌ Error saving job "${job.title}" (${docKey}):`,
          error.message
        );
      }
    }

    res
      .status(200)
      .json({ message: `${savedCount} new jobs saved to Firestore.` });
  } catch (err) {
    console.error("❌ Error writing CSV:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

app.get("/jobs", verifyFirebaseToken, async (req, res) => {
  try {
    const db = require("./db");
    const snapshot = await db
      .collection("jobs")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const jobs = [];

    snapshot.forEach((doc) => {
      jobs.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      message: `${jobs.length} jobs fetched successfully.`,
      data: jobs,
    });
  } catch (error) {
    console.error("❌ Error fetching jobs from Firestore:", error.message);
    res.status(500).json({ message: "Failed to fetch jobs." });
  }
});
const csvFilePath = path.join(__dirname, "upwork_jobs.csv");

app.post("/generate-proposal", verifyFirebaseToken, async (req, res) => {
  const jobData = req.body;
  if (!jobData || !jobData.title || !jobData.link || !jobData.date) {
    return res.status(400).json({ error: "Invalid job data" });
  }

  const rawKey = `${jobData.title}-${jobData.date}`;
  const docKey = rawKey.replace(/[^\w]/gi, "_").slice(0, 100);

  try {
    const db = require("./db");
    const jobRef = db.collection("jobs").doc(docKey);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      return res.status(404).json({ error: "Job not found in Firestore" });
    }

    const jobDoc = jobSnap.data();

    if (jobDoc.proposal && jobDoc.proposal.trim().length > 0) {
      console.log("⚠️ Proposal already exists. Returning cached.");
      return res.json({ proposal: jobDoc.proposal.trim(), cached: true });
    }

    const py = spawn("py", ["python/job_proposal.py", JSON.stringify(jobData)]);

    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    py.on("close", async (code) => {
      if (code !== 0 || errorOutput) {
        console.error("❌ Python error:", errorOutput.trim());
        return res.status(500).json({
          error: "Failed to generate proposal",
          details: errorOutput.trim(),
        });
      }

      const proposalText = output.trim();

      await jobRef.update({
        proposal: proposalText,
        proposalGeneratedAt: new Date(),
      });

      console.log("✅ Proposal saved to Firestore.");
      return res.json({ proposal: proposalText });
    });
  } catch (error) {
    console.error("❌ Error generating proposal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
