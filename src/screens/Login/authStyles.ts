import { StyleSheet } from "react-native";

import type { AppTheme } from "../../theme/ThemeProvider";

export const createAuthStyles = (theme: AppTheme) =>
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
      backgroundColor: theme.input,
    },

    primaryButton: {
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 10,
      backgroundColor: theme.accent,
    },

    buttonText: {
      color: theme.accentText,
      fontWeight: "bold",
    },

    linkText: {
      marginTop: 20,
      textAlign: "center",
      color: theme.text,
    },
  });
