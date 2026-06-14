import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../services/supabase"

export default function SignupScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");

 const handleSignup = async () => {
  if (!email || !password || !nickname) {
    Alert.alert("알림", "모든 항목을 입력해주세요.");
    return;
  }

  try {
    // 1️⃣ auth.users 생성 (기본 유저)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      throw new Error("유저 생성 실패");
    }

    // 2️⃣ nickname만 따로 저장
    const { error: insertError } = await supabase
      .from("user_informations")
      .insert([
        {
          id: user.id,
          nickname: nickname,
        },
      ]);

    if (insertError) throw insertError;

    console.log("회원가입 + 닉네임 저장 성공");

    Alert.alert(
      "회원가입 성공",
      "이메일 인증 후 로그인 해주세요."
    );

    navigation.replace("EmailVerify");

  } catch (error: any) {
    Alert.alert(
      "회원가입 실패",
      error.message || "오류 발생"
    );
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="닉네임"
        placeholderTextColor={theme.placeholder}
        value={nickname}
        onChangeText={setNickname}
      />

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleSignup}
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>
          이미 계정이 있나요? 로그인
        </Text>
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
      textAlign: "center",
      marginBottom: 30,
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

    signupButton: {
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

    loginText: {
      marginTop: 20,
      textAlign: "center",
      color: theme.text,
    },
  });