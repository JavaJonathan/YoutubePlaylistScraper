import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/scrapePlaylist", async (req, res) => {
    try{
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  const videos = await page.$$eval("#video-title", els =>
    els
      .map(el => ({ title: el.textContent.trim(), href: el.href }))
      .filter(v => v.title && v.href)
  );

  console.log(videos)

  await browser.close();
  res.json({ videos });
  } catch (err) {
    console.error("scrapePlaylist error:", err);
    return res.status(500).json({ error: "Scrape failed" });
  }
});

app.post("/api/scrapeVideo", async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "Missing url" });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    const data = await page.evaluate(() => {
      const titleElement =
        document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
        document.querySelector("h1.title yt-formatted-string") ||
        document.querySelector("h1 yt-formatted-string");

      const channelElement =
        document.querySelector("#channel-name a") ||
        document.querySelector("ytd-video-owner-renderer #channel-name a") ||
        document.querySelector("ytd-channel-name a");

      let title =titleElement?.textContent;
      let channel = channelElement?.textContent;

      return { title, channel };
    });

    if (!data.title || !data.channel) {
      return res.status(500).json({
        error: "Could not extract title/channel.",
      });
    }

    console.log(data)

    return res.json({ ...data, url });
  } catch (err) {
    console.error("scrapeVideo error:", err);
    return res.status(500).json({ error: "Scrape failed" });
  }
});


app.listen(3001, () => console.log("API running on http://localhost:3001"));