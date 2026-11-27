import puppeteer from 'puppeteer-core';

async function main() {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await b.newPage();
  const startTime = Date.now();
  console.log('Navigating to https://waypoint-jade-kappa.vercel.app/board ...');
  try {
    await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded', timeout: 35000 });
    console.log(`Loaded in ${Date.now() - startTime}ms! URL: ${page.url()}`);
    const text = await page.$eval('body', el => el.innerText);
    console.log('Board text snippet:', text.slice(0, 300).replace(/\n+/g, ' '));
  } catch (e) {
    console.error('Nav failed:', e.message);
  } finally {
    await page.close();
    await b.disconnect();
  }
}

main().catch(console.error);
