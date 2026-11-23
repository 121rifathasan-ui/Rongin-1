export interface UserPrivacySettings {
  hideUsername?: boolean;
  hidePhone?: boolean;
  hideEmail?: boolean;
  hideBirthday?: boolean;
  hideAge?: boolean;
  hideGender?: boolean;
  hideLocation?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  contact?: string;
  phone?: string;
  email?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  location?: string;
  password?: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio: string;
  isVerified?: boolean;
  following: number;
  followers: number;
  likes: number;
  category?: string;
  website?: string;
  isFollowing?: boolean;
  isProfileLocked?: boolean;
  privacySettings?: UserPrivacySettings;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  timestamp: number;
  replies?: PostComment[];
}

export interface PostVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  userId: string;
  username: string;
  userDisplayName: string;
  avatarUrl: string;
  isVerified?: boolean;
  caption: string;
  tags: string[];
  musicTitle: string;
  musicAuthor: string;
  musicCover?: string;
  likes: number;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount: number;
  saves: number;
  isSaved?: boolean;
  shares: number;
  views: number;
  viewsCount?: number;
  watchTime: number; // in seconds
  timestamp: number;
  isFollowing?: boolean;
  isPinned?: boolean;
  privacy?: 'public' | 'friends' | 'private';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  text: string;
  mediaUrl?: string;
  sharedPost?: {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    username: string;
    avatarUrl: string;
  };
  timestamp: number;
  isRead: boolean;
  status?: 'sent' | 'delivered' | 'seen';
}

export interface Conversation {
  id: string;
  participant: {
    uid: string;
    name: string;
    username: string;
    avatarUrl: string;
    isOnline: boolean;
    isVerified?: boolean;
    lastSeen?: string;
  };
  lastMessage: DirectMessage;
  unreadCount: number;
}


export interface LiveStreamData {
  id: string;
  hostUser: UserProfile;
  title: string;
  viewerCount: number;
  startedAt: number;
  comments: {
    id: string;
    userId: string;
    username: string;
    userAvatar: string;
    text: string;
    badge?: string;
    timestamp: number;
  }[];
  heartsCount: number;
}



export interface AppNotification {
  id: string;
  recipientUid?: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
  actor: {
    uid: string;
    name: string;
    username: string;
    avatarUrl: string;
  };
  post?: {
    id: string;
    thumbnailUrl?: string;
    caption?: string;
  };
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface AnalyticsData {
  views: number;
  watchHours: number;
  engagement: number;
  followers: number;
  estimatedIncomeBdt: number;
  period: '7d' | '28d' | '90d' | 'total';
}

export interface VideoReport {
  id: string;
  postId: string;
  postUrl: string;
  postCaption: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId: string;
  reporterUsername: string;
  subject: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: number;
}

