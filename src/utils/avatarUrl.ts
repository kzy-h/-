import { convertFileSrc, invoke } from "@tauri-apps/api/core";

// 少量缓存即可覆盖对话中频繁切换的表情，同时避免把全部高清立绘常驻内存。
const avatarUrlCache = new Map<string, Promise<string>>();
const MAX_AVATAR_CACHE_ENTRIES = 8;

/**
 * 将本地立绘路径转换成 WebView 可显示的 URL。
 *
 * Windows 上 asset 协议在安装目录、中文文件名或升级后的旧目录组合下偶尔会只
 * 留下空白。优先让后端读取为 data URL；若命令不可用，再回退到 Tauri asset URL。
 */
export function toAvatarUrl(path: string): Promise<string> {
  if (
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("asset:")
  ) {
    return Promise.resolve(path);
  }

  const cached = avatarUrlCache.get(path);
  if (cached) return cached;

  const pending = invoke<string>("get_asset_base64", { filePath: path }).catch((error) => {
    console.warn("立绘 data URL 读取失败，回退到 asset 协议", path, error);
    return convertFileSrc(path);
  });
  avatarUrlCache.set(path, pending);

  if (avatarUrlCache.size > MAX_AVATAR_CACHE_ENTRIES) {
    const oldest = avatarUrlCache.keys().next().value;
    if (oldest) avatarUrlCache.delete(oldest);
  }

  return pending;
}
