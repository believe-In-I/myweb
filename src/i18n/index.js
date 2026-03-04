import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入语言文件
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

// i18n 配置
i18n
  // 语言检测器
  .use(LanguageDetector)
  // react-i18next 初始化
  .use(initReactI18next)
  .init({
    // 默认语言
    fallbackLng: 'zh-CN',
    // 默认命名空间
    defaultNS: 'translation',
    // 命名空间列表
    ns: ['translation'],
    // 语言资源
    resources: {
      'zh-CN': {
        translation: zhCN,
      },
      'en-US': {
        translation: enUS,
      },
    },
    // 调试模式（生产环境设为 false）
    debug: false,
    // 插值配置
    interpolation: {
      // React 已经安全处理了 XSS
      escapeValue: false,
    },
    // 语言检测配置
    detection: {
      // 检测顺序
      order: ['localStorage', 'navigator'],
      // 缓存用户选择的语言
      caches: ['localStorage'],
    },
  });

export default i18n;
