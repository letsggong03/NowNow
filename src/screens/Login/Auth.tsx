import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../../services/supabase";

export default function AuthScreen() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuth = async () => {
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) console.log(error.message);
    } else {
      if (form.password !== form.confirmPassword) {
        console.log("비밀번호 불일치");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) console.log(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // 🔥 로그인 상태 → 홈 화면
  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>홈 🎉</Text>

        <Text style={styles.email}>
          {session?.user?.email}
        </Text>

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🔥 로그인/회원가입 화면
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isLogin ? "로그인" : "회원가입"}
      </Text>

      <TextInput
        placeholder="이메일"
        value={form.email}
        onChangeText={(t) => handleChange("email", t)}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="비밀번호"
        value={form.password}
        onChangeText={(t) => handleChange("password", t)}
        secureTextEntry
        style={styles.input}
      />

      {!isLogin && (
        <TextInput
          placeholder="비밀번호 확인"
          value={form.confirmPassword}
          onChangeText={(t) => handleChange("confirmPassword", t)}
          secureTextEntry
          style={styles.input}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {isLogin ? "로그인" : "회원가입"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? "회원가입으로" : "로그인으로"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10, borderRadius: 8 },
  button: { backgroundColor: "#4F46E5", padding: 14, borderRadius: 8, marginTop: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  switchText: { textAlign: "center", marginTop: 15, color: "#4F46E5" },
  email: { textAlign: "center", marginBottom: 20 },
});