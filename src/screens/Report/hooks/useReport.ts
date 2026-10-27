import {useEffect, useMemo, useState} from 'react';
import {teamApi} from '../../../services/api/team';
const {kstToday} = require('../../../../backend/utils/kstDate');

import {
  todayHRVData,
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
  const [daily, setDaily] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [reportStatus, setReportStatus] = useState('실제 스트레스 기록 조회 중');
  const [stressCauses, setStressCauses] = useState<StressCause[]>([]);
  useEffect(() => {
    let active = true;
    Promise.all([teamApi.dailyStress(kstToday()), teamApi.stressCauses(stressPeriod), teamApi.recommendation()])
      .then(([d,c,r]) => {
        if (!active) return;
        setDaily(d.data); setRecommendation(r.data);
        setStressCauses(withPercentage(c.data.causes || []));
        setReportStatus(d.data.finalDailyStressScore === null ? '측정자료 부족 · 스트레스 점수 없음' : '실제 기록 기반 팀 알고리즘 · 의료 진단 아님');
      }).catch(() => {if (active) {setStressCauses([]);setReportStatus('스트레스 API 연결/로그인 확인 필요');}});
    return () => {active = false;};
  }, [stressPeriod]);

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


  return {
    daily, recommendation, reportStatus,
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
