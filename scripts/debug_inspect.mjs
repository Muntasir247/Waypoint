import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  page.on('request', req => {
    if (req.method() === 'POST') {
      console.log('\n[POST REQ] URL:', req.url());
      console.log('[POST REQ] Next-Action:', req.headers()['next-action']);
      console.log('[POST REQ] PostData:', req.postData());
    }
  });

  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      console.log('\n[POST RES] Status:', res.status());
      console.log('[POST RES] Next-Action:', res.request().headers()['next-action']);
      try {
        const text = await res.text();
        console.log('[POST RES] Body:', text);
      } catch (e) {
        console.log('[POST RES] Could not read body:', e.message);
      }
    }
  });

  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const btn = await page.waitForSelector('button ::-p-text(New Project)');
  await btn.click();
  await new Promise(r => setTimeout(r, 800));

  console.log('Typing project title...');
  await page.type('input[placeholder="e.g. Core API v2 Gateway"]', 'Alpha Test Initiative 101');
  await new Promise(r => setTimeout(r, 500));

  console.log('Submitting form...');
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  console.log('Waiting up to 15 seconds to observe network and DOM...');
  for (let s = 1; s <= 15; s++) {
    await new Promise(r => setTimeout(r, 1000));
    const modal = await page.$('.fixed.inset-0');
    const buttonText = modal ? await page.$eval('button[type="submit"]', b => b.innerText).catch(() => 'no button') : 'modal closed';
    const errText = modal ? await page.$eval('.bg-rose-50', el => el.innerText).catch(() => null) : null;
    console.log(`[T+${s}s] modal: ${!!modal}, buttonText: "${buttonText}", error: ${errText}`);
    if (!modal) {
      console.log('Modal closed! Success!');
      break;
    }
  }

  const projects = await page.$$eval('a[href^="/projects/"]', els => els.map(e => e.href));
  console.log('Projects on page:', projects);

  await page.close();
}

test().catch(console.error);
