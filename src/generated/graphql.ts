import { DocumentNode } from 'graphql';
import * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Time: { input: string; output: string; }
  Upload: { input: File; output: File; }
};

export type AccessLevel =
  | 'PRIVATE'
  | 'PUBLIC'
  | 'RESTRICTED';

export type AdminCreateUserInput = {
  email: Scalars['String']['input'];
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
  password: Scalars['String']['input'];
  role?: InputMaybe<UserRole>;
  username: Scalars['String']['input'];
};

export type AuthPayload = {
  __typename: 'AuthPayload';
  expiresAt: Scalars['Time']['output'];
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: User;
};

export type BlogPost = {
  __typename: 'BlogPost';
  accessLevel: AccessLevel;
  author: User;
  categories: Array<Scalars['String']['output']>;
  content: Scalars['String']['output'];
  coverImageUrl?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Time']['output'];
  excerpt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isLiked: Scalars['Boolean']['output'];
  lastEditedAt?: Maybe<Scalars['Time']['output']>;
  publishedAt?: Maybe<Scalars['Time']['output']>;
  slug: Scalars['String']['output'];
  stats: BlogPostStats;
  status: PostStatus;
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
  versions: Array<BlogPostVersion>;
};

export type BlogPostStats = {
  __typename: 'BlogPostStats';
  commentCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  lastViewedAt?: Maybe<Scalars['Time']['output']>;
  likeCount: Scalars['Int']['output'];
  shareCount: Scalars['Int']['output'];
  updatedAt: Scalars['Time']['output'];
  viewCount: Scalars['Int']['output'];
};

export type BlogPostVersion = {
  __typename: 'BlogPostVersion';
  changeLog?: Maybe<Scalars['String']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['Time']['output'];
  createdBy: User;
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  versionNum: Scalars['Int']['output'];
};

export type ConfirmPasswordResetInput = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type CreateFolderInput = {
  name: Scalars['String']['input'];
};

export type CreateInviteCodeInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt: Scalars['Time']['input'];
  maxUses?: InputMaybe<Scalars['Int']['input']>;
};

export type CreatePostInput = {
  accessLevel?: InputMaybe<AccessLevel>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  content: Scalars['String']['input'];
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  publishAt?: InputMaybe<Scalars['Time']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};

export type EmailLoginInput = {
  email: Scalars['String']['input'];
};

export type FileFolder = {
  __typename: 'FileFolder';
  createdAt: Scalars['Time']['output'];
  fileCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  path: Scalars['String']['output'];
};

