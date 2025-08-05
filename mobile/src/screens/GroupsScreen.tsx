import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import ApiService, { Group } from '../services/ApiService';
import { COLORS, SIZES } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const GroupsScreen: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      const groupsData = await ApiService.getGroups();
      setGroups(groupsData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar grupos');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadGroups();
  };

  const handleJoinGroup = async (groupId: string, isJoined: boolean) => {
    try {
      if (isJoined) {
        await ApiService.leaveGroup(groupId);
        Alert.alert('Sucesso', 'Você saiu do grupo');
      } else {
        await ApiService.joinGroup(groupId);
        Alert.alert('Sucesso', 'Você entrou no grupo!');
      }
      
      // Update local state
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { 
              ...group, 
              isJoined: !isJoined,
              memberCount: isJoined ? group.memberCount - 1 : group.memberCount + 1
            }
          : group
      ));
    } catch (error) {
      Alert.alert('Erro', isJoined ? 'Não foi possível sair do grupo' : 'Não foi possível entrar no grupo');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando grupos..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadGroups} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Grupos da Comunidade</Text>
          <Text style={styles.subtitle}>
            Participe de grupos de discussão por área de interesse
          </Text>
        </View>

        {groups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupIcon}>
                <Text style={styles.groupIconText}>👥</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupStats}>
                  {group.memberCount} membros
                </Text>
              </View>
            </View>

            <Text style={styles.groupDescription}>{group.description}</Text>

            <View style={styles.groupActions}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  group.isJoined ? styles.leaveButton : styles.joinButton
                ]}
                onPress={() => handleJoinGroup(group.id, group.isJoined)}
              >
                <Text style={[
                  styles.actionButtonText,
                  group.isJoined ? styles.leaveButtonText : styles.joinButtonText
                ]}>
                  {group.isJoined ? 'Sair do Grupo' : 'Entrar no Grupo'}
                </Text>
              </TouchableOpacity>

              {group.isJoined && (
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>Ver Posts</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum grupo encontrado.{'\n'}
              Novos grupos serão adicionados em breve!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupIconText: {
    fontSize: SIZES.xl,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  groupStats: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  groupDescription: {
    fontSize: SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 20,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.primary,
  },
  leaveButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
  joinButtonText: {
    color: COLORS.white,
  },
  leaveButtonText: {
    color: COLORS.textLight,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
  },
  viewButtonText: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default GroupsScreen;