import {useEffect, useMemo, useState} from 'react';
import {localReportCauses} from '../../../services/reportRecords';
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
  const [causeStatus, setCauseStatus] = useState('대화 기록을 살펴보고 있어요.');
  useEffect(() => {
    let active = true;
    Promise.allSettled([teamApi.dailyStress(kstToday()), teamApi.stressCauses(stressPeriod), teamApi.recommendation(), localReportCauses(stressPeriod)])
      .then(([d,c,r,l]) => {
        if (!active) return;
        if (d.status === 'fulfilled') {
          setDaily(d.value.data);
          setReportStatus(d.value.data.finalDailyStressScore == null ? '계산할 수 있는 스트레스 기록이 아직 없어요.' : '생활관리 참고 지표 · 의료 진단이 아니에요.');
        } else setReportStatus('스트레스 기록을 불러오지 못했어요. 연결을 확인해 주세요.');
        if (r.status === 'fulfilled') setRecommendation(r.value.data);
        const local = l.status === 'fulfilled' ? l.value : null;
        const remote = c.status === 'fulfilled' ? c.value.data.causes || [] : [];
        // One source at a time: a synced summary must not be counted twice.
        const causes = local?.summaries ? local.causes : remote;
        setStressCauses(withPercentage(causes));
        setCauseStatus(causes.length ? (local?.summaries ? '이 기기에 저장한 하루 요약의 키워드 기준이에요.' : '계정에 저장된 하루 요약의 키워드 기준이에요.')
          : local?.summaries ? '저장된 요약에서 부담 원인 키워드가 확인되지 않았어요.'
          : c.status === 'rejected' ? '서버 기록을 불러오지 못했고 이 기기에 저장된 하루 요약도 없어요.'
          : '아직 분석할 하루 요약이 없어요. 뿡뿡이에게 힘들었던 일을 이야기하고 하루 요약을 저장해 주세요.');
      });
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
    daily, recommendation, reportStatus, causeStatus,
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
