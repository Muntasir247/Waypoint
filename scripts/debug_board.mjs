import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  const start = Date.now();
  console.log('Navigating to /board...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded' });
  console.log(`Loaded /board in ${(Date.now() - start)}ms! URL: ${page.url()}`);
  
  const text = await page.$eval('body', b => b.innerText);
  console.log('Has Task Workspace:', text.includes('Task Workspace'));
  console.log('Has New Task button:', text.includes('New Task'));

  await page.close();
}

test().catch(console.error);