export type FileUploadResponse = {
  __typename: 'FileUploadResponse';
  fileName?: Maybe<Scalars['String']['output']>;
  filePath?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type GeneralResponse = {
  __typename: 'GeneralResponse';
  code?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ImageUploadResponse = {
  __typename: 'ImageUploadResponse';
  deleteUrl?: Maybe<Scalars['String']['output']>;
  filename: Scalars['String']['output'];
  imageUrl: Scalars['String']['output'];
  size: Scalars['Int']['output'];
};

export type InviteCode = {
  __typename: 'InviteCode';
  code: Scalars['String']['output'];
  createdAt: Scalars['Time']['output'];
  createdBy: User;
  currentUses: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  maxUses: Scalars['Int']['output'];
  usedAt?: Maybe<Scalars['Time']['output']>;
  usedBy?: Maybe<User>;
};

export type LoginInput = {
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
  remember?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MarkdownFile = {
  __typename: 'MarkdownFile';
  content?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Time']['output'];
  folder: Scalars['String']['output'];
  name: Scalars['String']['output'];
  size: Scalars['Int']['output'];
  updatedAt: Scalars['Time']['output'];
};

export type Mutation = {
  __typename: 'Mutation';
  adminCreateUser: User;
  adminDeleteUser: GeneralResponse;
  adminUpdateUser: User;
  archivePost: BlogPost;
  changePassword: GeneralResponse;
  clearCache: GeneralResponse;
  confirmPasswordReset: GeneralResponse;
  createFolder: FileFolder;
  createInviteCode: InviteCode;
  createPost: BlogPost;
  deactivateInviteCode: GeneralResponse;
  deleteFile: GeneralResponse;
  deleteFolder: GeneralResponse;
  deletePost: GeneralResponse;
  emailLogin: GeneralResponse;
  likePost: BlogPost;
  login: AuthPayload;
  logout: GeneralResponse;
  publishPost: BlogPost;
  rebuildSearchIndex: GeneralResponse;
  refreshToken: AuthPayload;
  register: AuthPayload;
  requestPasswordReset: GeneralResponse;
  sendVerificationCode: GeneralResponse;
  unlikePost: BlogPost;
  updateFile: MarkdownFile;
  updatePost: BlogPost;
  updateProfile: User;
  uploadImage: ImageUploadResponse;
  uploadMarkdownFile: FileUploadResponse;
  verifyEmail: GeneralResponse;
  verifyEmailAndLogin: AuthPayload;
};


export type MutationAdminCreateUserArgs = {
  input: AdminCreateUserInput;
};


export type MutationAdminDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAdminUpdateUserArgs = {
  email?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
  role?: InputMaybe<UserRole>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationArchivePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationConfirmPasswordResetArgs = {
  input: ConfirmPasswordResetInput;
};


export type MutationCreateFolderArgs = {
  input: CreateFolderInput;
};


export type MutationCreateInviteCodeArgs = {
  input: CreateInviteCodeInput;
};


export type MutationCreatePostArgs = {
  input: CreatePostInput;
};


export type MutationDeactivateInviteCodeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  fileName: Scalars['String']['input'];
  folder: Scalars['String']['input'];
};


export type MutationDeleteFolderArgs = {
  name: Scalars['String']['input'];
};


export type MutationDeletePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEmailLoginArgs = {
  input: EmailLoginInput;
};


export type MutationLikePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationPublishPostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRequestPasswordResetArgs = {
  input: RequestPasswordResetInput;
};


export type MutationSendVerificationCodeArgs = {
  email: Scalars['String']['input'];
  type: VerificationType;
};


export type MutationUnlikePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateFileArgs = {
  input: UpdateFileInput;
};


export type MutationUpdatePostArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePostInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};


export type MutationUploadImageArgs = {
  file: Scalars['Upload']['input'];
};


export type MutationUploadMarkdownFileArgs = {
  input: UploadMarkdownFileInput;
};


export type MutationVerifyEmailArgs = {
  input: VerifyEmailInput;
};


export type MutationVerifyEmailAndLoginArgs = {
  input: VerifyEmailInput;
};

export type PopularQuery = {
  __typename: 'PopularQuery';
  count: Scalars['Int']['output'];
  lastSearched: Scalars['Time']['output'];
  query: Scalars['String']['output'];
};

export type PostFilterInput = {
  accessLevel?: InputMaybe<AccessLevel>;
  authorId?: InputMaybe<Scalars['ID']['input']>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  dateFrom?: InputMaybe<Scalars['Time']['input']>;
  dateTo?: InputMaybe<Scalars['Time']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type PostSortInput = {
  field?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['String']['input']>;
};

export type PostStatus =
  | 'ARCHIVED'
  | 'DRAFT'
  | 'PUBLISHED';

export type Query = {
  __typename: 'Query';
  fileContent?: Maybe<MarkdownFile>;
  files: Array<MarkdownFile>;
  folders: Array<FileFolder>;
  getPopularPosts: Array<BlogPost>;
  getRecentPosts: Array<BlogPost>;
  getSearchStats: SearchStats;
  getSearchSuggestions: Array<Scalars['String']['output']>;
  getTrendingSearches: Array<Scalars['String']['output']>;
  getTrendingTags: Array<Scalars['String']['output']>;
  inviteCodes: Array<InviteCode>;
  me?: Maybe<User>;
  post?: Maybe<BlogPost>;
  postVersions: Array<BlogPostVersion>;
  posts: Array<BlogPost>;
  searchPosts: SearchResult;
  serverDashboard: ServerDashboard;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryFileContentArgs = {
  fileName: Scalars['String']['input'];
  folder: Scalars['String']['input'];
};


export type QueryFilesArgs = {
  folder: Scalars['String']['input'];
};


export type QueryGetPopularPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetRecentPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetSearchSuggestionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryGetTrendingSearchesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetTrendingTagsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryInviteCodesArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPostArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryPostVersionsArgs = {
  postId: Scalars['ID']['input'];
};


export type QueryPostsArgs = {
  filter?: InputMaybe<PostFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<PostSortInput>;
};


export type QuerySearchPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  query: Scalars['String']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  role?: InputMaybe<UserRole>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type RegisterInput = {
  email: Scalars['String']['input'];
  inviteCode?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type RequestPasswordResetInput = {
  email: Scalars['String']['input'];
};

export type SearchResult = {
  __typename: 'SearchResult';
  posts: Array<BlogPost>;
  took: Scalars['String']['output'];
  total: Scalars['Int']['output'];
};

export type SearchStats = {
  __typename: 'SearchStats';
  popularQueries: Array<PopularQuery>;
  searchTrends: Array<SearchTrend>;
  totalSearches: Scalars['Int']['output'];
};

export type SearchTrend = {
  __typename: 'SearchTrend';
  date: Scalars['String']['output'];
  searchCount: Scalars['Int']['output'];
  topQueries: Array<Scalars['String']['output']>;
};

export type ServerDashboard = {
  __typename: 'ServerDashboard';
  cpuCount: Scalars['Int']['output'];
  goVersion: Scalars['String']['output'];
  goroutines: Scalars['Int']['output'];
  hostname: Scalars['String']['output'];
  memory: ServerMemoryStats;
  postCount: Scalars['Int']['output'];
  serverTime: Scalars['Time']['output'];
  todayPosts: Scalars['Int']['output'];
  todayRegistrations: Scalars['Int']['output'];
  uptime: Scalars['String']['output'];
  userCount: Scalars['Int']['output'];
};

export type ServerMemoryStats = {
  __typename: 'ServerMemoryStats';
  alloc: Scalars['String']['output'];
  heapAlloc: Scalars['String']['output'];
  heapSys: Scalars['String']['output'];
  sys: Scalars['String']['output'];
  totalAlloc: Scalars['String']['output'];
};

export type UpdateFileInput = {
  content: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder: Scalars['String']['input'];
};

export type UpdatePostInput = {
  accessLevel?: InputMaybe<AccessLevel>;
  categories?: InputMaybe<Array<Scalars['String']['input']>>;
  changeLog?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  coverImageUrl?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PostStatus>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProfileInput = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type UploadMarkdownFileInput = {
  file: Scalars['Upload']['input'];
  folder: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type User = {
  __typename: 'User';
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  emailVerifiedAt?: Maybe<Scalars['Time']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  lastLoginAt?: Maybe<Scalars['Time']['output']>;
  posts: Array<BlogPost>;
  postsCount: Scalars['Int']['output'];
  role: UserRole;
  updatedAt: Scalars['Time']['output'];
  username: Scalars['String']['output'];
};


export type UserPostsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type UserRole =
  | 'ADMIN'
  | 'USER';

export type VerificationType =
  | 'LOGIN'
  | 'REGISTER'
  | 'RESET_PASSWORD';

export type VerifyEmailInput = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
  type: VerificationType;
};

export type UsersQuery_users_User = { __typename: 'User', postsCount: number, id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type UsersQuery_Query = { __typename: 'Query', users: Array<UsersQuery_users_User> };


export type UsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<UserRole>;
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UsersQueryResult = UsersQuery_Query;

export type ServerDashboardQuery_serverDashboard_ServerDashboard_memory_ServerMemoryStats = { __typename: 'ServerMemoryStats', alloc: string, totalAlloc: string, sys: string, heapAlloc: string, heapSys: string };

export type ServerDashboardQuery_serverDashboard_ServerDashboard = { __typename: 'ServerDashboard', serverTime: string, hostname: string, goVersion: string, cpuCount: number, goroutines: number, uptime: string, userCount: number, postCount: number, todayRegistrations: number, todayPosts: number, memory: ServerDashboardQuery_serverDashboard_ServerDashboard_memory_ServerMemoryStats };

export type ServerDashboardQuery_Query = { __typename: 'Query', serverDashboard: ServerDashboardQuery_serverDashboard_ServerDashboard };


export type ServerDashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type ServerDashboardQueryResult = ServerDashboardQuery_Query;

export type InviteCodesQuery_inviteCodes_InviteCode_createdBy_User = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type InviteCodesQuery_inviteCodes_InviteCode_usedBy_User = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type InviteCodesQuery_inviteCodes_InviteCode = { __typename: 'InviteCode', id: string, code: string, usedAt?: string | null, expiresAt: string, maxUses: number, currentUses: number, isActive: boolean, description?: string | null, createdAt: string, createdBy: InviteCodesQuery_inviteCodes_InviteCode_createdBy_User, usedBy?: InviteCodesQuery_inviteCodes_InviteCode_usedBy_User | null };

export type InviteCodesQuery_Query = { __typename: 'Query', inviteCodes: Array<InviteCodesQuery_inviteCodes_InviteCode> };


export type InviteCodesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type InviteCodesQueryResult = InviteCodesQuery_Query;

export type AdminCreateUserMutation_adminCreateUser_User = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type AdminCreateUserMutation_Mutation = { __typename: 'Mutation', adminCreateUser: AdminCreateUserMutation_adminCreateUser_User };


export type AdminCreateUserMutationVariables = Exact<{
  input: AdminCreateUserInput;
}>;


export type AdminCreateUserMutationResult = AdminCreateUserMutation_Mutation;

export type AdminUpdateUserMutation_adminUpdateUser_User = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type AdminUpdateUserMutation_Mutation = { __typename: 'Mutation', adminUpdateUser: AdminUpdateUserMutation_adminUpdateUser_User };


export type AdminUpdateUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  username?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<UserRole>;
  isVerified?: InputMaybe<Scalars['Boolean']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type AdminUpdateUserMutationResult = AdminUpdateUserMutation_Mutation;

export type AdminDeleteUserMutation_adminDeleteUser_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type AdminDeleteUserMutation_Mutation = { __typename: 'Mutation', adminDeleteUser: AdminDeleteUserMutation_adminDeleteUser_GeneralResponse };


export type AdminDeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AdminDeleteUserMutationResult = AdminDeleteUserMutation_Mutation;

export type CreateInviteCodeMutation_createInviteCode_InviteCode = { __typename: 'InviteCode', id: string, code: string, usedAt?: string | null, expiresAt: string, maxUses: number, currentUses: number, isActive: boolean, description?: string | null, createdAt: string, createdBy: InviteCodesQuery_inviteCodes_InviteCode_createdBy_User, usedBy?: InviteCodesQuery_inviteCodes_InviteCode_usedBy_User | null };

export type CreateInviteCodeMutation_Mutation = { __typename: 'Mutation', createInviteCode: CreateInviteCodeMutation_createInviteCode_InviteCode };


export type CreateInviteCodeMutationVariables = Exact<{
  input: CreateInviteCodeInput;
}>;


export type CreateInviteCodeMutationResult = CreateInviteCodeMutation_Mutation;

export type DeactivateInviteCodeMutation_deactivateInviteCode_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type DeactivateInviteCodeMutation_Mutation = { __typename: 'Mutation', deactivateInviteCode: DeactivateInviteCodeMutation_deactivateInviteCode_GeneralResponse };


export type DeactivateInviteCodeMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeactivateInviteCodeMutationResult = DeactivateInviteCodeMutation_Mutation;

export type ClearCacheMutation_clearCache_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type ClearCacheMutation_Mutation = { __typename: 'Mutation', clearCache: ClearCacheMutation_clearCache_GeneralResponse };


export type ClearCacheMutationVariables = Exact<{ [key: string]: never; }>;


export type ClearCacheMutationResult = ClearCacheMutation_Mutation;

export type RebuildSearchIndexMutation_rebuildSearchIndex_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type RebuildSearchIndexMutation_Mutation = { __typename: 'Mutation', rebuildSearchIndex: RebuildSearchIndexMutation_rebuildSearchIndex_GeneralResponse };


export type RebuildSearchIndexMutationVariables = Exact<{ [key: string]: never; }>;


export type RebuildSearchIndexMutationResult = RebuildSearchIndexMutation_Mutation;

export type RegisterMutation_register_AuthPayload_user_User = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type RegisterMutation_register_AuthPayload = { __typename: 'AuthPayload', token: string, refreshToken: string, expiresAt: string, user: RegisterMutation_register_AuthPayload_user_User };

export type RegisterMutation_Mutation = { __typename: 'Mutation', register: RegisterMutation_register_AuthPayload };


export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutationResult = RegisterMutation_Mutation;

export type LoginMutation_login_AuthPayload = { __typename: 'AuthPayload', token: string, refreshToken: string, expiresAt: string, user: RegisterMutation_register_AuthPayload_user_User };

export type LoginMutation_Mutation = { __typename: 'Mutation', login: LoginMutation_login_AuthPayload };


export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutationResult = LoginMutation_Mutation;

export type EmailLoginMutation_emailLogin_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type EmailLoginMutation_Mutation = { __typename: 'Mutation', emailLogin: EmailLoginMutation_emailLogin_GeneralResponse };


export type EmailLoginMutationVariables = Exact<{
  input: EmailLoginInput;
}>;


export type EmailLoginMutationResult = EmailLoginMutation_Mutation;

export type VerifyEmailAndLoginMutation_verifyEmailAndLogin_AuthPayload = { __typename: 'AuthPayload', token: string, refreshToken: string, expiresAt: string, user: RegisterMutation_register_AuthPayload_user_User };

export type VerifyEmailAndLoginMutation_Mutation = { __typename: 'Mutation', verifyEmailAndLogin: VerifyEmailAndLoginMutation_verifyEmailAndLogin_AuthPayload };


export type VerifyEmailAndLoginMutationVariables = Exact<{
  input: VerifyEmailInput;
}>;


export type VerifyEmailAndLoginMutationResult = VerifyEmailAndLoginMutation_Mutation;

export type LogoutMutation_logout_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type LogoutMutation_Mutation = { __typename: 'Mutation', logout: LogoutMutation_logout_GeneralResponse };


export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutationResult = LogoutMutation_Mutation;

export type RefreshTokenMutation_refreshToken_AuthPayload = { __typename: 'AuthPayload', token: string, refreshToken: string, expiresAt: string, user: RegisterMutation_register_AuthPayload_user_User };

export type RefreshTokenMutation_Mutation = { __typename: 'Mutation', refreshToken: RefreshTokenMutation_refreshToken_AuthPayload };


export type RefreshTokenMutationVariables = Exact<{ [key: string]: never; }>;


export type RefreshTokenMutationResult = RefreshTokenMutation_Mutation;

export type SendVerificationCodeMutation_sendVerificationCode_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type SendVerificationCodeMutation_Mutation = { __typename: 'Mutation', sendVerificationCode: SendVerificationCodeMutation_sendVerificationCode_GeneralResponse };


export type SendVerificationCodeMutationVariables = Exact<{
  email: Scalars['String']['input'];
  type: VerificationType;
}>;


export type SendVerificationCodeMutationResult = SendVerificationCodeMutation_Mutation;

export type VerifyEmailMutation_verifyEmail_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type VerifyEmailMutation_Mutation = { __typename: 'Mutation', verifyEmail: VerifyEmailMutation_verifyEmail_GeneralResponse };


export type VerifyEmailMutationVariables = Exact<{
  input: VerifyEmailInput;
}>;


export type VerifyEmailMutationResult = VerifyEmailMutation_Mutation;

export type RequestPasswordResetMutation_requestPasswordReset_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type RequestPasswordResetMutation_Mutation = { __typename: 'Mutation', requestPasswordReset: RequestPasswordResetMutation_requestPasswordReset_GeneralResponse };


export type RequestPasswordResetMutationVariables = Exact<{
  input: RequestPasswordResetInput;
}>;


export type RequestPasswordResetMutationResult = RequestPasswordResetMutation_Mutation;

export type ConfirmPasswordResetMutation_confirmPasswordReset_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type ConfirmPasswordResetMutation_Mutation = { __typename: 'Mutation', confirmPasswordReset: ConfirmPasswordResetMutation_confirmPasswordReset_GeneralResponse };


export type ConfirmPasswordResetMutationVariables = Exact<{
  input: ConfirmPasswordResetInput;
}>;


export type ConfirmPasswordResetMutationResult = ConfirmPasswordResetMutation_Mutation;

export type UpdateProfileMutation_updateProfile_User = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type UpdateProfileMutation_Mutation = { __typename: 'Mutation', updateProfile: UpdateProfileMutation_updateProfile_User };


export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutationResult = UpdateProfileMutation_Mutation;

export type ChangePasswordMutation_changePassword_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type ChangePasswordMutation_Mutation = { __typename: 'Mutation', changePassword: ChangePasswordMutation_changePassword_GeneralResponse };


export type ChangePasswordMutationVariables = Exact<{
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ChangePasswordMutationResult = ChangePasswordMutation_Mutation;

export type MeQuery_me_User_posts_BlogPost_author_User = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type MeQuery_me_User_posts_BlogPost_stats_BlogPostStats = { __typename: 'BlogPostStats', viewCount: number, likeCount: number, shareCount: number, commentCount: number };

export type MeQuery_me_User_posts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type MeQuery_me_User = { __typename: 'User', postsCount: number, id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string, posts: Array<MeQuery_me_User_posts_BlogPost> };

export type MeQuery_Query = { __typename: 'Query', me?: MeQuery_me_User | null };


export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQueryResult = MeQuery_Query;

export type UserQuery_user_User_posts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type UserQuery_user_User = { __typename: 'User', postsCount: number, id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string, posts: Array<UserQuery_user_User_posts_BlogPost> };

export type UserQuery_Query = { __typename: 'Query', user?: UserQuery_user_User | null };


export type UserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UserQueryResult = UserQuery_Query;

export type PostsQuery_posts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type PostsQuery_Query = { __typename: 'Query', posts: Array<PostsQuery_posts_BlogPost> };


export type PostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  filter?: InputMaybe<PostFilterInput>;
  sort?: InputMaybe<PostSortInput>;
}>;


export type PostsQueryResult = PostsQuery_Query;

export type PostQuery_post_BlogPost_author_User = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type PostQuery_post_BlogPost_stats_BlogPostStats = { __typename: 'BlogPostStats', id: string, viewCount: number, likeCount: number, shareCount: number, commentCount: number, lastViewedAt?: string | null, updatedAt: string };

export type PostQuery_post_BlogPost_versions_BlogPostVersion_createdBy_User = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type PostQuery_post_BlogPost_versions_BlogPostVersion = { __typename: 'BlogPostVersion', id: string, versionNum: number, title: string, content: string, changeLog?: string | null, createdAt: string, createdBy: PostQuery_post_BlogPost_versions_BlogPostVersion_createdBy_User };

export type PostQuery_post_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, content: string, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, accessLevel: AccessLevel, status: PostStatus, publishedAt?: string | null, lastEditedAt?: string | null, createdAt: string, updatedAt: string, author: PostQuery_post_BlogPost_author_User, stats: PostQuery_post_BlogPost_stats_BlogPostStats, versions: Array<PostQuery_post_BlogPost_versions_BlogPostVersion> };

export type PostQuery_Query = { __typename: 'Query', post?: PostQuery_post_BlogPost | null };


export type PostQueryVariables = Exact<{
  id?: InputMaybe<Scalars['ID']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
}>;


export type PostQueryResult = PostQuery_Query;

export type PostVersionsQuery_postVersions_BlogPostVersion_createdBy_User = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type PostVersionsQuery_postVersions_BlogPostVersion = { __typename: 'BlogPostVersion', id: string, versionNum: number, title: string, content: string, changeLog?: string | null, createdAt: string, createdBy: PostVersionsQuery_postVersions_BlogPostVersion_createdBy_User };

export type PostVersionsQuery_Query = { __typename: 'Query', postVersions: Array<PostVersionsQuery_postVersions_BlogPostVersion> };


export type PostVersionsQueryVariables = Exact<{
  postId: Scalars['ID']['input'];
}>;


export type PostVersionsQueryResult = PostVersionsQuery_Query;

export type SearchPostsQuery_searchPosts_SearchResult_posts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type SearchPostsQuery_searchPosts_SearchResult = { __typename: 'SearchResult', total: number, took: string, posts: Array<SearchPostsQuery_searchPosts_SearchResult_posts_BlogPost> };

export type SearchPostsQuery_Query = { __typename: 'Query', searchPosts: SearchPostsQuery_searchPosts_SearchResult };


export type SearchPostsQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchPostsQueryResult = SearchPostsQuery_Query;

export type PopularPostsQuery_getPopularPosts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type PopularPostsQuery_Query = { __typename: 'Query', getPopularPosts: Array<PopularPostsQuery_getPopularPosts_BlogPost> };


export type PopularPostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PopularPostsQueryResult = PopularPostsQuery_Query;

export type RecentPostsQuery_getRecentPosts_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type RecentPostsQuery_Query = { __typename: 'Query', getRecentPosts: Array<RecentPostsQuery_getRecentPosts_BlogPost> };


export type RecentPostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RecentPostsQueryResult = RecentPostsQuery_Query;

export type TrendingTagsQuery_Query = { __typename: 'Query', getTrendingTags: Array<string> };


export type TrendingTagsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TrendingTagsQueryResult = TrendingTagsQuery_Query;

export type CreatePostMutation_createPost_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, content: string, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, accessLevel: AccessLevel, status: PostStatus, publishedAt?: string | null, lastEditedAt?: string | null, createdAt: string, updatedAt: string, author: PostQuery_post_BlogPost_author_User, stats: PostQuery_post_BlogPost_stats_BlogPostStats, versions: Array<PostQuery_post_BlogPost_versions_BlogPostVersion> };

export type CreatePostMutation_Mutation = { __typename: 'Mutation', createPost: CreatePostMutation_createPost_BlogPost };


export type CreatePostMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type CreatePostMutationResult = CreatePostMutation_Mutation;

export type UpdatePostMutation_updatePost_BlogPost = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, content: string, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, accessLevel: AccessLevel, status: PostStatus, publishedAt?: string | null, lastEditedAt?: string | null, createdAt: string, updatedAt: string, author: PostQuery_post_BlogPost_author_User, stats: PostQuery_post_BlogPost_stats_BlogPostStats, versions: Array<PostQuery_post_BlogPost_versions_BlogPostVersion> };

export type UpdatePostMutation_Mutation = { __typename: 'Mutation', updatePost: UpdatePostMutation_updatePost_BlogPost };


export type UpdatePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  input: UpdatePostInput;
}>;


export type UpdatePostMutationResult = UpdatePostMutation_Mutation;

export type DeletePostMutation_deletePost_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type DeletePostMutation_Mutation = { __typename: 'Mutation', deletePost: DeletePostMutation_deletePost_GeneralResponse };


export type DeletePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeletePostMutationResult = DeletePostMutation_Mutation;

export type PublishPostMutation_publishPost_BlogPost = { __typename: 'BlogPost', id: string, status: PostStatus, publishedAt?: string | null };

export type PublishPostMutation_Mutation = { __typename: 'Mutation', publishPost: PublishPostMutation_publishPost_BlogPost };


export type PublishPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type PublishPostMutationResult = PublishPostMutation_Mutation;

export type ArchivePostMutation_archivePost_BlogPost = { __typename: 'BlogPost', id: string, status: PostStatus };

export type ArchivePostMutation_Mutation = { __typename: 'Mutation', archivePost: ArchivePostMutation_archivePost_BlogPost };


export type ArchivePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ArchivePostMutationResult = ArchivePostMutation_Mutation;

export type LikePostMutation_likePost_BlogPost_stats_BlogPostStats = { __typename: 'BlogPostStats', id: string, viewCount: number, likeCount: number, shareCount: number, commentCount: number, lastViewedAt?: string | null, updatedAt: string };

export type LikePostMutation_likePost_BlogPost = { __typename: 'BlogPost', id: string, stats: LikePostMutation_likePost_BlogPost_stats_BlogPostStats };

export type LikePostMutation_Mutation = { __typename: 'Mutation', likePost: LikePostMutation_likePost_BlogPost };


export type LikePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type LikePostMutationResult = LikePostMutation_Mutation;

export type UnlikePostMutation_unlikePost_BlogPost_stats_BlogPostStats = { __typename: 'BlogPostStats', id: string, viewCount: number, likeCount: number, shareCount: number, commentCount: number, lastViewedAt?: string | null, updatedAt: string };

export type UnlikePostMutation_unlikePost_BlogPost = { __typename: 'BlogPost', id: string, stats: UnlikePostMutation_unlikePost_BlogPost_stats_BlogPostStats };

export type UnlikePostMutation_Mutation = { __typename: 'Mutation', unlikePost: UnlikePostMutation_unlikePost_BlogPost };


export type UnlikePostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnlikePostMutationResult = UnlikePostMutation_Mutation;

export type FoldersQuery_folders_FileFolder = { __typename: 'FileFolder', name: string, path: string, createdAt: string, fileCount: number };

export type FoldersQuery_Query = { __typename: 'Query', folders: Array<FoldersQuery_folders_FileFolder> };


export type FoldersQueryVariables = Exact<{ [key: string]: never; }>;


export type FoldersQueryResult = FoldersQuery_Query;

export type FilesQuery_files_MarkdownFile = { __typename: 'MarkdownFile', name: string, folder: string, size: number, createdAt: string, updatedAt: string };

export type FilesQuery_Query = { __typename: 'Query', files: Array<FilesQuery_files_MarkdownFile> };


export type FilesQueryVariables = Exact<{
  folder: Scalars['String']['input'];
}>;


export type FilesQueryResult = FilesQuery_Query;

export type FileContentQuery_fileContent_MarkdownFile = { __typename: 'MarkdownFile', name: string, folder: string, content?: string | null, size: number, createdAt: string, updatedAt: string };

export type FileContentQuery_Query = { __typename: 'Query', fileContent?: FileContentQuery_fileContent_MarkdownFile | null };


export type FileContentQueryVariables = Exact<{
  folder: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
}>;


export type FileContentQueryResult = FileContentQuery_Query;

export type CreateFolderMutation_createFolder_FileFolder = { __typename: 'FileFolder', name: string, path: string, createdAt: string, fileCount: number };

export type CreateFolderMutation_Mutation = { __typename: 'Mutation', createFolder: CreateFolderMutation_createFolder_FileFolder };


export type CreateFolderMutationVariables = Exact<{
  input: CreateFolderInput;
}>;


export type CreateFolderMutationResult = CreateFolderMutation_Mutation;

export type UploadMarkdownFileMutation_uploadMarkdownFile_FileUploadResponse = { __typename: 'FileUploadResponse', success: boolean, message: string, filePath?: string | null, fileName?: string | null };

export type UploadMarkdownFileMutation_Mutation = { __typename: 'Mutation', uploadMarkdownFile: UploadMarkdownFileMutation_uploadMarkdownFile_FileUploadResponse };


export type UploadMarkdownFileMutationVariables = Exact<{
  input: UploadMarkdownFileInput;
}>;


export type UploadMarkdownFileMutationResult = UploadMarkdownFileMutation_Mutation;

export type UpdateFileMutation_updateFile_MarkdownFile = { __typename: 'MarkdownFile', name: string, folder: string, content?: string | null, size: number, createdAt: string, updatedAt: string };

export type UpdateFileMutation_Mutation = { __typename: 'Mutation', updateFile: UpdateFileMutation_updateFile_MarkdownFile };


export type UpdateFileMutationVariables = Exact<{
  input: UpdateFileInput;
}>;


export type UpdateFileMutationResult = UpdateFileMutation_Mutation;

export type DeleteFileMutation_deleteFile_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type DeleteFileMutation_Mutation = { __typename: 'Mutation', deleteFile: DeleteFileMutation_deleteFile_GeneralResponse };


export type DeleteFileMutationVariables = Exact<{
  folder: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
}>;


export type DeleteFileMutationResult = DeleteFileMutation_Mutation;

export type DeleteFolderMutation_deleteFolder_GeneralResponse = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type DeleteFolderMutation_Mutation = { __typename: 'Mutation', deleteFolder: DeleteFolderMutation_deleteFolder_GeneralResponse };


export type DeleteFolderMutationVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type DeleteFolderMutationResult = DeleteFolderMutation_Mutation;

export type UploadImageMutation_uploadImage_ImageUploadResponse = { __typename: 'ImageUploadResponse', imageUrl: string, deleteUrl?: string | null, filename: string, size: number };

export type UploadImageMutation_Mutation = { __typename: 'Mutation', uploadImage: UploadImageMutation_uploadImage_ImageUploadResponse };


export type UploadImageMutationVariables = Exact<{
  file: Scalars['Upload']['input'];
}>;


export type UploadImageMutationResult = UploadImageMutation_Mutation;

export type UserInfoFragment = { __typename: 'User', id: string, username: string, email: string, role: UserRole, isVerified: boolean, isActive: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: string | null, emailVerifiedAt?: string | null, createdAt: string, updatedAt: string };

export type UserSummaryFragment = { __typename: 'User', id: string, username: string, avatar?: string | null, role: UserRole };

export type BlogPostInfoFragment = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, content: string, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, accessLevel: AccessLevel, status: PostStatus, publishedAt?: string | null, lastEditedAt?: string | null, createdAt: string, updatedAt: string };

export type BlogPostSummaryFragment = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, status: PostStatus, publishedAt?: string | null, author: MeQuery_me_User_posts_BlogPost_author_User, stats: MeQuery_me_User_posts_BlogPost_stats_BlogPostStats };

export type BlogPostDetailFragment = { __typename: 'BlogPost', id: string, title: string, slug: string, excerpt?: string | null, content: string, tags: Array<string>, categories: Array<string>, coverImageUrl?: string | null, accessLevel: AccessLevel, status: PostStatus, publishedAt?: string | null, lastEditedAt?: string | null, createdAt: string, updatedAt: string, author: PostQuery_post_BlogPost_author_User, stats: PostQuery_post_BlogPost_stats_BlogPostStats, versions: Array<PostQuery_post_BlogPost_versions_BlogPostVersion> };

export type BlogPostStatsFragment = { __typename: 'BlogPostStats', id: string, viewCount: number, likeCount: number, shareCount: number, commentCount: number, lastViewedAt?: string | null, updatedAt: string };

export type BlogPostVersionFragment = { __typename: 'BlogPostVersion', id: string, versionNum: number, title: string, content: string, changeLog?: string | null, createdAt: string, createdBy: PostVersionsQuery_postVersions_BlogPostVersion_createdBy_User };

export type FileFolderInfoFragment = { __typename: 'FileFolder', name: string, path: string, createdAt: string, fileCount: number };

export type MarkdownFileInfoFragment = { __typename: 'MarkdownFile', name: string, folder: string, content?: string | null, size: number, createdAt: string, updatedAt: string };

export type MarkdownFileSummaryFragment = { __typename: 'MarkdownFile', name: string, folder: string, size: number, createdAt: string, updatedAt: string };

export type InviteCodeInfoFragment = { __typename: 'InviteCode', id: string, code: string, usedAt?: string | null, expiresAt: string, maxUses: number, currentUses: number, isActive: boolean, description?: string | null, createdAt: string, createdBy: InviteCodesQuery_inviteCodes_InviteCode_createdBy_User, usedBy?: InviteCodesQuery_inviteCodes_InviteCode_usedBy_User | null };

export type AuthPayloadInfoFragment = { __typename: 'AuthPayload', token: string, refreshToken: string, expiresAt: string, user: RegisterMutation_register_AuthPayload_user_User };

export type ServerDashboardInfoFragment = { __typename: 'ServerDashboard', serverTime: string, hostname: string, goVersion: string, cpuCount: number, goroutines: number, uptime: string, userCount: number, postCount: number, todayRegistrations: number, todayPosts: number, memory: ServerDashboardQuery_serverDashboard_ServerDashboard_memory_ServerMemoryStats };

export type GeneralResponseInfoFragment = { __typename: 'GeneralResponse', success: boolean, message?: string | null, code?: string | null };

export type SearchSuggestionsQuery_Query = { __typename: 'Query', getSearchSuggestions: Array<string> };


export type SearchSuggestionsQueryVariables = Exact<{
  query: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SearchSuggestionsQueryResult = SearchSuggestionsQuery_Query;

export type TrendingSearchesQuery_Query = { __typename: 'Query', getTrendingSearches: Array<string> };


export type TrendingSearchesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TrendingSearchesQueryResult = TrendingSearchesQuery_Query;

export type SearchStatsQuery_getSearchStats_SearchStats_popularQueries_PopularQuery = { __typename: 'PopularQuery', query: string, count: number, lastSearched: string };

export type SearchStatsQuery_getSearchStats_SearchStats_searchTrends_SearchTrend = { __typename: 'SearchTrend', date: string, searchCount: number, topQueries: Array<string> };

export type SearchStatsQuery_getSearchStats_SearchStats = { __typename: 'SearchStats', totalSearches: number, popularQueries: Array<SearchStatsQuery_getSearchStats_SearchStats_popularQueries_PopularQuery>, searchTrends: Array<SearchStatsQuery_getSearchStats_SearchStats_searchTrends_SearchTrend> };

export type SearchStatsQuery_Query = { __typename: 'Query', getSearchStats: SearchStatsQuery_getSearchStats_SearchStats };


export type SearchStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type SearchStatsQueryResult = SearchStatsQuery_Query;

export const UserSummaryFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode;
export const BlogPostSummaryFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode;
export const BlogPostInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UserInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const BlogPostDetailFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostInfo"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const BlogPostStatsFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostStats"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const BlogPostVersionFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostVersion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode;
export const FileFolderInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileFolder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileCount"}}]}}]} as unknown as DocumentNode;
export const MarkdownFileInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkdownFileInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkdownFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const MarkdownFileSummaryFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkdownFileSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkdownFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const InviteCodeInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InviteCodeInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteCode"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"currentUses"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]} as unknown as DocumentNode;
export const AuthPayloadInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const ServerDashboardInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerDashboardInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverTime"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"goVersion"}},{"kind":"Field","name":{"kind":"Name","value":"cpuCount"}},{"kind":"Field","name":{"kind":"Name","value":"goroutines"}},{"kind":"Field","name":{"kind":"Name","value":"memory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alloc"}},{"kind":"Field","name":{"kind":"Name","value":"totalAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"sys"}},{"kind":"Field","name":{"kind":"Name","value":"heapAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"heapSys"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}},{"kind":"Field","name":{"kind":"Name","value":"userCount"}},{"kind":"Field","name":{"kind":"Name","value":"postCount"}},{"kind":"Field","name":{"kind":"Name","value":"todayRegistrations"}},{"kind":"Field","name":{"kind":"Name","value":"todayPosts"}}]}}]} as unknown as DocumentNode;
export const GeneralResponseInfoFragmentDoc = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export const UsersDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRole"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isVerified"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}},{"kind":"Argument","name":{"kind":"Name","value":"isVerified"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isVerified"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}},{"kind":"Field","name":{"kind":"Name","value":"postsCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;

/**
 * __useUsersQuery__
 *
 * To run a query within a React component, call `useUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUsersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      search: // value for 'search'
 *      role: // value for 'role'
 *      isVerified: // value for 'isVerified'
 *   },
 * });
 */
export function useUsersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<UsersQueryResult, UsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<UsersQueryResult, UsersQueryVariables>(UsersDocument, options);
      }
export function useUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UsersQueryResult, UsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<UsersQueryResult, UsersQueryVariables>(UsersDocument, options);
        }
