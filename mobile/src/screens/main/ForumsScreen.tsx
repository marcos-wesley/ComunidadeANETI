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

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  repliesCount: number;
  lastActivity: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  topicCount: number;
  lastActivity: string;
  icon: string;
}

export default function ForumsScreen() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentTopics, setRecentTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados simulados de categorias
  const sampleCategories: ForumCategory[] = [
    {
      id: '1',
      name: 'Desenvolvimento Web',
      description: 'Discussões sobre frontend, backend e tecnologias web',
      topicCount: 245,
      lastActivity: '2 horas atrás',
      icon: 'web'
    },
    {
      id: '2',
      name: 'Mobile Development',
      description: 'React Native, Flutter, iOS e Android',
      topicCount: 156,
      lastActivity: '1 hora atrás',
      icon: 'smartphone'
    },
    {
      id: '3',
      name: 'DevOps & Cloud',
      description: 'Infraestrutura, CI/CD, AWS, Azure e GCP',
      topicCount: 89,
      lastActivity: '3 horas atrás',
      icon: 'cloud'
    },
    {
      id: '4',
      name: 'Inteligência Artificial',
      description: 'Machine Learning, Deep Learning e Data Science',
      topicCount: 167,
      lastActivity: '30 min atrás',
      icon: 'psychology'
    },
    {
      id: '5',
      name: 'Carreira & Mercado',
      description: 'Dicas de carreira, entrevistas e mercado de trabalho',
      topicCount: 298,
      lastActivity: '15 min atrás',
      icon: 'work'
    }
  ];

  // Dados simulados de tópicos recentes
  const sampleTopics: ForumTopic[] = [
    {
      id: '1',
      title: 'Como migrar de React para Next.js?',
      description: 'Estou com dúvidas sobre a migração de um projeto React para Next.js...',
      category: 'Desenvolvimento Web',
      repliesCount: 12,
      lastActivity: '15 min atrás',
      authorName: 'João Silva',
      isPinned: false,
      isLocked: false
    },
    {
      id: '2',
      title: '[FIXADO] Regras do Fórum - Leia antes de postar',
      description: 'Regras importantes para manter a qualidade das discussões...',
      category: 'Geral',
      repliesCount: 45,
      lastActivity: '1 dia atrás',
      authorName: 'Moderador',
      isPinned: true,
      isLocked: true
    },
    {
      id: '3',
      title: 'Melhor stack para aplicativo mobile em 2025?',
      description: 'Qual stack vocês recomendam para começar desenvolvimento mobile hoje?',
      category: 'Mobile Development',
      repliesCount: 8,
      lastActivity: '30 min atrás',
      authorName: 'Maria Santos',
      isPinned: false,
      isLocked: false
    },
    {
      id: '4',
      title: 'Docker vs Kubernetes: quando usar cada um?',
      description: 'Tenho dúvidas sobre quando é melhor usar Docker ou Kubernetes...',
      category: 'DevOps & Cloud',
      repliesCount: 23,
      lastActivity: '2 horas atrás',
      authorName: 'Pedro Costa',
      isPinned: false,
      isLocked: false
    }
  ];

  const loadForumData = async () => {
    try {
      // Simular carregamento da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCategories(sampleCategories);
      setRecentTopics(sampleTopics);
    } catch (error) {
      console.error('Error loading forum data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os fóruns');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumData();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: ForumCategory) => {
    Alert.alert('Em breve', `Navegação para categoria "${category.name}" em desenvolvimento`);
  };

  const handleTopicPress = (topic: ForumTopic) => {
    Alert.alert('Em breve', `Visualização do tópico "${topic.title}" em desenvolvimento`);
  };

  const formatLastActivity = (activity: string) => {
    return activity;
  };

  useEffect(() => {
    if (user?.isApproved) {
      loadForumData();
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
          Você precisa ter sua conta aprovada para participar dos fóruns da comunidade.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando fóruns...</Text>
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
      {/* Botão para criar novo tópico */}
      <TouchableOpacity 
        style={styles.createTopicButton}
        onPress={() => Alert.alert('Em breve', 'Criação de tópicos em desenvolvimento')}
      >
        <MaterialIcons name="add" size={20} color={COLORS.white} />
        <Text style={styles.createTopicText}>Criar Novo Tópico</Text>
      </TouchableOpacity>

      {/* Categorias do Fórum */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="category" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Categorias</Text>
        </View>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(category)}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <MaterialIcons name={category.icon} size={24} color={COLORS.white} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryStatsText}>
                    {category.topicCount} tópicos • {category.lastActivity}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.gray} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tópicos Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="schedule" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Tópicos Recentes</Text>
        </View>
        
        {recentTopics.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.topicCard}
            onPress={() => handleTopicPress(topic)}
          >
            <View style={styles.topicHeader}>
              <View style={styles.topicIcons}>
                {topic.isPinned && (
                  <MaterialIcons name="push-pin" size={16} color={COLORS.secondary} />
                )}
                {topic.isLocked && (
                  <MaterialIcons name="lock" size={16} color={COLORS.gray} />
                )}
              </View>
              <Text style={[
                styles.topicTitle,
                topic.isPinned && styles.pinnedTopicTitle
              ]}>
                {topic.title}
              </Text>
            </View>
            
            <Text style={styles.topicDescription} numberOfLines={2}>
              {topic.description}
            </Text>
            
            <View style={styles.topicMeta}>
              <View style={styles.topicMetaLeft}>
                <Text style={styles.topicCategory}>{topic.category}</Text>
                <Text style={styles.topicAuthor}>por {topic.authorName}</Text>
              </View>
              <View style={styles.topicMetaRight}>
                <View style={styles.repliesCount}>
                  <MaterialIcons name="chat-bubble-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.repliesText}>{topic.repliesCount}</Text>
                </View>
                <Text style={styles.lastActivity}>{topic.lastActivity}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
  createTopicButton: {
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
  createTopicText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
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
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
    lineHeight: 20,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryStatsText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  topicCard: {
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
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicIcons: {
    flexDirection: 'row',
    marginRight: 8,
    marginTop: 2,
  },
  topicTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    lineHeight: 22,
  },
  pinnedTopicTitle: {
    color: COLORS.secondary,
  },
  topicDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  topicMetaLeft: {
    flex: 1,
  },
  topicCategory: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 2,
  },
  topicAuthor: {
    fontSize: 12,
    color: COLORS.gray,
  },
  topicMetaRight: {
    alignItems: 'flex-end',
  },
  repliesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  repliesText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  lastActivity: {
    fontSize: 12,
    color: COLORS.gray,
  },
});