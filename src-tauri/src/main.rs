// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod pty;


use std::fs::{self, File};
use std::path::Path;

#[tauri::command]
fn create_file(path: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }

    File::create(&path).map_err(|err| err.to_string()).map(|_| ())
}

#[tauri::command]
fn create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|err| err.to_string())
}

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let metadata = fs::metadata(&path).map_err(|err| err.to_string())?;
    if metadata.is_dir() {
        fs::remove_dir_all(&path).map_err(|err| err.to_string())
    } else {
        fs::remove_file(&path).map_err(|err| err.to_string())
    }
}

#[tauri::command]
fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|err| err.to_string())
}

#[tauri::command]
fn move_path(source_path: String, target_folder_path: String) -> Result<(), String> {
    let file_name = Path::new(&source_path)
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .ok_or_else(|| "Invalid source path".to_string())?;
    let destination = Path::new(&target_folder_path).join(file_name);
    fs::rename(&source_path, &destination).map_err(|err| err.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::files::read_dir,
            commands::files::read_file,
            commands::files::write_file,
            create_file,
            create_dir,
            delete_path,
            rename_path,
            move_path,
            commands::files::run_shell_command,
            commands::files::read_dir_tree,
            pty::spawn_pty,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            commands::ai_handler::write_ai_code,
            commands::ai_handler::execute_terminal_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
