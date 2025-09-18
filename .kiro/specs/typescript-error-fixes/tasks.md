# Implementation Plan

- [x] 1. Fix duplicate imports in test files

  - Remove duplicate vitest import statements in all test files
  - Consolidate describe, it, expect imports into single import per file
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Clean up unused variables and imports across codebase
- [x] 2.1 Remove unused React imports in non-JSX files

  - Remove React import from ArticleGroup.test.tsx and SearchAndFilter.test.tsx
  - Remove unused React imports in other files where JSX is not used
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 2.2 Remove unused component and icon imports

  - Clean up unused Button, List, FileAddOutlined, and other icon imports
  - Remove unused Ant Design component imports across all files
  - _Requirements: 2.1, 2.2_

- [x] 2.3 Remove unused variable declarations

  - Remove unused useState, useCallback, and other hook declarations
  - Clean up unused function parameters and local variables
  - _Requirements: 2.1, 2.3_

- [x] 2.4 Remove unused type imports

  - Clean up unused GraphQL type imports in hooks and components
  - Remove unused interface imports that are not referenced
  - _Requirements: 2.1, 2.2_

- [x] 3. Align GraphQL generated types with custom type definitions
- [x] 3.1 Fix AccessLevel enum usage in test mocks

  - Update test mock objects to use AccessLevel enum values instead of strings
  - Ensure all BlogPost mocks have proper accessLevel enum values
  - _Requirements: 3.1, 3.3_

- [x] 3.2 Complete BlogPost mock objects in tests

  - Add missing required fields (tags, categories, stats, etc.) to all BlogPost mocks
  - Ensure all mock objects satisfy the complete BlogPost interface
  - _Requirements: 3.1, 3.2, 4.1, 6.2_

- [x] 3.3 Fix BlogPostComment type compatibility in hooks

  - Update useComment hook to handle optional GraphQL responses properly
  - Align comment return types with actual GraphQL response structure
  - _Requirements: 3.2, 5.1, 5.2_

- [x] 4. Fix component prop type issues
- [x] 4.1 Remove invalid Tag component size props

  - Remove size="small" props from Tag components in PostManagement.tsx
  - Use valid Tag component props according to Ant Design API
  - _Requirements: 4.2, 4.3_

- [x] 4.2 Fix Select component placeholder prop

  - Remove or properly type placeholder prop in SearchAndFilter test mock
  - Ensure Select component props match Ant Design interface
  - _Requirements: 4.2, 4.3_

- [x] 4.3 Fix ArticleCard BlogPost prop requirements

  - Ensure ArticleCard receives complete BlogPost objects with all required fields
  - Update component prop validation to handle proper BlogPost structure
  - _Requirements: 4.1, 4.3_

- [x] 5. Fix hook return type mismatches
- [x] 5.1 Update useComment hook return types

  - Handle optional GraphQL responses in comment hooks
  - Ensure return types match actual API response structure
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5.2 Fix comment action function return types

  - Update createComment, updateComment, deleteComment return types
  - Handle undefined responses from GraphQL mutations appropriately
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 5.3 Fix comment hook error handling types

  - Ensure proper error type handling in comment operations
  - Update loading state types to match actual usage patterns
  - _Requirements: 5.1, 5.2_

- [x] 6. Fix test mock function typing
- [x] 6.1 Fix Modal.confirm mock typing in MarkdownEditor tests

  - Properly type modal.mock.calls access for vitest mocks
  - Ensure mock function properties are correctly typed
  - _Requirements: 6.1, 6.2_

- [x] 6.2 Complete test data object interfaces

  - Ensure all test mock objects include required properties
  - Fix missing tags property in ArticleGroup test mocks
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. Fix React component type issues
- [x] 7.1 Fix ReactNode type issues in SearchPage

  - Properly type conditional rendering expressions that return ReactNode
  - Ensure post.coverImageUrl, post.excerpt, and stats render as ReactNode
  - _Requirements: 7.1, 7.2_

- [x] 7.2 Fix component prop interface compatibility

  - Ensure all component props match their expected interfaces
  - Validate that passed props are compatible with component definitions
  - _Requirements: 7.1, 7.3_

- [x] 8. Validate and test all fixes
- [x] 8.1 Run TypeScript compiler to verify all errors are resolved

  - Execute pnpm type-check to confirm zero TypeScript errors
  - Ensure no new errors were introduced during fixes
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 8.2 Run test suite to ensure functionality is preserved
  - Execute pnpm test to verify all tests still pass
  - Ensure mock objects work correctly with updated types
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Fix remaining TypeScript errors
- [x] 9.1 Remove unused parameters in test mocks
  - Remove unused 'size' parameter in Button mock in MarkdownEditor.test.tsx
  - Remove unused 'wrap' parameter in Space mock in MarkdownEditor.test.tsx
  - _Requirements: 2.1, 2.3_

- [x] 9.2 Fix window object type assertions
  - Properly type window object extensions in ArticleListContainer.tsx
  - Use proper interface extension instead of 'never' type assertion
  - _Requirements: 7.1, 7.2_

- [x] 9.3 Remove unused imports in LandingPage
  - Remove unused Title import from Typography in LandingPage.tsx
  - _Requirements: 2.1, 2.2_

- [x] 10. Final validation of all TypeScript fixes
  - Run TypeScript compiler to confirm zero errors
  - Verify all requirements have been satisfied
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_
