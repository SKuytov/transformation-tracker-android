import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { ThemeContext } from '../theme/ThemeContext';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { WeightScreen } from '../screens/WeightScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { NutritionScreen } from '../screens/NutritionScreen';
import { PhotosScreen } from '../screens/PhotosScreen';
import { MeasurementsScreen } from '../screens/MeasurementsScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { ProgramScreen } from '../screens/ProgramScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Icons
import {
  LayoutDashboard,
  Scale,
  Dumbbell,
  Apple,
  Camera,
  Ruler,
  BookOpen,
  Trophy,
  BarChart2,
  Settings,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: t.surface,
            borderTopColor: t.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: t.textFaint,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Weight"
          component={WeightScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Scale size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Workouts"
          component={WorkoutsScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
            tabBarLabel: 'Train',
          }}
        />
        <Tab.Screen
          name="Nutrition"
          component={NutritionScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Apple size={size} color={color} />,
            tabBarLabel: 'Food',
          }}
        />
        <Tab.Screen
          name="Photos"
          component={PhotosScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreNavigator}
          options={{
            tabBarIcon: ({ color, size }) => <BarChart2 size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const Stack = createNativeStackNavigator();

function MoreNavigator() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MoreList" component={MoreListScreen} options={{ title: 'More' }} />
      <Stack.Screen name="Measurements" component={MeasurementsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Program" component={ProgramScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// More list screen
import { TouchableOpacity, FlatList, Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MORE_ITEMS = [
  { key: 'Measurements', label: 'Measurements', icon: Ruler },
  { key: 'Journal', label: 'Journal / Calendar', icon: BookOpen },
  { key: 'Program', label: 'Training Program', icon: Trophy },
  { key: 'Reports', label: 'Reports & Export', icon: BarChart2 },
  { key: 'Settings', label: 'Settings', icon: Settings },
];

function MoreListScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={MORE_ITEMS}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}
            onPress={() => nav.navigate(item.key)}
          >
            <item.icon size={22} color={Colors.primary} />
            <Text style={[styles.rowLabel, { color: t.text }]}>{item.label}</Text>
            <Text style={{ color: t.textFaint }}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
