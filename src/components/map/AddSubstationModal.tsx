import React, { useState } from 'react';
import { PlusCircle, MapPin, Zap, Layers } from 'lucide-react';
import { Modal } from '../common/Modal';
import { EnergyObject, ObjectType } from '../../types/energy';
import { useEnergy } from '../../context/EnergyContext';

interface AddSubstationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSubstationModal: React.FC<AddSubstationModalProps> = ({ isOpen, onClose }) => {
  const { addNewObject } = useEnergy();

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Наурзумский');
  const [voltage, setVoltage] = useState<number>(110);
  const [type, setType] = useState<ObjectType>('ПС 110/35/10 кВ');
  const [lat, setLat] = useState<string>('51.6458');
  const [lng, setLng] = useState<string>('64.2197');
  const [capacityMVA, setCapacityMVA] = useState<number>(25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newObj: EnergyObject = {
      id: 'sub-' + Date.now(),
      name: name.trim() || `ПС ${voltage} кВ "${name.trim()}"`,
      code: `PS-${voltage}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type,
      status: 'normal',
      district,
      address: `${district} район`,
      coordinates: [parseFloat(lat) || 51.6458, parseFloat(lng) || 64.2197],
      installedCapacityMVA: capacityMVA || 25,
      currentLoadMVA: +(capacityMVA * 0.55).toFixed(1),
      loadPercentage: 55,
      voltageClassKV: voltage,
      transformersCount: 2,
      installationYear: 2020,
      lastMaintenanceDate: new Date().toISOString().slice(0, 10),
      chiefEngineer: 'Дежурный инженер ОДС',
      phone: '+7 (7142) 54-12-88',
      telemetryStatus: 'online',
      consumerType: 'Смешанные',
      feedersCount: 8,
      telemetry: {
        voltageKV: +(voltage * 1.01).toFixed(1),
        activePowerMW: +(capacityMVA * 0.5).toFixed(1),
        reactivePowerMvar: +(capacityMVA * 0.15).toFixed(1),
        frequencyHz: 50.01,
        loadPercentage: 55,
        transformerTempC: 42.0,
        oilPressureBar: 1.40,
        updatedAt: new Date().toISOString(),
      },
    };

    addNewObject(newObj);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Добавить энергообъект на карту"
      subtitle="Укажите название, класс напряжения и географические координаты"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Название объекта
          </label>
          <input
            type="text"
            required
            placeholder='Например: ПС 110/35/10 кВ "Караменды"'
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Район (РЭС)
            </label>
            <input
              type="text"
              required
              value={district}
              onChange={e => setDistrict(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Класс напряжения
            </label>
            <select
              value={voltage}
              onChange={e => {
                const v = parseInt(e.target.value);
                setVoltage(v);
                if (v >= 220) setType('ПС 220/110/10 кВ');
                else if (v >= 110) setType('ПС 110/35/10 кВ');
                else if (v >= 35) setType('ПС 35/10 кВ');
                else setType('РП 10 кВ');
              }}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
            >
              <option value={220}>220 кВ</option>
              <option value={110}>110 кВ</option>
              <option value={35}>35 кВ</option>
              <option value={10}>10 кВ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Широта (Latitude)
            </label>
            <input
              type="number"
              step="any"
              required
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Долгота (Longitude)
            </label>
            <input
              type="number"
              step="any"
              required
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Установленная мощность (МВА)
          </label>
          <input
            type="number"
            required
            value={capacityMVA}
            onChange={e => setCapacityMVA(parseFloat(e.target.value) || 10)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl flex items-center gap-2 shadow-lg"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Добавить на карту</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
