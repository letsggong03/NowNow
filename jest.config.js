module.exports = {
  preset: '@react-native/jest-preset',
  // backend/는 Node 내장 테스트(node --test)로 따로 돌린다.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backend/'],
};
