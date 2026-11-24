import { expect, test } from '@playwright/test';
import * as fx from '../src/test/fixtures';
import { mockBackend } from './backend';

test('usta gets a live alert, opens the question and answers (KAN-66, KAN-63)', async ({ page }) => {
  const api = await mockBackend(page, { role: 'usta', routes: { 'POST /questions/51/answer': { ok: true }, 'POST /alerts/1/read': { unread_count: 0, items: [] } } });
  await page.goto('/usta');
  await expect(page.getByRole('heading', { name: /İşçilerden sorular/ })).toContainText('1 açık');
  api.pushAlert(fx.alertList.items[0]!);
  const toast = page.locator('[data-slot=toast]');
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
  await page.goto('/record'); // no machine yet: nothing to record with
  await expect(page.getByRole('link', { name: 'makinenin QR kodunu okutun' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Kamerayı aç/ })).toHaveCount(0);
  await expect(page.getByLabel(/telefondan video seç/)).toHaveCount(0);
  await page.getByLabel('Makine').selectOption('1');
  await page.getByLabel(/telefondan video seç/).setInputFiles({ name: 'servis.mp4', mimeType: 'video/mp4', buffer: Buffer.from('fake') });
  await expect(page.getByLabel('Kaydın önizlemesi')).toBeVisible();
  await page.getByLabel('Başlık').fill('Servis anlatımı');
  await page.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Sıkıştırılıyor (H.264)')).toBeVisible();
  await expect(page.getByText('Hazır', { exact: true })).toBeVisible();
});

test('usta adds a new machine from home, then removes it (KAN-27)', async ({ page }) => {
  const created = { ...fx.machinePage, machine: { ...fx.machinePage.machine, id: 12, code: 'CNC-7', name: 'CNC Torna' }, actions: { ...fx.machinePage.actions, archive: true, qr: true } };
  const api = await mockBackend(page, { role: 'usta', routes: { 'POST /machines': { status: 201, body: { id: 12 } }, 'GET /machines/12': created, 'POST /machines/12/archive': { status: 204, body: null } } });
  await page.goto('/usta');
  await page.getByRole('link', { name: 'Makine ekle' }).click();
  await page.getByLabel(/Makine kodu/).fill('CNC-7');
  await page.getByLabel('Makine adı').fill('CNC Torna');
  await page.getByRole('button', { name: 'Makineyi ekle' }).click();
  await expect(page).toHaveURL(/\/m\/12$/);
  await expect(page.getByRole('heading', { name: 'CNC Torna' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Etiketi yazdır (PDF)' })).toHaveAttribute('href', '/api/machines/12/sticker.pdf'); // QR for the new machine
  await page.getByRole('button', { name: 'Makineyi kaldır' }).click();
  await page.getByRole('button', { name: 'Evet, kaldır' }).click();
  await expect(page).toHaveURL(/\/usta$/);
  expect(api.calls.filter((c) => c.key === 'POST /machines/12/archive')).toHaveLength(1);
});

test('usta searches any machine from home and opens it', async ({ page }) => {
  const forklift = { id: 2, code: 'FL-03', name: 'Forklift 3', location: 'Depo · Rampa 1' };
  await mockBackend(page, { role: 'usta', routes: { 'GET /machines?q=fork': [forklift], 'GET /machines/2': { ...fx.machinePage, machine: { ...fx.machinePage.machine, id: 2, name: 'Forklift 3' } } } });
  await page.goto('/usta');
  await page.getByLabel('Makine ara').fill('fork');
  await page.getByRole('link', { name: 'FL-03 · Forklift 3 · Depo · Rampa 1' }).click();
  await expect(page).toHaveURL(/\/m\/2$/);
  await expect(page.getByRole('heading', { name: 'Forklift 3' })).toBeVisible();
});

test('usta adds a document to their machine from the machine page (KAN-33)', async ({ page }) => {
  const mine = { ...fx.machinePage, documents: [], actions: { ...fx.machinePage.actions, upload_document: true } };
  const doc = { id: 77, title: 'Bakım talimatı', type: 'operating_instructions', page_count: 1, summary_status: 'preparing', summary_preview: null };
  const api = await mockBackend(page, { role: 'usta', routes: { 'GET /machines/1': mine, 'POST /machines/1/documents': doc } });
  await page.goto('/m/1');
  await page.getByRole('link', { name: 'Belge yükle' }).click();
  await expect(page).toHaveURL(/\/m\/1\/documents\/new$/);
  await page.getByLabel('Tür').selectOption('Kullanım talimatı');
  await page.getByLabel('Başlık').fill('Bakım talimatı');
  await page.getByLabel('Dosya (PDF, Word, Excel, CSV, metin veya fotoğraf)').setInputFiles({ name: 'talimat.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
  await page.getByRole('button', { name: 'Yükle' }).click();
  await expect(page).toHaveURL(/\/m\/1$/);
  expect(api.calls.filter((c) => c.key === 'POST /machines/1/documents')).toHaveLength(1);
});

test('usta scans an unknown code, adds the machine from the dialog and lands on its page (KAN-29, KAN-27)', async ({ page }) => {
  const api = await mockBackend(page, { role: 'usta', routes: { 'POST /machines': { id: 1 } } });
  await page.goto('/scan');
  await page.getByLabel(/makine kodunu/).fill('pk-200');
  await page.getByRole('button', { name: 'Aç' }).click();
  const dialog = page.getByRole('dialog', { name: 'Yeni makine kodu' });
  await expect(dialog).toContainText('PK-200');
  await dialog.getByRole('button', { name: 'Evet, makine ekle' }).click();
  await expect(page).toHaveURL(/\/machines\/new$/);
  await expect(page.getByLabel(/Makine kodu/)).toHaveValue('PK-200');
  await page.getByLabel(/Makine adı/).fill('Hidrolik Pres');
  await page.getByRole('button', { name: 'Makineyi ekle' }).click();
  await expect(page).toHaveURL(/\/m\/1$/);
  expect(api.calls.find((c) => c.key === 'POST /machines')?.body).toMatchObject({ code: 'PK-200', name: 'Hidrolik Pres' });
  await page.goBack(); // the form was replaced by the machine page: back returns to the scanner
  await expect(page).toHaveURL(/\/scan$/);
});

test('worker scanning an unknown code is not offered to add a machine', async ({ page }) => {
  await mockBackend(page, { role: 'worker' });
  await page.goto('/scan');
  await page.getByLabel(/makine kodunu/).fill('pk-200');
  await page.getByRole('button', { name: 'Aç' }).click();
  await expect(page.getByRole('dialog', { name: 'Makine bulunamadı' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Evet, makine ekle' })).toHaveCount(0);
});
