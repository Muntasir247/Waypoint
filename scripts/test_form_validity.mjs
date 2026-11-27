import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[PAGE CONSOLE]', msg.text()));

  await page.goto('https://waypoint-jade-kappa.vercel.app/board', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));

  console.log('Clicking New Task button...');
  const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)');
  await newTaskBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  console.log('Typing title...');
  const titleInput = await page.waitForSelector('form input[type="text"]');
  await titleInput.type('Diagnose scheduler latency bug');
  await new Promise(r => setTimeout(r, 800));

  const diag = await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return { error: 'No form found' };

    const elements = Array.from(form.elements).map(el => ({
      tagName: el.tagName,
      type: el.type,
      name: el.name,
      value: el.value,
      required: el.required,
      validity: {
        valid: el.validity.valid,
        valueMissing: el.validity.valueMissing,
        customError: el.validity.customError,
      },
      validationMessage: el.validationMessage
    }));

    return {
      formValid: form.checkValidity(),
      elements
    };
  });

  console.log('Form Validity Diagnostics:', JSON.stringify(diag, null, 2));

  // Let's add an event listener to form on submit
  await page.evaluate(() => {
    const form = document.querySelector('form');
    form.addEventListener('submit', () => console.log('FORM SUBMIT EVENT FIRED!'));
  });

  console.log('Clicking Submit button via page.click...');
  await page.click('form button[type="submit"]');

  await new Promise(r => setTimeout(r, 3000));

  const afterClick = await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    return { modalStillOpen: !!modal };
  });
  console.log('After page.click:', afterClick);

  if (afterClick.modalStillOpen) {
    console.log('Trying form.requestSubmit()...');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form.requestSubmit();
    });
    await new Promise(r => setTimeout(r, 3000));
    const afterRequestSubmit = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return { modalStillOpen: !!modal };
    });
    console.log('After form.requestSubmit():', afterRequestSubmit);
  }

  await page.close();
  await browser.disconnect();
}

main().catch(console.error);
