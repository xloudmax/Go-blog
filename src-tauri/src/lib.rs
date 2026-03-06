// src-tauri/src/lib.rs
use tauri::Manager;
use tauri_plugin_shell::{ShellExt, process::CommandChild};
use tauri_plugin_global_shortcut::GlobalShortcutExt;
use std::sync::Mutex;
use keyring::Entry;

struct SidecarState {
    child: Mutex<Option<CommandChild>>,
}

// --- 钥匙串操作 ---

#[tauri::command]
fn store_token(token: String) -> Result<(), String> {
    let entry = Entry::new("cc.xloudmax.blog", "auth_token").map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_token() -> Result<Option<String>, String> {
    let entry = Entry::new("cc.xloudmax.blog", "auth_token").map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn delete_token() -> Result<(), String> {
    let entry = Entry::new("cc.xloudmax.blog", "auth_token").map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// --- 应用运行入口 ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![store_token, get_token, delete_token])
        .setup(|app| {
            // 1. 初始化系统托盘菜单
            let show_i = tauri::menu::MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "彻底退出", true, None::<&str>)?;
            let menu = tauri::menu::Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            // 彻底清理并退出
                            if let Some(state) = app.try_state::<SidecarState>() {
                                if let Ok(mut child_lock) = state.child.lock() {
                                    if let Some(child) = child_lock.take() {
                                        let _ = child.kill();
                                    }
                                }
                            }
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // 2. 注册全局快捷键 (Cmd + Shift + B)
            let shortcut = tauri_plugin_global_shortcut::Shortcut::new(Some(tauri_plugin_global_shortcut::Modifiers::SUPER | tauri_plugin_global_shortcut::Modifiers::SHIFT), tauri_plugin_global_shortcut::Code::KeyB);
            
            app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, _event| {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            })?;

            // 3. 启动 Go Sidecar (带环境保护)
            #[cfg(desktop)]
            {
                let sidecar_command = app.shell().sidecar("blog-backend").unwrap();
                match sidecar_command.spawn() {
                    Ok((_rx, child)) => {
                        app.manage(SidecarState {
                            child: Mutex::new(Some(child)),
                        });
                    }
                    Err(e) => {
                        eprintln!("CRITICAL: Failed to spawn sidecar: {}", e);
                    }
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
