import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  });

  console.log('Polling live site for new build deployment...');
  for (let attempt = 1; attempt <= 25; attempt++) {
    const page = await browser.newPage();
    let found = false;

    page.on('response', async res => {
      const url = res.url();
      if (url.includes('/_next/static/chunks/') && url.endsWith('.js')) {
        try {
          const text = await res.text();
          if (text.includes('effectiveProjectId')) {
            found = true;
          }
        } catch {}
      }
    });

    try {
      await page.goto('https://waypoint-jade-kappa.vercel.app/board', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
    } catch {}

    await page.close();

    if (found) {
      console.log(`>>> SUCCESS: Found new build (effectiveProjectId) deployed on attempt ${attempt}! <<<`);
      await browser.disconnect();
      return;
    }

    console.log(`[Attempt ${attempt}/25] New build not active yet, waiting 6 seconds...`);
    await new Promise(r => setTimeout(r, 6000));
  }

  console.log('Timeout waiting for deployment.');
  await browser.disconnect();
}

main().catch(console.error);
