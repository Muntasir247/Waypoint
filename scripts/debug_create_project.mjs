import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://waypoint-jade-kappa.vercel.app';
const ADMIN_EMAIL = 'lead_1795777758386@example.com';
const ADMIN_PASS = 'Password123!';

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log('--- POST Response (' + res.status() + ' ' + res.url() + ') ---');
        console.log(text);
      } catch (e) {
        console.log('POST Response (unreadable):', res.status(), res.url());
      }
    }
  });

  await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  if (page.url().includes('/login')) {
    console.log('Signing in...');
    await page.type('input#email', ADMIN_EMAIL);
    await page.type('input#password', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('Current URL:', page.url());
  const bodyTextBefore = await page.$eval('body', el => el.innerText);
  console.log('Body before click:', bodyTextBefore.slice(0, 200).replace(/\n+/g, ' '));

  // Find New Project button
  const newProjectBtn = await page.waitForSelector('button ::-p-text(New Project), button ::-p-text(Create Project)');
  console.log('Found New Project button, clicking...');
  await newProjectBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  const nameInput = await page.waitForSelector('input[placeholder="e.g. Core API v2 Gateway"]');
  console.log('Found modal name input, typing...');
  await nameInput.type('Debug Core Project');

  const submitBtn = await page.waitForSelector('form button[type="submit"]');
  console.log('Submit button disabled?', await submitBtn.evaluate(el => el.disabled));
  console.log('Submit button text:', await submitBtn.evaluate(el => el.innerText));
  
  console.log('Clicking submit...');
  await submitBtn.click();
  
  await new Promise(r => setTimeout(r, 4000));

  // Check if error message is displayed in modal
  const modalError = await page.$eval('.bg-rose-50', el => el.innerText).catch(() => null);
  console.log('Modal error if any:', modalError);

  const bodyTextAfter = await page.$eval('body', el => el.innerText);
  console.log('Body after submit:', bodyTextAfter.slice(0, 400).replace(/\n+/g, ' '));

  await page.close();
  await browser.disconnect();
}

main().catch(console.error);
