import { API_BASE_URL } from '../config';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  city: string;
  state: string;
  area: string;
  position: string;
  company: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
  bio: string;
  profilePicture?: string;
  coverPhoto?: string;
  aboutMe?: string;
  professionalTitle?: string;
  isApproved: boolean;
  isActive: boolean;
  role: string;
  planName?: string;
  connectionsCount?: number;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
    professionalTitle?: string;
    planName?: string;
  };
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isJoined: boolean;
  imageUrl?: string;
  createdAt: string;
}

export interface Forum {
  id: string;
  title: string;
  description: string;
  topicsCount: number;
  lastActivity?: string;
  category: string;
}

export interface Topic {
  id: string;
  forumId: string;
  title: string;
  content: string;
  authorId: string;
  repliesCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<User> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/api/user');
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    return this.request('/api/posts');
  }

  async createPost(content: string, imageUrl?: string): Promise<Post> {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content, imageUrl }),
    });
  }

  async likePost(postId: string): Promise<{ liked: boolean; likes: number }> {
    return this.request(`/api/posts/${postId}/like`, { method: 'POST' });
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return this.request(`/api/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string): Promise<Comment> {
    return this.request(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return this.request('/api/groups');
  }

  async joinGroup(groupId: string): Promise<void> {
    await this.request(`/api/groups/${groupId}/join`, { method: 'POST' });
  }

  async leaveGroup(groupId: string): Promise<void> {
    await this.request(`/api/groups/${groupId}/leave`, { method: 'POST' });
  }

  async getGroupPosts(groupId: string): Promise<Post[]> {
    return this.request(`/api/groups/${groupId}/posts`);
  }

  // Forums
  async getForums(): Promise<Forum[]> {
    return this.request('/api/forums');
  }

  async getForumTopics(forumId: string): Promise<Topic[]> {
    return this.request(`/api/forums/${forumId}/topics`);
  }

  async createTopic(forumId: string, title: string, content: string): Promise<Topic> {
    return this.request(`/api/forums/${forumId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  // Members
  async getMembers(): Promise<User[]> {
    return this.request('/api/members');
  }

  async getUserProfile(userId: string): Promise<User> {
    return this.request(`/api/profile/${userId}`);
  }

  // Connections
  async getConnections(): Promise<any[]> {
    return this.request('/api/connections');
  }

  async sendConnectionRequest(receiverId: string): Promise<void> {
    await this.request('/api/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  }

  async acceptConnection(connectionId: string): Promise<void> {
    await this.request(`/api/connections/${connectionId}/accept`, { method: 'POST' });
  }

  async rejectConnection(connectionId: string): Promise<void> {
    await this.request(`/api/connections/${connectionId}/reject`, { method: 'POST' });
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    return this.request('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.request(`/api/notifications/${notificationId}/read`, { method: 'POST' });
  }

  // Conversations/Messages
  async getConversations(): Promise<any[]> {
    return this.request('/api/conversations');
  }

  async getMessages(conversationId: string): Promise<any[]> {
    return this.request(`/api/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<any> {
    return this.request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

export default new ApiService();