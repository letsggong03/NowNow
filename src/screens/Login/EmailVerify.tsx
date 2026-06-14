 import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function EmailVerifyScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>이메일 인증이 필요합니다</Text>

      <Text style={styles.desc}>
        가입하신 이메일로 인증 메일을 보냈습니다.
        {"\n"}인증을 완료한 후 아래 버튼을 눌러주세요.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.buttonText}>인증 완료했어요</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  desc: {
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});