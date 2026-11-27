import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  page.on('request', req => {
    if (req.method() === 'POST') {
      console.log('POST REQUEST:', req.url(), 'ACTION:', req.headers()['next-action'], 'BODY:', req.postData());
    }
  });
  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log('POST RESPONSE:', res.status(), 'ACTION:', res.request().headers()['next-action'], 'BODY:', text.slice(0, 400));
      } catch (e) {
        console.log('Could not read response text');
      }
    }
  });

  console.log('Navigating to https://waypoint-jade-kappa.vercel.app/projects...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking New Project button...');
  const btn = await page.waitForSelector('button ::-p-text(New Project)');
  await btn.click();
  await new Promise(r => setTimeout(r, 1000));

  const inputEl = await page.waitForSelector('input[placeholder="e.g. Core API v2 Gateway"]');
  await inputEl.click();
  await page.type('input[placeholder="e.g. Core API v2 Gateway"]', 'Debug Initiative Project', { delay: 30 });
  
  console.log('Clicking submit button...');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));

  const modalStillThere = await page.$('.fixed.inset-0');
  if (modalStillThere) {
    const modalText = await page.$eval('.fixed.inset-0', el => el.innerText);
    console.log('Modal text after submit:', modalText);
  }

  await page.close();
}

test().catch(console.error);
