import puppeteer from 'puppeteer-core';

async function main() {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await b.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE_ERR:', err.message));

  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('URL:', page.url());

  const newProjBtn = await page.waitForSelector('button ::-p-text(New Project), button ::-p-text(Create Project)');
  await newProjBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  const nameInput = await page.waitForSelector('input[placeholder="e.g. Core API v2 Gateway"]');
  await nameInput.type('Investigate Test Project');
  await new Promise(r => setTimeout(r, 500));

  const submitBtn = await page.waitForSelector('form button[type="submit"]');
  console.log('Button text:', await submitBtn.evaluate(el => el.innerText), 'Disabled:', await submitBtn.evaluate(el => el.disabled));

  await submitBtn.click();
  console.log('Clicked submit...');

  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const errText = await page.$eval('.bg-rose-50', el => el.innerText).catch(() => null);
    if (errText) console.log(`[Second ${i+1}] Modal error:`, errText);
    const body = await page.$eval('body', el => el.innerText);
    if (body.includes('Investigate Test Project')) {
      console.log(`[Second ${i+1}] PROJECT FOUND ON PAGE!`);
      break;
    }
  }

  await page.close();
  await b.disconnect();
}

main().catch(console.error);
