import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import RegisterScreen from '../screens/RegisterScreen';
import ExpertScreen from '../screens/ExpertScreen';
import RegisterStep2Screen from '../screens/RegisterStep2Screen';
import ChatScreen from '../screens/ChatScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ExpertChatScreen from '../screens/ExpertChatScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Register" component={RegisterScreen}/>
        <Stack.Screen name="ExpertScreen" component={ExpertScreen} />
        <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen}/>
        <Stack.Screen name="FavoritesScreen" component={FavoritesScreen}/>
        <Stack.Screen name="ExpertChatScreen" component={ExpertChatScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
