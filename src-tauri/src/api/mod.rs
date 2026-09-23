pub mod achievement;
pub mod adventure;
pub mod ambient;
pub mod asr;
pub mod asset;
pub mod background;
pub mod character;
pub mod chat;
pub mod codex;
pub mod font;
pub mod game;
pub mod live2d;
pub mod locale;
pub mod music;
pub mod pet;
pub mod plugins;
pub mod save;
pub mod scene;
pub mod schedule;
pub mod screenshot;
pub mod script;
pub mod script_editor;
pub mod settings;
pub mod tool_settings;
pub mod workshop;

use std::path::PathBuf;

use crate::AppState;
use tauri::Manager;

// ========== 共享辅助函数 ==========

/// 资源来源字段默认值（游戏自有）。
pub(crate) fn default_source() -> String {
    "game".to_string()
}

/// 文件修改时间戳（秒，含小数），读取失败返回 "0"。
pub(crate) fn mtime_secs(path: &std::path::Path) -> String {
    path.metadata()
        .ok()
        .and_then(|m| m.modified().ok())
        .map(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs_f64().to_string())
                .unwrap_or_else(|_| "0".to_string())
        })
        .unwrap_or_else(|| "0".to_string())
}

// ========== 共享路径辅助函数 ==========

pub(crate) fn data_dir() -> PathBuf {
    crate::init::static_copy::get_data_dir().clone()
}

pub(crate) fn game_data_dir() -> PathBuf {
    data_dir().join("game_data")
}

pub(crate) fn characters_dir() -> PathBuf {
    game_data_dir().join("characters")
}

/// 插件角色的 `resource_folder` 编码前缀：`plugin:<plugin_id>/<folder>`。
pub const PLUGIN_ROLE_PREFIX: &str = "plugin:";

/// 瞌睡米塔增强版内置资源的稳定目录名。
///
/// 早期角色包使用过多个压缩包文件名，导入器会据此生成不同的
/// `resource_folder`。旧存档因此可能仍指向已经不存在的目录。增强版把素材固定
/// 内置到这个目录，并在旧目录失效时兼容回退。
pub const SLEEPY_MITA_RESOURCE_FOLDER: &str = "瞌睡米塔LingChat角色包";

/// 识别增强版角色包曾经使用过的中英文目录名。
pub(crate) fn is_sleepy_mita_resource_folder(resource_folder: &str) -> bool {
    let normalized: String = resource_folder
        .to_lowercase()
        .chars()
        .filter(|character| !matches!(character, '-' | '_' | ' '))
        .collect();
    resource_folder.contains("瞌睡米塔") || normalized.contains("sleepymita")
}

/// 编码插件角色的 resource_folder 值。
pub fn encode_plugin_folder(plugin_id: &str, folder: &str) -> String {
    format!("{PLUGIN_ROLE_PREFIX}{plugin_id}/{folder}")
}

/// 解析插件角色编码值为 (plugin_id, folder)。非插件编码返回 None。
pub fn decode_plugin_folder(resource_folder: &str) -> Option<(&str, &str)> {
    let rest = resource_folder.strip_prefix(PLUGIN_ROLE_PREFIX)?;
    let (plugin_id, folder) = rest.split_once('/')?;
    if plugin_id.is_empty() || folder.is_empty() {
        return None;
    }
    Some((plugin_id, folder))
}

/// 把角色的 resource_folder 解析为实际目录（游戏 characters 或插件 characters）。
///
/// 这是所有「硬编码 characters_dir().join(resource_folder)」的统一替换点：
/// `plugin:<id>/<folder>` → `data/plugins/<id>/characters/<folder>`；
/// 其余 → `game_data/characters/<folder>`（原行为）。
pub fn resolve_character_dir(resource_folder: &str) -> PathBuf {
    resolve_character_dir_in(&data_dir(), resource_folder)
}

/// `resolve_character_dir` 的显式 base 版本（供已持有 data_dir 的调用方使用，如 role_repo）。
/// 复用底层 `utils::path::resolve_character_path`（其内部已处理 `plugin:` 编码前缀）。
pub fn resolve_character_dir_in(base_data_dir: &std::path::Path, resource_folder: &str) -> PathBuf {
    let exact = crate::utils::path::resolve_character_path(base_data_dir, resource_folder);

    // 角色包导入目录由 zip 文件名派生。此前发放过不同文件名的米塔角色包，
    // 已有存档会保留旧 resource_folder；升级安装后该目录可能不存在，最终表现为
    // “名字和台词正常、整个人物透明”。只在精确目录缺少基础立绘时启用此兼容层，
    // 已正确导入或用户自行修改过的角色目录仍然优先。
    if is_sleepy_mita_resource_folder(resource_folder)
        && resource_folder != SLEEPY_MITA_RESOURCE_FOLDER
    {
        let exact_has_avatar = ["png", "webp", "jpg", "jpeg", "gif", "bmp"]
            .iter()
            .any(|ext| exact.join("avatar").join(format!("正常.{ext}")).is_file());
        if !exact_has_avatar {
            let bundled = crate::utils::path::resolve_character_path(
                base_data_dir,
                SLEEPY_MITA_RESOURCE_FOLDER,
            );
            if bundled.join("settings.yml").is_file() {
                tracing::warn!(
                    "角色目录 {:?} 缺少基础立绘，回退到内置瞌睡米塔资源 {:?}",
                    exact,
                    bundled
                );
                return bundled;
            }
        }
    }

    exact
}

pub(crate) fn backgrounds_dir() -> PathBuf {
    game_data_dir().join("backgrounds")
}

pub(crate) fn music_dir() -> PathBuf {
    game_data_dir().join("musics")
}

pub(crate) fn ambient_dir() -> PathBuf {
    game_data_dir().join("ambients")
}

pub(crate) fn voice_dir() -> PathBuf {
    data_dir().join("voice")
}

pub(crate) fn fonts_dir() -> PathBuf {
    data_dir().join("fonts")
}

// ========== 主动对话系统指令 ==========

/// 前端通知后端当前是否具备主动对话投放条件。
/// 仅在最终布尔值翻转时调用。
#[tauri::command]
pub async fn proactive_set_can_deliver(
    app: tauri::AppHandle,
    can_deliver: bool,
) -> Result<(), String> {
    let state = app.state::<AppState>();
    if let Some(ref ps) = state.proactive_system {
        ps.lock().await.set_can_deliver(can_deliver);
    }
    Ok(())
}
pub mod role_archive;
