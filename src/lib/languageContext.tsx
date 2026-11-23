import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  LanguageSelectorModal,
  WORLD_LANGUAGES,
  WorldLanguage,
} from '../components/LanguageSelectorModal';

export type Language = string;

export interface Translations {
  // Navigation
  home: string;
  discover: string;
  upload: string;
  inbox: string;
  profile: string;

  // Header & Feed
  following: string;
  forYou: string;
  live: string;
  search: string;
  searchPlaceholder: string;
  noVideosFound: string;
  noFollowingVideos: string;
  goToForYou: string;
  uploadNewVideo: string;

  // Actions
  like: string;
  comments: string;
  saves: string;
  share: string;
  views: string;
  originalSound: string;
  follow: string;
  followingBtn: string;
  messageBtn: string;

  // APK & App
  downloadApk: string;
  apkDownloadTitle: string;
  installApp: string;
  installGuide: string;

  // Studio & Upload
  createVideo: string;
  recordVideo: string;
  selectFile: string;
  captionPlaceholder: string;
  postVideo: string;
  drafts: string;
  effects: string;
  speed: string;
  flip: string;
  timer: string;
  maxDurationNotice: string;

  // Profile & Settings Drawer
  editProfile: string;
  creatorDashboard: string;
  privacy: string;
  analytics: string;
  myVideos: string;
  aboutTab: string;
  likedVideos: string;
  savedVideos: string;
  privateVideos: string;
  followers: string;
  likesReceived: string;
  login: string;
  logout: string;

  settingsAndMenu: string;
  appSettings: string;
  languageLabel: string;
  themeMode: string;
  darkMode: string;
  lightMode: string;
  creatorAndProfileTools: string;
  shareProfile: string;
  profileLinkCopied: string;
  personalInfo: string;
  changePassword: string;
  updateYourPassword: string;
  profileLock: string;
  lockProfileSubtitle: string;
  onlyMutualFriendsView: string;
  profileLockedToast: string;
  profileUnlockedToast: string;
  accountSection: string;
  switchOrAddAccount: string;
  thisProfileIsLocked: string;
  lockedProfileDesc: string;
  noVideosUploadedYet: string;
  noSavedVideos: string;
  noPrivateVideos: string;
  pinned: string;
  aboutBioTitle: string;
  noBioAddedYet: string;
  noBioProvided: string;
  noPublicDetails: string;
  hiddenLabel: string;
  editPersonalInfoPrivacyBtn: string;

  // Personal Info Modal
  saving: string;
  save: string;
  changePhoto: string;
  savingPhoto: string;
  basicInfo: string;
  fullName: string;
  fullNamePlaceholder: string;
  bio: string;
  bioPlaceholder: string;
  genderAndDob: string;
  genderLabel: string;
  male: string;
  female: string;
  otherGender: string;
  birthdayLabel: string;
  tapToSelect: string;
  ageLabel: string;
  yearsLabel: string;
  contactInfo: string;
  emailLabel: string;
  addEmailPlaceholder: string;
  phoneLabel: string;
  addPhonePlaceholder: string;
  doneBtn: string;
  addBtn: string;
  locationLabel: string;
  locationPlaceholder: string;
  websiteLabel: string;
  websitePlaceholder: string;
  whoCanSeeSection: string;
  hideFromOthers: string;
  usernameLabel: string;

  // Change Password Modal
  passwordSecurityDesc: string;
  currentPasswordLabel: string;
  currentPasswordPlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  savePasswordBtn: string;
  errEnterCurrentPass: string;
  errNewPassMin: string;
  errConfirmPassMismatch: string;
  errWrongCurrentPass: string;
  errChangePassFailed: string;
  passChangedSuccess: string;

  // Edit Profile Modal
  profileCustomization: string;
  tapCameraToChangePhoto: string;
  displayName: string;
  yourNamePlaceholder: string;
  usernameHandle: string;
  creatorCategory: string;
  bioDescription: string;
  socialWebsiteLink: string;
  cancel: string;
  saveChanges: string;
  uploading: string;

  // Inbox & Direct Messages
  directMessages: string;
  messagesTab: string;
  notificationsTab: string;
  sendMessage: string;
  typeMessage: string;
  searchPeoplePlaceholder: string;
  recentChats: string;
  noMessagesFound: string;
  startNewChat: string;
  startConversationPrompt: string;
  loginToUseMessenger: string;
  loginMessengerDesc: string;
  loginOrCreateAccount: string;
  allFilter: string;
  likesFilter: string;
  commentsFilter: string;
  followersFilter: string;
  noPrivateNotifications: string;
  startedFollowingYou: string;
  likedYourVideo: string;
  commentedPrefix: string;
  justNow: string;
  minAgo: string;
  hourAgo: string;
  dayAgo: string;
  e2eeProtected: string;

  // Share, Report & Comments
  report: string;
  block: string;
  copyLink: string;
  copied: string;
  shareTo: string;
  sendBtn: string;
  downloadVideo: string;
  editVideo: string;
  deleteVideo: string;
  moreApps: string;
  commentsTitle: string;
  noCommentsYet: string;
  beFirstToComment: string;
  replyBtn: string;
  writeCommentPlaceholder: string;

  // Discover & Dashboard
  trendingHashtags: string;
  exploreTitle: string;
  videosUnit: string;
  professionalDashboard: string;
  creatorInsightsSubtitle: string;
  last7Days: string;
  last28Days: string;
  last90Days: string;
  allTime: string;
  totalViews: string;
  watchTime: string;
  engagement: string;
  estimatedIncome: string;
  withdrawMoney: string;
  creatorTargetsTitle: string;
  followersTarget: string;
  viewsTarget: string;
  watchTimeTarget: string;
  engagementTarget: string;

  // Offline & Language Modal
  offlineModeBanner: string;
  installAppSubtitle: string;
  installTikTokTitle: string;
  installBtn: string;
  iosInstallTitle: string;
  iosInstallStep1: string;
  iosInstallStep2: string;
  switchLanguage: string;
  selectLanguageTitle: string;
  searchLanguagePlaceholder: string;
  noLanguageFound: string;

  // Inbox Extras
  ronginDm: string;
  seenStatus: string;
  sentStatus: string;
  minAgoFull: string;
  hourAgoFull: string;
  dayAgoFull: string;

  // Discover Extras
  searchDiscoverPlaceholder: string;
  trendingChallengeTitle: string;
  trendingChallengeDesc: string;
  resultsFor: string;

  // Creator Dashboard Extras
  activeVideoViews: string;
  totalWatchHours: string;
  likeCommentShare: string;
  activeAudience: string;
  incomeRateDesc: string;
  level2Creator: string;
  withdrawMoneyTitle: string;
  withdrawableBalance: string;
  paymentMethod: string;
  personalMobileNumber: string;
  withdrawSuccessTitle: string;
  withdrawSuccessDesc: string;
  confirmBtn: string;
  enterValidNumberErr: string;

  // Auth Modal
  signupSubtitle: string;
  loginSubtitle: string;
  googleLoginBtn: string;
  orDivider: string;
  savedAccountsTitle: string;
  tapToLogin: string;
  removeFromList: string;
  signUpTab: string;
  logInTab: string;
  yourFullNameLabel: string;
  mobileOrEmailLabel: string;
  oneIdPerContact: string;
  ageYearsLabel: string;
  passwordLabel: string;
  passwordMinPlaceholder: string;
  confirmAccountBtn: string;
  enterYourPasswordPlaceholder: string;
  errNameRequired: string;
  errContactRequired: string;
  errMinAge: string;
  errPassMin: string;
  errEnterPassword: string;
  errWrongPassword: string;
  errLoginFailed: string;
  welcomeBackMsg: string;
  welcomeNewAccountMsg: string;

