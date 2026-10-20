import {useMemo, useState} from 'react';

import {
  monthlyStressData,
  todayHRVData,
  weeklyStressData,
} from '../constants/reportData';
import type {MetricType, ReportPeriod, StressCause, StressPeriod} from '../types';

const withPercentage = (
  causes: Omit<StressCause, 'percentage'>[],
): StressCause[] => {
  const total = causes.reduce((sum, item) => sum + item.count, 0);

  return causes.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));
};

export const useReport = () => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('heartRate');
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [stressPeriod, setStressPeriod] = useState<StressPeriod>('week');

  const peakStress = useMemo(
    () =>
      todayHRVData.reduce((max, current) =>
        current.stress > max.stress ? current : max,
      ),
    [],
  );

  const lowestStress = useMemo(
    () =>
      todayHRVData.reduce((min, current) =>
        current.stress < min.stress ? current : min,
      ),
    [],
  );

  const stressCauses = useMemo(
    () =>
      withPercentage(
        stressPeriod === 'week' ? weeklyStressData : monthlyStressData,
      ),
    [stressPeriod],
  );

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
  };
};
