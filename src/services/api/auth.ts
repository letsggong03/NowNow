import {request} from './client';

export interface UserInformation {
  user_id: string;
  nickname: string;
  character_type: string;
  notification_enabled: boolean;
}

export interface SignupParams {
  email: string;
  password: string;
  nickname?: string;
  character_type?: string;
  notification_enabled?: boolean;
}

export const signup = (params: SignupParams) =>
  request<{
    message: string;
    data: {user: unknown; user_information: UserInformation};
  }>('POST', '/api/auth/signup', {body: params, auth: false});

export const login = (email: string, password: string) =>
  request<{
    message: string;
    token: string;
    user: unknown;
    user_information: UserInformation;
  }>('POST', '/api/auth/login', {body: {email, password}, auth: false});

export const getMe = async () => {
  const res = await request<{message: string; data: UserInformation}>(
    'GET',
    '/api/auth/me',
  );
  return res.data;
};

export const updateMe = async (
  updates: Partial<Omit<UserInformation, 'user_id'>>,
) => {
  const res = await request<{message: string; data: UserInformation}>(
    'PATCH',
    '/api/auth/me',
    {body: updates},
  );
  return res.data;
};