  // Share Modal Extras
  sendToHeader: string;
  noContactsFound: string;
  reportVideoTitle: string;
  reportSubjectLabel: string;
  reportSubjectPlaceholder: string;
  reportDetailsLabel: string;
  reportDetailsPlaceholder: string;
  submitting: string;
  submitBtn: string;
  editPostTitle: string;
  changeThumbnail: string;
  changeThumbnailLong: string;
  whoCanViewLabel: string;
  everyoneOpt: string;
  friendsOpt: string;
  onlyMeOpt: string;
  updateBtn: string;
  deleteVideoConfirmTitle: string;
  deleteVideoConfirmDesc: string;
  noKeepIt: string;
  yesDeleteIt: string;
  moreShareOptions: string;
  reportReason1: string;
  reportReason2: string;
  reportReason3: string;
  reportReason4: string;
  reportReason5: string;
  reportSubmittedToast: string;
  postUpdatedToast: string;
  videoDeletedToast: string;
  sentToMessengerToast: string;
  downloadStartedToast: string;
  videoSavedDeviceToast: string;

  // VideoPlayer, Studio, ThumbnailPicker & App
  loadingVideo: string;
  cannotPlayVideo: string;
  cannotPlayVideoDesc: string;
  retryBtn: string;
  promoteVideo: string;
  featureComingSoon: string;
  seeLess: string;
  seeMore: string;
  backBtn: string;
  postEditorTitle: string;
  changeVideoBtn: string;
  selectThumbnailBtn: string;
  selectMusicTitle: string;
  galleryBtn: string;
  filtersBtn: string;
  audioTrackLabel: string;
  cloudStorageLabel: string;
  backgroundUploadNote: string;
  savedToDraftsToast: string;
  chooseFromVideo: string;
  selectedThumbnailLabel: string;
  selectAnyVideoPart: string;
  useThisFrameBtn: string;
  chooseFromGalleryBtn: string;
  saveThumbnailBtn: string;
  uploadingVideoProgress: string;
  processingVideoProgress: string;
  continueUsingApp: string;
  videoPublishedToast: string;
  activateFeedDesc: string;

  // Thumbnail & Profile Tooltips
  thumbNotReady: string;
  thumbFrameSelected: string;
  thumbLinkError: string;
  thumbPreparingGallery: string;
  thumbGallerySelected: string;
  thumbReadError: string;
  thumbChoosePrompt: string;
  menuLabel: string;
  lockedProfileTitle: string;
}