export function useUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UsersQueryResult, UsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<UsersQueryResult, UsersQueryVariables>(UsersDocument, options);
        }
export type UsersQueryHookResult = ReturnType<typeof useUsersQuery>;
export type UsersLazyQueryHookResult = ReturnType<typeof useUsersLazyQuery>;
export type UsersSuspenseQueryHookResult = ReturnType<typeof useUsersSuspenseQuery>;
export type UsersQueryResult = Apollo.QueryResult<UsersQueryResult, UsersQueryVariables>;
export const ServerDashboardDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ServerDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ServerDashboardInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ServerDashboardInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ServerDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"serverTime"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}},{"kind":"Field","name":{"kind":"Name","value":"goVersion"}},{"kind":"Field","name":{"kind":"Name","value":"cpuCount"}},{"kind":"Field","name":{"kind":"Name","value":"goroutines"}},{"kind":"Field","name":{"kind":"Name","value":"memory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"alloc"}},{"kind":"Field","name":{"kind":"Name","value":"totalAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"sys"}},{"kind":"Field","name":{"kind":"Name","value":"heapAlloc"}},{"kind":"Field","name":{"kind":"Name","value":"heapSys"}}]}},{"kind":"Field","name":{"kind":"Name","value":"uptime"}},{"kind":"Field","name":{"kind":"Name","value":"userCount"}},{"kind":"Field","name":{"kind":"Name","value":"postCount"}},{"kind":"Field","name":{"kind":"Name","value":"todayRegistrations"}},{"kind":"Field","name":{"kind":"Name","value":"todayPosts"}}]}}]} as unknown as DocumentNode;

