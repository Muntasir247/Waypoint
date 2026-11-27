import puppeteer from 'puppeteer-core';

async function checkChecks() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  await page.goto('https://github.com/Muntasir247/Waypoint/commit/5b1ea02', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const text = await page.$eval('body', b => b.innerText);
  const statusLines = text.split('\n').filter(l => l.includes('Vercel') || l.includes('check') || l.includes('deploy') || l.includes('passed') || l.includes('failed') || l.includes('pending'));
  console.log('Status lines:', statusLines.join('\n'));
  await page.close();
}

checkChecks().catch(console.error);
