import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../services/supabase"
import { createAuthStyles } from "./authStyles";

export default function SignupScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createAuthStyles(theme), [theme]);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");

 const handleSignup = async () => {
  if (!email || !password || !nickname) {
    Alert.alert("알림", "모든 항목을 입력해주세요.");
    return;
  }

  try {
    // auth.users 생성. 닉네임은 메타데이터에 담아 두고,
    // 프로필(user_informations) 행은 세션이 생기면 RootNavigator가 만든다.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("유저 생성 실패");
    }

    console.log("회원가입 성공");

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
        style={styles.primaryButton}
        onPress={handleSignup}
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>
          이미 계정이 있나요? 로그인
        </Text>
      </TouchableOpacity>
    </View>
  );
}
