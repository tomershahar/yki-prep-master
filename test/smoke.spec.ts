import { test, expect } from '@playwright/test';

// Helper to wait for practice content to load
// AI generation can be slow, so we increase the timeout to 60 seconds
async function waitForPracticeToLoad(page) {
  // We use .first() here because strict mode might fail if "Question" appears multiple times
  await expect(page.locator('text=/Question|Task|Read the text|Listen|Prompt/i').first())
    .toBeVisible({ timeout: 60000 });
}

test.describe('Quick Practice Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ideally wait for a specific dashboard element instead of networkidle
    // But keeping your logic for now:
    await page.waitForLoadState('networkidle');
  });

  test('Reading Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    
    // FIX: Use specific heading or .first() to avoid matching the description text below the button
    await page.click('h3:has-text("Reading Practice"), button:has-text("Reading Practice")');
    
    await waitForPracticeToLoad(page);
    
    // FIX: Add .first() to handle multiple matches
    await expect(page.locator('text=/Read the text|Question/i').first()).toBeVisible();
    
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.isVisible()) {
      await firstRadio.click();
    }
    
    // Check if we have a submit or next button
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Next")').first();
    if (await submitButton.isVisible()) {
        await submitButton.click();
    }
    
    await page.click('button:has-text("Exit Practice")');
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('Listening Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    
    // FIX: Target the specific card title or button to avoid "Strict Mode" error
    await page.locator('text=Listening Practice').first().click();
    
    await waitForPracticeToLoad(page);
    
    // FIX: Relaxed regex and .first()
    await expect(page.locator('text=/Listening|Listen/i').first()).toBeVisible();
    await expect(page.locator('audio, button:has-text("Play")').first()).toBeVisible();
    
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.isVisible()) {
      await firstRadio.click();
    }
    
    await page.click('button:has-text("Exit Practice")');
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('Speaking Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    
    // FIX: Click the specific element
    await page.locator('text=Speaking Practice').first().click();
    
    await waitForPracticeToLoad(page);
    
    // FIX: Add .first()
    await expect(page.locator('text=/Speaking|Task|Prompt/i').first()).toBeVisible();
    await expect(page.locator('button:has-text("Start Recording")').first()).toBeVisible();
    
    await page.click('button:has-text("Exit Practice")');
    
    // Handle dialog if it appears
    page.once('dialog', dialog => dialog.accept());
    
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('Writing Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    
    await page.locator('text=Writing Practice').first().click();
    
    await waitForPracticeToLoad(page);
    
    // FIX: Add .first()
    await expect(page.locator('text=/Task|Prompt|Write/i').first()).toBeVisible();
    
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    await textarea.fill('Test response.');
    
    await page.click('button:has-text("Exit Practice")');
    page.once('dialog', dialog => dialog.accept());
    
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('All Practice Sections Are Accessible', async ({ page }) => {
    await page.goto('/Practice');

    // FIX: Check for Headings specifically to ensure we are seeing the Cards, not just any text
    // If you don't use headings, .first() is the quick fix.
    await expect(page.locator('text=Reading Practice').first()).toBeVisible();
    await expect(page.locator('text=Listening Practice').first()).toBeVisible();
    await expect(page.locator('text=Speaking Practice').first()).toBeVisible();
    await expect(page.locator('text=Writing Practice').first()).toBeVisible();
    
    const startButtons = page.locator('button:has-text("Start Practice")');
    // We expect at least one button to be visible
    expect(await startButtons.count()).toBeGreaterThan(0);
  });
});
