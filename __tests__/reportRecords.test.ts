const mockReportDisk: Record<string,string> = {};
let mockReportUser = 'user-a';
jest.mock('@react-native-async-storage/async-storage',()=>({__esModule:true,default:{getItem:jest.fn(async(key:string)=>mockReportDisk[key]||null),setItem:jest.fn(async(key:string,value:string)=>{mockReportDisk[key]=value;})}}));
jest.mock('../src/services/supabase',()=>({supabase:{auth:{getSession:jest.fn(async()=>({data:{session:{user:{id:mockReportUser}}}}))}}}));
import {recordReportSummary,localReportCauses} from '../src/services/reportRecords';
beforeEach(()=>{for(const key of Object.keys(mockReportDisk))delete mockReportDisk[key];mockReportUser='user-a';});
test('repeated summaries on one day replace the previous analysis instead of inflating causes',async()=>{
  await recordReportSummary('업무','업무 스트레스 야근'.split(' '));
  await recordReportSummary('학업 부담',['학업','학업']);
  expect(await localReportCauses('week')).toEqual({summaries:1,causes:[{cause:'학업',count:1}]});
});
test('local report summaries are isolated by signed-in account',async()=>{
  await recordReportSummary('업무',['야근']);mockReportUser='user-b';
  expect(await localReportCauses('month')).toEqual({summaries:0,causes:[]});
});
test('no cause is invented when the real summary contains no burden keyword',async()=>{
  await recordReportSummary('평온한 하루',[]);
  expect(await localReportCauses('week')).toEqual({summaries:1,causes:[]});
});
