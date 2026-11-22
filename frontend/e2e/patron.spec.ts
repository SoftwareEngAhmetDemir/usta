import { expect, test } from '@playwright/test';
import * as fx from '../src/test/fixtures';
import { mockBackend } from './backend';

test('patron sees machines, searches, prints QR stickers and checks users (KAN-32, KAN-30)', async ({ page }) => {
  await mockBackend(page, { role: 'patron', routes: { 'GET /admin/machines?q=forklift': { ...fx.adminMachines, machines: fx.adminMachines.machines.slice(1) } } });
  await page.goto('/');
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByRole('link', { name: 'Sorular' })).toHaveAttribute('href', '/usta'); // the patron answers any question
  await expect(page.getByRole('cell', { name: /Plazma Kesim Makinesi/ })).toBeVisible();
  await page.getByLabel('Makine ara').fill('forklift');
  await expect(page.getByRole('cell', { name: /Plazma Kesim Makinesi/ })).toHaveCount(0);
  await page.getByRole('link', { name: 'QR etiketleri' }).click();
  await expect(page.getByAltText('Plazma Kesim Makinesi QR kodu')).toBeAttached();
  await expect(page.getByRole('link', { name: 'PDF indir (2)' })).toHaveAttribute('href', '/api/admin/qr-stickers.pdf');
  await page.getByRole('checkbox', { name: 'Forklift 3 yazdır' }).uncheck();
  await expect(page.getByRole('link', { name: 'PDF indir (1)' })).toHaveAttribute('href', '/api/admin/qr-stickers.pdf?ids=1');
  await page.getByRole('link', { name: 'Kullanıcılar' }).click();
  await expect(page.getByRole('row', { name: /Emre K\./ })).toContainText('Yetkili');
});
