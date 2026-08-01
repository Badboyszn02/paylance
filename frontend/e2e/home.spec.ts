import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const SHOT_DIR = path.join(__dirname, 'screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

test.describe('Homepage redesign', () => {
  test('hero is product-first and fits desktop viewport', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Outcome-led headline
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText(/both of you agree/i);

    // Primary CTAs
    await expect(page.getByRole('link', { name: /Browse listings/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Post a job/i }).first()).toBeVisible();

    // Product stage (escrow preview), not stock hero photo
    await expect(page.getByText(/Escrow · #2841/i)).toBeVisible();
    await expect(page.getByText(/USDC/i).first()).toBeVisible();
    await expect(page.getByText(/Brand site redesign/i)).toBeVisible();

    // Old failure modes must be gone
    await expect(page.locator('text=How the platform works')).toHaveCount(0);
    await expect(page.locator('text=How a job becomes a payment')).toHaveCount(0);
    await expect(page.locator('img[alt="Creator working at a desk"]')).toHaveCount(0);
    await expect(page.locator('text=USDC settlement')).toHaveCount(0);

    // Desktop: hero section should not exceed viewport height significantly
    if (testInfo.project.name === 'chromium-desktop') {
      const hero = page.locator('section').first();
      const box = await hero.boundingBox();
      const vp = page.viewportSize();
      expect(box).toBeTruthy();
      expect(vp).toBeTruthy();
      // Hero + nav should fit roughly one screen (allow small overflow for scrollbars)
      expect(box!.height).toBeLessThanOrEqual((vp!.height - 40) * 1.08);
    }

    const file = path.join(SHOT_DIR, `home-${testInfo.project.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    await testInfo.attach(`viewport-${testInfo.project.name}`, {
      path: file,
      contentType: 'image/png',
    });
  });

  test('how-it-works and categories exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /What you can hire/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /How it works/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Post or hire/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lock USDC/i })).toBeVisible();
  });

  test('mobile primary CTA is tappable width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-mobile', 'mobile only');
    await page.goto('/');
    const browse = page.getByRole('link', { name: /Browse listings/i }).first();
    const box = await browse.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(260);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    const file = path.join(SHOT_DIR, 'home-mobile-full.png');
    await page.screenshot({ path: file, fullPage: true });
  });
});
