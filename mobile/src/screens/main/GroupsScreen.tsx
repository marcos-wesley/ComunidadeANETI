import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  border: '#e1e1e1'
};

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  category: string;
}

export default function GroupsScreen() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados simulados de grupos (adaptar conforme API real)
  const sampleGroups: Group[] = [
    {
      id: '1',
      name: 'Desenvolvedores Frontend',
      description: 'Discussões sobre React, Vue, Angular e tecnologias frontend',
      memberCount: 156,
      isJoined: true,
      category: 'Desenvolvimento'
    },
    {
      id: '2',
      name: 'DevOps & Cloud',
      description: 'Práticas de DevOps, AWS, Azure, Docker e Kubernetes',
      memberCount: 89,
      isJoined: false,
      category: 'Infraestrutura'
    },
    {
      id: '3',
      name: 'Inteligência Artificial',
      description: 'Machine Learning, Deep Learning e IA aplicada',
      memberCount: 203,
      isJoined: true,
      category: 'IA & Dados'
    },
    {
      id: '4',
      name: 'Gestão de Projetos',
      description: 'Metodologias ágeis, Scrum, Kanban e gestão de equipes',
      memberCount: 134,
      isJoined: false,
      category: 'Gestão'
    },
    {
      id: '5',
      name: 'Segurança da Informação',
      description: 'Cybersecurity, pentesting e proteção de dados',
      memberCount: 167,
      isJoined: false,
      category: 'Segurança'
    },
    {
      id: '6',
      name: 'Mobile Development',
      description: 'React Native, Flutter, iOS e Android nativo',
      memberCount: 121,
      isJoined: true,
      category: 'Mobile'
    }
  ];

  const loadGroups = async () => {
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGroups(sampleGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      // Atualizar estado local
      setGroups(prevGroups =>
        prevGroups.map(group =>
          group.id === groupId
            ? {
                ...group,
                isJoined: !group.isJoined,
                memberCount: group.isJoined ? group.memberCount - 1 : group.memberCount + 1
              }
            : group
        )
      );

      const group = groups.find(g => g.id === groupId);
      const action = group?.isJoined ? 'saiu do' : 'entrou no';
      Alert.alert('Sucesso', `Você ${action} grupo ${group?.name}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível processar a solicitação');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Desenvolvimento': return 'code';
      case 'Infraestrutura': return 'cloud';
      case 'IA & Dados': return 'psychology';
      case 'Gestão': return 'business';
      case 'Segurança': return 'security';
      case 'Mobile': return 'smartphone';
      default: return 'group';
    }
  };

  useEffect(() => {
    if (user?.isApproved) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user?.isApproved) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="lock" size={64} color={COLORS.gray} />
        <Text style={styles.restrictedTitle}>Acesso Restrito</Text>
        <Text style={styles.restrictedText}>
          Você precisa ter sua conta aprovada para participar dos grupos da comunidade.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando grupos...</Text>
      </View>
    );
  }

  const joinedGroups = groups.filter(group => group.isJoined);
  const availableGroups = groups.filter(group => !group.isJoined);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Grupos que o usuário participa */}
      {joinedGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="group" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Meus Grupos ({joinedGroups.length})</Text>
          </View>
          
          {joinedGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <MaterialIcons 
                    name={getCategoryIcon(group.category)} 
                    size={24} 
                    color={COLORS.white} 
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCategory}>{group.category}</Text>
                  <Text style={styles.memberCount}>{group.memberCount} membros</Text>
                </View>
                <TouchableOpacity
                  style={[styles.joinButton, styles.joinedButton]}
                  onPress={() => handleJoinGroup(group.id)}
                >
                  <MaterialIcons name="check" size={16} color={COLORS.white} />
                  <Text style={styles.joinedButtonText}>Participando</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Grupos disponíveis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="explore" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>
            Descubra Grupos ({availableGroups.length})
          </Text>
        </View>
        
        {availableGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Nenhum grupo disponível</Text>
            <Text style={styles.emptyText}>
              Você já participa de todos os grupos disponíveis!
            </Text>
          </View>
        ) : (
          availableGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <MaterialIcons 
                    name={getCategoryIcon(group.category)} 
                    size={24} 
                    color={COLORS.white} 
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCategory}>{group.category}</Text>
                  <Text style={styles.memberCount}>{group.memberCount} membros</Text>
                </View>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoinGroup(group.id)}
                >
                  <MaterialIcons name="add" size={16} color={COLORS.white} />
                  <Text style={styles.joinButtonText}>Participar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>
          ))
        )}
      </View>

      {/* Botão para criar grupo */}
      <TouchableOpacity 
        style={styles.createGroupButton}
        onPress={() => Alert.alert('Em breve', 'Funcionalidade de criar grupo em desenvolvimento')}
      >
        <MaterialIcons name="add" size={24} color={COLORS.white} />
        <Text style={styles.createGroupText}>Criar Novo Grupo</Text>
      </TouchableOpacity>
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
    padding: 20,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  restrictedText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 10,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  groupCategory: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    color: COLORS.gray,
  },
  joinButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinedButton: {
    backgroundColor: COLORS.primary,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  joinedButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
    margin: 15,
    borderRadius: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  createGroupButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createGroupText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});