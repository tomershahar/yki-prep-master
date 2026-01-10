import { test, expect } from '@playwright/test';

// Helper to wait for practice content to load
async function waitForPracticeToLoad(page) {
  // Wait for either question content or task content to appear
  await page.waitForSelector('text=/Question|Task|Read the text|Listen/', { timeout: 30000 });
}

test.describe('Quick Practice Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app - adjust URL based on your setup
    await page.goto('/');
    
    // Wait for authentication or redirect to dashboard/practice
    // Adjust this based on your auth flow - you may need to log in first
    await page.waitForLoadState('networkidle');
  });

  test('Reading Practice - End to End', async ({ page }) => {
    // Navigate to Quick Practice page
    await page.goto('/Practice');
    await page.waitForLoadState('networkidle');

    // Click on Reading Practice button
    await page.click('text=Reading Practice');
    
    // Wait for practice generation and content to load
    await waitForPracticeToLoad(page);
    
    // Verify we can see the reading text
    await expect(page.locator('text=/Read the text|Question/i')).toBeVisible();
    
    // Answer the first question (select first radio option if available)
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.isVisible()) {
      await firstRadio.click();
    }
    
    // Click Submit or Next button
    const submitButton = page.locator('button:has-text("Submit")').or(page.locator('button:has-text("Next")')).first();
    await submitButton.click();
    
    // Wait a bit for feedback
    await page.waitForTimeout(1000);
    
    // Cancel/Exit the practice
    await page.click('button:has-text("Exit Practice")');
    
    // Verify we're back at the practice selection page
    await expect(page.locator('text=Quick Practice')).toBeVisible();
  });

  test('Listening Practice - End to End', async ({ page }) => {
    // Navigate to Quick Practice page
    await page.goto('/Practice');
    await page.waitForLoadState('networkidle');

    // Click on Listening Practice button
    await page.click('text=Listening Practice');
    
    // Wait for practice generation and content to load
    await waitForPracticeToLoad(page);
    
    // Verify listening scenario is visible
    await expect(page.locator('text=/Listening Scenario|Listen/i')).toBeVisible();
    
    // Verify audio player is present
    await expect(page.locator('audio, button:has-text("Play")')).toBeVisible();
    
    // Answer the first question (select first radio option if available)
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.isVisible()) {
      await firstRadio.click();
    }
    
    // Wait a bit before canceling
    await page.waitForTimeout(1000);
    
    // Cancel/Exit the practice
    await page.click('button:has-text("Exit Practice")');
    
    // Verify we're back at the practice selection page
    await expect(page.locator('text=Quick Practice')).toBeVisible();
  });

  test('Speaking Practice - End to End', async ({ page }) => {
    // Navigate to Quick Practice page
    await page.goto('/Practice');
    await page.waitForLoadState('networkidle');

    // Click on Speaking Practice button
    await page.click('text=Speaking Practice');
    
    // Wait for practice generation and content to load
    await waitForPracticeToLoad(page);
    
    // Verify speaking task prompt is visible
    await expect(page.locator('text=/Speaking Task|Prompt/i')).toBeVisible();
    
    // Verify recording controls are present
    await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();
    
    // Note: We don't actually record audio in the test, just verify the UI is present
    
    // Cancel/Exit the practice
    await page.click('button:has-text("Exit Practice")');
    
    // Confirm the cancellation in the alert
    page.on('dialog', dialog => dialog.accept());
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Verify we're back at the practice selection page
    await expect(page.locator('text=Quick Practice')).toBeVisible();
  });

  test('Writing Practice - End to End', async ({ page }) => {
    // Navigate to Quick Practice page
    await page.goto('/Practice');
    await page.waitForLoadState('networkidle');

    // Click on Writing Practice button
    await page.click('text=Writing Practice');
    
    // Wait for practice generation and content to load
    await waitForPracticeToLoad(page);
    
    // Verify writing task prompt is visible
    await expect(page.locator('text=/Task|Prompt|Write/i')).toBeVisible();
    
    // Verify textarea for writing is present
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();
    
    // Type some sample text
    await textarea.fill('This is a test response for the writing practice.');
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // Cancel/Exit the practice
    await page.click('button:has-text("Exit Practice")');
    
    // Confirm the cancellation in the alert
    page.on('dialog', dialog => dialog.accept());
    
    // Wait for navigation
    await page.waitForTimeout(1000);
    
    // Verify we're back at the practice selection page
    await expect(page.locator('text=Quick Practice')).toBeVisible();
  });

  test('All Practice Sections Are Accessible', async ({ page }) => {
    // Navigate to Quick Practice page
    await page.goto('/Practice');
    await page.waitForLoadState('networkidle');

    // Verify all four practice sections are visible
    await expect(page.locator('text=Reading Practice')).toBeVisible();
    await expect(page.locator('text=Listening Practice')).toBeVisible();
    await expect(page.locator('text=Speaking Practice')).toBeVisible();
    await expect(page.locator('text=Writing Practice')).toBeVisible();
    
    // Verify all have "Start Practice" buttons
    const startButtons = page.locator('button:has-text("Start Practice")');
    await expect(startButtons).toHaveCount(4);
  });
});
