import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://waypoint-jade-kappa.vercel.app';

async function testFlow1() {
  console.log('=== Starting Flow 1: Visitor / New User Flow ===');
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
    // 1. Visit Landing Page
    console.log('\n--- Step 1.1: Visiting Landing Page ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    const currentUrl = page.url();
    console.log('Landing page URL:', currentUrl);

    // If redirected to login or dashboard, handle cookies
    const title = await page.title();
    console.log('Page Title:', title);

    // Check for landing page elements
    const heroHeading = await page.$eval('h1', el => el.innerText).catch(() => null);
    console.log('Hero Heading:', heroHeading);

    // 2. Navigate to /signup
    console.log('\n--- Step 1.2: Navigating to /signup ---');
    await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle2' });
    console.log('Signup URL:', page.url());

    // Check signup form inputs
    const nameInput = await page.$('input[name="name"], input#name');
    const emailInput = await page.$('input[name="email"], input#email');
    const passwordInput = await page.$('input[name="password"], input#password');

    if (!nameInput || !emailInput || !passwordInput) {
      throw new Error(`Missing signup inputs: name=${!!nameInput}, email=${!!emailInput}, password=${!!passwordInput}`);
    }
    console.log('All signup inputs present: name, email, password');

    // Test form validation: try submitting empty form
    console.log('\n--- Step 1.3: Testing Signup Form Validation ---');
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    console.log('Attempted empty submit, checking if stayed on signup page...');
    if (!page.url().includes('/signup')) {
      throw new Error('Form submitted with empty inputs!');
    }
    console.log('Validation prevented empty submission successfully.');

    // 3. Register a new user
    const timestamp = Date.now();
    const testEmail = `lead_${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testName = `Lead Test ${timestamp.toString().slice(-4)}`;

    console.log(`\n--- Step 1.4: Registering New User (${testEmail}) ---`);
    await nameInput.type(testName);
    await emailInput.type(testEmail);
    await passwordInput.type(testPassword);
    
    const confirmPassInput = await page.$('input#confirmPassword');
    if (!confirmPassInput) {
      throw new Error('Confirm password input not found!');
    }
    await confirmPassInput.type(testPassword);
    
    // Submit registration
    await submitBtn.click();
    await page.waitForSelector('text/Registration Successful!', { timeout: 10000 });
    console.log('Registration success screen verified!');

    // Click Go to Sign In
    console.log('\n--- Step 1.5: Navigating to Sign In & Logging In ---');
    const goToSignInLink = await page.$('a[href="/login"]');
    if (!goToSignInLink) {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    } else {
      await Promise.all([
        goToSignInLink.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }
    console.log('Login URL:', page.url());

    // Fill login form
    const loginEmail = await page.$('input[name="email"], input#email');
    const loginPass = await page.$('input[name="password"], input#password');
    await loginEmail.type(testEmail);
    await loginPass.type(testPassword);
    const loginBtn = await page.$('button[type="submit"]');
    
    await Promise.all([
      loginBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);
    console.log('Post-login URL:', page.url());

    // Verify workspace auto-provisioning
    console.log('\n--- Step 1.6: Verifying Workspace Auto-Provisioning & Dashboard ---');
    await new Promise(r => setTimeout(r, 2000));
    const bodyText = await page.$eval('body', el => el.innerText);
    const hasWorkspace = bodyText.includes('Waypoint Core') || bodyText.includes('Sprint') || bodyText.includes('Projects');
    console.log('Workspace indicator found:', hasWorkspace);
    console.log('Current URL:', page.url());

    // 4. Test Forgot Password Page
    console.log('\n--- Step 1.7: Testing Forgot Password Page ---');
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'networkidle2' });
    console.log('Forgot Password URL:', page.url());
    const fpEmail = await page.$('input[type="email"]');
    if (fpEmail) {
      await fpEmail.type(testEmail);
      const fpSubmit = await page.$('button[type="submit"]');
      if (fpSubmit) {
        await fpSubmit.click();
        await new Promise(r => setTimeout(r, 2000));
        console.log('Forgot password submitted successfully.');
      }
    }

    console.log('\n=== Flow 1 Results ===');
    console.log('Total errors detected:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', JSON.stringify(errors, null, 2));
    } else {
      console.log('SUCCESS: Flow 1 executed with 0 errors!');
    }

    return { success: errors.length === 0, testEmail, testPassword, testName };
  } finally {
    await page.close();
    await browser.disconnect();
  }
}

testFlow1().catch(err => {
  console.error('Flow 1 failed:', err);
  process.exit(1);
});
