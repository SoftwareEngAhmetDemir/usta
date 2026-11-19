import type { DocumentType, ExternalSource } from '../api';

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  user_manual: 'Kullanım kılavuzu',
  operating_instructions: 'Kullanım talimatı',
  catalog: 'Katalog',
  technical_info: 'Teknik bilgi',
};

export const EXTERNAL_SOURCE_LABEL: Record<ExternalSource, string> = {
  manufacturer: 'Üretici',
  service_company: 'Servis firması',
  other: 'Diğer',
};
