import puppeteer from 'puppeteer-core';

async function main() {
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const page = await b.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });
  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]:', err.message);
  });

  console.log('Navigating to /projects ...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL:', page.url());

  const newProjBtn = await page.waitForSelector('button ::-p-text(New Project), button ::-p-text(Create Project)');
  await newProjBtn.click();
  console.log('Modal opened.');
  await new Promise(r => setTimeout(r, 1000));

  const nameInput = await page.waitForSelector('input[placeholder="e.g. Core API v2 Gateway"]');
  const testProjName = `Vercel Live Project ${Date.now().toString().slice(-4)}`;
  await nameInput.type(testProjName);
  console.log('Typed project name:', testProjName);
  await new Promise(r => setTimeout(r, 500));

  console.log('Invoking form.requestSubmit() ...');
  await page.$eval('form', f => f.requestSubmit());

  console.log('Waiting for server action response...');
  await new Promise(r => setTimeout(r, 6000));

  const body = await page.$eval('body', el => el.innerText);
  console.log('Project in DOM?', body.includes(testProjName));
  const projectLinks = await page.$$eval('a[href^="/projects/"]', els => els.map(a => a.href));
  console.log('Project links found:', projectLinks);

  await page.close();
  await b.disconnect();
}

main().catch(console.error);
