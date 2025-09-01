import { gql } from '@apollo/client';

// 获取当前用户信息查询
export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      role
      isVerified
      isActive
      avatar
      bio
      lastLoginAt
      emailVerifiedAt
      createdAt
      updatedAt
    }
  }
`;