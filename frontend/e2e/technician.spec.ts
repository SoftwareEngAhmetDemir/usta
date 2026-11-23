import { expect, test } from '@playwright/test';
import * as fx from '../src/test/fixtures';
import { mockBackend } from './backend';

test('technician records a maintenance job and sees it on top of the history (KAN-39, KAN-40)', async ({ page }) => {
  const saved = { ...fx.maintenanceRecord, id: 77, machine_id: 2, description: 'Hidrolik yağ tamamlandı.' };
  const page2 = { ...fx.machinePage, machine: { ...fx.machinePage.machine, id: 2, name: 'Forklift 3' }, maintenance: [saved, fx.maintenanceRecord], actions: { ...fx.machinePage.actions, record_maintenance: true } };
  await mockBackend(page, { role: 'technician', routes: { 'GET /machines/2/maintenance-form': fx.maintenanceForm, 'POST /machines/2/maintenance': saved, 'GET /machines/2': page2 } });
  await page.goto('/m/2/maintenance');
  await expect(page.getByText('Forklift periyodik bakım yetki belgesi')).toBeVisible();
  await page.getByLabel('Yapılan iş').fill('Hidrolik yağ tamamlandı.');
  await page.getByLabel('Makineyi açan').selectOption({ label: 'Ali Usta' });
  await page.getByRole('button', { name: 'Bakımı kaydet' }).click();
  await expect(page).toHaveURL(/\/m\/2$/);
  await expect(page.getByText('Kaydedildi')).toBeVisible();
  const first = page.getByRole('list').filter({ hasText: 'Hidrolik yağ tamamlandı.' }).getByRole('listitem').first();
  await expect(first).toHaveAttribute('aria-current', 'true'); // the new record, highlighted
  await expect(first).toContainText('Hidrolik yağ tamamlandı.');
  await expect(first).toContainText('Yetkili');
});
