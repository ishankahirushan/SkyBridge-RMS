const { test, expect } = require('@playwright/test');

async function loginAsAgent(page) {
  await page.goto('/frontend/internal/login.html');
  await page.getByLabel('Email Address:').fill('john@skybridge.lk');
  await page.getByLabel('Password:').fill('test123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard\.html/);
}

test.describe('Phase 16 - Booking Registry', () => {
  test('shows booking registry rows', async ({ page }) => {
    await loginAsAgent(page);

    await page.getByRole('link', { name: /Bookings Registry/i }).click();
    await expect(page.getByRole('heading', { name: 'Bookings Registry' })).toBeVisible();

    const table = page.locator('table.bookings-table');
    await expect(table).toBeVisible();

    const rowCount = await table.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('cancel/refund action updates booking row status', async ({ page }) => {
    await loginAsAgent(page);

    await page.getByRole('link', { name: /Bookings Registry/i }).click();
    await expect(page.locator('table.bookings-table')).toBeVisible();

    const cancelButton = page.locator('button.btn-cancel').first();
    const canCancel = (await cancelButton.count()) > 0;

    test.skip(!canCancel, 'No active booking available for cancellation in current dataset.');

    const row = cancelButton.locator('xpath=ancestor::tr[1]');
    const bookingRef = (await row.locator('td').nth(0).innerText()).trim();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await cancelButton.click();

    const updatedRow = page.locator('table.bookings-table tbody tr').filter({ hasText: bookingRef }).first();
    await expect(updatedRow).toContainText('cancelled');
  });
});