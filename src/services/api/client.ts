import {NativeModules, Platform} from 'react-native';

import {supabase} from '../supabase';

// 안드로이드 에뮬레이터에서는 호스트 PC의 localhost가 10.0.2.2로 보인다.
// USB 연결 실기기는 adb reverse로 PC 서버에 접속한다.
const DEV_HOST = Platform.OS === 'android'
  ? NativeModules.HealthConnectModule?.localApiHost ?? '10.0.2.2'
  : 'localhost';

const deployedApiUrl: string = NativeModules.HealthConnectModule?.apiBaseUrl ?? '';
export const API_BASE_URL = deployedApiUrl.replace(/\/$/, '') || `http://${DEV_HOST}:5000`;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  // 기본값 true. 토큰이 있으면 Authorization 헤더를 붙인다.
  auth?: boolean;
}

const buildUrl = (path: string, query?: RequestOptions['query']) => {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

  return `${API_BASE_URL}${path}${params ? `?${params}` : ''}`;
};

export const getAccessToken = async () => {
  const {data} = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

export async function request<T>(
  method: HttpMethod,
  path: string,
  {query, body, auth = true}: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const help = deployedApiUrl ? '인터넷 연결을 확인하고 다시 시도해 주세요.' : '현재 앱은 테스트용 PC 서버에 연결해야 해요.';
    throw new ApiError(0, `서버에 연결하지 못했어요. ${help}`, null);
  }

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    const message =
      json?.message ?? json?.error?.message ?? json?.error ?? '요청에 실패했습니다.';
    throw new ApiError(response.status, String(message), json);
  }

  return json as T;
}