/**
 * __useServerDashboardQuery__
 *
 * To run a query within a React component, call `useServerDashboardQuery` and pass it any options that fit your needs.
 * When your component renders, `useServerDashboardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useServerDashboardQuery({
 *   variables: {
 *   },
 * });
 */
export function useServerDashboardQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ServerDashboardQueryResult, ServerDashboardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ServerDashboardQueryResult, ServerDashboardQueryVariables>(ServerDashboardDocument, options);
      }
export function useServerDashboardLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ServerDashboardQueryResult, ServerDashboardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ServerDashboardQueryResult, ServerDashboardQueryVariables>(ServerDashboardDocument, options);
        }
export function useServerDashboardSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ServerDashboardQueryResult, ServerDashboardQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ServerDashboardQueryResult, ServerDashboardQueryVariables>(ServerDashboardDocument, options);
        }
export type ServerDashboardQueryHookResult = ReturnType<typeof useServerDashboardQuery>;
export type ServerDashboardLazyQueryHookResult = ReturnType<typeof useServerDashboardLazyQuery>;
export type ServerDashboardSuspenseQueryHookResult = ReturnType<typeof useServerDashboardSuspenseQuery>;
export type ServerDashboardQueryResult = Apollo.QueryResult<ServerDashboardQueryResult, ServerDashboardQueryVariables>;
export const InviteCodesDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InviteCodes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteCodes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InviteCodeInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InviteCodeInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteCode"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"currentUses"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;

/**
 * __useInviteCodesQuery__
 *
 * To run a query within a React component, call `useInviteCodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useInviteCodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useInviteCodesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useInviteCodesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<InviteCodesQueryResult, InviteCodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<InviteCodesQueryResult, InviteCodesQueryVariables>(InviteCodesDocument, options);
      }
export function useInviteCodesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<InviteCodesQueryResult, InviteCodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<InviteCodesQueryResult, InviteCodesQueryVariables>(InviteCodesDocument, options);
        }
export function useInviteCodesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<InviteCodesQueryResult, InviteCodesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<InviteCodesQueryResult, InviteCodesQueryVariables>(InviteCodesDocument, options);
        }
export type InviteCodesQueryHookResult = ReturnType<typeof useInviteCodesQuery>;
export type InviteCodesLazyQueryHookResult = ReturnType<typeof useInviteCodesLazyQuery>;
export type InviteCodesSuspenseQueryHookResult = ReturnType<typeof useInviteCodesSuspenseQuery>;
export type InviteCodesQueryResult = Apollo.QueryResult<InviteCodesQueryResult, InviteCodesQueryVariables>;
export const AdminCreateUserDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminCreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminCreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminCreateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type AdminCreateUserMutationFn = Apollo.MutationFunction<AdminCreateUserMutationResult, AdminCreateUserMutationVariables>;

/**
 * __useAdminCreateUserMutation__
 *
 * To run a mutation, you first call `useAdminCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminCreateUserMutation, { data, loading, error }] = useAdminCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAdminCreateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AdminCreateUserMutationResult, AdminCreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AdminCreateUserMutationResult, AdminCreateUserMutationVariables>(AdminCreateUserDocument, options);
      }
export type AdminCreateUserMutationHookResult = ReturnType<typeof useAdminCreateUserMutation>;
export type AdminCreateUserMutationResult = Apollo.MutationResult<AdminCreateUserMutationResult>;
export type AdminCreateUserMutationOptions = Apollo.BaseMutationOptions<AdminCreateUserMutationResult, AdminCreateUserMutationVariables>;
export const AdminUpdateUserDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminUpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"username"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRole"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isVerified"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminUpdateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"username"},"value":{"kind":"Variable","name":{"kind":"Name","value":"username"}}},{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}},{"kind":"Argument","name":{"kind":"Name","value":"isVerified"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isVerified"}}},{"kind":"Argument","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type AdminUpdateUserMutationFn = Apollo.MutationFunction<AdminUpdateUserMutationResult, AdminUpdateUserMutationVariables>;

/**
 * __useAdminUpdateUserMutation__
 *
 * To run a mutation, you first call `useAdminUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminUpdateUserMutation, { data, loading, error }] = useAdminUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      username: // value for 'username'
 *      email: // value for 'email'
 *      role: // value for 'role'
 *      isVerified: // value for 'isVerified'
 *      isActive: // value for 'isActive'
 *   },
 * });
 */
