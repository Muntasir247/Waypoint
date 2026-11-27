import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[PAGE CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  // Listen to all network requests and responses
  page.on('request', req => {
    if (req.method() === 'POST') {
      console.log(`[REQ POST] ${req.url()}`);
    }
  });
  page.on('response', async res => {
    if (res.request().method() === 'POST') {
      try {
        const text = await res.text();
        console.log(`[RES POST ${res.status()}] ${res.url()}:\n${text.slice(0, 400)}`);
      } catch (e) {
        console.log(`[RES POST ${res.status()}] ${res.url()} (could not read body)`);
      }
    }
  });

  console.log('Navigating to signup/login to get an authenticated session...');
  const testEmail = `diag_${Date.now()}@example.com`;
  const testPass = 'Password123!';

  await page.goto('https://waypoint-jade-kappa.vercel.app/signup', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.type('input#name', 'Diag User');
  await page.type('input#email', testEmail);
  await page.type('input#password', testPass);
  await page.type('input#confirmPassword', testPass);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => document.body.innerText.includes('Registration Successful') || document.body.innerText.includes('Sign in'), { timeout: 15000 });

  await page.goto('https://waypoint-jade-kappa.vercel.app/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  await page.type('input#email', testEmail);
  await page.type('input#password', testPass);
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  // Create a project first
  console.log('Navigating to /projects...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/projects', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Creating project...');
  const newProjBtn = await page.waitForSelector('button ::-p-text(New Project)');
  await newProjBtn.click();
  await new Promise(r => setTimeout(r, 800));
  await page.type('input[placeholder="e.g. Core API v2 Gateway"]', 'Diag Test Platform');
  await page.type('textarea', 'Diagnostic test project');
  const createProjBtn = await page.waitForSelector('form button[type="submit"]');
  await createProjBtn.click();

  await page.waitForSelector('.fixed.inset-0', { hidden: true, timeout: 25000 });
  console.log('Project created!');
  await new Promise(r => setTimeout(r, 1500));

  // Now go to /board
  console.log('Navigating to /board...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Opening New Task modal...');
  const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)');
  await newTaskBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // Inspect form state before typing
  let formState = await page.evaluate(() => {
    const titleInput = document.querySelector('form input[type="text"]');
    const select = document.querySelector('form select');
    const submitBtn = document.querySelector('form button[type="submit"]');
    return {
      titleVal: titleInput?.value,
      selectVal: select?.value,
      selectOptions: Array.from(select?.options || []).map(o => ({ value: o.value, text: o.text, selected: o.selected })),
      submitDisabled: submitBtn?.disabled,
      submitText: submitBtn?.innerText
    };
  });
  console.log('Initial Modal Form State:', JSON.stringify(formState, null, 2));

  console.log('Typing title...');
  const titleInput = await page.waitForSelector('form input[type="text"]');
  await titleInput.type('Core Kernel Scheduler Dispatch');
  await new Promise(r => setTimeout(r, 500));

  formState = await page.evaluate(() => {
    const titleInput = document.querySelector('form input[type="text"]');
    const select = document.querySelector('form select');
    const submitBtn = document.querySelector('form button[type="submit"]');
    return {
      titleVal: titleInput?.value,
      selectVal: select?.value,
      selectOptions: Array.from(select?.options || []).map(o => ({ value: o.value, text: o.text, selected: o.selected })),
      submitDisabled: submitBtn?.disabled,
      submitText: submitBtn?.innerText
    };
  });
  console.log('Modal Form State After Typing Title:', JSON.stringify(formState, null, 2));

  // If select has no value or submit is disabled:
  if (formState.submitDisabled) {
    console.log('Submit button is disabled! Checking why...');
    if (formState.selectOptions.length > 1) {
      const optVal = formState.selectOptions[1].value;
      console.log(`Explicitly selecting option: ${optVal}`);
      await page.select('form select', optVal);
      await new Promise(r => setTimeout(r, 500));
      const afterSelectState = await page.evaluate(() => {
        const select = document.querySelector('form select');
        const submitBtn = document.querySelector('form button[type="submit"]');
        return {
          selectVal: select?.value,
          submitDisabled: submitBtn?.disabled
        };
      });
      console.log('After page.select:', afterSelectState);
    }
  }

  console.log('Clicking Submit Task button...');
  const submitBtn = await page.waitForSelector('form button[type="submit"]');
  await submitBtn.click();

  console.log('Waiting 6s to see if modal closes or error appears...');
  await new Promise(r => setTimeout(r, 6000));

  const finalCheck = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    const errorEl = document.querySelector('.bg-rose-50');
    return {
      modalStillOpen: !!modal,
      errorText: errorEl ? errorEl.innerText : null
    };
  });
  console.log('Final Result:', finalCheck);

  await page.close();
  await browser.disconnect();
}

main().catch(console.error);
