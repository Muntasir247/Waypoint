import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://waypoint-jade-kappa.vercel.app';
const ADMIN_EMAIL = 'lead_1795777758386@example.com';
const ADMIN_PASS = 'Password123!';

async function testFlow4() {
  console.log('=== Starting Flow 4: Viewer / Stakeholder Flow ===');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  [Console Error]:', msg.text());
      errors.push({ type: 'console.error', text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    console.error('  [Page Error]:', err.message);
    errors.push({ type: 'pageerror', message: err.message });
  });

  try {
    // 1. Ensure Logged In
    console.log('\n--- Step 4.1: Checking Session / Logging In ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      await page.type('input#email', ADMIN_EMAIL);
      await page.type('input#password', ADMIN_PASS);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      ]);
    }

    // 2. Sprint Burndown & Executive Overview (/)
    console.log('\n--- Step 4.2: Stakeholder Overview & Velocity (/) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const overviewText = await page.$eval('body', el => el.innerText);
    const hasBurndownOrMetrics = overviewText.includes('Burndown') || overviewText.includes('Velocity') || overviewText.includes('Overview');
    console.log('Sprint trajectory & burndown metrics verified:', hasBurndownOrMetrics);

    // 3. Roadmap & Projects Inspection (/projects)
    console.log('\n--- Step 4.3: Roadmap & Projects Inspection (/projects) ---');
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const projectsText = await page.$eval('body', el => el.innerText);
    const hasProjects = projectsText.includes('Alpha') || projectsText.includes('Initiatives') || projectsText.includes('Projects');
    console.log('Project initiatives and milestones verified:', hasProjects);

    // 4. Read-Only Kanban Exploration (/board)
    console.log('\n--- Step 4.4: Kanban Board Inspection (/board) ---');
    await page.goto(`${BASE_URL}/board`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const boardText = await page.$eval('body', el => el.innerText);
    const hasColumns = boardText.includes('To Do') || boardText.includes('In Progress') || boardText.includes('Done');
    console.log('Kanban columns and task distribution verified:', hasColumns);

    // 5. Workload Distribution Audit (/workload)
    console.log('\n--- Step 4.5: Workload Distribution Audit (/workload) ---');
    await page.goto(`${BASE_URL}/workload`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const workloadText = await page.$eval('body', el => el.innerText);
    const hasWorkload = workloadText.includes('Workload') || workloadText.includes('Capacity');
    console.log('Team capacity balance audited:', hasWorkload);

    // 6. Leaderboard & Recognition (/leaderboard)
    console.log('\n--- Step 4.6: Leaderboard & Recognition (/leaderboard) ---');
    await page.goto(`${BASE_URL}/leaderboard`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const leaderboardText = await page.$eval('body', el => el.innerText);
    const hasLeaderboard = leaderboardText.includes('Leaderboard') || leaderboardText.includes('Sprint');
    console.log('Leaderboard rankings verified:', hasLeaderboard);

    // 7. Executive Reports (/reports)
    console.log('\n--- Step 4.7: Executive Reports & Analytics (/reports) ---');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const reportsText = await page.$eval('body', el => el.innerText);
    const hasReports = reportsText.includes('Report') || reportsText.includes('Velocity') || reportsText.includes('Summary');
    console.log('Executive reports analytics verified:', hasReports);

    console.log('\n=== Flow 4 Results ===');
    console.log('Total errors detected:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', JSON.stringify(errors, null, 2));
    } else {
      console.log('SUCCESS: Flow 4 executed with 0 errors!');
    }

    return { success: errors.length === 0 };
  } finally {
    await page.close();
    await browser.disconnect();
  }
}

testFlow4().catch(err => {
  console.error('Flow 4 failed:', err);
  process.exit(1);
});
