import puppeteer from 'puppeteer-core';

async function main() {
  console.log('Connecting to browser on http://127.0.0.1:9222...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 }
  });
  console.log('Connected! Creating page...');
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  
  console.log('Navigating to https://waypoint-jade-kappa.vercel.app/ ...');
  await page.goto('https://waypoint-jade-kappa.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  const title = await page.title();
  const url = page.url();
  console.log('Page Title:', title);
  console.log('Final URL:', url);
  
  await page.close();
  await browser.disconnect();
  console.log('Test completed successfully!');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
