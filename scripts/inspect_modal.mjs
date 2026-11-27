import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('/board')) || pages[0];
  console.log('Current URL:', page.url());
  
  const errorEl = await page.$('.bg-rose-50');
  if (errorEl) {
    console.log('Error banner text:', await errorEl.evaluate(el => el.innerText));
  } else {
    console.log('No error banner found.');
  }

  const modal = await page.$('.fixed.inset-0');
  if (modal) {
    const text = await modal.evaluate(el => el.innerText);
    console.log('Modal text:\n', text);
    const selects = await modal.$$eval('select', els => els.map(s => ({
      value: s.value,
      options: Array.from(s.options).map(o => ({ value: o.value, text: o.text, selected: o.selected }))
    })));
    console.log('Modal selects:', JSON.stringify(selects, null, 2));
  } else {
    console.log('Modal not found on page.');
  }

  await browser.disconnect();
}

main().catch(console.error);
