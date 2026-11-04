import {Linking} from 'react-native';

// 배달앱 열기. 배민·쿠팡이츠는 공개 검색 API가 없어 앱을 여는 데까지만 한다.
// 앱이 없으면 플레이스토어 설치 화면으로 보낸다.
// 안드로이드 11부터는 다른 앱을 찾으려면 AndroidManifest.xml <queries>에 패키지가 있어야 한다.

export type DeliveryApp = 'baemin' | 'coupangEats';

export const deliveryApps: Record<
  DeliveryApp,
  {label: string; scheme: string; packageName: string}
> = {
  baemin: {
    label: '배민',
    scheme: 'baemin://',
    packageName: 'com.sampleapp',
  },
  coupangEats: {
    label: '쿠팡이츠',
    scheme: 'coupangeats://',
    packageName: 'com.coupang.mobile.eats',
  },
};

export async function openDeliveryApp(app: DeliveryApp) {
  const {scheme, packageName} = deliveryApps[app];

  try {
    await Linking.openURL(scheme);
    return;
  } catch {
    // 앱이 없으면 아래에서 설치 화면을 연다.
  }

  try {
    await Linking.openURL(`market://details?id=${packageName}`);
  } catch {
    // 플레이스토어 앱도 없으면(에뮬레이터 등) 웹으로 연다.
    await Linking.openURL(
      `https://play.google.com/store/apps/details?id=${packageName}`,
    );
  }
}
