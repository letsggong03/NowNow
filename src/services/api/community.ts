import {request} from './client';

// Community DB는 컬럼명이 대문자라 응답 필드도 그대로 맞춘다.
export interface CommunityPost {
  POST_ID: number;
  CONTENT: string;
  MOOD: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
  USER_ID: string;
  USER_NAME: string;
  LIKE_COUNT: number;
  COMMENT_COUNT: number;
}

export interface CommunityComment {
  POST_COMMENT_ID: number;
  CONTENT: string;
  CREATED_AT: string;
  POST_ID: number;
  USER_ID: string;
  USER_NAME: string;
}

// 응답 래핑 형태가 명세에 없어 배열/객체 둘 다 받는다.
const unwrapList = <T>(res: any, key: string): T[] =>
  Array.isArray(res) ? res : res?.[key] ?? res?.data ?? [];

export const getPosts = async () =>
  unwrapList<CommunityPost>(
    await request('GET', '/api/community/posts', {auth: false}),
    'posts',
  );

export const createPost = async (CONTENT: string, MOOD?: string) => {
  const res = await request<{message: string; post: CommunityPost}>(
    'POST',
    '/api/community/posts',
    {body: {CONTENT, MOOD}},
  );
  return res.post;
};

export const deletePost = (postId: number) =>
  request<{message: string}>('DELETE', `/api/community/posts/${postId}`);

// 좋아요가 없으면 추가, 있으면 취소. liked는 응답 메시지로 판별한다.
export const togglePostLike = async (postId: number) => {
  const res = await request<{message: string}>(
    'POST',
    `/api/community/posts/${postId}/like`,
  );
  return {liked: !res.message.includes('취소'), message: res.message};
};

export const getComments = async (postId: number) =>
  unwrapList<CommunityComment>(
    await request('GET', `/api/community/posts/${postId}/comments`, {
      auth: false,
    }),
    'comments',
  );

export const createComment = async (postId: number, CONTENT: string) => {
  const res = await request<{message: string; comment: CommunityComment}>(
    'POST',
    `/api/community/posts/${postId}/comments`,
    {body: {CONTENT}},
  );
  return res.comment;
};

export const deleteComment = (commentId: number) =>
  request<{message: string}>('DELETE', `/api/community/comments/${commentId}`);