export function useAdminUpdateUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AdminUpdateUserMutationResult, AdminUpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AdminUpdateUserMutationResult, AdminUpdateUserMutationVariables>(AdminUpdateUserDocument, options);
      }
export type AdminUpdateUserMutationHookResult = ReturnType<typeof useAdminUpdateUserMutation>;
export type AdminUpdateUserMutationResult = Apollo.MutationResult<AdminUpdateUserMutationResult>;
export type AdminUpdateUserMutationOptions = Apollo.BaseMutationOptions<AdminUpdateUserMutationResult, AdminUpdateUserMutationVariables>;
export const AdminDeleteUserDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type AdminDeleteUserMutationFn = Apollo.MutationFunction<AdminDeleteUserMutationResult, AdminDeleteUserMutationVariables>;

/**
 * __useAdminDeleteUserMutation__
 *
 * To run a mutation, you first call `useAdminDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdminDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [adminDeleteUserMutation, { data, loading, error }] = useAdminDeleteUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAdminDeleteUserMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AdminDeleteUserMutationResult, AdminDeleteUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AdminDeleteUserMutationResult, AdminDeleteUserMutationVariables>(AdminDeleteUserDocument, options);
      }
export type AdminDeleteUserMutationHookResult = ReturnType<typeof useAdminDeleteUserMutation>;
export type AdminDeleteUserMutationResult = Apollo.MutationResult<AdminDeleteUserMutationResult>;
export type AdminDeleteUserMutationOptions = Apollo.BaseMutationOptions<AdminDeleteUserMutationResult, AdminDeleteUserMutationVariables>;
export const CreateInviteCodeDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateInviteCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateInviteCodeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createInviteCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"InviteCodeInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InviteCodeInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"InviteCode"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"maxUses"}},{"kind":"Field","name":{"kind":"Name","value":"currentUses"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export type CreateInviteCodeMutationFn = Apollo.MutationFunction<CreateInviteCodeMutationResult, CreateInviteCodeMutationVariables>;

/**
 * __useCreateInviteCodeMutation__
 *
 * To run a mutation, you first call `useCreateInviteCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateInviteCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createInviteCodeMutation, { data, loading, error }] = useCreateInviteCodeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateInviteCodeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateInviteCodeMutationResult, CreateInviteCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateInviteCodeMutationResult, CreateInviteCodeMutationVariables>(CreateInviteCodeDocument, options);
      }
export type CreateInviteCodeMutationHookResult = ReturnType<typeof useCreateInviteCodeMutation>;
export type CreateInviteCodeMutationResult = Apollo.MutationResult<CreateInviteCodeMutationResult>;
export type CreateInviteCodeMutationOptions = Apollo.BaseMutationOptions<CreateInviteCodeMutationResult, CreateInviteCodeMutationVariables>;
export const DeactivateInviteCodeDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateInviteCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateInviteCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type DeactivateInviteCodeMutationFn = Apollo.MutationFunction<DeactivateInviteCodeMutationResult, DeactivateInviteCodeMutationVariables>;

/**
 * __useDeactivateInviteCodeMutation__
 *
 * To run a mutation, you first call `useDeactivateInviteCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeactivateInviteCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deactivateInviteCodeMutation, { data, loading, error }] = useDeactivateInviteCodeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeactivateInviteCodeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeactivateInviteCodeMutationResult, DeactivateInviteCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeactivateInviteCodeMutationResult, DeactivateInviteCodeMutationVariables>(DeactivateInviteCodeDocument, options);
      }
export type DeactivateInviteCodeMutationHookResult = ReturnType<typeof useDeactivateInviteCodeMutation>;
export type DeactivateInviteCodeMutationResult = Apollo.MutationResult<DeactivateInviteCodeMutationResult>;
export type DeactivateInviteCodeMutationOptions = Apollo.BaseMutationOptions<DeactivateInviteCodeMutationResult, DeactivateInviteCodeMutationVariables>;
export const ClearCacheDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCache"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCache"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type ClearCacheMutationFn = Apollo.MutationFunction<ClearCacheMutationResult, ClearCacheMutationVariables>;

/**
 * __useClearCacheMutation__
 *
 * To run a mutation, you first call `useClearCacheMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useClearCacheMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [clearCacheMutation, { data, loading, error }] = useClearCacheMutation({
 *   variables: {
 *   },
 * });
 */
export function useClearCacheMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ClearCacheMutationResult, ClearCacheMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ClearCacheMutationResult, ClearCacheMutationVariables>(ClearCacheDocument, options);
      }
export type ClearCacheMutationHookResult = ReturnType<typeof useClearCacheMutation>;
export type ClearCacheMutationResult = Apollo.MutationResult<ClearCacheMutationResult>;
export type ClearCacheMutationOptions = Apollo.BaseMutationOptions<ClearCacheMutationResult, ClearCacheMutationVariables>;
export const RebuildSearchIndexDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RebuildSearchIndex"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rebuildSearchIndex"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type RebuildSearchIndexMutationFn = Apollo.MutationFunction<RebuildSearchIndexMutationResult, RebuildSearchIndexMutationVariables>;

/**
 * __useRebuildSearchIndexMutation__
 *
 * To run a mutation, you first call `useRebuildSearchIndexMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRebuildSearchIndexMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rebuildSearchIndexMutation, { data, loading, error }] = useRebuildSearchIndexMutation({
 *   variables: {
 *   },
 * });
 */
export function useRebuildSearchIndexMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RebuildSearchIndexMutationResult, RebuildSearchIndexMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RebuildSearchIndexMutationResult, RebuildSearchIndexMutationVariables>(RebuildSearchIndexDocument, options);
      }
export type RebuildSearchIndexMutationHookResult = ReturnType<typeof useRebuildSearchIndexMutation>;
export type RebuildSearchIndexMutationResult = Apollo.MutationResult<RebuildSearchIndexMutationResult>;
export type RebuildSearchIndexMutationOptions = Apollo.BaseMutationOptions<RebuildSearchIndexMutationResult, RebuildSearchIndexMutationVariables>;
export const RegisterDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}}]} as unknown as DocumentNode;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutationResult, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RegisterMutationResult, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RegisterMutationResult, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutationResult>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutationResult, RegisterMutationVariables>;
export const LoginDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}}]} as unknown as DocumentNode;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutationResult, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LoginMutationResult, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LoginMutationResult, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutationResult>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutationResult, LoginMutationVariables>;
export const EmailLoginDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EmailLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EmailLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emailLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type EmailLoginMutationFn = Apollo.MutationFunction<EmailLoginMutationResult, EmailLoginMutationVariables>;

