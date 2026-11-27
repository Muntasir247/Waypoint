import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log('POST Response:', res.status(), text.slice(0, 300));
      } catch (e) {}
    }
  });

  await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking New Task button...');
  const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)');
  await newTaskBtn.click();

  console.log('Waiting 5s to see modal responses...');
  await new Promise(r => setTimeout(r, 5000));

  const selects = await page.$$eval('select', els => els.map(s => ({
    className: s.className,
    options: Array.from(s.options).map(o => ({ value: o.value, text: o.text }))
  })));
  console.log('Select elements after 5s:', JSON.stringify(selects, null, 2));

  await page.close();
}

test().catch(console.error);
