import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log(`POST response from ${res.url()} [${res.status()}]:`, text.slice(0, 300));
      } catch {}
    }
  });

  console.log('Logging in...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Use the test account or default
  await page.type('input[name="email"], input#email', 'demo@waypoint.dev');
  await page.type('input[name="password"], input#password', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  console.log('Navigating to /board...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Clicking New Task button...');
  const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)');
  await newTaskBtn.click();
  await new Promise(r => setTimeout(r, 1500));

  console.log('Typing title...');
  const titleInput = await page.waitForSelector('input[placeholder*="mTLS"], form input[type="text"]');
  await titleInput.type('Investigate microkernel scheduler latency');

  console.log('Checking selects...');
  const selects = await page.$$eval('form select', els => els.map(s => ({
    name: s.name,
    value: s.value,
    options: Array.from(s.options).map(o => ({ value: o.value, text: o.text }))
  })));
  console.log('Selects found:', JSON.stringify(selects, null, 2));

  // If select has value "", let's see why
  const projectSelect = await page.$('form select');
  if (projectSelect) {
    const val = await projectSelect.evaluate(el => el.value);
    console.log('Current project select value:', val);
    if (!val) {
      const firstOptVal = await page.$eval('form select option:nth-child(2)', el => el.value).catch(() => null);
      console.log('First option value:', firstOptVal);
      if (firstOptVal) {
        await page.select('form select', firstOptVal);
        console.log('Selected option value:', firstOptVal);
      }
    }
  }

  console.log('Clicking submit button...');
  const submitBtn = await page.waitForSelector('form button[type="submit"]');
  await submitBtn.click();

  console.log('Waiting 5s to observe response...');
  await new Promise(r => setTimeout(r, 5000));

  const errorEl = await page.$('.bg-rose-50');
  if (errorEl) {
    console.log('Error banner text:', await errorEl.evaluate(el => el.innerText));
  } else {
    console.log('No error banner.');
  }

  const modalStillPresent = await page.$('.fixed.inset-0');
  console.log('Modal still present:', !!modalStillPresent);

  await page.close();
  await browser.disconnect();
}

main().catch(console.error);
