import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

import TabNavigator from "./TabNavigator";
import AuthScreen from "../screens/Login/Auth";

export default function RootNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2. 로그인 상태 변화 감지
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // 로딩 중 (깜빡임 방지)
  if (loading) return null;

  // 로그인 여부에 따라 분기
  return session ? <TabNavigator /> : <AuthScreen />;
}