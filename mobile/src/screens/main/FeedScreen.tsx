import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiService } from '../../services/ApiService';
import { useAuth } from '../../services/AuthContext';

const COLORS = {
  primary: '#012d6a',
  secondary: '#25a244',
  white: '#ffffff',
  gray: '#666666',
  lightGray: '#f5f5f5',
  border: '#e1e1e1'
};

interface Post {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const loadPosts = async () => {
    try {
      const postsData = await ApiService.getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Erro', 'Não foi possível carregar o feed');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Erro', 'Digite o conteúdo do post');
      return;
    }

    setPosting(true);
    try {
      await ApiService.createPost({ content: newPostContent.trim() });
      setNewPostContent('');
      setShowCreatePost(false);
      await loadPosts(); // Recarregar feed
      Alert.alert('Sucesso', 'Post publicado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível publicar o post');
    } finally {
      setPosting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await ApiService.likePost(postId);
      // Atualizar o estado local
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
              }
            : post
        )
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível curtir o post');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    if (user?.isApproved) {
      loadPosts();
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
          Você precisa ter sua conta aprovada para acessar o feed da comunidade.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Carregando feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botão para criar post */}
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={() => setShowCreatePost(true)}
      >
        <MaterialIcons name="edit" size={20} color={COLORS.white} />
        <Text style={styles.createPostText}>Criar Post</Text>
      </TouchableOpacity>

      {/* Feed de posts */}
      <ScrollView
        style={styles.feedContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="dynamic-feed" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
            <Text style={styles.emptyText}>
              Seja o primeiro a compartilhar algo com a comunidade!
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatar}>
                    <MaterialIcons name="person" size={24} color={COLORS.white} />
                  </View>
                  <View>
                    <Text style={styles.authorName}>{post.authorName}</Text>
                    <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleLikePost(post.id)}
                >
                  <MaterialIcons 
                    name={post.isLiked ? "favorite" : "favorite-border"} 
                    size={20} 
                    color={post.isLiked ? COLORS.secondary : COLORS.gray} 
                  />
                  <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                    {post.likesCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="comment" size={20} color={COLORS.gray} />
                  <Text style={styles.actionText}>{post.commentsCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <MaterialIcons name="share" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para criar post */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreatePost(false)}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Post</Text>
            <TouchableOpacity 
              onPress={handleCreatePost}
              disabled={posting || !newPostContent.trim()}
            >
              <Text style={[
                styles.postButton, 
                (posting || !newPostContent.trim()) && styles.disabledButton
              ]}>
                {posting ? 'Publicando...' : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.postInput}
            placeholder="O que você está pensando?"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </Modal>
    </View>
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
  createPostButton: {
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
  createPostText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  feedContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
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
  postCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginBottom: 15,
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
  postHeader: {
    marginBottom: 15,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 24,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: COLORS.gray,
    marginLeft: 5,
    fontSize: 14,
  },
  likedText: {
    color: COLORS.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    color: COLORS.gray,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  postButton: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  postInput: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    color: COLORS.primary,
  },
});