/**
 * __useEmailLoginMutation__
 *
 * To run a mutation, you first call `useEmailLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEmailLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [emailLoginMutation, { data, loading, error }] = useEmailLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useEmailLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<EmailLoginMutationResult, EmailLoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<EmailLoginMutationResult, EmailLoginMutationVariables>(EmailLoginDocument, options);
      }
export type EmailLoginMutationHookResult = ReturnType<typeof useEmailLoginMutation>;
export type EmailLoginMutationResult = Apollo.MutationResult<EmailLoginMutationResult>;
export type EmailLoginMutationOptions = Apollo.BaseMutationOptions<EmailLoginMutationResult, EmailLoginMutationVariables>;
export const VerifyEmailAndLoginDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmailAndLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmailAndLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}}]} as unknown as DocumentNode;
export type VerifyEmailAndLoginMutationFn = Apollo.MutationFunction<VerifyEmailAndLoginMutationResult, VerifyEmailAndLoginMutationVariables>;

/**
 * __useVerifyEmailAndLoginMutation__
 *
 * To run a mutation, you first call `useVerifyEmailAndLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useVerifyEmailAndLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [verifyEmailAndLoginMutation, { data, loading, error }] = useVerifyEmailAndLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useVerifyEmailAndLoginMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<VerifyEmailAndLoginMutationResult, VerifyEmailAndLoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<VerifyEmailAndLoginMutationResult, VerifyEmailAndLoginMutationVariables>(VerifyEmailAndLoginDocument, options);
      }
export type VerifyEmailAndLoginMutationHookResult = ReturnType<typeof useVerifyEmailAndLoginMutation>;
export type VerifyEmailAndLoginMutationResult = Apollo.MutationResult<VerifyEmailAndLoginMutationResult>;
export type VerifyEmailAndLoginMutationOptions = Apollo.BaseMutationOptions<VerifyEmailAndLoginMutationResult, VerifyEmailAndLoginMutationVariables>;
export const LogoutDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutationResult, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LogoutMutationResult, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LogoutMutationResult, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutationResult>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutationResult, LogoutMutationVariables>;
export const RefreshTokenDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshToken"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthPayloadInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthPayloadInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}}]} as unknown as DocumentNode;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutationResult, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RefreshTokenMutationResult, RefreshTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RefreshTokenMutationResult, RefreshTokenMutationVariables>(RefreshTokenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutationResult>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutationResult, RefreshTokenMutationVariables>;
export const SendVerificationCodeDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendVerificationCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerificationType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendVerificationCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type SendVerificationCodeMutationFn = Apollo.MutationFunction<SendVerificationCodeMutationResult, SendVerificationCodeMutationVariables>;

/**
 * __useSendVerificationCodeMutation__
 *
 * To run a mutation, you first call `useSendVerificationCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendVerificationCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendVerificationCodeMutation, { data, loading, error }] = useSendVerificationCodeMutation({
 *   variables: {
 *      email: // value for 'email'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useSendVerificationCodeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendVerificationCodeMutationResult, SendVerificationCodeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SendVerificationCodeMutationResult, SendVerificationCodeMutationVariables>(SendVerificationCodeDocument, options);
      }
export type SendVerificationCodeMutationHookResult = ReturnType<typeof useSendVerificationCodeMutation>;
export type SendVerificationCodeMutationResult = Apollo.MutationResult<SendVerificationCodeMutationResult>;
export type SendVerificationCodeMutationOptions = Apollo.BaseMutationOptions<SendVerificationCodeMutationResult, SendVerificationCodeMutationVariables>;
export const VerifyEmailDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VerifyEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type VerifyEmailMutationFn = Apollo.MutationFunction<VerifyEmailMutationResult, VerifyEmailMutationVariables>;

/**
 * __useVerifyEmailMutation__
 *
 * To run a mutation, you first call `useVerifyEmailMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useVerifyEmailMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [verifyEmailMutation, { data, loading, error }] = useVerifyEmailMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useVerifyEmailMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<VerifyEmailMutationResult, VerifyEmailMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<VerifyEmailMutationResult, VerifyEmailMutationVariables>(VerifyEmailDocument, options);
      }
export type VerifyEmailMutationHookResult = ReturnType<typeof useVerifyEmailMutation>;
export type VerifyEmailMutationResult = Apollo.MutationResult<VerifyEmailMutationResult>;
export type VerifyEmailMutationOptions = Apollo.BaseMutationOptions<VerifyEmailMutationResult, VerifyEmailMutationVariables>;
export const RequestPasswordResetDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestPasswordResetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type RequestPasswordResetMutationFn = Apollo.MutationFunction<RequestPasswordResetMutationResult, RequestPasswordResetMutationVariables>;

/**
 * __useRequestPasswordResetMutation__
 *
 * To run a mutation, you first call `useRequestPasswordResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestPasswordResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestPasswordResetMutation, { data, loading, error }] = useRequestPasswordResetMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRequestPasswordResetMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RequestPasswordResetMutationResult, RequestPasswordResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RequestPasswordResetMutationResult, RequestPasswordResetMutationVariables>(RequestPasswordResetDocument, options);
      }
export type RequestPasswordResetMutationHookResult = ReturnType<typeof useRequestPasswordResetMutation>;
export type RequestPasswordResetMutationResult = Apollo.MutationResult<RequestPasswordResetMutationResult>;
export type RequestPasswordResetMutationOptions = Apollo.BaseMutationOptions<RequestPasswordResetMutationResult, RequestPasswordResetMutationVariables>;
export const ConfirmPasswordResetDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfirmPasswordResetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type ConfirmPasswordResetMutationFn = Apollo.MutationFunction<ConfirmPasswordResetMutationResult, ConfirmPasswordResetMutationVariables>;

/**
 * __useConfirmPasswordResetMutation__
 *
 * To run a mutation, you first call `useConfirmPasswordResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmPasswordResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmPasswordResetMutation, { data, loading, error }] = useConfirmPasswordResetMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useConfirmPasswordResetMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ConfirmPasswordResetMutationResult, ConfirmPasswordResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ConfirmPasswordResetMutationResult, ConfirmPasswordResetMutationVariables>(ConfirmPasswordResetDocument, options);
      }
export type ConfirmPasswordResetMutationHookResult = ReturnType<typeof useConfirmPasswordResetMutation>;
export type ConfirmPasswordResetMutationResult = Apollo.MutationResult<ConfirmPasswordResetMutationResult>;
export type ConfirmPasswordResetMutationOptions = Apollo.BaseMutationOptions<ConfirmPasswordResetMutationResult, ConfirmPasswordResetMutationVariables>;
export const UpdateProfileDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type UpdateProfileMutationFn = Apollo.MutationFunction<UpdateProfileMutationResult, UpdateProfileMutationVariables>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProfileMutationResult, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProfileMutationResult, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutationResult>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<UpdateProfileMutationResult, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"currentPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type ChangePasswordMutationFn = Apollo.MutationFunction<ChangePasswordMutationResult, ChangePasswordMutationVariables>;

/**
 * __useChangePasswordMutation__
 *
 * To run a mutation, you first call `useChangePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordMutation, { data, loading, error }] = useChangePasswordMutation({
 *   variables: {
 *      currentPassword: // value for 'currentPassword'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ChangePasswordMutationResult, ChangePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ChangePasswordMutationResult, ChangePasswordMutationVariables>(ChangePasswordDocument, options);
      }
export type ChangePasswordMutationHookResult = ReturnType<typeof useChangePasswordMutation>;
export type ChangePasswordMutationResult = Apollo.MutationResult<ChangePasswordMutationResult>;
export type ChangePasswordMutationOptions = Apollo.BaseMutationOptions<ChangePasswordMutationResult, ChangePasswordMutationVariables>;
export const MeDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}},{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"postsCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<MeQueryResult, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<MeQueryResult, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<MeQueryResult, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<MeQueryResult, MeQueryVariables>(MeDocument, options);
        }
export function useMeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<MeQueryResult, MeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<MeQueryResult, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQueryResult, MeQueryVariables>;
export const UserDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"User"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}},{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"postsCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __useUserQuery__
 *
 * To run a query within a React component, call `useUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUserQuery(baseOptions: ApolloReactHooks.QueryHookOptions<UserQueryResult, UserQueryVariables> & ({ variables: UserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<UserQueryResult, UserQueryVariables>(UserDocument, options);
      }
export function useUserLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<UserQueryResult, UserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<UserQueryResult, UserQueryVariables>(UserDocument, options);
        }
export function useUserSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<UserQueryResult, UserQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<UserQueryResult, UserQueryVariables>(UserDocument, options);
        }
export type UserQueryHookResult = ReturnType<typeof useUserQuery>;
export type UserLazyQueryHookResult = ReturnType<typeof useUserLazyQuery>;
export type UserSuspenseQueryHookResult = ReturnType<typeof useUserSuspenseQuery>;
export type UserQueryResult = Apollo.QueryResult<UserQueryResult, UserQueryVariables>;
export const PostsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Posts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PostFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PostSortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __usePostsQuery__
 *
 * To run a query within a React component, call `usePostsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      filter: // value for 'filter'
 *      sort: // value for 'sort'
 *   },
 * });
 */
export function usePostsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PostsQueryResult, PostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PostsQueryResult, PostsQueryVariables>(PostsDocument, options);
      }
export function usePostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostsQueryResult, PostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PostsQueryResult, PostsQueryVariables>(PostsDocument, options);
        }
export function usePostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PostsQueryResult, PostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PostsQueryResult, PostsQueryVariables>(PostsDocument, options);
        }
export type PostsQueryHookResult = ReturnType<typeof usePostsQuery>;
export type PostsLazyQueryHookResult = ReturnType<typeof usePostsLazyQuery>;
export type PostsSuspenseQueryHookResult = ReturnType<typeof usePostsSuspenseQuery>;
export type PostsQueryResult = Apollo.QueryResult<PostsQueryResult, PostsQueryVariables>;
export const PostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Post"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostInfo"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}}]}}]} as unknown as DocumentNode;

/**
 * __usePostQuery__
 *
 * To run a query within a React component, call `usePostQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostQuery({
 *   variables: {
 *      id: // value for 'id'
 *      slug: // value for 'slug'
 *   },
 * });
 */
export function usePostQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PostQueryResult, PostQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PostQueryResult, PostQueryVariables>(PostDocument, options);
      }
export function usePostLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostQueryResult, PostQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PostQueryResult, PostQueryVariables>(PostDocument, options);
        }
export function usePostSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PostQueryResult, PostQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PostQueryResult, PostQueryVariables>(PostDocument, options);
        }
export type PostQueryHookResult = ReturnType<typeof usePostQuery>;
export type PostLazyQueryHookResult = ReturnType<typeof usePostLazyQuery>;
export type PostSuspenseQueryHookResult = ReturnType<typeof usePostSuspenseQuery>;
export type PostQueryResult = Apollo.QueryResult<PostQueryResult, PostQueryVariables>;
export const PostVersionsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostVersions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postVersions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostVersion"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostVersion"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostVersion"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __usePostVersionsQuery__
 *
 * To run a query within a React component, call `usePostVersionsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePostVersionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePostVersionsQuery({
 *   variables: {
 *      postId: // value for 'postId'
 *   },
 * });
 */
export function usePostVersionsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<PostVersionsQueryResult, PostVersionsQueryVariables> & ({ variables: PostVersionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PostVersionsQueryResult, PostVersionsQueryVariables>(PostVersionsDocument, options);
      }
export function usePostVersionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PostVersionsQueryResult, PostVersionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PostVersionsQueryResult, PostVersionsQueryVariables>(PostVersionsDocument, options);
        }
export function usePostVersionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PostVersionsQueryResult, PostVersionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PostVersionsQueryResult, PostVersionsQueryVariables>(PostVersionsDocument, options);
        }
export type PostVersionsQueryHookResult = ReturnType<typeof usePostVersionsQuery>;
export type PostVersionsLazyQueryHookResult = ReturnType<typeof usePostVersionsLazyQuery>;
export type PostVersionsSuspenseQueryHookResult = ReturnType<typeof usePostVersionsSuspenseQuery>;
export type PostVersionsQueryResult = Apollo.QueryResult<PostVersionsQueryResult, PostVersionsQueryVariables>;
export const SearchPostsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"took"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __useSearchPostsQuery__
 *
 * To run a query within a React component, call `useSearchPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchPostsQuery({
 *   variables: {
 *      query: // value for 'query'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useSearchPostsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchPostsQueryResult, SearchPostsQueryVariables> & ({ variables: SearchPostsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchPostsQueryResult, SearchPostsQueryVariables>(SearchPostsDocument, options);
      }
export function useSearchPostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchPostsQueryResult, SearchPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchPostsQueryResult, SearchPostsQueryVariables>(SearchPostsDocument, options);
        }
export function useSearchPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchPostsQueryResult, SearchPostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchPostsQueryResult, SearchPostsQueryVariables>(SearchPostsDocument, options);
        }
export type SearchPostsQueryHookResult = ReturnType<typeof useSearchPostsQuery>;
export type SearchPostsLazyQueryHookResult = ReturnType<typeof useSearchPostsLazyQuery>;
export type SearchPostsSuspenseQueryHookResult = ReturnType<typeof useSearchPostsSuspenseQuery>;
export type SearchPostsQueryResult = Apollo.QueryResult<SearchPostsQueryResult, SearchPostsQueryVariables>;
export const PopularPostsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PopularPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPopularPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __usePopularPostsQuery__
 *
 * To run a query within a React component, call `usePopularPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePopularPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePopularPostsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function usePopularPostsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<PopularPostsQueryResult, PopularPostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PopularPostsQueryResult, PopularPostsQueryVariables>(PopularPostsDocument, options);
      }
export function usePopularPostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PopularPostsQueryResult, PopularPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PopularPostsQueryResult, PopularPostsQueryVariables>(PopularPostsDocument, options);
        }
export function usePopularPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PopularPostsQueryResult, PopularPostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PopularPostsQueryResult, PopularPostsQueryVariables>(PopularPostsDocument, options);
        }
export type PopularPostsQueryHookResult = ReturnType<typeof usePopularPostsQuery>;
export type PopularPostsLazyQueryHookResult = ReturnType<typeof usePopularPostsLazyQuery>;
export type PopularPostsSuspenseQueryHookResult = ReturnType<typeof usePopularPostsSuspenseQuery>;
export type PopularPostsQueryResult = Apollo.QueryResult<PopularPostsQueryResult, PopularPostsQueryVariables>;
export const RecentPostsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRecentPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}}]}}]} as unknown as DocumentNode;

/**
 * __useRecentPostsQuery__
 *
 * To run a query within a React component, call `useRecentPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentPostsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecentPostsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<RecentPostsQueryResult, RecentPostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<RecentPostsQueryResult, RecentPostsQueryVariables>(RecentPostsDocument, options);
      }
