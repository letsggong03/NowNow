import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EmailVerifyScreen from '../screens/Login/EmailVerify';
import LoginPage from '../screens/Login/LoginPage';
import SignupPage from '../screens/Login/SignupPage';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginPage}
      />

      <Stack.Screen
        name="Signup"
        component={SignupPage}
      />

      <Stack.Screen
        name="EmailVerify"
        component={EmailVerifyScreen}
      />
    </Stack.Navigator>
  );
}
