import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import ApiService, { Forum, Topic } from '../services/ApiService';
import { COLORS, SIZES } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ForumsScreen: React.FC = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const loadForums = async () => {
    try {
      const forumsData = await ApiService.getForums();
      setForums(forumsData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar fóruns');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadTopics = async (forumId: string) => {
    try {
      const topicsData = await ApiService.getForumTopics(forumId);
      setTopics(topicsData);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível carregar os tópicos');
      console.error(err);
    }
  };

  useEffect(() => {
    loadForums();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    if (selectedForum) {
      loadTopics(selectedForum.id);
    } else {
      loadForums();
    }
  };

  const handleForumSelect = (forum: Forum) => {
    setSelectedForum(forum);
    loadTopics(forum.id);
  };

  const handleBackToForums = () => {
    setSelectedForum(null);
    setTopics([]);
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      Alert.alert('Erro', 'Preencha título e conteúdo do tópico');
      return;
    }

    if (!selectedForum) return;

    setIsCreatingTopic(true);
    try {
      await ApiService.createTopic(selectedForum.id, newTopicTitle.trim(), newTopicContent.trim());
      setNewTopicTitle('');
      setNewTopicContent('');
      setShowCreateTopic(false);
      loadTopics(selectedForum.id); // Reload topics
      Alert.alert('Sucesso', 'Tópico criado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o tópico');
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando fóruns..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadForums} />;
  }

  // Show forum topics
  if (selectedForum) {
    return (
      <View style={styles.container}>
        <View style={styles.forumHeader}>
          <TouchableOpacity onPress={handleBackToForums} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.forumTitle}>{selectedForum.title}</Text>
          <TouchableOpacity 
            style={styles.createTopicButton}
            onPress={() => setShowCreateTopic(true)}
          >
            <Text style={styles.createTopicButtonText}>+ Novo Tópico</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {topics.map((topic) => (
            <View key={topic.id} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicAuthor}>por {topic.author.fullName}</Text>
              </View>
              
              <Text style={styles.topicContent} numberOfLines={3}>
                {topic.content}
              </Text>
              
              <View style={styles.topicStats}>
                <Text style={styles.topicStat}>💬 {topic.repliesCount} respostas</Text>
                <Text style={styles.topicStat}>👁 {topic.viewsCount} visualizações</Text>
                <Text style={styles.topicDate}>{formatDate(topic.createdAt)}</Text>
              </View>
            </View>
          ))}

          {topics.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhum tópico neste fórum ainda.{'\n'}
                Seja o primeiro a iniciar uma discussão!
              </Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showCreateTopic}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateTopic(false)}>
                <Text style={styles.cancelButton}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Novo Tópico</Text>
              <TouchableOpacity 
                onPress={handleCreateTopic}
                disabled={isCreatingTopic || !newTopicTitle.trim() || !newTopicContent.trim()}
              >
                <Text style={[
                  styles.createButton, 
                  (!newTopicTitle.trim() || !newTopicContent.trim() || isCreatingTopic) && styles.disabledButton
                ]}>
                  {isCreatingTopic ? 'Criando...' : 'Criar'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TextInput
                style={styles.titleInput}
                placeholder="Título do tópico"
                value={newTopicTitle}
                onChangeText={setNewTopicTitle}
                maxLength={100}
              />
              
              <TextInput
                style={styles.contentInput}
                placeholder="Conteúdo da discussão..."
                value={newTopicContent}
                onChangeText={setNewTopicContent}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Show forums list
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fóruns de Discussão</Text>
        <Text style={styles.subtitle}>
          Participe das discussões técnicas e troque experiências
        </Text>
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {forums.map((forum) => (
          <TouchableOpacity 
            key={forum.id} 
            style={styles.forumCard}
            onPress={() => handleForumSelect(forum)}
          >
            <View style={styles.forumIcon}>
              <Text style={styles.forumIconText}>💬</Text>
            </View>
            
            <View style={styles.forumInfo}>
              <Text style={styles.forumName}>{forum.title}</Text>
              <Text style={styles.forumDescription}>{forum.description}</Text>
              <View style={styles.forumStats}>
                <Text style={styles.forumStat}>{forum.topicsCount} tópicos</Text>
                {forum.lastActivity && (
                  <Text style={styles.forumStat}>
                    Última atividade: {formatDate(forum.lastActivity)}
                  </Text>
                )}
              </View>
            </View>
            
            <Text style={styles.forumArrow}>→</Text>
          </TouchableOpacity>
        ))}

        {forums.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum fórum disponível no momento.{'\n'}
              Novos fóruns serão adicionados em breve!
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
  forumCard: {
    backgroundColor: COLORS.white,
    margin: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forumIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  forumIconText: {
    fontSize: SIZES.xl,
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  forumDescription: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  forumStats: {
    flexDirection: 'row',
    gap: 15,
  },
  forumStat: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
  forumArrow: {
    fontSize: SIZES.lg,
    color: COLORS.primary,
    marginLeft: 10,
  },
  forumHeader: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  forumTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  createTopicButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  createTopicButtonText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontWeight: 'bold',
  },
  topicCard: {
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
  topicHeader: {
    marginBottom: 10,
  },
  topicTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  topicAuthor: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  topicContent: {
    fontSize: SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 15,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicStat: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
  },
  topicDate: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    fontSize: SIZES.md,
    color: COLORS.textLight,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  createButton: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  disabledButton: {
    color: COLORS.textLight,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    fontSize: SIZES.md,
    marginBottom: 15,
  },
  contentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 15,
    fontSize: SIZES.md,
    textAlignVertical: 'top',
  },
});

export default ForumsScreen;