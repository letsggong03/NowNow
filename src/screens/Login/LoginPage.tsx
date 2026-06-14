import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { supabase } from "../../services/supabase";
import { useAppTheme } from "../../theme/ThemeProvider";

export default function LoginScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("로그인 성공:", data);

      const { data: sessionData } = await supabase.auth.getSession();
      console.log("세션:", sessionData.session);

      Alert.alert("로그인 성공");

      // 👉 RootNavigator가 session 보고 자동 전환함
    } catch (error: any) {
      Alert.alert("로그인 실패", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor={theme.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      {/* 수정 핵심 */}
      <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
        <Text style={styles.signupText}>회원가입하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      backgroundColor: theme.background,
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 30,
      textAlign: "center",
      color: theme.text,
    },

    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
    },

    loginButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
      backgroundColor: theme.primary,
    },

    buttonText: {
      color: theme.buttonText,
      fontWeight: "bold",
    },

    signupText: {
      marginTop: 20,
      textAlign: "center",
      color: theme.text,
    },
  });