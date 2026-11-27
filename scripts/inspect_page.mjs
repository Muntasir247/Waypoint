import puppeteer from 'puppeteer-core';

async function main() {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await b.newPage();
  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const links = await page.$$eval('a', els => els.map(a => ({ href: a.href, text: a.innerText.trim() })));
  console.log('Project links:', links.filter(l => l.href.includes('/projects/')));
  const bodyText = await page.$eval('body', el => el.innerText);
  console.log('Body snippet:', bodyText.slice(0, 400).replace(/\n+/g, ' '));
  await page.close();
  await b.disconnect();
}

main().catch(console.error);

