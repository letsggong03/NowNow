import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { useAppTheme, type AppTheme } from "../../theme/ThemeProvider";
import { createAuthStyles } from "./authStyles";

export default function EmailVerifyScreen({ navigation }: any) {
  const { theme } = useAppTheme();
  const authStyles = useMemo(() => createAuthStyles(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[authStyles.container, styles.container]}>
      <Text style={styles.title}>이메일 인증이 필요합니다</Text>

      <Text style={styles.desc}>
        가입하신 이메일로 인증 메일을 보냈습니다.
        {"\n"}인증을 완료한 후 아래 버튼을 눌러주세요.
      </Text>

      <TouchableOpacity
        style={[authStyles.primaryButton, styles.button]}
        onPress={() => navigation.replace("Login")}
      >
        <Text style={authStyles.buttonText}>인증 완료했어요</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 20,
      color: theme.text,
    },
    desc: {
      textAlign: "center",
      marginBottom: 30,
      color: theme.textMuted,
    },
    button: {
      marginTop: 0,
      paddingHorizontal: 24,
    },
  });
