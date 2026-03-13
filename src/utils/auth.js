/**
 * 认证工具函数
 * 账号: niumashuai
 * 密码: 123456
 * token: 时间戳
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * 登录验证
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {{ success: boolean, token?: string, message?: string }}
 */
export const login = (username, password) => {
  if (username === 'niumashuai' && password === '123456') {
    const token = Date.now().toString();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ username }));
    return { success: true, token };
  }
  return { success: false, message: '用户名或密码错误' };
};

/**
 * 退出登录
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * 获取 token
 * @returns {string | null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取用户信息
 * @returns {{ username: string } | null}
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getToken();
};
