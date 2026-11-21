import { expect, test } from '@playwright/test';
import * as fx from '../src/test/fixtures';
import { mockBackend } from './backend';

test('usta gets a live alert, opens the question and answers (KAN-66, KAN-63)', async ({ page }) => {
  const api = await mockBackend(page, { role: 'usta', routes: { 'POST /questions/51/answer': { ok: true }, 'POST /alerts/1/read': { unread_count: 0, items: [] } } });
  await page.goto('/usta');
  await expect(page.getByRole('heading', { name: /İşçilerden sorular/ })).toContainText('1 açık');
  api.pushAlert(fx.alertList.items[0]!);
  const toast = page.locator('.toast');
  await expect(toast).toContainText('Yeni soru');
  await toast.click();
  await expect(page).toHaveURL(/\/usta\/questions\/51$/);
  await expect(page.getByText('يتكون نتوء تحت القطع، ماذا أفعل؟')).toBeVisible();
  await page.getByLabel('Cevabın').fill('Kesim hızını %10 düşür.');
  await page.getByRole('button', { name: 'Cevabı gönder' }).click();
  await expect(page.getByText('Cevap işçiye iletildi')).toBeVisible();
});

test('usta picks a video from the phone and uploads it (KAN-36, KAN-74)', async ({ page }) => {
  await mockBackend(page, { role: 'usta', routes: { 'POST /machines/1/videos': fx.processing, 'GET /videos/9/processing': { ...fx.processing, status: 'ready' } } });
  await page.goto('/record?machine=1');
  await page.getByLabel(/telefondan video seç/).setInputFiles({ name: 'servis.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fake') });
  await expect(page.getByLabel('Kaydın önizlemesi')).toBeVisible();
  await page.getByLabel('Başlık').fill('Servis anlatımı');
  await page.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Sıkıştırılıyor (H.264)')).toBeVisible();
  await expect(page.getByText('Hazır', { exact: true })).toBeVisible();
});

test('usta adds a new machine from home, then removes it (KAN-27)', async ({ page }) => {
  const created = { ...fx.machinePage, machine: { ...fx.machinePage.machine, id: 12, code: 'CNC-7', name: 'CNC Torna' }, actions: { ...fx.machinePage.actions, archive: true } };
  const api = await mockBackend(page, { role: 'usta', routes: { 'POST /machines': { status: 201, body: { id: 12 } }, 'GET /machines/12': created, 'POST /machines/12/archive': { status: 204, body: null } } });
  await page.goto('/usta');
  await page.getByRole('link', { name: '+ Makine ekle' }).click();
  await page.getByLabel(/Makine kodu/).fill('CNC-7');
  await page.getByLabel('Makine adı').fill('CNC Torna');
  await page.getByRole('button', { name: 'Makineyi ekle' }).click();
  await expect(page).toHaveURL(/\/m\/12$/);
  await expect(page.getByRole('heading', { name: 'CNC Torna' })).toBeVisible();
  await page.getByRole('button', { name: 'Makineyi kaldır' }).click();
  await page.getByRole('button', { name: 'Evet, kaldır' }).click();
  await expect(page).toHaveURL(/\/usta$/);
  expect(api.calls.filter((c) => c.key === 'POST /machines/12/archive')).toHaveLength(1);
});
