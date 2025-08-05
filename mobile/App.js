import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  SafeAreaView
} from 'react-native';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  background: '#f8f9fa'
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
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
      setCurrentScreen('main');
    } else {
      Alert.alert('Erro', 'Preencha usuário e senha');
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentScreen('login');
    setActiveTab('home');
    setLoginForm({ username: '', password: '' });
  };

  const renderLoginScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ANETI</Text>
          </View>
          <Text style={styles.tagline}>Associação Nacional dos{'\n'}Especialistas em TI</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Entrar na Comunidade</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            value={loginForm.username}
            onChangeText={(text) => setLoginForm(prev => ({ ...prev, username: text }))}
            autoCapitalize="none"
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
            💡 Digite qualquer usuário e senha para testar o app
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.welcomeText}>Olá, {user?.fullName}! 👋</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🏠 Página Inicial</Text>
              <Text style={styles.cardDescription}>
                Bem-vindo à ANETI! Aqui você encontra todas as atualizações e novidades da nossa comunidade de profissionais de TI.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Estatísticas</Text>
              <Text style={styles.cardDescription}>
                • Membros ativos: 250+{'\n'}
                • Grupos de discussão: 15{'\n'}
                • Posts no feed: 50 esta semana
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 Próximos Eventos</Text>
              <Text style={styles.cardDescription}>
                • Webinar sobre IA - 15/08{'\n'}
                • Meetup de DevOps - 22/08{'\n'}
                • Workshop React Native - 30/08
              </Text>
            </View>
          </ScrollView>
        );

      case 'feed':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📰 Feed da Comunidade</Text>
              <Text style={styles.cardDescription}>
                Acompanhe as últimas novidades, posts e discussões dos membros da ANETI.
              </Text>
            </View>

            <View style={styles.postCard}>
              <Text style={styles.postAuthor}>Ana Silva</Text>
              <Text style={styles.postContent}>
                Acabei de finalizar um projeto incrível usando React Native! 
                Alguém mais trabalhando com mobile?
              </Text>
              <Text style={styles.postTime}>2 horas atrás</Text>
            </View>

            <View style={styles.postCard}>
              <Text style={styles.postAuthor}>Carlos Mendes</Text>
              <Text style={styles.postContent}>
                Compartilhando artigo sobre as tendências de DevOps para 2025. 
                Vale muito a pena ler!
              </Text>
              <Text style={styles.postTime}>5 horas atrás</Text>
            </View>
          </ScrollView>
        );

      case 'groups':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👥 Meus Grupos</Text>
              <Text style={styles.cardDescription}>
                Participe de grupos de discussão por área de interesse e conecte-se com profissionais da sua área.
              </Text>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupName}>💻 Desenvolvimento Frontend</Text>
              <Text style={styles.groupMembers}>45 membros • 12 posts esta semana</Text>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupName}>☁️ Cloud Computing</Text>
              <Text style={styles.groupMembers}>38 membros • 8 posts esta semana</Text>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupName}>🤖 Inteligência Artificial</Text>
              <Text style={styles.groupMembers}>52 membros • 15 posts esta semana</Text>
            </View>
          </ScrollView>
        );

      case 'forums':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💬 Fóruns de Discussão</Text>
              <Text style={styles.cardDescription}>
                Participe das discussões técnicas e troque experiências com outros profissionais.
              </Text>
            </View>

            <View style={styles.forumCard}>
              <Text style={styles.forumTitle}>🔧 Dúvidas Técnicas</Text>
              <Text style={styles.forumDescription}>Tire suas dúvidas e ajude outros membros</Text>
              <Text style={styles.forumStats}>234 tópicos • 1.2k respostas</Text>
            </View>

            <View style={styles.forumCard}>
              <Text style={styles.forumTitle}>💼 Carreira em TI</Text>
              <Text style={styles.forumDescription}>Discussões sobre desenvolvimento profissional</Text>
              <Text style={styles.forumStats}>156 tópicos • 890 respostas</Text>
            </View>
          </ScrollView>
        );

      case 'profile':
        return (
          <ScrollView style={styles.content}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.fullName?.[0]}</Text>
              </View>
              <Text style={styles.profileName}>{user?.fullName}</Text>
              <Text style={styles.profileUsername}>@{user?.username}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Estatísticas do Perfil</Text>
              <Text style={styles.cardDescription}>
                • Posts publicados: 12{'\n'}
                • Comentários: 45{'\n'}
                • Conexões: 28{'\n'}
                • Grupos participando: 3
              </Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const renderMainScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ANETI Mobile</Text>
      </View>

      {renderContent()}

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'home' && styles.activeTab]} 
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
            🏠{'\n'}Início
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]} 
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            📰{'\n'}Feed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]} 
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            👥{'\n'}Grupos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'forums' && styles.activeTab]} 
          onPress={() => setActiveTab('forums')}
        >
          <Text style={[styles.tabText, activeTab === 'forums' && styles.activeTabText]}>
            💬{'\n'}Fóruns
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]} 
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            👤{'\n'}Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return currentScreen === 'login' ? renderLoginScreen() : renderMainScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginBottom: 15,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 30,
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
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
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
    marginTop: 20,
    fontStyle: 'italic',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
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
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 5,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.7,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  groupMembers: {
    fontSize: 12,
    color: COLORS.gray,
  },
  forumCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  forumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  forumDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
  forumStats: {
    fontSize: 12,
    color: COLORS.gray,
    opacity: 0.7,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  profileUsername: {
    fontSize: 14,
    color: COLORS.gray,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '10',
  },
  tabText: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
