import React, { useState } from 'react';
import { PlusCircle, AlertOctagon, Wrench, CheckCircle2, Search, Radio, ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { EnergyObject, EventType, ObjectStatus } from '../../types/energy';
import { useEnergy } from '../../context/EnergyContext';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetObject: EnergyObject;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  targetObject,
}) => {
  const { addEvent } = useEnergy();

  const [eventType, setEventType] = useState<EventType>('accident');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [dispatcherName, setDispatcherName] = useState('Диспетчер ОДС Ибраев А.С.');
  const [targetStatus, setTargetStatus] = useState<ObjectStatus>('outage');

  // Adjust default status when event type changes
  const handleTypeChange = (type: EventType) => {
    setEventType(type);
    if (type === 'accident') {
      setTargetStatus('outage');
      if (!title || title.startsWith('Вывод') || title.startsWith('Ввод') || title.startsWith('Плановый')) {
        setTitle('Аварийное отключение выключателя');
      }
    } else if (type === 'repair') {
      setTargetStatus('maintenance');
      if (!title || title.startsWith('Аварийное') || title.startsWith('Ввод') || title.startsWith('Плановый')) {
        setTitle('Вывод в плановый ремонт оборудования');
      }
    } else if (type === 'restoration') {
      setTargetStatus('normal');
      if (!title || title.startsWith('Аварийное') || title.startsWith('Вывод') || title.startsWith('Плановый')) {
        setTitle('Ввод в нормальную схему питания');
      }
    } else if (type === 'relay_protection') {
      if (!title) setTitle('Срабатывание сигнализации РЗА');
    } else {
      if (!title) setTitle('Плановый технический осмотр');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addEvent({
      objectId: targetObject.id,
      type: eventType,
      title: title.trim() || undefined,
      description: comment.trim() || 'Оперативная диспетчерская запись.',
      dispatcherName: dispatcherName.trim() || 'Диспетчер ОДС',
      newStatus: targetStatus,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Зафиксировать оперативное событие"
      subtitle={`${targetObject.name} (${targetObject.code})`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Тип фиксируемого события
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('accident')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                eventType === 'accident'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <AlertOctagon className="h-5 w-5 text-rose-400" />
              <span>Авария</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('repair')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                eventType === 'repair'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Wrench className="h-5 w-5 text-amber-400" />
              <span>Ремонт / ТО</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('restoration')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                eventType === 'restoration'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Восстановление</span>
            </button>
          </div>
        </div>

        {/* New Status Result Preview */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Новый статус объекта:</span>
          <select
            value={targetStatus}
            onChange={e => setTargetStatus(e.target.value as ObjectStatus)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-semibold focus:border-cyan-500 focus:outline-none"
          >
            <option value="normal">🟢 В норме</option>
            <option value="maintenance">🟡 Плановые работы</option>
            <option value="outage">🔴 Авария / Отключение</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Краткий заголовок записи
          </label>
          <input
            type="text"
            required
            placeholder="Например: Отключение фидера 10кВ от МТЗ"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Comment / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Подробное описание инцидента / работ
          </label>
          <textarea
            required
            rows={3}
            placeholder="Укажите причину, действия бригады ОВБ, параметры срабатывания защит..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
          />
        </div>

        {/* Dispatcher Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Ответственный диспетчер
          </label>
          <input
            type="text"
            required
            value={dispatcherName}
            onChange={e => setDispatcherName(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all font-sans"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Зафиксировать в журнале</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
