import { expect, test } from '@playwright/test';
import * as fx from '../src/test/fixtures';
import { mockBackend } from './backend';

test('worker logs in after scanning and lands on the machine page (KAN-24, KAN-31)', async ({ page }) => {
  await mockBackend(page, { role: 'worker', loggedIn: false });
  await page.goto('/m/1');
  await expect(page.getByRole('heading', { name: 'Giriş' })).toBeVisible();
  await page.getByLabel('Telefon veya e-posta').fill('yusuf');
  await page.getByLabel('Şifre').fill('gizli');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page).toHaveURL(/\/m\/1$/);
  await expect(page.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeVisible();
  for (const section of ['Videolar', 'Dokümanlar', 'Bakım geçmişi', 'Sorular & cevaplar']) {
    await expect(page.getByRole('heading', { name: new RegExp(section) })).toBeVisible();
  }
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeVisible();
});

test('new usta without an account signs up from the login page and lands on the scanned machine', async ({ page }) => {
  const api = await mockBackend(page, { role: 'worker', loggedIn: false });
  await page.goto('/m/1');
  await page.getByRole('link', { name: 'Kayıt ol' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await page.getByRole('button', { name: 'Usta' }).click();
  await page.getByLabel('Ad soyad').fill('Yusuf Kaya');
  await page.getByLabel('Telefon veya e-posta').fill('0532 123 45 67');
  await page.getByLabel('Şifre (en az 8 karakter)').fill('gizli-sifre');
  await page.getByRole('button', { name: 'Kayıt ol' }).click();
  await expect(page).toHaveURL(/\/m\/1$/);
  await expect(page.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeVisible();
  expect(api.calls.find((c) => c.key === 'POST /auth/register')?.body).toEqual({
    name: 'Yusuf Kaya', login: '0532 123 45 67', password: 'gizli-sifre', role: 'usta',
  });
});

test('opening a page calls each API once, not twice', async ({ page }) => {
  const api = await mockBackend(page, { role: 'worker' });
  await page.goto('/m/1');
  await expect(page.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const count = (key: string) => api.calls.filter((c) => c.key === key).length;
  expect(count('GET /machines/1')).toBe(1);
  expect(count('GET /auth/me')).toBe(1);
  expect(count('GET /alerts')).toBe(1);
});

test('worker switches the site language to Arabic from the header, searching by name, and the UI follows (KAN-46)', async ({ page }) => {
  const ui = { language: 'ar', dir: 'rtl', texts: { 'Çıkış yap': 'تسجيل الخروج' } };
  const api = await mockBackend(page, { role: 'worker', routes: { 'POST /ui-texts': ui } });
  await page.goto('/m/1');
  const menu = page.getByRole('button', { name: 'Site dili' });
  await menu.click();
  await page.getByRole('combobox', { name: 'Site dili: ara' }).fill('arap');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.getByRole('option', { name: /العربية/ }).click();
  await expect(menu).toHaveText(/AR/);
  expect(api.calls.find((c) => c.key === 'PATCH /me/language')?.body).toEqual({ language: 'ar' });
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible(); // UI texts in Arabic
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  expect(api.calls.find((c) => c.key === 'POST /ui-texts')?.body).toMatchObject({ texts: expect.arrayContaining(['Çıkış yap']) });
});

test('ask the machine → answer with sources → video opens at that second (KAN-61)', async ({ page }) => {
  await mockBackend(page, { role: 'worker', routes: { 'POST /machines/1/ask': fx.askAnswered } });
  await page.goto('/m/1');
  await page.getByRole('link', { name: /Makineye sor/ }).click();
  await page.getByLabel('Sorunuz').fill('Elektrot ne zaman değiştirilir?');
  await page.getByRole('button', { name: 'Sor' }).click();
  await expect(page.getByRole('region', { name: 'Cevap' })).toContainText('1,5 mm');
  await expect(page.getByRole('link', { name: /SAYFA 37/ })).toHaveAttribute('href', '/documents/1?page=37');
  await page.getByRole('link', { name: /VİDEO · 1:48/ }).click();
  await expect(page).toHaveURL(/\/videos\/1\?t=108$/);
  await expect(page.getByLabel('Meme ve elektrot değişimi')).toHaveAttribute('src', '/uploads/videos/1/original.mp4');
});

test('nothing found → Ustaya sor → Sorularım (KAN-62)', async ({ page }) => {
  const api = await mockBackend(page, { role: 'worker', routes: { 'POST /machines/1/ask': fx.askNotFound, 'POST /machines/1/questions': fx.questionSent } });
  await page.goto('/m/1/ask');
  await page.getByLabel('Sorunuz').fill('Kesimin altında çapak oluşuyor');
  await page.getByRole('button', { name: 'Sor' }).click();
  await expect(page.getByText('cevap bulunamadı', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /Ustaya sor/ }).click();
  await expect(page.getByText(/Soru iletildi: Mehmet Usta, Hasan Usta\./)).toBeVisible();
  expect(api.calls.find((c) => c.key === 'POST /machines/1/questions')?.body).toEqual({ question: 'Kesimin altında çapak oluşuyor' });
  await page.getByRole('link', { name: 'Sorularım →' }).click();
  await expect(page.getByText('Açık')).toBeVisible();
});

test('video in the worker language is prepared on demand with progress (KAN-55)', async ({ page }) => {
  const preparing = { ...fx.videoDetail, preparation: { language: 'ar', language_name: 'العربية', steps: [{ key: 'translate', label: 'Çeviri', status: 'done' }, { key: 'subtitles', label: 'Altyazı', status: 'running' }, { key: 'dub', label: 'Dublaj (ustanın sesiyle)', status: 'waiting' }] } };
  await mockBackend(page, { role: 'worker', routes: { 'GET /videos/1': preparing } });
  await page.goto('/videos/1');
  await expect(page.getByText('Bu video العربية hazırlanıyor')).toBeVisible();
  await expect(page.getByText('Dublaj (ustanın sesiyle)')).toBeVisible();
});

test('fixture media is answered by the stub, never sent to a real backend', async ({ page }) => {
  const api = await mockBackend(page, { role: 'worker' });
  await page.goto('/videos/1');
  await expect.poll(() => api.calls.some((c) => c.key === 'GET /uploads/videos/1/original.mp4')).toBe(true);
});

test('document opens at the cited page with its summary (KAN-45)', async ({ page }) => {
  await mockBackend(page, { role: 'worker' });
  await page.goto('/documents/1?page=37');
  await expect(page.getByRole('region', { name: 'AI özet' })).toContainText('5,9–6,2 bar');
  await expect(page.getByTitle(/sayfa 37/)).toHaveAttribute('src', '/uploads/docs/pk105.pdf#page=37');
});

test('scan page: an unknown code shows the "not found" dialog, a known one opens the machine (KAN-29)', async ({ page }) => {
  await mockBackend(page, { role: 'worker', routes: { 'GET /machines/lookup?code=PK-105': { id: 1 } } });
  await page.goto('/scan');
  const code = page.getByLabel(/makine kodunu/);
  await code.fill('XX-1');
  await page.getByRole('button', { name: 'Aç' }).click();
  const dialog = page.getByRole('dialog', { name: 'Makine bulunamadı' });
  await expect(dialog).toContainText('XX-1');
  await dialog.getByRole('button', { name: 'Tekrar tara' }).click();
  await expect(dialog).toBeHidden();
  await code.fill('pk-105');
  await page.getByRole('button', { name: 'Aç' }).click();
  await expect(page).toHaveURL(/\/m\/1$/);
  await expect(page.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeVisible();
});
