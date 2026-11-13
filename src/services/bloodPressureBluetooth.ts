import {PermissionsAndroid, Platform} from 'react-native';
import {BleManager, State, type Device} from 'react-native-ble-plx';
import {toByteArray} from 'base64-js';
import {saveHealthRecords} from './api/health';

const bloodPressureService = '00001810-0000-1000-8000-00805f9b34fb';
const measurementCharacteristic = '00002a35-0000-1000-8000-00805f9b34fb';
let checking = false;

function decodeMeasurement(value: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) return null;
  const bytes = toByteArray(value);
  const byte = (index: number) => bytes[index];
  const word = (index: number) => byte(index) | (byte(index + 1) << 8);
  const flags = byte(0);
  if (bytes.length < 14 || !(flags & 2)) return null;

  const pressure = (index: number) => {
    const raw = word(index);
    if (raw >= 0x07fe && raw <= 0x0802) return NaN;
    const mantissa = (raw << 20) >> 20;
    const exponent = (raw << 16) >> 28;
    return Math.round(mantissa * 10 ** exponent * (flags & 1 ? 7.50062 : 1));
  };
  const systolic = pressure(1);
  const diastolic = pressure(3);
  const measuredAt = new Date(word(7), byte(9) - 1, byte(10), byte(11), byte(12), byte(13));
  if (
    !(systolic >= 40 && systolic <= 300 && diastolic >= 20 && diastolic <= 200) ||
    systolic <= diastolic || measuredAt.getFullYear() !== word(7) ||
    measuredAt.getMonth() !== byte(9) - 1 || measuredAt.getDate() !== byte(10) ||
    measuredAt.getHours() !== byte(11) || measuredAt.getMinutes() !== byte(12) ||
    measuredAt.getSeconds() !== byte(13)
  ) return null;

  return {time: measuredAt.toISOString(), systolic, diastolic};
}

export async function checkBloodPressureBluetooth(): Promise<string> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) {
    return '이 연결 확인은 Android 12 이상에서 사용할 수 있어요.';
  }
  if (checking) return '이미 혈압계를 확인하고 있어요.';
  checking = true;
  let manager: BleManager | undefined;
  try {
    const {BLUETOOTH_SCAN, BLUETOOTH_CONNECT} = PermissionsAndroid.PERMISSIONS;
    const granted = await PermissionsAndroid.requestMultiple([BLUETOOTH_SCAN, BLUETOOTH_CONNECT]);
    if ([BLUETOOTH_SCAN, BLUETOOTH_CONNECT].some(permission => granted[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
      return '휴대폰 설정에서 주변 기기 권한을 허용해 주세요.';
    }

    const bluetooth = new BleManager();
    manager = bluetooth;
    if (await bluetooth.state() !== State.PoweredOn) return '휴대폰의 블루투스를 켜 주세요.';

    const candidate = await new Promise<Device | null>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(null), 12000);
      bluetooth.startDeviceScan(null, null, (error, device) => {
        if (error) {
          clearTimeout(timeout);
          reject(error);
        } else if (device && [device.localName, device.name].some(name => /HEM[-_ ]?7142|BP7150|U705T/i.test(name ?? ''))) {
          clearTimeout(timeout);
          resolve(device);
        }
      }).catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    await bluetooth.stopDeviceScan();
    if (!candidate) {
      return 'HEM-7142T2를 찾지 못했어요. 혈압계 화면에 -P-가 깜박일 때 다시 시도해 주세요.';
    }

    const connected = await candidate.connect({timeout: 10000});
    try {
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      const services = await discovered.services();
      const service = services.find(item => item.uuid.toLowerCase() === bloodPressureService);
      if (!service) return '이 혈압계에서 표준 혈압 서비스를 찾지 못했어요. 오므론 커넥트에서 동기화해 주세요.';
      const characteristics = await service.characteristics();
      if (!characteristics.some(item => item.uuid.toLowerCase() === measurementCharacteristic && item.isIndicatable)) {
        return '이 혈압계에서 표준 측정값을 받을 수 없어요. 오므론 커넥트에서 동기화해 주세요.';
      }

      const sample = await new Promise<ReturnType<typeof decodeMeasurement>>((resolve, reject) => {
        const timeout = setTimeout(() => {
          subscription.remove();
          resolve(null);
        }, 60000);
        const subscription = discovered.monitorCharacteristicForService(
          bloodPressureService,
          measurementCharacteristic,
          (error, characteristic) => {
            const reading = characteristic?.value ? decodeMeasurement(characteristic.value) : null;
            if (!error && !reading) return;
            clearTimeout(timeout);
            subscription.remove();
            if (error) reject(error);
            else resolve(reading);
          },
        );
      });
      if (!sample) return '측정 시각이 포함된 혈압 기록을 받지 못했어요. 다시 연결하거나 오므론 커넥트에서 동기화해 주세요.';
      try {
        await saveHealthRecords({bloodPressureSamples: [sample]});
        return '혈압 기록을 저장했어요. 리포트에서 확인해 주세요.';
      } catch {
        return '혈압을 받았지만 저장하지 못했어요. 로그인과 서버 연결을 확인해 주세요.';
      }
    } finally {
      await connected.cancelConnection().catch(() => {});
    }
  } catch {
    return '혈압계 연결을 확인하지 못했어요. 기기를 가까이 두고 페어링 모드에서 다시 시도해 주세요.';
  } finally {
    await manager?.destroy().catch(() => {});
    checking = false;
  }
}
