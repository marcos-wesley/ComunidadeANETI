import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import ApiService, { Post } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  const loadPosts = async () => {
    try {
      const postsData = await ApiService.getPosts();
      setPosts(postsData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar posts');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      Alert.alert('Erro', 'Digite o conteúdo da publicação');
      return;
    }

    setIsCreatingPost(true);
    try {
      await ApiService.createPost(newPostContent.trim());
      setNewPostContent('');
      setShowCreatePost(false);
      loadPosts(); // Reload posts
      Alert.alert('Sucesso', 'Publicação criada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a publicação');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const result = await ApiService.likePost(postId);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: result.liked, likesCount: result.likes }
          : post
      ));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível curtir a publicação');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Agora mesmo';
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)}d atrás`;
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando feed..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPosts} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.createPostContainer}>
          <TouchableOpacity 
            style={styles.createPostButton}
            onPress={() => setShowCreatePost(true)}
          >
            <Text style={styles.createPostText}>No que você está pensando, {user?.fullName?.split(' ')[0]}?</Text>
          </TouchableOpacity>
        </View>

        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {post.author.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.authorDetails}>
                  <Text style={styles.authorName}>{post.author.fullName}</Text>
                  <Text style={styles.authorTitle}>
                    {post.author.professionalTitle || post.author.username}
                  </Text>
                  <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.imageUrl && (
              <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
            )}

            <View style={styles.postActions}>
              <TouchableOpacity 
                style={[styles.actionButton, post.isLiked && styles.likedButton]}
                onPress={() => handleLikePost(post.id)}
              >
                <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                  👍 {post.likesCount} Curtir
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>💬 {post.commentsCount} Comentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

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
            <Text style={styles.modalTitle}>Nova Publicação</Text>
            <TouchableOpacity 
              onPress={handleCreatePost}
              disabled={isCreatingPost || !newPostContent.trim()}
            >
              <Text style={[
                styles.postButton, 
                (!newPostContent.trim() || isCreatingPost) && styles.disabledButton
              ]}>
                {isCreatingPost ? 'Publicando...' : 'Publicar'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.postInput}
            placeholder="No que você está pensando?"
            value={newPostContent}
            onChangeText={setNewPostContent}
            multiline
            autoFocus
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  createPostContainer: {
    backgroundColor: COLORS.white,
    margin: 15,
    borderRadius: 12,
    padding: 15,
  },
  createPostButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 25,
    padding: 15,
  },
  createPostText: {
    color: COLORS.textLight,
    fontSize: SIZES.md,
  },
  postCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
  },
  postHeader: {
    marginBottom: 15,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  authorTitle: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  postTime: {
    fontSize: SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  postContent: {
    fontSize: SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  likedButton: {
    backgroundColor: COLORS.primary + '10',
  },
  actionText: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  likedText: {
    color: COLORS.primary,
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
  postButton: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  disabledButton: {
    color: COLORS.textLight,
  },
  postInput: {
    flex: 1,
    padding: 20,
    fontSize: SIZES.md,
    textAlignVertical: 'top',
  },
});

export default FeedScreen;