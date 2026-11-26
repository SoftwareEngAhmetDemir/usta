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
  await expect(page.getByRole('button', { name: 'İşçi' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Teknisyen' })).toHaveCount(0);
  await expect(page.getByText('Bu rolde kullanıcı yok.')).toBeVisible();
  await page.getByRole('button', { name: 'Usta', exact: true }).click();
  await expect(page.getByRole('row', { name: /Mehmet Usta/ })).toContainText('Plazma Kesim Makinesi');
});

test('patron picks the Usta tab, goes usta → machine → watches a video, opens a document, deletes a video', async ({ page }) => {
  const machine = { ...fx.machinePage, actions: { ...fx.machinePage.actions, delete_content: true } };
  let deleted = false;
  const { calls } = await mockBackend(page, {
    role: 'patron',
    routes: {
      'GET /machines/1': () => (deleted ? { ...machine, videos: machine.videos.slice(1) } : machine),
      'DELETE /videos/1': () => { deleted = true; return null; },
    },
  });
  await page.goto('/panel/users');
  await page.getByRole('button', { name: 'Usta', exact: true }).click();
  await expect(page).toHaveURL(/\/panel\/users\?role=usta$/);
  await expect(page.getByText('Emre K.')).toHaveCount(0);
  await page.getByRole('link', { name: 'Mehmet Usta' }).click();
  await expect(page).toHaveURL(/\/ustas\/7$/);
  await page.getByRole('link', { name: /Plazma Kesim Makinesi/ }).first().click();
  await expect(page).toHaveURL(/\/m\/1$/);
  await expect(page.getByRole('link', { name: /Meme ve elektrot değişimi/ })).toHaveAttribute('href', '/videos/1');
  await expect(page.getByRole('link', { name: /PK-105 Kullanım Kılavuzu/ })).toHaveAttribute('href', '/documents/1');
  await page.getByRole('button', { name: 'Sil: Meme ve elektrot değişimi' }).click();
  await page.getByRole('dialog', { name: 'Video silinsin mi?' }).getByRole('button', { name: 'Evet, sil' }).click();
  await expect(page.getByRole('link', { name: /Meme ve elektrot değişimi/ })).toHaveCount(0);
  expect(calls.some((c) => c.key === 'DELETE /videos/1')).toBe(true);
  await page.getByRole('link', { name: /PK-105 Kullanım Kılavuzu/ }).click();
  await expect(page).toHaveURL(/\/documents\/1$/);
});
