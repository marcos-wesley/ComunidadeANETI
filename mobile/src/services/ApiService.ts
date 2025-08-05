import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - usar o servidor Replit atual
const BASE_URL = 'https://0a3d4ae2-8cbc-470c-b717-a8e70ac8fbd5-00-3ngb0yqx1oa41.kirk.replit.dev';

class ApiServiceClass {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      withCredentials: true, // Para manter as sessões do backend atual
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // O backend atual usa sessões via cookies, não headers Authorization
    // Interceptor para adicionar headers necessários
    this.axiosInstance.interceptors.request.use((config) => {
      // Manter cookies para sessões
      return config;
    });

    // Interceptor para tratar respostas de erro
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirou ou usuário não autenticado
          this.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('authToken');
  }

  // AUTH ENDPOINTS
  async login(username: string, password: string) {
    const response = await this.axiosInstance.post('/api/login', {
      username,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await this.axiosInstance.post('/api/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.axiosInstance.get('/api/user');
    return response.data;
  }

  // MEMBERSHIP PLANS
  async getMembershipPlans() {
    const response = await this.axiosInstance.get('/api/membership-plans');
    return response.data;
  }

  // USER MANAGEMENT
  async getMembers() {
    const response = await this.axiosInstance.get('/api/members');
    return response.data;
  }

  async updateProfile(profileData: any) {
    const response = await this.axiosInstance.put('/api/user/profile', profileData);
    return response.data;
  }

  // POSTS & FEED
  async getPosts() {
    const response = await this.axiosInstance.get('/api/posts');
    return response.data;
  }

  async createPost(postData: any) {
    const response = await this.axiosInstance.post('/api/posts', postData);
    return response.data;
  }

  async likePost(postId: string) {
    const response = await this.axiosInstance.post(`/api/posts/${postId}/like`);
    return response.data;
  }

  async addComment(postId: string, content: string) {
    const response = await this.axiosInstance.post(`/api/posts/${postId}/comments`, {
      content,
    });
    return response.data;
  }

  // CONNECTIONS
  async getConnections() {
    const response = await this.axiosInstance.get('/api/connections');
    return response.data;
  }

  async getPendingConnections() {
    const response = await this.axiosInstance.get('/api/connections/pending');
    return response.data;
  }

  async sendConnectionRequest(userId: string) {
    const response = await this.axiosInstance.post('/api/connections/request', {
      receiverId: userId,
    });
    return response.data;
  }

  async acceptConnection(connectionId: string) {
    const response = await this.axiosInstance.post(`/api/connections/${connectionId}/accept`);
    return response.data;
  }

  async rejectConnection(connectionId: string) {
    const response = await this.axiosInstance.post(`/api/connections/${connectionId}/reject`);
    return response.data;
  }

  // NOTIFICATIONS
  async getNotifications() {
    const response = await this.axiosInstance.get('/api/notifications');
    return response.data;
  }

  async getUnreadNotificationsCount() {
    const response = await this.axiosInstance.get('/api/notifications/unread-count');
    return response.data;
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.axiosInstance.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  }

  // CONVERSATIONS/MESSAGES
  async getConversations() {
    const response = await this.axiosInstance.get('/api/conversations');
    return response.data;
  }

  async getMessages(conversationId: string) {
    const response = await this.axiosInstance.get(`/api/conversations/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: string, content: string) {
    const response = await this.axiosInstance.post(`/api/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  }

  // USER APPLICATION STATUS
  async getUserApplication() {
    const response = await this.axiosInstance.get('/api/user/application');
    return response.data;
  }

  // UTILS
  async checkEmailAvailability(email: string) {
    const response = await this.axiosInstance.post('/api/check-email', { email });
    return response.data;
  }

  async checkUsernameAvailability(username: string) {
    const response = await this.axiosInstance.post('/api/check-username', { username });
    return response.data;
  }
}

export const ApiService = new ApiServiceClass();