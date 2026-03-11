// src/utils/config.ts
import { isIOS, isTauri } from './platform';

/**
 * 获取 API 基础 URL
 * 在 iOS (Tauri) 下特殊配置 Tailscale 转发地址
 * 在 桌面端 (Tauri) 下使用 localhost
 */
export const getApiBaseUrl = (): string => {
  if (isTauri) {
    if (isIOS) {
      return 'http://100.64.250.28:11451';
    } else {
      // Desktop Tauri
      return 'http://localhost:11451';
    }
  }

  // 默认使用环境变量或固定 IP
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:11451";
};