export function useRecentPostsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<RecentPostsQueryResult, RecentPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<RecentPostsQueryResult, RecentPostsQueryVariables>(RecentPostsDocument, options);
        }
export function useRecentPostsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<RecentPostsQueryResult, RecentPostsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<RecentPostsQueryResult, RecentPostsQueryVariables>(RecentPostsDocument, options);
        }
export type RecentPostsQueryHookResult = ReturnType<typeof useRecentPostsQuery>;
export type RecentPostsLazyQueryHookResult = ReturnType<typeof useRecentPostsLazyQuery>;
export type RecentPostsSuspenseQueryHookResult = ReturnType<typeof useRecentPostsSuspenseQuery>;
export type RecentPostsQueryResult = Apollo.QueryResult<RecentPostsQueryResult, RecentPostsQueryVariables>;
export const TrendingTagsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TrendingTags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTrendingTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}]}]}}]} as unknown as DocumentNode;

/**
 * __useTrendingTagsQuery__
 *
 * To run a query within a React component, call `useTrendingTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrendingTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrendingTagsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useTrendingTagsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<TrendingTagsQueryResult, TrendingTagsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<TrendingTagsQueryResult, TrendingTagsQueryVariables>(TrendingTagsDocument, options);
      }
export function useTrendingTagsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<TrendingTagsQueryResult, TrendingTagsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<TrendingTagsQueryResult, TrendingTagsQueryVariables>(TrendingTagsDocument, options);
        }
export function useTrendingTagsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<TrendingTagsQueryResult, TrendingTagsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<TrendingTagsQueryResult, TrendingTagsQueryVariables>(TrendingTagsDocument, options);
        }
export type TrendingTagsQueryHookResult = ReturnType<typeof useTrendingTagsQuery>;
export type TrendingTagsLazyQueryHookResult = ReturnType<typeof useTrendingTagsLazyQuery>;
export type TrendingTagsSuspenseQueryHookResult = ReturnType<typeof useTrendingTagsSuspenseQuery>;
export type TrendingTagsQueryResult = Apollo.QueryResult<TrendingTagsQueryResult, TrendingTagsQueryVariables>;
export const CreatePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostInfo"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}}]}}]} as unknown as DocumentNode;
export type CreatePostMutationFn = Apollo.MutationFunction<CreatePostMutationResult, CreatePostMutationVariables>;

/**
 * __useCreatePostMutation__
 *
 * To run a mutation, you first call `useCreatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPostMutation, { data, loading, error }] = useCreatePostMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePostMutationResult, CreatePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePostMutationResult, CreatePostMutationVariables>(CreatePostDocument, options);
      }
export type CreatePostMutationHookResult = ReturnType<typeof useCreatePostMutation>;
export type CreatePostMutationResult = Apollo.MutationResult<CreatePostMutationResult>;
export type CreatePostMutationOptions = Apollo.BaseMutationOptions<CreatePostMutationResult, CreatePostMutationVariables>;
export const UpdatePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostDetail"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"isVerified"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"coverImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"accessLevel"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastEditedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostInfo"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserInfo"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"versions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"versionNum"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"changeLog"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummary"}}]}}]}}]}}]} as unknown as DocumentNode;
export type UpdatePostMutationFn = Apollo.MutationFunction<UpdatePostMutationResult, UpdatePostMutationVariables>;

/**
 * __useUpdatePostMutation__
 *
 * To run a mutation, you first call `useUpdatePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePostMutation, { data, loading, error }] = useUpdatePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePostMutationResult, UpdatePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePostMutationResult, UpdatePostMutationVariables>(UpdatePostDocument, options);
      }
export type UpdatePostMutationHookResult = ReturnType<typeof useUpdatePostMutation>;
export type UpdatePostMutationResult = Apollo.MutationResult<UpdatePostMutationResult>;
export type UpdatePostMutationOptions = Apollo.BaseMutationOptions<UpdatePostMutationResult, UpdatePostMutationVariables>;
export const DeletePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type DeletePostMutationFn = Apollo.MutationFunction<DeletePostMutationResult, DeletePostMutationVariables>;

/**
 * __useDeletePostMutation__
 *
 * To run a mutation, you first call `useDeletePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePostMutation, { data, loading, error }] = useDeletePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeletePostMutationResult, DeletePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeletePostMutationResult, DeletePostMutationVariables>(DeletePostDocument, options);
      }
export type DeletePostMutationHookResult = ReturnType<typeof useDeletePostMutation>;
export type DeletePostMutationResult = Apollo.MutationResult<DeletePostMutationResult>;
export type DeletePostMutationOptions = Apollo.BaseMutationOptions<DeletePostMutationResult, DeletePostMutationVariables>;
export const PublishPostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishPost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}}]}}]}}]} as unknown as DocumentNode;
export type PublishPostMutationFn = Apollo.MutationFunction<PublishPostMutationResult, PublishPostMutationVariables>;

/**
 * __usePublishPostMutation__
 *
 * To run a mutation, you first call `usePublishPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePublishPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [publishPostMutation, { data, loading, error }] = usePublishPostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePublishPostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<PublishPostMutationResult, PublishPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<PublishPostMutationResult, PublishPostMutationVariables>(PublishPostDocument, options);
      }
export type PublishPostMutationHookResult = ReturnType<typeof usePublishPostMutation>;
export type PublishPostMutationResult = Apollo.MutationResult<PublishPostMutationResult>;
export type PublishPostMutationOptions = Apollo.BaseMutationOptions<PublishPostMutationResult, PublishPostMutationVariables>;
export const ArchivePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchivePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"archivePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode;
export type ArchivePostMutationFn = Apollo.MutationFunction<ArchivePostMutationResult, ArchivePostMutationVariables>;

/**
 * __useArchivePostMutation__
 *
 * To run a mutation, you first call `useArchivePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useArchivePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [archivePostMutation, { data, loading, error }] = useArchivePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useArchivePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ArchivePostMutationResult, ArchivePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ArchivePostMutationResult, ArchivePostMutationVariables>(ArchivePostDocument, options);
      }
export type ArchivePostMutationHookResult = ReturnType<typeof useArchivePostMutation>;
export type ArchivePostMutationResult = Apollo.MutationResult<ArchivePostMutationResult>;
export type ArchivePostMutationOptions = Apollo.BaseMutationOptions<ArchivePostMutationResult, ArchivePostMutationVariables>;
export const LikePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LikePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"likePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostStats"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostStats"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type LikePostMutationFn = Apollo.MutationFunction<LikePostMutationResult, LikePostMutationVariables>;

/**
 * __useLikePostMutation__
 *
 * To run a mutation, you first call `useLikePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLikePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [likePostMutation, { data, loading, error }] = useLikePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useLikePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<LikePostMutationResult, LikePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<LikePostMutationResult, LikePostMutationVariables>(LikePostDocument, options);
      }
export type LikePostMutationHookResult = ReturnType<typeof useLikePostMutation>;
export type LikePostMutationResult = Apollo.MutationResult<LikePostMutationResult>;
export type LikePostMutationOptions = Apollo.BaseMutationOptions<LikePostMutationResult, LikePostMutationVariables>;
export const UnlikePostDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnlikePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlikePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BlogPostStats"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BlogPostStats"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BlogPostStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"likeCount"}},{"kind":"Field","name":{"kind":"Name","value":"shareCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastViewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type UnlikePostMutationFn = Apollo.MutationFunction<UnlikePostMutationResult, UnlikePostMutationVariables>;

/**
 * __useUnlikePostMutation__
 *
 * To run a mutation, you first call `useUnlikePostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnlikePostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unlikePostMutation, { data, loading, error }] = useUnlikePostMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useUnlikePostMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UnlikePostMutationResult, UnlikePostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UnlikePostMutationResult, UnlikePostMutationVariables>(UnlikePostDocument, options);
      }
export type UnlikePostMutationHookResult = ReturnType<typeof useUnlikePostMutation>;
export type UnlikePostMutationResult = Apollo.MutationResult<UnlikePostMutationResult>;
export type UnlikePostMutationOptions = Apollo.BaseMutationOptions<UnlikePostMutationResult, UnlikePostMutationVariables>;
export const FoldersDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Folders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"folders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFolderInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileFolder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileCount"}}]}}]} as unknown as DocumentNode;

/**
 * __useFoldersQuery__
 *
 * To run a query within a React component, call `useFoldersQuery` and pass it any options that fit your needs.
 * When your component renders, `useFoldersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFoldersQuery({
 *   variables: {
 *   },
 * });
 */
export function useFoldersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<FoldersQueryResult, FoldersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<FoldersQueryResult, FoldersQueryVariables>(FoldersDocument, options);
      }
export function useFoldersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<FoldersQueryResult, FoldersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<FoldersQueryResult, FoldersQueryVariables>(FoldersDocument, options);
        }
export function useFoldersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<FoldersQueryResult, FoldersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<FoldersQueryResult, FoldersQueryVariables>(FoldersDocument, options);
        }
export type FoldersQueryHookResult = ReturnType<typeof useFoldersQuery>;
export type FoldersLazyQueryHookResult = ReturnType<typeof useFoldersLazyQuery>;
export type FoldersSuspenseQueryHookResult = ReturnType<typeof useFoldersSuspenseQuery>;
export type FoldersQueryResult = Apollo.QueryResult<FoldersQueryResult, FoldersQueryVariables>;
export const FilesDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Files"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkdownFileSummary"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkdownFileSummary"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkdownFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;

/**
 * __useFilesQuery__
 *
 * To run a query within a React component, call `useFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFilesQuery({
 *   variables: {
 *      folder: // value for 'folder'
 *   },
 * });
 */
export function useFilesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<FilesQueryResult, FilesQueryVariables> & ({ variables: FilesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<FilesQueryResult, FilesQueryVariables>(FilesDocument, options);
      }
export function useFilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<FilesQueryResult, FilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<FilesQueryResult, FilesQueryVariables>(FilesDocument, options);
        }
export function useFilesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<FilesQueryResult, FilesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<FilesQueryResult, FilesQueryVariables>(FilesDocument, options);
        }
export type FilesQueryHookResult = ReturnType<typeof useFilesQuery>;
export type FilesLazyQueryHookResult = ReturnType<typeof useFilesLazyQuery>;
export type FilesSuspenseQueryHookResult = ReturnType<typeof useFilesSuspenseQuery>;
export type FilesQueryResult = Apollo.QueryResult<FilesQueryResult, FilesQueryVariables>;
export const FileContentDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FileContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fileContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkdownFileInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkdownFileInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkdownFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;

