import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));
  const projects = await page.$$eval('a[href^="/projects/"]', els => els.map(e => ({ href: e.href, text: e.innerText })));
  console.log('Projects on page now:', JSON.stringify(projects, null, 2));
  await page.close();
}

test().catch(console.error);
