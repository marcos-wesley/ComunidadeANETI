import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ApiService from '../services/ApiService';
import { COLORS, SIZES } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProfileData = async () => {
    try {
      const [connectionsData, notificationsData] = await Promise.all([
        ApiService.getConnections(),
        ApiService.getNotifications(),
      ]);
      setConnections(connectionsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfileData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando perfil..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.fullName}>{user?.fullName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.title}>{user?.professionalTitle || user?.position}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>📊 Estatísticas do Perfil</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{connections.length}</Text>
            <Text style={styles.statLabel}>Conexões</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Notificações</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Grupos</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>ℹ️ Informações Pessoais</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Telefone:</Text>
          <Text style={styles.infoValue}>{user?.phone || 'Não informado'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Localização:</Text>
          <Text style={styles.infoValue}>
            {user?.city && user?.state ? `${user.city}, ${user.state}` : 'Não informado'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Área:</Text>
          <Text style={styles.infoValue}>{user?.area || 'Não informado'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Empresa:</Text>
          <Text style={styles.infoValue}>{user?.company || 'Não informado'}</Text>
        </View>
      </View>

      {user?.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.cardTitle}>📝 Sobre</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      <View style={styles.linksCard}>
        <Text style={styles.cardTitle}>🔗 Links Profissionais</Text>
        {user?.linkedin && (
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>LinkedIn</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        )}
        {user?.github && (
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>GitHub</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        )}
        {user?.website && (
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Website</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        )}
        {!user?.linkedin && !user?.github && !user?.website && (
          <Text style={styles.noLinksText}>Nenhum link adicionado</Text>
        )}
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>✏️ Editar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>⚙️ Configurações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>📞 Suporte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>🚪 Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  fullName: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  username: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  title: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  infoLabel: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.md,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  bioCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  bioText: {
    fontSize: SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  linksCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  linkText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  linkArrow: {
    fontSize: SIZES.md,
    color: COLORS.primary,
  },
  noLinksText: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
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
  logoutButton: {
    backgroundColor: COLORS.error + '15',
  },
  logoutButtonText: {
    color: COLORS.error,
  },
});

export default ProfileScreen;