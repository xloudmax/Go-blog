// 测试 Apollo Client 导入
import { gql, useMutation, useQuery } from '@apollo/client';
import { useLazyQuery } from '@apollo/client';

console.log('Apollo Client imports successful');
console.log('gql:', typeof gql);
console.log('useMutation:', typeof useMutation);
console.log('useQuery:', typeof useQuery);
console.log('useLazyQuery:', typeof useLazyQuery);
