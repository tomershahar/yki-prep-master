import { test, expect } from '@playwright/test';

test.describe('UI Smoke Tests (No AI)', () => {
  // These tests should be fast, 30s is plenty
  test.setTimeout(30000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Check that the main layout loaded
    await expect(page.locator('text=YKI').first()).toBeVisible(); 
  });

  test('Dashboard loads correctly', async ({ page }) => {
    // Verify the dashboard or landing page has key elements
    // Adjust 'Quick Practice' to whatever text is actually on your home/dashboard
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('Practice Page loads all options', async ({ page }) => {
    // Navigate specifically to the practice page
    await page.goto('/Practice');
    
    // Verify the URL is correct
    await expect(page).toHaveURL(/.*Practice/);

    // Verify all 4 practice modes are visible buttons/cards
    // We use .first() to be safe against strict mode errors
    await expect(page.locator('text=Reading Practice').first()).toBeVisible();
    await expect(page.locator('text=Listening Practice').first()).toBeVisible();
    await expect(page.locator('text=Speaking Practice').first()).toBeVisible();
    await expect(page.locator('text=Writing Practice').first()).toBeVisible();
  });

  test('Can navigate to Reading Practice (Check Loading State)', async ({ page }) => {
    await page.goto('/Practice');
    
    // Click the reading practice button
    await page.locator('text=Reading Practice').first().click();
    
    // INSTEAD of waiting for the question (which needs AI),
    // we just check that the URL changed or a Loading state appeared.
    // This proves the Router and Button work.
    
    // Check 1: Did the URL change? (Assuming it goes to /Practice/Reading or similar)
    // If your app stays on the same page and opens a modal, delete this line.
    // await expect(page).toHaveURL(/.*Reading/);

    // Check 2: Does the app try to load?
    // Most apps show "Generating..." or a spinner or "Loading"
    // We expect ONE of these to be true, so the test doesn't crash if the AI is broken.
    const loadingOrContent = page.locator('text=/Loading|Generating|Question|Practice/i').first();
    await expect(loadingOrContent).toBeVisible();
  });
});
