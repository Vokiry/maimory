import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Launching Playwright browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error') {
      console.error('Browser console error:', text);
    }
  });

  page.on('pageerror', err => {
    console.error('Page error:', err.message);
    pageErrors.push(err.message);
  });

  console.log('🌐 Navigating to http://127.0.0.1:4321...');
  await page.goto('http://127.0.0.1:4321', { waitUntil: 'networkidle' });

  // Wait for canvas to mount and render
  await page.waitForSelector('canvas', { timeout: 10000 });
  console.log('✅ Canvas element found');

  // Verify Navbar title
  const brandTitle = await page.textContent('header');
  console.log('Header text preview:', brandTitle?.substring(0, 50));
  if (!brandTitle?.includes('MAIMORY')) {
    throw new Error('Expected MAIMORY in header');
  }

  // Verify sidebar filters
  await page.waitForSelector('aside', { timeout: 5000 });
  console.log('✅ Sidebar filters loaded');

  // Wait 1.5s for force-graph simulation to settle
  await page.waitForTimeout(1500);

  // Take full screenshot
  await page.screenshot({ path: 'tests/screenshot-main.png', fullPage: true });
  console.log('📸 Screenshot saved: tests/screenshot-main.png');

  // Test search interaction
  console.log('🔍 Testing search input...');
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('Architecture');
    await page.waitForTimeout(500);
    console.log('✅ Search input working');
  }

  // Open Create Entity Modal
  console.log('✨ Testing Create Entity Modal...');
  const createEntityBtn = page.locator('button:has-text("Entity")');
  await createEntityBtn.click();
  await page.waitForSelector('input[placeholder*="e.g. OBS-Templates-Architecture"]');
  console.log('✅ Create Entity modal opened successfully');

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Open Settings Modal
  console.log('⚙️ Testing Settings Modal...');
  const settingsBtn = page.locator('button[title*="Memory Settings"]');
  await settingsBtn.click();
  await page.waitForSelector('text=MCP Memory Storage Settings');
  console.log('✅ Settings modal opened successfully');

  await page.screenshot({ path: 'tests/screenshot-settings.png' });
  console.log('📸 Screenshot saved: tests/screenshot-settings.png');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Test Nodes tab and Node Selection in Inspector
  console.log('📌 Testing Nodes tab and Inspector...');
  const nodesTab = page.getByRole('button', { name: 'Nodes', exact: true });
  await nodesTab.click();
  await page.waitForTimeout(400);

  // Click on OBS-Templates-Architecture
  const obsNodeBtn = page.locator('button:has-text("OBS-Templates-Architecture")').first();
  await obsNodeBtn.click();
  await page.waitForTimeout(600);

  // Verify Inspector panel opened
  await page.waitForSelector('text=Observations (3)');
  console.log('✅ Inspector panel opened for OBS-Templates-Architecture');

  // Take screenshot with inspector open
  await page.screenshot({ path: 'tests/screenshot-inspector.png' });
  console.log('📸 Screenshot saved: tests/screenshot-inspector.png');

  // Check errors
  if (pageErrors.length > 0) {
    throw new Error(`Found ${pageErrors.length} page errors: ${pageErrors.join(', ')}`);
  }

  const criticalErrors = consoleMessages.filter(m => m.startsWith('[error]'));
  if (criticalErrors.length > 0) {
    throw new Error(`Found critical console errors: ${criticalErrors.join('\n')}`);
  }

  console.log('🎉 Verification completed successfully with 0 errors!');
  await browser.close();
}

main().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
