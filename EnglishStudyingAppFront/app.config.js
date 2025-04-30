// 프로젝트 루트 → app.config.js
import 'dotenv/config';

const projectId = '11f13d81-4306-4d8b-8f95-dc6af2e7052d';

// Expo는 app.config.js 실행 시 기본 config 객체를 바로 받습니다.
export default ({ config }) => {
  // config는 app.json 내용 전체이므로, config.expo가 아닌 config 바로 사용
  return {
    expo: {
      owner: 'minseong99',
      slug: 'EnglishStudyingAppFront',
      name: 'EnglishStudyingAppFront',
      version: '1.0.0',
      orientation: 'portrait',

      ios: {
        ...(config.ios || {}),
        bundleIdentifier: 'com.minseong99.englishstudyingappfront',
        infoPlist: {
          ...(config.ios?.infoPlist || {}),
          ITSAppUsesNonExemptEncryption: false,
        },
      },

      android: {
        ...(config.android || {}),
        package: 'com.minseong99.englishstudyingappfront',
      },

      web: {
        ...(config.web || {}),
        favicon: './assets/favicon.png',
      },

      extra: {
        ...(config.extra || {}),
        apiBaseUrl: process.env.API_BASE_URL,
        eas: { projectId },
      },

      runtimeVersion: {
        policy: 'sdkVersion',
      },

      plugins: [
        [
          'expo-updates',
          { userInterfaceStyle: 'automatic' }
        ]
      ],

      updates: {
        url: `https://u.expo.dev/${projectId}`,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
      },
    },
  };
};

