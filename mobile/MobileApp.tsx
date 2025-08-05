import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
};

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  isApproved: boolean;
}

export default function MobileApp() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const mockLogin = () => {
    if (loginForm.username && loginForm.password) {
      setUser({
        id: '1',
        fullName: 'Usuário ANETI',
        username: loginForm.username,
        email: 'usuario@aneti.org.br',
        isApproved: true
      });
      setCurrentScreen('home');
    } else {
      Alert.alert('Erro', 'Preencha usuário e senha');
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentScreen('login');
    setLoginForm({ username: '', password: '' });
  };

  const renderLoginScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ANETI</Text>
          </View>
          <Text style={styles.tagline}>Associação Nacional dos Especialistas em TI</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Entrar na Comunidade</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            value={loginForm.username}
            onChangeText={(text) => setLoginForm(prev => ({ ...prev, username: text }))}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={loginForm.password}
            onChangeText={(text) => setLoginForm(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={mockLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            💡 Digite qualquer usuário e senha para testar
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderHomeScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Olá, {user?.fullName}! 👋</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Início</Text>
          <Text style={styles.cardDescription}>
            Bem-vindo à ANETI! Aqui você encontra todas as atualizações da comunidade.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📰 Feed</Text>
          <Text style={styles.cardDescription}>
            Acompanhe as últimas novidades e posts dos membros da comunidade.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Grupos</Text>
          <Text style={styles.cardDescription}>
            Participe de grupos de discussão por área de interesse.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💬 Fóruns</Text>
          <Text style={styles.cardDescription}>
            Participe das discussões nos fóruns da comunidade.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Perfil</Text>
          <Text style={styles.cardDescription}>
            Gerencie suas informações pessoais e configurações.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>🏠 Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>📰 Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>👥 Grupos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>💬 Fóruns</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>👤 Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return user ? renderHomeScreen() : renderLoginScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 15,
    fontStyle: 'italic',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  tabText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '500',
  },
});