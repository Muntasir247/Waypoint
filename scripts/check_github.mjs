import puppeteer from 'puppeteer-core';

async function checkGithub() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  await page.goto('https://github.com/Muntasir247/Waypoint/commits/main', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const text = await page.$eval('body', b => b.innerText);
  console.log('GitHub commits text snippet:');
  const lines = text.split('\n').filter(l => l.includes('fix') || l.includes('perf') || l.includes('commit') || l.includes('Verified') || l.includes('ago'));
  console.log(lines.slice(0, 15).join('\n'));
  await page.close();
}

checkGithub().catch(console.error);
