import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/ApiService';
import { COLORS, SIZES } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

interface Stats {
  totalActiveMembers: number;
  newMembersThisMonth: number;
  totalPosts: number;
  totalGroups: number;
}

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Simulate stats - in real app you'd have a stats endpoint
      const posts = await ApiService.getPosts();
      const members = await ApiService.getMembers();
      const groups = await ApiService.getGroups();
      
      setStats({
        totalActiveMembers: members.length,
        newMembersThisMonth: Math.floor(members.length * 0.1), // 10% as new members
        totalPosts: posts.length,
        totalGroups: groups.length,
      });
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando início..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Olá, {user?.fullName}! 👋</Text>
        <Text style={styles.subtitle}>Bem-vindo à comunidade ANETI</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Estatísticas da Comunidade</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.totalActiveMembers}</Text>
            <Text style={styles.statLabel}>Membros Ativos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.newMembersThisMonth}</Text>
            <Text style={styles.statLabel}>Novos Membros</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts no Feed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.totalGroups}</Text>
            <Text style={styles.statLabel}>Grupos Ativos</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Ações Rápidas</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📝 Criar Nova Publicação</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>👥 Explorar Grupos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>💬 Participar de Fóruns</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🔍 Conectar com Membros</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Próximos Eventos</Text>
        <View style={styles.eventItem}>
          <Text style={styles.eventTitle}>Webinar sobre IA</Text>
          <Text style={styles.eventDate}>15 de Agosto, 19h</Text>
        </View>
        <View style={styles.eventItem}>
          <Text style={styles.eventTitle}>Meetup de DevOps</Text>
          <Text style={styles.eventDate}>22 de Agosto, 18h</Text>
        </View>
        <View style={styles.eventItem}>
          <Text style={styles.eventTitle}>Workshop React Native</Text>
          <Text style={styles.eventDate}>30 de Agosto, 14h</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  welcome: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  eventDate: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default HomeScreen;