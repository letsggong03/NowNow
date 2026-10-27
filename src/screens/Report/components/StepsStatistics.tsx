import React, {useEffect, useState} from 'react';
import {NativeModules, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useAppTheme} from '../../../theme/ThemeProvider';
import ReportCard from './ReportCard';
type Period = 'day'|'week'|'month';
type Point = {label: string; count: number|null};
const options: {key:Period; label:string}[] = [{key:'day',label:'오늘'}, {key:'week',label:'주간'}, {key:'month',label:'월간'}];
export default function StepsStatistics({refreshKey}: {refreshKey: unknown}) {
  const {theme} = useAppTheme();
  const [period,setPeriod] = useState<Period>('day');
  const [points,setPoints] = useState<Point[]>([]);
  const [status,setStatus] = useState('');
  const [retry,setRetry] = useState(0);
  const [loading,setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setPoints([]); setStatus('걸음 기록을 불러오고 있어요.');
    const module = NativeModules.HealthConnectModule;
    if (!module?.getStepsStatistics) {setStatus('걸음 통계를 보려면 건강 데이터 연결과 앱 업데이트를 확인해 주세요.');setLoading(false);return;}
    module.getStepsStatistics(period).then((rows: Point[]) => {
      if (!active) return;
      setPoints(rows);
      setStatus(rows.some(row => row.count !== null) ? '' : '이 기간에 공유된 걸음 기록이 없어요. 삼성 헬스의 데이터 공유 설정을 확인해 주세요.');
    }).catch(() => {if(active)setStatus('걸음 기록을 불러오지 못했어요. 건강 데이터 권한과 연결을 확인해 주세요.');})
      .finally(() => {if(active)setLoading(false);});
    return () => {active=false;};
  },[period,refreshKey,retry]);
  const measured = points.filter(row => row.count !== null && Number.isFinite(row.count));
  const total = measured.reduce((sum,row)=>sum+row.count!,0);
  const max = Math.max(1,...measured.map(row=>row.count!));
  return <ReportCard>
    <Text style={[styles.title,{color:theme.text}]}>걸음 수 통계</Text>
    <View style={styles.tabs}>{options.map(option=><Pressable key={option.key} accessibilityRole="button" accessibilityState={{selected:period===option.key}} onPress={()=>setPeriod(option.key)} style={[styles.tab,{backgroundColor:period===option.key?theme.nav:theme.surfaceMuted}]}><Text style={{color:theme.text}}>{option.label}</Text></Pressable>)}</View>
    <Text style={{color:theme.textMuted,marginTop:10}}>{period==='day'?'오늘 시간별':period==='week'?'오늘 포함 최근 7일':'이번 달 날짜별'} · Health Connect 기록</Text>
    {measured.length>0 && <><Text style={[styles.total,{color:theme.text}]}>{total.toLocaleString()}걸음</Text><Text style={{color:theme.textMuted}}>기록 있는 {period==='day'?'시간':'날짜'} 평균 {Math.round(total/measured.length).toLocaleString()}걸음</Text></>}
    {!!status && <Text accessibilityRole={loading?'text':'alert'} style={{color:theme.textMuted,marginTop:14}}>{status}</Text>}
    {points.length>0 && <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.chart}>{points.map((row,index)=><View key={row.label} accessible accessibilityLabel={`${row.label}${period==='day'?'시':''} ${row.count===null?'기록 없음':row.count+'걸음'}`} style={styles.column}>
      <Text style={{color:theme.textMuted,fontSize:9}}>{row.count===null?'—':row.count}</Text>
      <View style={{height:Math.max(2,(row.count||0)/max*110),width:14,borderRadius:7,backgroundColor:row.count===null?theme.border:theme.accent,marginVertical:8}} />
      <Text style={{color:theme.textMuted,fontSize:10}}>{period==='day'?row.label:(index===0||index%3===0||index===points.length-1?row.label:'')}</Text>
    </View>)}</ScrollView>}
    {points.length>0 && <Text style={{color:theme.textMuted,fontSize:11,marginTop:12}}>— 는 기록이 없거나 아직 지나지 않은 시간이에요. 빈 구간을 0걸음으로 계산하지 않아요.</Text>}
    {!loading && <Pressable accessibilityRole="button" onPress={()=>setRetry(n=>n+1)}><Text style={{color:theme.accent,marginTop:12}}>걸음 기록 새로고침</Text></Pressable>}
  </ReportCard>;
}
const styles=StyleSheet.create({title:{fontSize:17,fontWeight:'800'},tabs:{flexDirection:'row',gap:6,marginTop:14},tab:{flex:1,padding:10,borderRadius:12,alignItems:'center'},total:{fontSize:24,fontWeight:'800',marginTop:12},chart:{alignItems:'flex-end',height:170,paddingTop:14},column:{width:36,alignItems:'center',justifyContent:'flex-end'}});
