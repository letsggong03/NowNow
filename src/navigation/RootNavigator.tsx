import React from "react";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";

export default function RootNavigator() {
  const isLoggedIn = false; // 나중에 토큰 검사 결과

  return (
    <>
      {isLoggedIn ? (
        <TabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </>
  );
}