/**
 * __useFileContentQuery__
 *
 * To run a query within a React component, call `useFileContentQuery` and pass it any options that fit your needs.
 * When your component renders, `useFileContentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFileContentQuery({
 *   variables: {
 *      folder: // value for 'folder'
 *      fileName: // value for 'fileName'
 *   },
 * });
 */
export function useFileContentQuery(baseOptions: ApolloReactHooks.QueryHookOptions<FileContentQueryResult, FileContentQueryVariables> & ({ variables: FileContentQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<FileContentQueryResult, FileContentQueryVariables>(FileContentDocument, options);
      }
export function useFileContentLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<FileContentQueryResult, FileContentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<FileContentQueryResult, FileContentQueryVariables>(FileContentDocument, options);
        }
export function useFileContentSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<FileContentQueryResult, FileContentQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<FileContentQueryResult, FileContentQueryVariables>(FileContentDocument, options);
        }
export type FileContentQueryHookResult = ReturnType<typeof useFileContentQuery>;
export type FileContentLazyQueryHookResult = ReturnType<typeof useFileContentLazyQuery>;
export type FileContentSuspenseQueryHookResult = ReturnType<typeof useFileContentSuspenseQuery>;
export type FileContentQueryResult = Apollo.QueryResult<FileContentQueryResult, FileContentQueryVariables>;
export const CreateFolderDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFolderInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FileFolderInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FileFolderInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FileFolder"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileCount"}}]}}]} as unknown as DocumentNode;
export type CreateFolderMutationFn = Apollo.MutationFunction<CreateFolderMutationResult, CreateFolderMutationVariables>;

/**
 * __useCreateFolderMutation__
 *
 * To run a mutation, you first call `useCreateFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createFolderMutation, { data, loading, error }] = useCreateFolderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateFolderMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateFolderMutationResult, CreateFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateFolderMutationResult, CreateFolderMutationVariables>(CreateFolderDocument, options);
      }
export type CreateFolderMutationHookResult = ReturnType<typeof useCreateFolderMutation>;
export type CreateFolderMutationResult = Apollo.MutationResult<CreateFolderMutationResult>;
export type CreateFolderMutationOptions = Apollo.BaseMutationOptions<CreateFolderMutationResult, CreateFolderMutationVariables>;
export const UploadMarkdownFileDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadMarkdownFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UploadMarkdownFileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadMarkdownFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"filePath"}},{"kind":"Field","name":{"kind":"Name","value":"fileName"}}]}}]}}]} as unknown as DocumentNode;
export type UploadMarkdownFileMutationFn = Apollo.MutationFunction<UploadMarkdownFileMutationResult, UploadMarkdownFileMutationVariables>;

/**
 * __useUploadMarkdownFileMutation__
 *
 * To run a mutation, you first call `useUploadMarkdownFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadMarkdownFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadMarkdownFileMutation, { data, loading, error }] = useUploadMarkdownFileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUploadMarkdownFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UploadMarkdownFileMutationResult, UploadMarkdownFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UploadMarkdownFileMutationResult, UploadMarkdownFileMutationVariables>(UploadMarkdownFileDocument, options);
      }
export type UploadMarkdownFileMutationHookResult = ReturnType<typeof useUploadMarkdownFileMutation>;
export type UploadMarkdownFileMutationResult = Apollo.MutationResult<UploadMarkdownFileMutationResult>;
export type UploadMarkdownFileMutationOptions = Apollo.BaseMutationOptions<UploadMarkdownFileMutationResult, UploadMarkdownFileMutationVariables>;
export const UpdateFileDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkdownFileInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkdownFileInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkdownFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"folder"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export type UpdateFileMutationFn = Apollo.MutationFunction<UpdateFileMutationResult, UpdateFileMutationVariables>;

/**
 * __useUpdateFileMutation__
 *
 * To run a mutation, you first call `useUpdateFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateFileMutation, { data, loading, error }] = useUpdateFileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateFileMutationResult, UpdateFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateFileMutationResult, UpdateFileMutationVariables>(UpdateFileDocument, options);
      }
export type UpdateFileMutationHookResult = ReturnType<typeof useUpdateFileMutation>;
export type UpdateFileMutationResult = Apollo.MutationResult<UpdateFileMutationResult>;
export type UpdateFileMutationOptions = Apollo.BaseMutationOptions<UpdateFileMutationResult, UpdateFileMutationVariables>;
export const DeleteFileDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"folder"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"folder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"folder"}}},{"kind":"Argument","name":{"kind":"Name","value":"fileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type DeleteFileMutationFn = Apollo.MutationFunction<DeleteFileMutationResult, DeleteFileMutationVariables>;

/**
 * __useDeleteFileMutation__
 *
 * To run a mutation, you first call `useDeleteFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFileMutation, { data, loading, error }] = useDeleteFileMutation({
 *   variables: {
 *      folder: // value for 'folder'
 *      fileName: // value for 'fileName'
 *   },
 * });
 */
export function useDeleteFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteFileMutationResult, DeleteFileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteFileMutationResult, DeleteFileMutationVariables>(DeleteFileDocument, options);
      }
export type DeleteFileMutationHookResult = ReturnType<typeof useDeleteFileMutation>;
export type DeleteFileMutationResult = Apollo.MutationResult<DeleteFileMutationResult>;
export type DeleteFileMutationOptions = Apollo.BaseMutationOptions<DeleteFileMutationResult, DeleteFileMutationVariables>;
export const DeleteFolderDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteFolder"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteFolder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeneralResponseInfo"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeneralResponseInfo"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeneralResponse"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]} as unknown as DocumentNode;
export type DeleteFolderMutationFn = Apollo.MutationFunction<DeleteFolderMutationResult, DeleteFolderMutationVariables>;

/**
 * __useDeleteFolderMutation__
 *
 * To run a mutation, you first call `useDeleteFolderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteFolderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteFolderMutation, { data, loading, error }] = useDeleteFolderMutation({
 *   variables: {
 *      name: // value for 'name'
 *   },
 * });
 */
export function useDeleteFolderMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteFolderMutationResult, DeleteFolderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteFolderMutationResult, DeleteFolderMutationVariables>(DeleteFolderDocument, options);
      }
export type DeleteFolderMutationHookResult = ReturnType<typeof useDeleteFolderMutation>;
export type DeleteFolderMutationResult = Apollo.MutationResult<DeleteFolderMutationResult>;
export type DeleteFolderMutationOptions = Apollo.BaseMutationOptions<DeleteFolderMutationResult, DeleteFolderMutationVariables>;
export const UploadImageDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UploadImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"file"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Upload"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploadImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"file"},"value":{"kind":"Variable","name":{"kind":"Name","value":"file"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"deleteUrl"}},{"kind":"Field","name":{"kind":"Name","value":"filename"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}}]} as unknown as DocumentNode;
export type UploadImageMutationFn = Apollo.MutationFunction<UploadImageMutationResult, UploadImageMutationVariables>;

/**
 * __useUploadImageMutation__
 *
 * To run a mutation, you first call `useUploadImageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUploadImageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [uploadImageMutation, { data, loading, error }] = useUploadImageMutation({
 *   variables: {
 *      file: // value for 'file'
 *   },
 * });
 */
export function useUploadImageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UploadImageMutationResult, UploadImageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UploadImageMutationResult, UploadImageMutationVariables>(UploadImageDocument, options);
      }
export type UploadImageMutationHookResult = ReturnType<typeof useUploadImageMutation>;
export type UploadImageMutationResult = Apollo.MutationResult<UploadImageMutationResult>;
export type UploadImageMutationOptions = Apollo.BaseMutationOptions<UploadImageMutationResult, UploadImageMutationVariables>;
export const SearchSuggestionsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchSuggestions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"query"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSearchSuggestions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"Variable","name":{"kind":"Name","value":"query"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}]}]}}]} as unknown as DocumentNode;

/**
 * __useSearchSuggestionsQuery__
 *
 * To run a query within a React component, call `useSearchSuggestionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchSuggestionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchSuggestionsQuery({
 *   variables: {
 *      query: // value for 'query'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchSuggestionsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables> & ({ variables: SearchSuggestionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>(SearchSuggestionsDocument, options);
      }
export function useSearchSuggestionsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>(SearchSuggestionsDocument, options);
        }
export function useSearchSuggestionsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>(SearchSuggestionsDocument, options);
        }
export type SearchSuggestionsQueryHookResult = ReturnType<typeof useSearchSuggestionsQuery>;
export type SearchSuggestionsLazyQueryHookResult = ReturnType<typeof useSearchSuggestionsLazyQuery>;
export type SearchSuggestionsSuspenseQueryHookResult = ReturnType<typeof useSearchSuggestionsSuspenseQuery>;
export type SearchSuggestionsQueryResult = Apollo.QueryResult<SearchSuggestionsQueryResult, SearchSuggestionsQueryVariables>;
export const TrendingSearchesDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TrendingSearches"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTrendingSearches"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}]}]}}]} as unknown as DocumentNode;

/**
 * __useTrendingSearchesQuery__
 *
 * To run a query within a React component, call `useTrendingSearchesQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrendingSearchesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrendingSearchesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useTrendingSearchesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>(TrendingSearchesDocument, options);
      }
export function useTrendingSearchesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>(TrendingSearchesDocument, options);
        }
export function useTrendingSearchesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>(TrendingSearchesDocument, options);
        }
export type TrendingSearchesQueryHookResult = ReturnType<typeof useTrendingSearchesQuery>;
export type TrendingSearchesLazyQueryHookResult = ReturnType<typeof useTrendingSearchesLazyQuery>;
export type TrendingSearchesSuspenseQueryHookResult = ReturnType<typeof useTrendingSearchesSuspenseQuery>;
export type TrendingSearchesQueryResult = Apollo.QueryResult<TrendingSearchesQueryResult, TrendingSearchesQueryVariables>;
export const SearchStatsDocument = /*#__PURE__*/ {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSearchStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalSearches"}},{"kind":"Field","name":{"kind":"Name","value":"popularQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"query"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"lastSearched"}}]}},{"kind":"Field","name":{"kind":"Name","value":"searchTrends"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"searchCount"}},{"kind":"Field","name":{"kind":"Name","value":"topQueries"}}]}}]}}]}}]} as unknown as DocumentNode;

/**
 * __useSearchStatsQuery__
 *
 * To run a query within a React component, call `useSearchStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSearchStatsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SearchStatsQueryResult, SearchStatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchStatsQueryResult, SearchStatsQueryVariables>(SearchStatsDocument, options);
      }
export function useSearchStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchStatsQueryResult, SearchStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchStatsQueryResult, SearchStatsQueryVariables>(SearchStatsDocument, options);
        }
export function useSearchStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchStatsQueryResult, SearchStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchStatsQueryResult, SearchStatsQueryVariables>(SearchStatsDocument, options);
        }
export type SearchStatsQueryHookResult = ReturnType<typeof useSearchStatsQuery>;
export type SearchStatsLazyQueryHookResult = ReturnType<typeof useSearchStatsLazyQuery>;
export type SearchStatsSuspenseQueryHookResult = ReturnType<typeof useSearchStatsSuspenseQuery>;
export type SearchStatsQueryResult = Apollo.QueryResult<SearchStatsQueryResult, SearchStatsQueryVariables>;