import {request} from './client';

export interface CharacterInteraction {
  interaction_id: number;
  action: string;
  choice: string | null;
  created_at: string;
}

// 캐릭터 상호작용(먹이 주기 등)과 고른 취향을 저장한다.
export const saveInteraction = async (action: string, choice: string) => {
  const res = await request<{message: string; data: CharacterInteraction}>(
    'POST',
    '/api/character/interactions',
    {body: {action, choice}},
  );
  return res.data;
};

// 오늘(한국 시간) 상호작용, 오래된 순
export const getTodayInteractions = async () => {
  const res = await request<{message: string; data: CharacterInteraction[]}>(
    'GET',
    '/api/character/interactions',
  );
  return res.data;
};
