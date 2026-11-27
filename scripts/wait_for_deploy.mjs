import puppeteer from 'puppeteer-core';

async function checkBuild() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  await page.goto('https://waypoint-jade-kappa.vercel.app/', { waitUntil: 'domcontentloaded' });
  const scripts = await page.$$eval('script[src]', els => els.map(e => e.src));
  const chunkWithBuild = scripts.find(s => s.includes('/_next/static/chunks/'));
  console.log('Sample script chunk:', chunkWithBuild);
  await page.close();
}

checkBuild().catch(console.error);
