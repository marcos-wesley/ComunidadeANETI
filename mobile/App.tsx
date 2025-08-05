import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// Services
import { AuthProvider, useAuth } from './src/services/AuthContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import FeedScreen from './src/screens/main/FeedScreen';
import GroupsScreen from './src/screens/main/GroupsScreen';
import ForumsScreen from './src/screens/main/ForumsScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// Navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();

// Colors
const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5'
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Login - ANETI' }}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Cadastro - ANETI' }}
      />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          switch (route.name) {
            case 'Início':
              iconName = 'home';
              break;
            case 'Feed':
              iconName = 'dynamic-feed';
              break;
            case 'Grupos':
              iconName = 'group';
              break;
            case 'Fóruns':
              iconName = 'forum';
              break;
            case 'Perfil':
              iconName = 'person';
              break;
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGray,
          paddingBottom: 5,
          height: 60
        },
        headerStyle: { 
          backgroundColor: COLORS.primary 
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: { 
          fontWeight: 'bold' 
        }
      })}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeScreen}
        options={{ title: 'ANETI - Início' }}
      />
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{ title: 'Feed da Comunidade' }}
      />
      <Tab.Screen 
        name="Grupos" 
        component={GroupsScreen}
        options={{ title: 'Grupos' }}
      />
      <Tab.Screen 
        name="Fóruns" 
        component={ForumsScreen}
        options={{ title: 'Fóruns de Discussão' }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={{ title: 'Meu Perfil' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <Text style={{ color: COLORS.white, fontSize: 18 }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}