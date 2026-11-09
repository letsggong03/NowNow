import {useEffect, useMemo, useState} from 'react';
import {request} from '../../../services/api/client';
import type {MetricType, ReportPeriod, StressCause, StressPeriod} from '../types';
import {hourlyStress} from '../../../../backend/services/stressCalculator';
import type {HealthConnectData} from '../../../services/api/health';

const withPercentage = (
  causes: Omit<StressCause, 'percentage'>[],
): StressCause[] => {
  const total = causes.reduce((sum, item) => sum + item.count, 0);

  return causes.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
};

export const useReport = (samples: HealthConnectData['heartRateSamples']) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('heartRate');
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [stressPeriod, setStressPeriod] = useState<StressPeriod>('day');

  const [stressCauses, setStressCauses] = useState<StressCause[]>([]);
  const [causesUnavailable, setCausesUnavailable] = useState(false);
  const date = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const timeline = useMemo(() => {
    const now = Date.now();
    const start = Date.parse(`${date}T00:00:00+09:00`);
    const unique = new Map<string, number>();
    for (const {time, bpm} of samples ?? []) {
      const measured = Date.parse(time);
      if (measured >= start && measured <= now && Number.isFinite(bpm) && bpm > 0) {
        unique.set(new Date(measured).toISOString(), bpm);
      }
    }
    return hourlyStress(Array.from(unique, ([measured_at, bpm]) => ({measured_at, bpm})));
  }, [date, samples]);

  useEffect(() => {
    let active = true;
    setStressCauses([]);
    setCausesUnavailable(false);
    request<{data: {causes: Omit<StressCause, 'percentage'>[]}}>('GET', '/api/reports/stress-causes', {query: {period: stressPeriod}})
      .then(({data}) => {if (active) setStressCauses(withPercentage(data.causes));})
      .catch(() => {if (active) setCausesUnavailable(true);});
    return () => {active = false;};
  }, [date, stressPeriod]);

  const sorted = [...timeline].sort((a, b) => a.stress - b.stress);
  const peakStress = sorted[sorted.length - 1] ?? null;
  const lowestStress = sorted[0] ?? null;

  return {
    selectedMetric,
    setSelectedMetric,
    period,
    setPeriod,
    stressPeriod,
    setStressPeriod,
    peakStress,
    lowestStress,
    stressCauses,
    causesUnavailable,
  };
};
