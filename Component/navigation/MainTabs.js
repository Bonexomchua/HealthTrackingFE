import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DrinkingScreen from '../screens/DrinkingScreen';
import CalendarScreen from '../screens/CalendarScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons'; // icon đẹp
import FunctionsScreen from '../screens/FunctionScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#356859',
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Drinking') iconName = 'water';
          else if (route.name === 'Calendar') iconName = 'calendar';
          else if (route.name === 'Favorites') iconName = 'heart';
          else if (route.name === 'Profile') iconName = 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Drinking" component={FunctionsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
    </Tab.Navigator>
  );
}
