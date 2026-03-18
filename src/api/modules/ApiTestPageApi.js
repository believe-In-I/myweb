import { get, post, del } from '@/utils/request';

// 健康检查
export const healthCheck = () => get(`/api/health`);

// OSS 相关接口
export const ossList = (prefix) => get(`/api/oss/list?prefix=${encodeURIComponent(prefix)}`);

export const ossDelete = (key) => del(`/api/oss/delete`, { key });

export const ossDeleteDir = (key) => del(`/api/oss/delete-dir`, { key });

export const ossDownloadUrl = (key) => get(`/api/oss/download-url?key=${encodeURIComponent(key)}`);

export const ossCreateDir = (dirName, parentPath) => post(`/api/oss/create-dir`, {
  dirName,
  parentPath
});

export const ossUpload = (formData) => post(`/api/oss/upload`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
