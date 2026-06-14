import React, { useEffect, useState } from "react";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { supabase } from "../services/supabase";
import { View, ActivityIndicator } from "react-native";

export default function RootNavigator() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <TabNavigator /> : <AuthNavigator />;
}