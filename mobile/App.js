import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import ForumsScreen from './src/screens/ForumsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingSpinner from './src/components/LoadingSpinner';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  background: '#f8f9fa'
};

function TabIcon({ name, focused }) {
  const icons = {
    Home: '🏠',
    Feed: '📰',
    Groups: '👥',
    Forums: '💬',
    Profile: '👤',
  };

  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
      {icons[name]}
    </Text>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');

  if (isLoading) {
    return <LoadingSpinner text="Iniciando aplicativo..." />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Feed':
        return <FeedScreen />;
      case 'Groups':
        return <GroupsScreen />;
      case 'Forums':
        return <ForumsScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'Home' && 'ANETI Comunidade'}
          {activeTab === 'Feed' && 'Feed da Comunidade'}
          {activeTab === 'Groups' && 'Grupos'}
          {activeTab === 'Forums' && 'Fóruns'}
          {activeTab === 'Profile' && 'Meu Perfil'}
        </Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'Home', label: 'Início' },
          { key: 'Feed', label: 'Feed' },
          { key: 'Groups', label: 'Grupos' },
          { key: 'Forums', label: 'Fóruns' },
          { key: 'Profile', label: 'Perfil' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <TabIcon name={tab.key} focused={activeTab === tab.key} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(1, 45, 106, 0.1)',
  },
  tabText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '500',
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});