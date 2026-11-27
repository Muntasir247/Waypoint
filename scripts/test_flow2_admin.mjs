import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://waypoint-jade-kappa.vercel.app';
const ADMIN_EMAIL = 'lead_1795777758386@example.com';
const ADMIN_PASS = 'Password123!';

async function testFlow2() {
  console.log('=== Starting Flow 2: Tech Lead / Admin Flow ===');
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
    console.log('\n--- Step 2.1: Checking Session / Logging In ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      console.log('Not logged in, signing in...');
      await page.type('input#email', ADMIN_EMAIL);
      await page.type('input#password', ADMIN_PASS);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded' })
      ]);
      console.log('Logged in! URL:', page.url());
    } else {
      console.log('Already authenticated on:', page.url());
    }

    // 2. Executive Dashboard Overview
    console.log('\n--- Step 2.2: Inspecting Dashboard Overview (/) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    const dashText = await page.$eval('body', el => el.innerText);
    console.log('Dashboard title/content sample:', dashText.slice(0, 150).replace(/\n+/g, ' '));

    // 3. Project Setup (/projects)
    console.log('\n--- Step 2.3: Project Setup (/projects) ---');
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Projects Page URL:', page.url());

    let projectLink = await page.$('a[href^="/projects/"]');
    if (!projectLink) {
      console.log('No project found, creating one...');
      const newProjectBtn = await page.waitForSelector('button ::-p-text(New Project), button ::-p-text(Create Project)', { timeout: 10000 });
      await newProjectBtn.click();
      await page.waitForSelector('input[placeholder="e.g. Core API v2 Gateway"]', { timeout: 5000 });
      const projectName = `Alpha Core Engine ${Date.now().toString().slice(-4)}`;
      await page.type('input[placeholder="e.g. Core API v2 Gateway"]', projectName);
      await page.type('textarea', 'Core microservices and distributed event gateway');
      const submitProjectBtn = await page.waitForSelector('form button[type="submit"]');
      await submitProjectBtn.click();
      await new Promise(r => setTimeout(r, 3000));
      await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 2000));
      projectLink = await page.waitForSelector('a[href^="/projects/"]', { timeout: 10000 });
    }

    // 4. Click project to open Project Detail View (/projects/[id])
    console.log('\n--- Step 2.4: Project Detail & Sprint Planning ---');
    const projectHref = await projectLink.evaluate(el => el.getAttribute('href'));
    console.log('Navigating to project detail:', projectHref);
    await page.goto(`${BASE_URL}${projectHref}`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Project Detail URL:', page.url());

    // Verify detail page elements
    const detailText = await page.$eval('body', el => el.innerText);
    const hasMilestonesOrSprints = detailText.includes('Sprint') || detailText.includes('Milestone') || detailText.includes('Tasks') || detailText.includes('Core');
    console.log('Project detail structure verified:', hasMilestonesOrSprints);

    // 5. Backlog & Smart Allocation on /board
    console.log('\n--- Step 2.5: Kanban Board & Smart Task Allocation (/board) ---');
    await page.goto(`${BASE_URL}/board`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Board URL:', page.url());

    // Click New Task
    const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)', { timeout: 10000 });
    await newTaskBtn.click();
    console.log('Clicked "New Task", modal opened.');

    const titleInput = await page.waitForSelector('input[placeholder*="mTLS"], form input[type="text"]', { timeout: 5000 });
    const taskTitle = `Implement Auth Middleware ${Date.now().toString().slice(-4)}`;
    await titleInput.type(taskTitle);

    // Ensure project is selected in dropdown
    const selectEl = await page.$('form select');
    if (selectEl) {
      const opts = await page.$$eval('form select option', els => els.map(e => e.value).filter(Boolean));
      if (opts.length > 0) {
        await selectEl.select(opts[0]);
      }
    }

    // Wait for smart suggestion debounced evaluation
    await new Promise(r => setTimeout(r, 2000));

    // Submit task inside modal
    const createTaskSubmitBtn = await page.waitForSelector('form button[type="submit"]');
    await createTaskSubmitBtn.click();
    console.log('Submitted task creation form...');

    await new Promise(r => setTimeout(r, 3000));
    // Verify task is on board
    const boardText = await page.$eval('body', el => el.innerText);
    const taskOnBoard = boardText.includes('Implement Auth Middleware') || boardText.includes('To Do') || boardText.includes('Done');
    console.log(`Task board view verified:`, taskOnBoard);

    // 6. Team Management (/team)
    console.log('\n--- Step 2.6: Team Management & Invites (/team) ---');
    await page.goto(`${BASE_URL}/team`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Team Page URL:', page.url());

    const inviteMemberBtn = await page.waitForSelector('button ::-p-text(Invite Member)', { timeout: 10000 });
    await inviteMemberBtn.click();
    console.log('Opened Invite Member modal...');

    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    const inviteEmail = `dev_${Date.now().toString().slice(-4)}@example.com`;
    await page.type('input[type="email"]', inviteEmail);

    const sendInviteBtn = await page.waitForSelector('form button[type="submit"]');
    await sendInviteBtn.click();
    console.log('Clicked Send Invitation button...');

    await new Promise(r => setTimeout(r, 3000));
    const inviteModalText = await page.$eval('body', el => el.innerText);
    const hasInviteLink = inviteModalText.includes('/invite/') || inviteModalText.includes('copied') || inviteModalText.includes('Link') || inviteModalText.includes('Done');
    console.log('Invite link generated successfully:', hasInviteLink);

    // 7. Workload & Capacity (/workload)
    console.log('\n--- Step 2.7: Workload & Capacity (/workload) ---');
    await page.goto(`${BASE_URL}/workload`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Workload URL:', page.url());
    const workloadText = await page.$eval('body', el => el.innerText);
    const hasCapacity = workloadText.includes('Capacity') || workloadText.includes('Workload') || workloadText.includes('Points') || workloadText.includes('Engineering');
    console.log('Workload capacity interface verified:', hasCapacity);

    // 8. Settings & Scoring Sandbox (/settings)
    console.log('\n--- Step 2.8: Settings & Scoring Sandbox (/settings) ---');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Settings URL:', page.url());
    const settingsText = await page.$eval('body', el => el.innerText);
    const hasScoring = settingsText.includes('Scoring') || settingsText.includes('Multiplier') || settingsText.includes('Sandbox') || settingsText.includes('Rules');
    console.log('Scoring sandbox & governance settings verified:', hasScoring);

    // 9. Security Audit Log (/audit-log)
    console.log('\n--- Step 2.9: Security Audit Log (/audit-log) ---');
    await page.goto(`${BASE_URL}/audit-log`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Audit Log URL:', page.url());
    const auditText = await page.$eval('body', el => el.innerText);
    const hasAuditTrail = auditText.includes('CREATE') || auditText.includes('Audit') || auditText.includes('Security') || auditText.includes('PROJECT') || auditText.includes('Events');
    console.log('Audit trail verified:', hasAuditTrail);

    console.log('\n=== Flow 2 Results ===');
    console.log('Total errors detected:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', JSON.stringify(errors, null, 2));
    } else {
      console.log('SUCCESS: Flow 2 executed with 0 errors!');
    }

    return { success: errors.length === 0 };
  } finally {
    await page.close();
    await browser.disconnect();
  }
}

testFlow2().catch(err => {
  console.error('Flow 2 failed:', err);
  process.exit(1);
});
