use tauri::command;
use serde::Serialize;
use std::path::Path;

#[command]
pub fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|err| err.to_string())
}

#[command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    std::fs::write(&path, content).map_err(|err| err.to_string())
}

#[command]
pub fn read_dir(path: String) -> Result<Vec<String>, String> {
    let mut files = Vec::new();

    for entry in std::fs::read_dir(&path).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        if entry.file_type().map_err(|err| err.to_string())?.is_file() {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }

    Ok(files)
}

#[derive(Serialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileNode>>,
}

fn build_tree(path: &Path) -> Result<FileNode, String> {
    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    let name = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());

    if metadata.is_file() {
        return Ok(FileNode {
            name,
            path: path.to_string_lossy().to_string(),
            is_directory: false,
            children: None,
        });
    }

    let mut children = Vec::new();
    let entries = std::fs::read_dir(path).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let child_path = entry.path();
        // skip hidden/system entries? keep all for now
        if let Ok(node) = build_tree(&child_path) {
            children.push(node);
        }
    }

    Ok(FileNode {
        name,
        path: path.to_string_lossy().to_string(),
        is_directory: true,
        children: Some(children),
    })
}

#[command]
pub fn read_dir_tree(path: String) -> Result<FileNode, String> {
    let p = Path::new(&path);
    build_tree(p)
}

#[command]
pub fn run_shell_command(command: String) -> Result<String, String> {
    let output = if cfg!(windows) {
        std::process::Command::new("cmd")
            .args(["/C", &command])
            .output()
            .map_err(|err| err.to_string())?
    } else {
        std::process::Command::new("sh")
            .arg("-c")
            .arg(&command)
            .output()
            .map_err(|err| err.to_string())?
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let mut result = String::new();

    if !stdout.is_empty() {
        result.push_str(&stdout);
    }
    if !stderr.is_empty() {
        if !result.is_empty() {
            result.push('\n');
        }
        result.push_str(&stderr);
    }

    Ok(result)
}
