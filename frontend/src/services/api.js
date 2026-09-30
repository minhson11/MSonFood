/**
 * Re-export axiosClient để backward compatible với toàn bộ service files hiện có.
 * Mọi service file import `api` từ file này vẫn hoạt động bình thường.
 * Source of truth: src/api/axiosClient.js
 */
export { default } from '../api/axiosClient';