export const EN_TRANSLATIONS: Translations = {
  home: 'Home',
  discover: 'Discover',
  upload: 'Create',
  inbox: 'Inbox',
  profile: 'Profile',

  following: 'Following',
  forYou: 'For You',
  live: 'LIVE',
  search: 'Search',
  searchPlaceholder: 'Search videos, hashtags or creators...',
  noVideosFound: 'No videos found',
  noFollowingVideos: 'No posts from accounts you follow yet. Explore or follow creators.',
  goToForYou: 'Go to For You',
  uploadNewVideo: 'Upload New Video',

  like: 'Like',
  comments: 'Comments',
  saves: 'Saves',
  share: 'Share',
  views: 'Views',
  originalSound: 'Original Sound',
  follow: 'Follow',
  followingBtn: 'Following',
  messageBtn: 'Message',

  downloadApk: 'Download APK',
  apkDownloadTitle: 'Download & Install Rongin APK',
  installApp: 'Install App',
  installGuide: 'Installation Guide',

  createVideo: 'Create Video',
  recordVideo: 'Camera Record',
  selectFile: 'Upload File',
  captionPlaceholder: 'Describe your video... #hashtags @mentions',
  postVideo: 'Post Video',
  drafts: 'Drafts',
  effects: 'Filters & Effects',
  speed: 'Speed',
  flip: 'Flip Camera',
  timer: 'Timer',
  maxDurationNotice: 'Max 5 minutes video allowed',

  editProfile: 'Edit Profile',
  creatorDashboard: 'Dashboard',
  privacy: 'Privacy & Security',
  analytics: 'Analytics',
  myVideos: 'My Videos',
  aboutTab: 'About',
  likedVideos: 'Liked',
  savedVideos: 'Saved',
  privateVideos: 'Private',
  followers: 'Followers',
  likesReceived: 'Likes',
  login: 'Log In',
  logout: 'Log Out',

  settingsAndMenu: 'Settings & Menu',
  appSettings: 'App Settings',
  languageLabel: 'Language',
  themeMode: 'Theme Mode',
  darkMode: 'Dark',
  lightMode: 'Light',
  creatorAndProfileTools: 'Creator & Profile Tools',
  shareProfile: 'Share Profile',
  profileLinkCopied: 'Profile link copied!',
  personalInfo: 'Personal Info',
  changePassword: 'Change Password',
  updateYourPassword: 'Update your password',
  profileLock: 'Profile Lock',
  lockProfileSubtitle: 'Lock your profile to restrict access',
  onlyMutualFriendsView: 'Only mutual friends can view',
  profileLockedToast: 'Profile locked — only friends can view',
  profileUnlockedToast: 'Profile unlocked',
  accountSection: 'Account',
  switchOrAddAccount: 'Switch or Add Account',
  thisProfileIsLocked: 'This profile is locked',
  lockedProfileDesc: 'Only mutual friends can see videos and personal details on this locked profile.',
  noVideosUploadedYet: 'No videos uploaded yet',
  noSavedVideos: 'No saved videos',
  noPrivateVideos: 'No private videos',
  pinned: 'Pinned',
  aboutBioTitle: 'About',
  noBioAddedYet: 'No bio added yet.',
  noBioProvided: 'No bio provided.',
  noPublicDetails: 'No public personal details available.',
  hiddenLabel: 'Hidden',
  editPersonalInfoPrivacyBtn: 'Edit Personal Info & Privacy Settings',

  saving: 'Saving...',
  save: 'Save',
  changePhoto: 'Change Photo',
  savingPhoto: 'Saving photo...',
  basicInfo: 'Basic Info',
  fullName: 'Full Name',
  fullNamePlaceholder: 'Enter your full name',
  bio: 'Bio',
  bioPlaceholder: 'Write about yourself...',
  genderAndDob: 'Gender & Birthday',
  genderLabel: 'Gender',
  male: 'Male',
  female: 'Female',
  otherGender: 'Other',
  birthdayLabel: 'Birthday',
  tapToSelect: 'Tap to select',
  ageLabel: 'Age',
  yearsLabel: 'years',
  contactInfo: 'Contact Info',
  emailLabel: 'Email',
  addEmailPlaceholder: 'Add email address',
  phoneLabel: 'Phone Number',
  addPhonePlaceholder: 'Add phone number',
  doneBtn: 'Done',
  addBtn: 'Add',
  locationLabel: 'Location',
  locationPlaceholder: 'Enter your city or location',
  websiteLabel: 'Website',
  websitePlaceholder: 'https://...',
  whoCanSeeSection: 'Who can see your details',
  hideFromOthers: 'Hide from other users',
  usernameLabel: 'Username',

  passwordSecurityDesc: 'Use a strong password to keep your account secure.',
  currentPasswordLabel: 'Current Password',
  currentPasswordPlaceholder: 'Enter current password',
  newPasswordLabel: 'New Password',
  newPasswordPlaceholder: 'Enter new password',
  confirmPasswordLabel: 'Confirm New Password',
  confirmPasswordPlaceholder: 'Re-enter new password',
  savePasswordBtn: 'Save Password',
  errEnterCurrentPass: 'Please enter your current password.',
  errNewPassMin: 'New password must be at least 4 characters.',
  errConfirmPassMismatch: 'New password and confirm password do not match.',
  errWrongCurrentPass: 'Current password is incorrect.',
  errChangePassFailed: 'Failed to update password.',
  passChangedSuccess: 'Password changed successfully!',

  profileCustomization: 'Profile Customization',
  tapCameraToChangePhoto: 'Tap the camera icon or select a preset avatar',
  displayName: 'Display Name',
  yourNamePlaceholder: 'Your name',
  usernameHandle: 'Username (Handle)',
  creatorCategory: 'Creator Category',
  bioDescription: 'Bio (Description)',
  socialWebsiteLink: 'Social / Website Link',
  cancel: 'Cancel',
  saveChanges: 'Save Changes',
  uploading: 'Uploading...',

  directMessages: 'Direct Messages',
  messagesTab: 'Messages',
  notificationsTab: 'Notifications',
  sendMessage: 'Send',
  typeMessage: 'Type a message...',
  searchPeoplePlaceholder: 'Search by name or @username...',
  recentChats: 'Recent Chats',
  noMessagesFound: 'No messages yet. Search a user or tap Message on a profile to start chatting.',
  startNewChat: 'Start New Chat',
  startConversationPrompt: 'Start a private conversation.',
  loginToUseMessenger: 'Log in to use Messenger',
  loginMessengerDesc: 'Log in to your account to chat privately with friends and view your notifications.',
  loginOrCreateAccount: 'Log In / Create Account',
  allFilter: 'All',
  likesFilter: 'Likes',
  commentsFilter: 'Comments',
  followersFilter: 'Followers',
  noPrivateNotifications: 'No notifications yet.',
  startedFollowingYou: 'started following you.',
  likedYourVideo: 'liked your video.',
  commentedPrefix: 'commented:',
  justNow: 'Just now',
  minAgo: 'm',
  hourAgo: 'h',
  dayAgo: 'd',
  e2eeProtected: 'Encrypted Private Chat',

  report: 'Report',
  block: 'Block User',
  copyLink: 'Copy Link',
  copied: 'Copied!',
  shareTo: 'Share to',
  sendBtn: 'Send',
  downloadVideo: 'Save Video',
  editVideo: 'Edit',
  deleteVideo: 'Delete',
  moreApps: 'More',
  commentsTitle: 'Comments',
  noCommentsYet: 'No comments yet',
  beFirstToComment: 'Be the first to comment!',
  replyBtn: 'Reply',
  writeCommentPlaceholder: 'Add a comment...',

  trendingHashtags: 'Trending Hashtags',
  exploreTitle: 'Explore',
  videosUnit: 'videos',
  professionalDashboard: 'Professional Dashboard',
  creatorInsightsSubtitle: 'Creator insights & income monitor',
  last7Days: 'Last 7 days',
  last28Days: 'Last 28 days',
  last90Days: 'Last 90 days',
  allTime: 'All time',
  totalViews: 'Total Views',
  watchTime: 'Watch Time',
  engagement: 'Engagement',
  estimatedIncome: 'Estimated Income (BDT)',
  withdrawMoney: 'Withdraw',
  creatorTargetsTitle: 'Creator Targets & Milestones',
  followersTarget: 'Followers Target',
  viewsTarget: 'Views Target',
  watchTimeTarget: 'Watch Time Target',
  engagementTarget: 'Engagement Target',

  offlineModeBanner: 'Offline Mode — Showing cached videos',
  installAppSubtitle: 'Fast fullscreen & offline experience',
  installTikTokTitle: 'Install Rongin App',
  installBtn: 'Install',
  iosInstallTitle: 'Install on iPhone / iPad',
  iosInstallStep1: '1. Tap the Share icon at the bottom of Safari.',
  iosInstallStep2: '2. Scroll down and select "Add to Home Screen".',
  switchLanguage: 'Language',
  selectLanguageTitle: 'Select Language',
  searchLanguagePlaceholder: 'Search language or country...',
  noLanguageFound: 'No matching language found',

  ronginDm: 'Rongin DM',
  seenStatus: 'Seen',
  sentStatus: 'Sent',
  minAgoFull: 'm ago',
  hourAgoFull: 'h ago',
  dayAgoFull: 'd ago',

  searchDiscoverPlaceholder: 'Search videos, creators, hashtags or songs...',
  trendingChallengeTitle: '#BanglaVibes Trend Challenge',
  trendingChallengeDesc: 'Post your creative short videos and earn an official verification badge!',
  resultsFor: 'Results for',

  activeVideoViews: 'Active video views',
  totalWatchHours: 'Total watch hours',
  likeCommentShare: 'Likes + Comments + Shares',
  activeAudience: 'Active audience',
  incomeRateDesc: 'Rate: ৳5.00 per 1,000 views (bonus included)',
  level2Creator: 'Level 2 Creator',
  withdrawMoneyTitle: 'Withdraw Money',
  withdrawableBalance: 'Withdrawable Balance',
  paymentMethod: 'Payment Method',
  personalMobileNumber: 'Mobile Number (Personal)',
  withdrawSuccessTitle: 'Withdrawal request submitted!',
  withdrawSuccessDesc: 'Funds will be sent to your bKash number within 24 hours.',
  confirmBtn: 'Confirm',
  enterValidNumberErr: 'Please enter a valid 11-digit bKash/Nagad number.',

  signupSubtitle: 'Create a unique account with your mobile number or email',
  loginSubtitle: 'Sign in to your account',
  googleLoginBtn: 'Continue with Google (Gmail Accounts)',
  orDivider: 'OR',
  savedAccountsTitle: 'Saved Accounts',
  tapToLogin: 'Tap to log in',
  removeFromList: 'Remove from list',
  signUpTab: 'Sign Up',
  logInTab: 'Log In',
  yourFullNameLabel: 'Your Full Name',
  mobileOrEmailLabel: 'Mobile Number or Email',
  oneIdPerContact: '1 ID per contact',
  ageYearsLabel: 'Age (Years)',
  passwordLabel: 'Password',
  passwordMinPlaceholder: 'At least 4 characters',
  confirmAccountBtn: 'Create Account',
  enterYourPasswordPlaceholder: 'Enter your password',
  errNameRequired: 'Please enter your name.',
  errContactRequired: 'Please enter a mobile number or email.',
  errMinAge: 'You must be at least 12 years old to create an account.',
  errPassMin: 'Password must be at least 4 characters.',
  errEnterPassword: 'Please enter your password.',
  errWrongPassword: 'Incorrect password. Please try again.',
  errLoginFailed: 'Login failed.',
  welcomeBackMsg: 'Welcome back',
  welcomeNewAccountMsg: 'Account created successfully! Welcome',

  sendToHeader: 'Send to',
  noContactsFound: 'No Messenger contacts found',
  reportVideoTitle: 'Report Video',
  reportSubjectLabel: 'Reason / Subject',
  reportSubjectPlaceholder: 'e.g. Spam, harassment, or copyright',
  reportDetailsLabel: 'Details',
  reportDetailsPlaceholder: 'Describe what is wrong with this video...',
  submitting: 'Submitting...',
  submitBtn: 'Submit',
  editPostTitle: 'Edit Post',
  changeThumbnail: 'Change Thumbnail',
  changeThumbnailLong: 'Change Thumbnail (from video or gallery)',
  whoCanViewLabel: 'Who can view',
  everyoneOpt: 'Everyone',
  friendsOpt: 'Friends',
  onlyMeOpt: 'Only me',
  updateBtn: 'Update',
  deleteVideoConfirmTitle: 'Delete this video?',
  deleteVideoConfirmDesc: 'Once deleted, this video cannot be recovered.',
  noKeepIt: 'No, keep it',
  yesDeleteIt: 'Yes, delete',
  moreShareOptions: 'More Share Options',
  reportReason1: 'Inappropriate content',
  reportReason2: 'Spam or scam',
  reportReason3: 'Copyright violation',
  reportReason4: 'Hate or harassment',
  reportReason5: 'Misinformation',
  reportSubmittedToast: 'Report submitted! Thank you.',
  postUpdatedToast: 'Post updated successfully!',
  videoDeletedToast: 'Video deleted!',
  sentToMessengerToast: 'Sent to Messenger!',
  downloadStartedToast: 'Starting video download...',
  videoSavedDeviceToast: 'Video saved to your device!',

  loadingVideo: 'Loading video...',
  cannotPlayVideo: 'Unable to play video',
  cannotPlayVideoDesc: 'Scroll to another video due to network or stream limitations.',
  retryBtn: 'Retry',
  promoteVideo: 'Promote Video',
  featureComingSoon: 'This feature will be available soon.',
  seeLess: 'Show less',
  seeMore: 'See more',
  backBtn: 'Back',
  postEditorTitle: 'Post Editor',
  changeVideoBtn: 'Change Video',
  selectThumbnailBtn: 'Select Thumbnail',
  selectMusicTitle: 'Select Music',
  galleryBtn: 'Gallery',
  filtersBtn: 'Filters',
  audioTrackLabel: 'Audio Track',
  cloudStorageLabel: 'Cloud Storage',
  backgroundUploadNote: 'Upload completes in the background while you continue using the app.',
  savedToDraftsToast: 'Saved to drafts!',
  chooseFromVideo: 'Choose from video',
  selectedThumbnailLabel: 'Selected Thumbnail',
  selectAnyVideoPart: 'Select any part of the video',
  useThisFrameBtn: 'Use This Frame',
  chooseFromGalleryBtn: 'Choose Thumbnail from Gallery',
  saveThumbnailBtn: 'Save Thumbnail',
  uploadingVideoProgress: 'Uploading video...',
  processingVideoProgress: 'Processing...',
  continueUsingApp: 'Continue using the app',
  videoPublishedToast: 'Your video has been published!',
  activateFeedDesc: 'Post a new video to start the feed.',

  thumbNotReady: 'Video frame is not ready yet. Please wait a moment and try again.',
  thumbFrameSelected: 'Selected video frame set as thumbnail!',
  thumbLinkError: 'Cannot capture frame from this video link. Please choose from gallery.',
  thumbPreparingGallery: 'Preparing thumbnail from gallery...',
  thumbGallerySelected: 'Thumbnail selected from gallery!',
  thumbReadError: 'Could not read image. Please try another photo.',
  thumbChoosePrompt: 'Select a video frame or photo from gallery',
  menuLabel: 'Menu',
  lockedProfileTitle: 'Locked Profile',
};

