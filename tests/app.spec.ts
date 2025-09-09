import { test, expect } from '@playwright/test';

test.describe('Image Studio App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main header and navigation', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: /Image Studio/i })).toBeVisible();
    await expect(page.getByText('AI-powered image generation and editing')).toBeVisible();

    // Check navigation tabs
    await expect(page.getByRole('tab', { name: /Generate/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Edit/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Compose/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Refine/i })).toBeVisible();
  });

  test('should have responsive navigation on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // On mobile, text should be hidden but icons visible
      const generateTab = page.getByRole('tab', { name: /Generate/i });
      await expect(generateTab).toBeVisible();
      
      // Check that the tabs grid properly on mobile
      const tabsList = page.locator('[role="tablist"]');
      await expect(tabsList).toHaveClass(/grid-cols-2/);
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Start on Generate tab (default)
    await expect(page.getByText('Text to Image')).toBeVisible();
    await expect(page.getByText('Describe your vision and watch it come to life')).toBeVisible();

    // Switch to Edit tab
    await page.getByRole('tab', { name: /Edit/i }).click();
    await expect(page.getByText('Image Editor')).toBeVisible();
    await expect(page.getByText('Upload an image and describe how you\'d like it modified')).toBeVisible();

    // Switch to Compose tab
    await page.getByRole('tab', { name: /Compose/i }).click();
    await expect(page.getByText('Multi-Image Composer')).toBeVisible();
    await expect(page.getByText('Combine multiple images into a single masterpiece')).toBeVisible();

    // Switch to Refine tab
    await page.getByRole('tab', { name: /Refine/i }).click();
    await expect(page.getByText('Iterative Refinement')).toBeVisible();
    await expect(page.getByText('Have a conversation to perfect your image step by step')).toBeVisible();
  });

  test('should have accessible footer', async ({ page }) => {
    await expect(page.getByText('Powered by AI')).toBeVisible();
    await expect(page.getByText('Create, edit, and refine images with artificial intelligence')).toBeVisible();
  });
});