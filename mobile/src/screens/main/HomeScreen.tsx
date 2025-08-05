import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { ApiService } from '../../services/ApiService';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545'
};

interface ApplicationStatus {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  planName: string;
  submittedAt: string;
}

interface Stats {
  totalActiveMembers: number;
  newMembersThisMonth: number;
  pendingApplications: number;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Carregar status da aplicação do usuário
      const appData = await ApiService.getUserApplication();
      setApplicationStatus(appData);

      // Carregar notificações
      const notifData = await ApiService.getNotifications();
      setNotifications(notifData.slice(0, 3)); // Mostrar apenas as 3 mais recentes

      // Se o usuário for aprovado, carregar estatísticas
      if (user?.isApproved) {
        // Stats são endpoint admin, então podemos simular ou adaptar
        setStats({
          totalActiveMembers: 150,
          newMembersThisMonth: 12,
          pendingApplications: 5
        });
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'rejected': return COLORS.danger;
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovada';
      case 'pending': return 'Em Análise';
      case 'rejected': return 'Rejeitada';
      default: return 'Desconhecido';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header com boas-vindas */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Olá, {user?.fullName}! 👋</Text>
          <Text style={styles.welcomeSubtext}>Bem-vindo à ANETI</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Status da Aplicação */}
      {applicationStatus && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="assignment" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Status da Aplicação</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(applicationStatus.status) }]}>
              <Text style={styles.statusText}>{getStatusText(applicationStatus.status)}</Text>
            </View>
            <Text style={styles.planText}>Plano: {applicationStatus.planName}</Text>
          </View>
          {applicationStatus.status === 'pending' && (
            <Text style={styles.pendingMessage}>
              Sua aplicação está sendo analisada pela equipe ANETI. Você será notificado quando houver atualizações.
            </Text>
          )}
        </View>
      )}

      {/* Estatísticas (apenas para membros aprovados) */}
      {user?.isApproved && stats && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="bar-chart" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Estatísticas da Comunidade</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalActiveMembers}</Text>
              <Text style={styles.statLabel}>Membros Ativos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.newMembersThisMonth}</Text>
              <Text style={styles.statLabel}>Novos este Mês</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notificações Recentes */}
      {notifications.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="notifications" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Notificações Recentes</Text>
          </View>
          {notifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <MaterialIcons name="circle" size={8} color={COLORS.secondary} />
              <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>Ver todas as notificações</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ações Rápidas */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="flash-on" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Ações Rápidas</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="person-add" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>Encontrar Membros</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="create" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>Criar Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="message" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>Mensagens</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: 15,
    marginTop: 0,
    marginBottom: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  planText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 10,
  },
  pendingMessage: {
    fontSize: 14,
    color: COLORS.gray,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  seeAllButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
  },
});