export const BN_TRANSLATIONS: Translations = {
  home: 'হোম',
  discover: 'এক্সপ্লোর',
  upload: 'তৈরি করুন',
  inbox: 'ইনবক্স',
  profile: 'প্রোফাইল',

  following: 'ফলোয়িং',
  forYou: 'ফর ইউ',
  live: 'লাইভ',
  search: 'খুঁজুন',
  searchPlaceholder: 'ভিডিও, হ্যাশট্যাগ বা ক্রিয়েটর খুঁজুন...',
  noVideosFound: 'কোনো ভিডিও পাওয়া যায়নি',
  noFollowingVideos: 'আপনি যাদের ফলো করেছেন তাদের কোনো পোস্ট নেই। এক্সপ্লোর করুন বা নতুন ক্রিয়েটরদের ফলো করুন।',
  goToForYou: 'ফর ইউ ফিডে যান',
  uploadNewVideo: 'নতুন ভিডিও আপলোড করুন',

  like: 'লাইক',
  comments: 'মন্তব্য',
  saves: 'সেভ',
  share: 'শেয়ার',
  views: 'ভিউ',
  originalSound: 'অরিজিনাল সাউন্ড',
  follow: 'ফলো',
  followingBtn: 'ফলোয়িং',
  messageBtn: 'মেসেজ',

  downloadApk: 'APK ডাউনলোড',
  apkDownloadTitle: 'রঙিন অ্যাপ APK ডাউনলোড ও ইনস্টল',
  installApp: 'অ্যাপ ইনস্টল করুন',
  installGuide: 'ইনস্টলেশন গাইড',

  createVideo: 'ভিডিও তৈরি করুন',
  recordVideo: 'ক্যামেরা রেকর্ড',
  selectFile: 'ফাইল আপলোড',
  captionPlaceholder: 'ভিডিও সম্পর্কে কিছু লিখুন... #hashtags @mentions',
  postVideo: 'পোস্ট করুন',
  drafts: 'ড্রাফট',
  effects: 'ফিল্টার ও এফেক্ট',
  speed: 'স্পিড',
  flip: 'ক্যামেরা ঘোরান',
  timer: 'টাইমার',
  maxDurationNotice: 'সর্বোচ্চ ৫ মিনিটের ভিডিও গ্রহণযোগ্য',

  editProfile: 'এডিট প্রোফাইল',
  creatorDashboard: 'ড্যাশবোর্ড',
  privacy: 'প্রাইভেসি ও সিকিউরিটি',
  analytics: 'অ্যানালিটিক্স',
  myVideos: 'আমার ভিডিও',
  aboutTab: 'অ্যাবাউট',
  likedVideos: 'পছন্দের ভিডিও',
  savedVideos: 'সংরক্ষিত',
  privateVideos: 'প্রাইভেট',
  followers: 'ফলোয়ার',
  likesReceived: 'মোট লাইক',
  login: 'লগইন করুন',
  logout: 'লগআউট',

  settingsAndMenu: 'সেটিংস ও মেনু',
  appSettings: 'অ্যাপ সেটিংস',
  languageLabel: 'ভাষা (Language)',
  themeMode: 'থিম মোড',
  darkMode: 'ডার্ক',
  lightMode: 'লাইট',
  creatorAndProfileTools: 'ব্যক্তিগত ও ক্রিয়েটর টুল',
  shareProfile: 'প্রোফাইল শেয়ার করুন',
  profileLinkCopied: 'প্রোফাইল লিংক কপি করা হয়েছে!',
  personalInfo: 'ব্যক্তিগত তথ্য',
  changePassword: 'পাসওয়ার্ড পরিবর্তন',
  updateYourPassword: 'আপনার পাসওয়ার্ড আপডেট করুন',
  profileLock: 'প্রোফাইল লক',
  lockProfileSubtitle: 'অন্যদের অ্যাক্সেস সীমিত করতে প্রোফাইল লক করুন',
  onlyMutualFriendsView: 'শুধু মিউচুয়াল ফ্রেন্ডরা দেখতে পারবে',
  profileLockedToast: 'প্রোফাইল লক করা হয়েছে — শুধু ফ্রেন্ডরা দেখতে পারবে',
  profileUnlockedToast: 'প্রোফাইল আনলক করা হয়েছে',
  accountSection: 'অ্যাকাউন্ট',
  switchOrAddAccount: 'নতুন অ্যাকাউন্ট / লগইন',
  thisProfileIsLocked: 'প্রোফাইল লক করা আছে',
  lockedProfileDesc: 'এই ব্যবহারকারীর ভিডিও ও সকল তথ্য শুধুমাত্র মিউচুয়াল ফ্রেন্ডরা দেখতে পারবে (দুজনই একে অপরকে ফলো করলে ফ্রেন্ড হবে)।',
  noVideosUploadedYet: 'এখনো কোনো ভিডিও আপলোড করা হয়নি',
  noSavedVideos: 'কোনো ভিডিও সেভ করা নেই',
  noPrivateVideos: 'কোনো প্রাইভেট ভিডিও নেই',
  pinned: 'পিন করা',
  aboutBioTitle: 'পরিচিতি (About)',
  noBioAddedYet: 'আপনার সম্পর্কে এখনো কিছু লেখা হয়নি।',
  noBioProvided: 'কোনো বায়ো দেওয়া হয়নি।',
  noPublicDetails: 'কোনো ব্যক্তিগত তথ্য পাবলিক করা হয়নি।',
  hiddenLabel: 'হাইড',
  editPersonalInfoPrivacyBtn: 'ব্যক্তিগত তথ্য এডিট ও হাইড সেটিংস পরিবর্তন করুন',

  saving: 'সেভ হচ্ছে...',
  save: 'সংরক্ষণ',
  changePhoto: 'ছবি পরিবর্তন',
  savingPhoto: 'ছবি সেভ হচ্ছে...',
  basicInfo: 'মৌলিক তথ্য',
  fullName: 'পুরো নাম',
  fullNamePlaceholder: 'আপনার পুরো নাম লিখুন',
  bio: 'বায়ো',
  bioPlaceholder: 'আপনার সম্পর্কে লিখুন...',
  genderAndDob: 'লিঙ্গ ও জন্মদিন',
  genderLabel: 'লিঙ্গ',
  male: 'পুরুষ',
  female: 'মহিলা',
  otherGender: 'অন্যান্য',
  birthdayLabel: 'জন্মদিন',
  tapToSelect: 'নির্বাচন করতে ট্যাপ করুন',
  ageLabel: 'বয়স',
  yearsLabel: 'বছর',
  contactInfo: 'যোগাযোগের তথ্য',
  emailLabel: 'ইমেইল',
  addEmailPlaceholder: 'ইমেইল যোগ করুন',
  phoneLabel: 'ফোন নাম্বার',
  addPhonePlaceholder: 'ফোন নাম্বার যোগ করুন',
  doneBtn: 'ঠিক আছে',
  addBtn: 'যোগ করুন',
  locationLabel: 'ঠিকানা',
  locationPlaceholder: 'আপনার শহর বা ঠিকানা লিখুন',
  websiteLabel: 'ওয়েবসাইট',
  websitePlaceholder: 'https://...',
  whoCanSeeSection: 'কে দেখতে পারবে (প্রাইভেসি)',
  hideFromOthers: 'অন্য ব্যবহারকারীদের থেকে লুকিয়ে রাখুন',
  usernameLabel: 'ইউজারনেম',

  passwordSecurityDesc: 'অ্যাকাউন্টের নিরাপত্তার জন্য শক্তিশালী পাসওয়ার্ড ব্যবহার করুন।',
  currentPasswordLabel: 'আগের পাসওয়ার্ড',
  currentPasswordPlaceholder: 'আগের পাসওয়ার্ড লিখুন',
  newPasswordLabel: 'নতুন পাসওয়ার্ড',
  newPasswordPlaceholder: 'নতুন পাসওয়ার্ড দিন (কমপক্ষে ৪ অক্ষর)',
  confirmPasswordLabel: 'কনফার্ম পাসওয়ার্ড',
  confirmPasswordPlaceholder: 'পুনরায় নতুন পাসওয়ার্ড লিখুন',
  savePasswordBtn: 'পাসওয়ার্ড সেভ করুন',
  errEnterCurrentPass: 'আগের পাসওয়ার্ডটি লিখুন।',
  errNewPassMin: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।',
  errConfirmPassMismatch: 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি।',
  errWrongCurrentPass: 'আগের পাসওয়ার্ডটি সঠিক নয়।',
  errChangePassFailed: 'পাসওয়ার্ড পরিবর্তন করা যায়নি।',
  passChangedSuccess: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!',

  profileCustomization: 'প্রোফাইল কাস্টমাইজেশন',
  tapCameraToChangePhoto: 'ছবি পরিবর্তন করতে ক্যামেরা আইকনে ট্যাপ করুন বা প্রি-সেট বেছে নিন',
  displayName: 'ডিসপ্লে নাম',
  yourNamePlaceholder: 'আপনার নাম',
  usernameHandle: 'ইউজারনেম (হ্যান্ডেল)',
  creatorCategory: 'ক্রিয়েটর ক্যাটাগরি',
  bioDescription: 'বায়ো (বর্ণনা)',
  socialWebsiteLink: 'সোশ্যাল / ওয়েবসাইট লিংক',
  cancel: 'বাতিল',
  saveChanges: 'সংরক্ষণ করুন',
  uploading: 'আপলোড হচ্ছে...',

  directMessages: 'ডিরেক্ট মেসেজ',
  messagesTab: 'মেসেজ',
  notificationsTab: 'নোটিফিকেশন',
  sendMessage: 'পাঠান',
  typeMessage: 'মেসেজ লিখুন...',
  searchPeoplePlaceholder: 'নাম বা @ইউজারনেম দিয়ে খুঁজুন...',
  recentChats: 'সাম্প্রতিক চ্যাট',
  noMessagesFound: 'কোনো মেসেজ পাওয়া যায়নি। সার্চ করে বা কারো প্রোফাইল থেকে মেসেজ শুরু করুন।',
  startNewChat: 'নতুন চ্যাট শুরু করুন',
  startConversationPrompt: 'ব্যক্তিগত কথোপকথন শুরু করুন।',
  loginToUseMessenger: 'মেসেঞ্জার ব্যবহার করতে লগইন করুন',
  loginMessengerDesc: 'ব্যক্তিগত ইনবক্সে বন্ধুদের সাথে চ্যাট করতে ও নোটিফিকেশন দেখতে লগইন করুন।',
  loginOrCreateAccount: 'লগইন / অ্যাকাউন্ট খুলুন',
  allFilter: 'সবগুলো',
  likesFilter: 'লাইকস',
  commentsFilter: 'কমেন্টস',
  followersFilter: 'ফলোয়ার্স',
  noPrivateNotifications: 'কোনো প্রাইভেট নোটিফিকেশন নেই।',
  startedFollowingYou: 'আপনাকে ফলো করা শুরু করেছেন।',
  likedYourVideo: 'আপনার ভিডিওতে লাইক দিয়েছেন।',
  commentedPrefix: 'মন্তব্য করেছেন:',
  justNow: 'এইমাত্র',
  minAgo: 'মি.',
  hourAgo: 'ঘ.',
  dayAgo: 'দিন',
  e2eeProtected: 'এনক্রিপ্টেড প্রাইভেট চ্যাট',

  report: 'রিপোর্ট',
  block: 'ব্লক করুন',
  copyLink: 'লিংক কপি',
  copied: 'কপি হয়েছে!',
  shareTo: 'শেয়ার করুন',
  sendBtn: 'পাঠান',
  downloadVideo: 'ভিডিও সেভ',
  editVideo: 'এডিট',
  deleteVideo: 'ডিলিট',
  moreApps: 'আরও',
  commentsTitle: 'মন্তব্য',
  noCommentsYet: 'কোনো মন্তব্য নেই',
  beFirstToComment: 'প্রথম মন্তব্যটি আপনিই করুন!',
  replyBtn: 'উত্তর দিন',
  writeCommentPlaceholder: 'একটি চমৎকার মন্তব্য লিখুন...',

  trendingHashtags: 'জনপ্রিয় হ্যাশট্যাগ',
  exploreTitle: 'এক্সপ্লোর করুন',
  videosUnit: 'টি ভিডিও',
  professionalDashboard: 'প্রফেশনাল ড্যাশবোর্ড',
  creatorInsightsSubtitle: 'ক্রিয়েটর ইনসাইটস ও ইনকাম মনিটর',
  last7Days: 'গত ৭ দিন',
  last28Days: 'গত ২৮ দিন',
  last90Days: 'গত ৯০ দিন',
  allTime: 'সর্বমোট',
  totalViews: 'মোট ভিউ',
  watchTime: 'ওয়াচ টাইম',
  engagement: 'এনগেজমেন্ট',
  estimatedIncome: 'আনুমানিক ইনকাম (BDT)',
  withdrawMoney: 'টাকা উত্তোলন',
  creatorTargetsTitle: 'আপনার ক্রিয়েটর টার্গেট ও লক্ষ্যমাত্রা',
  followersTarget: 'ফলোয়ার টার্গেট',
  viewsTarget: 'ভিউ টার্গেট',
  watchTimeTarget: 'ওয়াচ টাইম টার্গেট',
  engagementTarget: 'এনগেজমেন্ট টার্গেট',

  offlineModeBanner: 'অফলাইন মোড — ক্যাশ করা ভিডিও দেখাচ্ছে',
  installAppSubtitle: 'দ্রুতগতির ফুলস্ক্রিন ও অফলাইন অভিজ্ঞতার জন্য',
  installTikTokTitle: 'Rongin অ্যাপ ইনস্টল করুন',
  installBtn: 'ইনস্টল',
  iosInstallTitle: 'iPhone / iPad এ ইনস্টল করুন',
  iosInstallStep1: '১. Safari ব্রাউজারের নিচের Share (শেয়ার) আইকনে ট্যাপ করুন।',
  iosInstallStep2: '২. নিচে স্ক্রোল করে "Add to Home Screen" বেছে নিন।',
  switchLanguage: 'বাংলা',
  selectLanguageTitle: 'ভাষা নির্বাচন করুন',
  searchLanguagePlaceholder: 'ভাষা বা দেশের নাম দিয়ে খুঁজুন...',
  noLanguageFound: 'কোনো ভাষা পাওয়া যায়নি',

  ronginDm: 'রঙিন ডিএম',
  seenStatus: 'দেখা হয়েছে',
  sentStatus: 'পাঠানো হয়েছে',
  minAgoFull: 'মিনিট আগে',
  hourAgoFull: 'ঘণ্টা আগে',
  dayAgoFull: 'দিন আগে',

  searchDiscoverPlaceholder: 'ভিডিও, ক্রিয়েটর, হ্যাশট্যাগ অথবা গান খুঁজুন...',
  trendingChallengeTitle: '#BanglaVibes ট্রেন্ড চ্যালেঞ্জ',
  trendingChallengeDesc: 'আপনার ক্রিয়েটিভ শর্ট ভিডিও পোস্ট করুন এবং পান অফিসিয়াল ভেরিফিকেশন ব্যাজ!',
  resultsFor: 'ফলাফল:',

  activeVideoViews: 'সক্রিয় ভিডিও ভিউ',
  totalWatchHours: 'মোট ওয়াচ আওয়ার',
  likeCommentShare: 'লাইক + কমেন্ট + শেয়ার',
  activeAudience: 'সক্রিয় অডিয়েন্স',
  incomeRateDesc: 'হিসাব: প্রতি ১,০০০ ভিউ = ৳৫.০০ (বোনাস অন্তর্ভুক্ত)',
  level2Creator: 'লেভেল ২ ক্রিয়েটর',
  withdrawMoneyTitle: 'টাকা উত্তোলন করুন',
  withdrawableBalance: 'উত্তোলনযোগ্য ব্যালেন্স',
  paymentMethod: 'পেমেন্ট মেথড',
  personalMobileNumber: 'মোবাইল নম্বর (Personal)',
  withdrawSuccessTitle: 'উত্তোলন অনুরোধ সফল হয়েছে!',
  withdrawSuccessDesc: '২৪ ঘণ্টার মধ্যে আপনার bKash নম্বরে টাকা পাঠানো হবে।',
  confirmBtn: 'নিশ্চিত করুন',
  enterValidNumberErr: 'সঠিক ১১ ডিজিটের bKash/Nagad নম্বর দিন।',

  signupSubtitle: 'একটি মোবাইল অথবা ইমেইল দিয়ে একটিই অনন্য অ্যাকাউন্ট খুলুন',
  loginSubtitle: 'আপনার অ্যাকাউন্টে সাইন ইন করুন',
  googleLoginBtn: 'Google দিয়ে লগইন করুন (Gmail Accounts)',
  orDivider: 'অথবা',
  savedAccountsTitle: 'সেভ করা অ্যাকাউন্টসমূহ',
  tapToLogin: 'ট্যাপ করে লগইন করুন',
  removeFromList: 'লিস্ট থেকে সরান',
  signUpTab: 'অ্যাকাউন্ট খুলুন',
  logInTab: 'লগইন করুন',
  yourFullNameLabel: 'আপনার পুরো নাম',
  mobileOrEmailLabel: 'মোবাইল নম্বর অথবা ইমেইল',
  oneIdPerContact: 'প্রতিটিতে ১টি আইডি',
  ageYearsLabel: 'বয়স (বছর)',
  passwordLabel: 'পাসওয়ার্ড',
  passwordMinPlaceholder: 'কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড',
  confirmAccountBtn: 'অ্যাকাউন্ট নিশ্চিত করুন',
  enterYourPasswordPlaceholder: 'আপনার পাসওয়ার্ড দিন',
  errNameRequired: 'অনুগ্রহ করে আপনার নাম দিন।',
  errContactRequired: 'মোবাইল নাম্বার অথবা ইমেইল প্রদান করুন।',
  errMinAge: 'অ্যাকাউন্ট খোলার জন্য ন্যূনতম বয়স ১২ বছর হতে হবে।',
  errPassMin: 'পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে।',
  errEnterPassword: 'পাসওয়ার্ড প্রদান করুন।',
  errWrongPassword: 'ভুল পাসওয়ার্ড দেওয়া হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  errLoginFailed: 'লগইন ব্যর্থ হয়েছে।',
  welcomeBackMsg: 'স্বাগতম ফিরে আসার জন্য',
  welcomeNewAccountMsg: 'অ্যাকাউন্ট সফলভাবে খোলা হয়েছে! স্বাগতম',

  sendToHeader: 'এতে পাঠান',
  noContactsFound: 'মেসেঞ্জারে কোনো কন্টাক্ট পাওয়া যায়নি',
  reportVideoTitle: 'ভিডিও রিপোর্ট করুন',
  reportSubjectLabel: 'রিপোর্ট করার বিষয় / কারণ',
  reportSubjectPlaceholder: 'যেমন: অশ্লীল কনটেন্ট, প্রতারণা বা কপিরাইট',
  reportDetailsLabel: 'বিস্তারিত বিবরণ',
  reportDetailsPlaceholder: 'এই ভিডিওতে কী সমস্যা রয়েছে তা বিস্তারিত লিখুন...',
  submitting: 'সাবমিট হচ্ছে...',
  submitBtn: 'সাবমিট করুন',
  editPostTitle: 'পোস্ট এডিট করুন',
  changeThumbnail: 'থাম্বেল চেঞ্জ',
  changeThumbnailLong: 'থাম্বেল পরিবর্তন করুন (ভিডিও বা গ্যালারি থেকে)',
  whoCanViewLabel: 'কে কে দেখতে পারবে',
  everyoneOpt: 'সবার জন্য',
  friendsOpt: 'ফ্রেন্ডস',
  onlyMeOpt: 'শুধু আমি',
  updateBtn: 'আপডেট করুন',
  deleteVideoConfirmTitle: 'ভিডিওটি মুছে ফেলবেন?',
  deleteVideoConfirmDesc: 'মুছে ফেললে এই ভিডিওটি আর ফিরে পাওয়া যাবে না।',
  noKeepIt: 'না, রাখুন',
  yesDeleteIt: 'হ্যাঁ, মুছে ফেলুন',
  moreShareOptions: 'আরও শেয়ার অপশন',
  reportReason1: 'অশ্লীল কনটেন্ট',
  reportReason2: 'স্প্যাম বা প্রতারণা',
  reportReason3: 'কপিরাইট লঙ্ঘন',
  reportReason4: 'ঘৃণা বা হয়রানি',
  reportReason5: 'ভুয়া তথ্য',
  reportSubmittedToast: 'রিপোর্ট সফলভাবে জমা হয়েছে! ধন্যবাদ।',
  postUpdatedToast: 'পোস্ট সফলভাবে আপডেট হয়েছে!',
  videoDeletedToast: 'ভিডিওটি মুছে ফেলা হয়েছে!',
  sentToMessengerToast: 'মেসেঞ্জারে পাঠানো হয়েছে!',
  downloadStartedToast: 'ভিডিও ডাউনলোড শুরু হচ্ছে...',
  videoSavedDeviceToast: 'ভিডিও আপনার ডিভাইসে সেভ হয়েছে!',

  loadingVideo: 'ভিডিও লোড হচ্ছে...',
  cannotPlayVideo: 'ভিডিও প্লে করা যাচ্ছে না',
  cannotPlayVideoDesc: 'নেটওয়ার্ক বা স্ট্রিম সংক্রান্ত সীমাবদ্ধতার কারণে অন্য ভিডিওতে স্ক্রোল করুন।',
  retryBtn: 'পুনরায় চেষ্টা করুন',
  promoteVideo: 'ভিডিও প্রমোট করুন',
  featureComingSoon: 'এই ফিচারটি খুব শীঘ্রই যোগ করা হবে।',
  seeLess: 'কম দেখান',
  seeMore: 'আরও দেখুন',
  backBtn: 'ফিরে যান',
  postEditorTitle: 'পোস্ট এডিটর',
  changeVideoBtn: 'ভিডিও পরিবর্তন করুন',
  selectThumbnailBtn: 'থাম্বেল নির্বাচন করুন',
  selectMusicTitle: 'মিউজিক নির্বাচন করুন',
  galleryBtn: 'গ্যালারি',
  filtersBtn: 'ফিল্টার',
  audioTrackLabel: 'অডিও ট্র্যাক',
  cloudStorageLabel: 'ক্লাউড স্টোরেজ',
  backgroundUploadNote: 'পোস্ট করার সাথে সাথে ব্যাকগ্রাউন্ডে আপলোড সম্পন্ন হবে। আপনি অ্যাপ ব্যবহার চালিয়ে যেতে পারবেন।',
  savedToDraftsToast: 'ড্রাফটে সংরক্ষিত হয়েছে!',
  chooseFromVideo: 'ভিডিও থেকে বেছে নিন',
  selectedThumbnailLabel: 'নির্বাচিত থাম্বেল',
  selectAnyVideoPart: 'ভিডিওর যেকোনো অংশ সিলেক্ট করুন',
  useThisFrameBtn: 'এই ফ্রেমটি থাম্বেল করুন',
  chooseFromGalleryBtn: 'গ্যালারি থেকে থাম্বেল দিন',
  saveThumbnailBtn: 'থাম্বেল সেভ করুন',
  uploadingVideoProgress: 'ভিডিও আপলোড হচ্ছে...',
  processingVideoProgress: 'প্রক্রিয়াধীন...',
  continueUsingApp: 'অ্যাপ ব্যবহার চালিয়ে যান',
  videoPublishedToast: 'আপনার ভিডিও সফলভাবে প্রকাশিত হয়েছে!',
  activateFeedDesc: 'নতুন ভিডিও পোস্ট করে ফিড সক্রিয় করুন।',

  thumbNotReady: 'ভিডিও ফ্রেম প্রস্তুত হয়নি। একটু অপেক্ষা করে আবার চেষ্টা করুন।',
  thumbFrameSelected: 'ভিডিওর এই অংশটি থাম্বেল হিসেবে সেট হয়েছে!',
  thumbLinkError: 'এই ভিডিও লিংক থেকে ফ্রেম নেওয়া যাচ্ছে না। গ্যালারি থেকে ছবি বাছুন।',
  thumbPreparingGallery: 'গ্যালারি থেকে থাম্বেল প্রস্তুত হচ্ছে...',
  thumbGallerySelected: 'গ্যালারি থেকে থাম্বেল নির্বাচন হয়েছে!',
  thumbReadError: 'ছবিটি পড়া যায়নি। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।',
  thumbChoosePrompt: 'ভিডিওর ফ্রেম বা গ্যালারি থেকে ছবি বাছুন',
  menuLabel: 'মেনু',
  lockedProfileTitle: 'লক করা প্রোফাইল',
};

