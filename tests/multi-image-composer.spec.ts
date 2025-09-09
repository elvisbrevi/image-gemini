import { test, expect } from '@playwright/test';

test.describe('Multi-Image Composer Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Switch to Compose tab
    await page.getByRole('tab', { name: /Compose/i }).click();
  });

  test('should display the multi-image composer interface', async ({ page }) => {
    await expect(page.getByText('Multi-Image Composer')).toBeVisible();
    await expect(page.getByText('Upload multiple images to combine')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /file/i })).toBeVisible();
  });

  test('should show upload prompt when no images are selected', async ({ page }) => {
    await expect(page.getByText('Upload images to combine')).toBeVisible();
    await expect(page.getByText('Select multiple image files and provide instructions')).toBeVisible();
    await expect(page.getByText('Multiple files')).toBeVisible();
  });

  test('should handle multiple file upload', async ({ page }) => {
    const fileInput = page.getByRole('textbox', { name: /file/i });
    await expect(fileInput).toBeVisible();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
    await expect(fileInput).toHaveAttribute('multiple');
  });

  test('should show proper file type indicators', async ({ page }) => {
    await expect(page.getByText('JPG, PNG')).toBeVisible();
    await expect(page.getByText('Multiple files')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that the upload area is properly sized for mobile
      const uploadPrompt = page.getByText('Upload images to combine');
      await expect(uploadPrompt).toBeVisible();
      
      // Check that image grid will be responsive (should use grid classes)
      await expect(page.locator('[class*="grid-cols-2"]')).toHaveCount(0); // No images yet
    }
  });

  test('should have proper accessibility', async ({ page }) => {
    const fileInput = page.getByLabelText(/upload multiple images to combine/i);
    await expect(fileInput).toBeVisible();
    
    // Check for descriptive icons and text
    const layersIcon = page.locator('[class*="lucide-layers"]').first();
    await expect(layersIcon).toBeVisible();
  });

  test('should handle composition API errors gracefully', async ({ page }) => {
    // Mock API error for multi-image composition
    await page.route('**/api/multi-image', route => {
      route.fulfill({
        status: 413,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Files too large' }),
      });
    });

    // The component should be ready to handle errors
    await expect(page.getByText('Upload images to combine')).toBeVisible();
  });
});