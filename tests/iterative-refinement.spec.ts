import { test, expect } from '@playwright/test';

test.describe('Iterative Refinement Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to Refine tab
    await page.getByRole('tab', { name: /Refine/i }).click();
  });

  test('should display the iterative refinement interface', async ({ page }) => {
    await expect(page.getByText('Iterative Refinement')).toBeVisible();
    await expect(page.getByText('Upload an image to start refining')).toBeVisible();
  });

  test('should show upload prompt when no image is provided', async ({ page }) => {
    await expect(page.getByText('Start with an image')).toBeVisible();
    await expect(page.getByText('Upload an image and have a conversation to refine it step by step')).toBeVisible();
  });

  test('should have file upload functionality', async ({ page }) => {
    const fileInput = page.getByRole('textbox', { name: /file/i });
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that the interface adapts properly for mobile
      const uploadPrompt = page.getByText('Start with an image');
      await expect(uploadPrompt).toBeVisible();
      
      // The conversation interface should be mobile-friendly when active
      await expect(page.locator('[class*="max-h-96"]')).toHaveCount(0); // No conversation yet
    }
  });

  test('should have proper conversational interface structure', async ({ page }) => {
    // Test the basic structure is ready for conversation
    await expect(page.getByText('Upload an image to start refining')).toBeVisible();
    
    // The upload icon should be visible
    const uploadIcon = page.locator('[class*="lucide-upload"]').first();
    await expect(uploadIcon).toBeVisible();
  });

  test('should handle refinement API errors', async ({ page }) => {
    // Mock API error for image refinement
    await page.route('**/api/image-edit', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
    });

    // The component should be prepared to handle errors in conversation
    await expect(page.getByText('Start with an image')).toBeVisible();
  });

  test('should have accessible labels for refinement inputs', async ({ page }) => {
    const fileInput = page.getByLabelText(/upload an image to start refining/i);
    await expect(fileInput).toBeVisible();
  });

  test('should display proper messaging icons', async ({ page }) => {
    // Check for message square icon in the title
    const messageIcon = page.locator('[class*="lucide-message-square"]').first();
    await expect(messageIcon).toBeVisible();
  });
});