const STATIC_TRANSLATIONS: Record<string, Translations> = {
  en: EN_TRANSLATIONS,
  bn: BN_TRANSLATIONS,
};

const VALID_LANG_CODES = new Set(WORLD_LANGUAGES.map((l) => l.code));
const CACHE_PREFIX = 'rongin_i18n_v5_';

const BROWSER_MYMEMORY_LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
  no: 'nb',
  fil: 'tl',
};

interface LanguageContextType {
  language: Language;
  currentLanguageInfo: WorldLanguage;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isLanguageModalOpen: boolean;
  isTranslating: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function isMeaningfullyTranslated(lang: string, dict: Record<string, unknown> | null): boolean {
  if (!dict || typeof dict !== 'object') return false;
  if (lang === 'en') return true;
  const keys = Object.keys(dict).filter((k) => k in EN_TRANSLATIONS && typeof dict[k] === 'string' && String(dict[k]).trim());
  if (keys.length < 10) return false;
  const changedCount = keys.filter(
    (k) => String(dict[k]).trim().toLowerCase() !== String((EN_TRANSLATIONS as any)[k]).trim().toLowerCase()
  ).length;
  return changedCount / keys.length >= 0.25;
}

function loadCachedTranslations(lang: string): Partial<Translations> | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isMeaningfullyTranslated(lang, parsed)) {
      localStorage.removeItem(`${CACHE_PREFIX}${lang}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function fetchBrowserMyMemoryChunk(
  targetLang: string,
  chunk: [string, string][]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!chunk.length) return result;
  const mmLang = BROWSER_MYMEMORY_LANG_MAP[targetLang] || targetLang;
  const joined = chunk.map(([, val]) => val.replace(/\r?\n/g, ' ').trim()).join('\n');
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      joined
    )}&langpair=${encodeURIComponent(`en|${mmLang}`)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const text = data?.responseData?.translatedText || '';
      if (!data?.quotaFinished && Number(data?.responseStatus) === 200 && text && !/^MYMEMORY WARNING:/i.test(text)) {
        if (chunk.length === 1) {
          result[chunk[0][0]] = text.trim();
          return result;
        }
        const lines = text.split(/\r?\n/);
        if (lines.length === chunk.length) {
          chunk.forEach(([k], idx) => {
            const val = (lines[idx] || '').trim();
            if (val) result[k] = val;
          });
          return result;
        }
      }
    }
  } catch {}
  if (chunk.length > 1) {
    const mid = Math.ceil(chunk.length / 2);
    const [left, right] = await Promise.all([
      fetchBrowserMyMemoryChunk(targetLang, chunk.slice(0, mid)),
      fetchBrowserMyMemoryChunk(targetLang, chunk.slice(mid)),
    ]);
    return { ...left, ...right };
  }
  return result;
}

async function fetchDynamicTranslations(targetLang: string): Promise<Partial<Translations>> {
  // 1. Try local backend translation proxy first
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLang,
        texts: EN_TRANSLATIONS,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.translations && isMeaningfullyTranslated(targetLang, data.translations)) {
        return data.translations;
      }
    }
  } catch {}

  // 2. Direct browser fallback to Google Translate API (works on user browser IPs)
  const result: Record<string, string> = {};
  const entries = Object.entries(EN_TRANSLATIONS) as [string, string][];
  const chunkSize = 35;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const joined = chunk.map(([, val]) => val.replace(/\r?\n/g, ' ')).join('\n');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
        targetLang
      )}&dt=t&q=${encodeURIComponent(joined)}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        const translatedJoined = Array.isArray(data?.[0])
          ? data[0].map((seg: any) => seg?.[0] || '').join('')
          : '';
        const lines = translatedJoined.split(/\r?\n/);
        if (lines.length === chunk.length) {
          chunk.forEach(([k], idx) => {
            const val = (lines[idx] || '').trim();
            if (val) result[k] = val;
          });
        }
      }
    } catch {}
  }
  if (isMeaningfullyTranslated(targetLang, result)) {
    return result;
  }

  // 3. Browser MyMemory CORS fallback for any missing keys
  const missingEntries = entries.filter(([k]) => !result[k]);
  const chunks: [string, string][][] = [];
  let cur: [string, string][] = [];
  let curLen = 0;
  for (const [k, rawVal] of missingEntries) {
    const cleanVal = rawVal.replace(/\r?\n/g, ' ').trim();
    const len = cleanVal.length + (cur.length > 0 ? 1 : 0);
    if (cur.length > 0 && curLen + len > 380) {
      chunks.push(cur);
      cur = [];
      curLen = 0;
    }
    cur.push([k, cleanVal]);
    curLen += len;
  }
  if (cur.length) chunks.push(cur);

  for (let i = 0; i < chunks.length; i += 4) {
    const settled = await Promise.all(
      chunks.slice(i, i + 4).map((ch) => fetchBrowserMyMemoryChunk(targetLang, ch))
    );
    settled.forEach((m) => Object.assign(result, m));
  }
  return result;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to English ('en') on first install
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('rongin_lang');
      return saved && VALID_LANG_CODES.has(saved) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const [dynamicDictionaries, setDynamicDictionaries] = useState<Record<string, Partial<Translations>>>(() => {
    try {
      const saved = localStorage.getItem('rongin_lang');
      if (saved && VALID_LANG_CODES.has(saved) && !STATIC_TRANSLATIONS[saved]) {
        const cached = loadCachedTranslations(saved);
        if (cached) return { [saved]: cached };
      }
    } catch {}
    return {};
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const ensureTranslationsLoaded = async (lang: string) => {
    if (STATIC_TRANSLATIONS[lang]) return;

    const cached = loadCachedTranslations(lang);
    const requiredKeys = Object.keys(EN_TRANSLATIONS);
    const hasAllCached = cached && requiredKeys.every((k) => Boolean((cached as any)[k]));

    if (cached) {
      setDynamicDictionaries((prev) => ({ ...prev, [lang]: cached }));
    }
    if (hasAllCached) return;

    setIsTranslating(true);
    try {
      const fresh = await fetchDynamicTranslations(lang);
      if (isMeaningfullyTranslated(lang, fresh)) {
        const merged = { ...(cached || {}), ...fresh };
        try {
          localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(merged));
        } catch {}
        setDynamicDictionaries((prev) => ({ ...prev, [lang]: merged }));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    ensureTranslationsLoaded(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    const valid = VALID_LANG_CODES.has(lang) ? lang : 'en';
    setLanguageState(valid);
    try {
      localStorage.setItem('rongin_lang', valid);
      document.documentElement.lang = valid;
    } catch {}
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);
  const toggleLanguage = () => setIsLanguageModalOpen(true);

  const currentLanguageInfo =
    WORLD_LANGUAGES.find((l) => l.code === language) || WORLD_LANGUAGES[0];

  const resolvedTranslations: Translations = STATIC_TRANSLATIONS[language]
    ? STATIC_TRANSLATIONS[language]
    : {
        ...EN_TRANSLATIONS,
        ...(dynamicDictionaries[language] || {}),
      };

  return (
    <LanguageContext.Provider
      value={{
        language,
        currentLanguageInfo,
        setLanguage,
        toggleLanguage,
        isLanguageModalOpen,
        isTranslating,
        openLanguageModal,
        closeLanguageModal,
        t: resolvedTranslations,
      }}
    >
      {children}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        selectedCode={language}
        onSelect={setLanguage}
        onClose={closeLanguageModal}
        title={resolvedTranslations.selectLanguageTitle}
        searchPlaceholder={resolvedTranslations.searchLanguagePlaceholder}
        noMatchLabel={resolvedTranslations.noLanguageFound}
      />
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
