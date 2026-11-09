import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  const svg = await readFile("public/icon.svg", "utf8");
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:#172e26}svg{width:100vw;height:100vh;display:block}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icon-${size}.png` });
  }
} finally {
  await browser.close();
}
