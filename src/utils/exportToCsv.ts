import { GridEvent } from '../types/energy';
import { formatDateTime, getEventTypeInfo } from './formatters';

export const exportEventsToCsv = (events: GridEvent[], filename: string = 'energysight_events.csv') => {
  const headers = [
    'ID события',
    'Дата и время',
    'Энергообъект',
    'Тип события',
    'Заголовок',
    'Описание',
    'Диспетчер / Автор',
    'Критичность',
    'Прежний статус',
    'Новый статус',
  ];

  const escapeField = (field: string | number | undefined | null): string => {
    if (field === undefined || field === null) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = events.map(evt => {
    const typeInfo = getEventTypeInfo(evt.type);
    return [
      escapeField(evt.id),
      escapeField(formatDateTime(evt.timestamp)),
      escapeField(evt.objectName),
      escapeField(typeInfo.label),
      escapeField(evt.title),
      escapeField(evt.description),
      escapeField(evt.dispatcherName),
      escapeField(evt.severity),
      escapeField(evt.previousStatus || '-'),
      escapeField(evt.newStatus || '-'),
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
