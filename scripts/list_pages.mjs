import puppeteer from 'puppeteer-core';

async function check() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const pages = await browser.pages();
  for (let i = 0; i < pages.length; i++) {
    console.log(`Page ${i}: ${await pages[i].title()} -> ${pages[i].url()}`);
  }
}

check().catch(console.error);
