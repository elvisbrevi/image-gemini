import { test, expect } from '@playwright/test';

test.describe('Image Generator Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Ensure we're on the Generate tab
    await page.getByRole('tab', { name: /Generate/i }).click();
  });

  test('should display the image generator form', async ({ page }) => {
    await expect(page.getByText('Text to Image')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /describe the image/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate image/i })).toBeVisible();
  });

  test('should have proper placeholder text', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /describe the image/i });
    await expect(textarea).toHaveAttribute('placeholder', /serene mountain landscape/);
  });

  test('should disable generate button when no prompt', async ({ page }) => {
    const generateButton = page.getByRole('button', { name: /generate image/i });
    await expect(generateButton).toBeDisabled();
  });

  test('should enable generate button when prompt is entered', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /describe the image/i });
    const generateButton = page.getByRole('button', { name: /generate image/i });

    await textarea.fill('A beautiful sunset over the ocean');
    await expect(generateButton).toBeEnabled();
  });

  test('should show loading state when generating', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /describe the image/i });
    const generateButton = page.getByRole('button', { name: /generate image/i });

    // Mock the API response to test loading state
    await page.route('**/api/text-to-image', async route => {
      // Delay response to see loading state
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('fake-image-data'),
      });
    });

    await textarea.fill('A beautiful sunset');
    await generateButton.click();

    // Check loading state
    await expect(page.getByText('Generating...')).toBeVisible();
    await expect(generateButton).toBeDisabled();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      const textarea = page.getByRole('textbox', { name: /describe the image/i });
      const generateButton = page.getByRole('button', { name: /generate image/i });
      
      // Check that elements are properly sized for mobile
      await expect(textarea).toBeVisible();
      await expect(generateButton).toHaveClass(/w-full/);
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    const textarea = page.getByRole('textbox', { name: /describe the image/i });
    const generateButton = page.getByRole('button', { name: /generate image/i });

    // Mock API error
    await page.route('**/api/text-to-image', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await textarea.fill('Test prompt');
    await generateButton.click();

    // Should show error message
    await expect(page.getByText(/HTTP error! status: 500/)).toBeVisible();
    
    // Button should be enabled again
    await expect(generateButton).toBeEnabled();
  });
});