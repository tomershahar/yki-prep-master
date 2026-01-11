import { test, expect } from '@playwright/test';

test.describe('Quick Practice Smoke Tests', () => {
  // 1. Give the tests more time (2 minutes each) because AI generation is slow
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // Helper to wait for the "loading" phase to finish
  async function waitForPracticeContent(page) {
    // Wait up to 60 seconds for any of these common practice words to appear
    await expect(page.locator('text=/Question|Task|Read|Listen|Prompt|Topic/i').first())
      .toBeVisible({ timeout: 60000 });
  }

  test('Reading Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    
    // Simple click: Find the text "Reading Practice" and click it
    await page.locator('text=Reading Practice').first().click();
    
    await waitForPracticeContent(page);
    
    // Wait for the questions to actually appear
    await expect(page.locator('text=/Question|Read/i').first()).toBeVisible({ timeout: 30000 });
    
    // Try to click a radio button if one exists
    const radio = page.locator('input[type="radio"]').first();
    if (await radio.count() > 0) {
      await radio.click();
    }
    
    await page.locator('button:has-text("Exit"), button:has-text("Back")').first().click();
    await expect(page.locator('text=Quick Practice').first()).toBeVisible();
  });

  test('Listening Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    await page.locator('text=Listening Practice').first().click();
    
    await waitForPracticeContent(page);
    
    // Wait specifically for the audio player or Play button
    await expect(page.locator('audio, button:has-text("Play")').first())
      .toBeVisible({ timeout: 30000 });
      
    await page.locator('button:has-text("Exit"), button:has-text("Back")').first().click();
  });

  test('Speaking Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    await page.locator('text=Speaking Practice').first().click();
    
    await waitForPracticeContent(page);
    
    // Wait specifically for the recording button
    await expect(page.locator('button:has-text("Start Recording"), button:has-text("Record")').first())
      .toBeVisible({ timeout: 30000 });
      
    await page.locator('button:has-text("Exit"), button:has-text("Back")').first().click();
  });

  test('Writing Practice - End to End', async ({ page }) => {
    await page.goto('/Practice');
    await page.locator('text=Writing Practice').first().click();
    
    await waitForPracticeContent(page);
    
    // Wait for the text area
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 30000 });
    await page.locator('textarea').first().fill('Test writing response');
    
    await page.locator('button:has-text("Exit"), button:has-text("Back")').first().click();
  });

  test('All Practice Sections Are Accessible', async ({ page }) => {
    await page.goto('/Practice');
    // Just verify the menu options exist
    await expect(page.locator('text=Reading Practice').first()).toBeVisible();
    await expect(page.locator('text=Listening Practice').first()).toBeVisible();
    await expect(page.locator('text=Speaking Practice').first()).toBeVisible();
    await expect(page.locator('text=Writing Practice').first()).toBeVisible();
  });
});
