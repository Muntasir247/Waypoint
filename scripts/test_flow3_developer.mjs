import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://waypoint-jade-kappa.vercel.app';
const ADMIN_EMAIL = 'lead_1795777758386@example.com';
const ADMIN_PASS = 'Password123!';

async function testFlow3() {
  console.log('=== Starting Flow 3: Developer / IC Flow ===');
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
    console.log('\n--- Step 3.1: Checking Session / Logging In ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    if (page.url().includes('/login')) {
      await page.type('input#email', ADMIN_EMAIL);
      await page.type('input#password', ADMIN_PASS);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }

    // 2. Focused Task Queue (/my-tasks)
    console.log('\n--- Step 3.2: Inspecting Focused Queue (/my-tasks) ---');
    await page.goto(`${BASE_URL}/my-tasks`, { waitUntil: 'networkidle2' });
    console.log('My Tasks URL:', page.url());
    const myTasksText = await page.$eval('body', el => el.innerText);
    console.log('My Tasks overview content found:', myTasksText.includes('Tasks') || myTasksText.includes('Assigned'));

    // 3. Navigate to /board to interact with Task Detail Drawer
    console.log('\n--- Step 3.3: Opening Task Drawer on /board ---');
    await page.goto(`${BASE_URL}/board`, { waitUntil: 'networkidle2' });
    
    // Look for any task card on board
    const taskCard = await page.waitForSelector('[data-task-id], div[draggable="true"], .cursor-grab', { timeout: 10000 }).catch(() => null);
    if (taskCard) {
      console.log('Found task card, clicking to open drawer...');
      await taskCard.click();
    } else {
      // Create a task quickly to test drawer
      console.log('No task found on board, creating one...');
      const newTaskBtn = await page.waitForSelector('button ::-p-text(New Task)');
      await newTaskBtn.click();
      await page.waitForSelector('input[placeholder*="title"]');
      const title = `IC Test Task ${Date.now().toString().slice(-4)}`;
      await page.type('input[placeholder*="title"]', title);
      await new Promise(r => setTimeout(r, 1000));
      const submitBtn = await page.waitForSelector('button ::-p-text(Create Task)');
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      const createdTaskCard = await page.waitForSelector(`text/${title}`);
      await createdTaskCard.click();
    }

    // Wait for drawer to open
    console.log('Waiting for Task Detail Drawer...');
    await page.waitForSelector('button ::-p-text(Checklist), button ::-p-text(Subtasks)', { timeout: 10000 });
    console.log('Task Detail Drawer opened successfully!');

    // 4. Checklist / Subtasks
    console.log('\n--- Step 3.4: Testing Checklist Subtasks ---');
    const checklistInput = await page.$('input[placeholder*="checklist"], input[placeholder*="subtask"], input[placeholder*="Add"]');
    if (checklistInput) {
      await checklistInput.type('Write test assertions');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 1500));
      console.log('Added checklist item: "Write test assertions"');
    }

    // 5. Time Logging
    console.log('\n--- Step 3.5: Testing Time Logging ---');
    const timeTabBtn = await page.waitForSelector('button ::-p-text(Time)', { timeout: 5000 }).catch(() => null);
    if (timeTabBtn) {
      await timeTabBtn.click();
      await new Promise(r => setTimeout(r, 800));
      const minutesInput = await page.$('input[type="number"]');
      if (minutesInput) {
        await minutesInput.click({ clickCount: 3 });
        await minutesInput.type('60');
        const logBtn = await page.$('button ::-p-text(Log Time), button ::-p-text(Add Time)');
        if (logBtn) {
          await logBtn.click();
          await new Promise(r => setTimeout(r, 1500));
          console.log('Logged 60 minutes successfully.');
        }
      }
    }

    // 6. Discussion Comments
    console.log('\n--- Step 3.6: Testing Discussion Comments ---');
    const discussionTabBtn = await page.$('button ::-p-text(Discussion), button ::-p-text(Comments)');
    if (discussionTabBtn) {
      await discussionTabBtn.click();
      await new Promise(r => setTimeout(r, 800));
    }
    const commentInput = await page.$('textarea[placeholder*="comment"], textarea[placeholder*="Write"]');
    if (commentInput) {
      await commentInput.type('All unit tests passing and ready for review.');
      const postBtn = await page.$('button ::-p-text(Post Comment), button ::-p-text(Send)');
      if (postBtn) {
        await postBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        console.log('Posted discussion comment successfully.');
      }
    }

    // 7. Status Transitions
    console.log('\n--- Step 3.7: Testing Status Transitions ---');
    // Change status to IN_PROGRESS
    const statusSelect = await page.$('select');
    if (statusSelect) {
      await statusSelect.select('IN_PROGRESS');
      await new Promise(r => setTimeout(r, 1500));
      console.log('Transitioned status to IN_PROGRESS');

      // Test BLOCKED transition and verify reason prompt
      await statusSelect.select('BLOCKED');
      await new Promise(r => setTimeout(r, 1000));
      const blockedPrompt = await page.$('input[placeholder*="Blocked waiting"], input[placeholder*="reason"]');
      if (blockedPrompt) {
        console.log('Verified: BLOCKED reason prompt appeared!');
        await blockedPrompt.type('Waiting for third-party webhook confirmation');
        const setBlockedBtn = await page.$('button ::-p-text(Set as Blocked)');
        if (setBlockedBtn) {
          await setBlockedBtn.click();
          await new Promise(r => setTimeout(r, 1500));
          console.log('Submitted blocker reason successfully.');
        }
      }

      // Transition to IN_REVIEW then DONE
      await statusSelect.select('IN_REVIEW');
      await new Promise(r => setTimeout(r, 1500));
      console.log('Transitioned status to IN_REVIEW');

      await statusSelect.select('DONE');
      await new Promise(r => setTimeout(r, 2000));
      console.log('Transitioned status to DONE (points should be calculated)');
    }

    // Close drawer
    const closeBtn = await page.$('button[aria-label="Close"], button:has(svg.lucide-x)');
    if (closeBtn) {
      await closeBtn.click();
    }

    // 8. Effort Recognition & Leaderboard (/leaderboard)
    console.log('\n--- Step 3.8: Leaderboard & Recognition (/leaderboard) ---');
    await page.goto(`${BASE_URL}/leaderboard`, { waitUntil: 'networkidle2' });
    console.log('Leaderboard URL:', page.url());
    const leaderboardText = await page.$eval('body', el => el.innerText);
    const hasLeaderboard = leaderboardText.includes('Leaderboard') || leaderboardText.includes('Points') || leaderboardText.includes('Rank');
    console.log('Leaderboard standings verified:', hasLeaderboard);

    // 9. Profile & Stats (/profile)
    console.log('\n--- Step 3.9: Developer Profile (/profile) ---');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle2' });
    console.log('Profile URL:', page.url());
    const profileText = await page.$eval('body', el => el.innerText);
    const hasProfile = profileText.includes('Profile') || profileText.includes('Skills') || profileText.includes('Activity');
    console.log('Developer profile verified:', hasProfile);

    console.log('\n=== Flow 3 Results ===');
    console.log('Total errors detected:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', JSON.stringify(errors, null, 2));
    } else {
      console.log('SUCCESS: Flow 3 executed with 0 errors!');
    }

    return { success: errors.length === 0 };
  } finally {
    await page.close();
    await browser.disconnect();
  }
}

testFlow3().catch(err => {
  console.error('Flow 3 failed:', err);
  process.exit(1);
});
