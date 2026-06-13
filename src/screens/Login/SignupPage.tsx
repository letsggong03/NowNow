import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");

  const handleSignup = async (): Promise<void> => {
    if (!email || !password || !nickname) {
      Alert.alert("알림", "모든 항목을 입력해주세요.");
      return;
    }

    try {
      // TODO: 회원가입 API 연결

      console.log("회원가입 시도", {
        email,
        password,
        nickname,
      });

      Alert.alert(
        "회원가입 성공",
        "로그인 화면으로 이동합니다."
      );

      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert(
        "회원가입 실패",
        error.message || "오류가 발생했습니다."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="닉네임"
        value={nickname}
        onChangeText={setNickname}
      />

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleSignup}
      >
        <Text style={styles.buttonText}>
          회원가입
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginText}>
          이미 계정이 있나요? 로그인
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  signupButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loginText: {
    marginTop: 20,
    textAlign: "center",
  },
});