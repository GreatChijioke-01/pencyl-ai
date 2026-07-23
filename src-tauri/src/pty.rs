use anyhow::Result;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::Serialize;
use tauri::Emitter;
use std::collections::HashMap;
use std::io::Read;
use std::sync::atomic::{AtomicU64, Ordering};
use std::thread;

#[derive(Clone, Serialize)]
struct PtyOutputEvent {
    id: u64,
    data: String,
}

struct PtyProcess {
    master: Box<dyn portable_pty::MasterPty + Send>,
    // Child is kept so the process lifetime is tied to this struct
    _child: Box<dyn portable_pty::Child + Send>,
    writer: Option<Box<dyn std::io::Write + Send>>,
}

static PTY_TABLE: Lazy<Mutex<HashMap<u64, PtyProcess>>> = Lazy::new(|| Mutex::new(HashMap::new()));
static NEXT_ID: AtomicU64 = AtomicU64::new(1);

#[tauri::command]
pub fn spawn_pty(app_handle: tauri::AppHandle, shell: Option<String>, cols: u16, rows: u16, cwd: Option<String>) -> Result<u64, String> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

    let mut command = match shell {
        Some(s) if !s.is_empty() => CommandBuilder::new(s),
        _ => {
            if cfg!(windows) {
                CommandBuilder::new("powershell.exe")
            } else {
                CommandBuilder::new("bash")
            }
        }
    };

    // Set working directory if provided
    if let Some(dir) = cwd {
        command.cwd(&dir);
    }

    let child = pair.slave.spawn_command(command).map_err(|e| e.to_string())?;

    // reader to stream stdout/stderr
    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let master = pair.master;

    let id = NEXT_ID.fetch_add(1, Ordering::SeqCst);

    // take a writer from the master (can't be taken more than once)
    let writer = master.take_writer().ok();

    // Insert into table before spawning thread so commands can write immediately
    {
        let mut table = PTY_TABLE.lock();
        table.insert(id, PtyProcess { master, _child: child, writer });
    }

    // Spawn thread to read output and emit events to frontend
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    // EOF
                    let _ = app_handle.emit("pty-output", PtyOutputEvent { id, data: "\u{0004}".to_string() });
                    break;
                }
                Ok(n) => {
                    if let Ok(s) = String::from_utf8(buf[..n].to_vec()) {
                        let _ = app_handle.emit("pty-output", PtyOutputEvent { id, data: s });
                    } else {
                        // binary data fallback: send bytes as latin1
                        let s: String = buf[..n].iter().map(|&b| b as char).collect();
                        let _ = app_handle.emit("pty-output", PtyOutputEvent { id, data: s });
                    }
                }
                Err(err) => {
                    let _ = app_handle.emit("pty-output", PtyOutputEvent { id, data: format!("\n[pty read error] {}\n", err) });
                    break;
                }
            }
        }

        // ensure process cleaned up
        PTY_TABLE.lock().remove(&id);
    });

    Ok(id)
}

#[tauri::command]
pub fn pty_write(id: u64, data: String) -> Result<(), String> {
    let mut table = PTY_TABLE.lock();
    if let Some(proc) = table.get_mut(&id) {
        if let Some(writer) = proc.writer.as_mut() {
            use std::io::Write as _;
            writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
            writer.flush().map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("pty writer unavailable".to_string())
        }
    } else {
        Err("pty id not found".to_string())
    }
}

#[tauri::command]
pub fn pty_resize(id: u64, cols: u16, rows: u16) -> Result<(), String> {
    let table = PTY_TABLE.lock();
    if let Some(proc) = table.get(&id) {
        proc.master.resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 }).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("pty id not found".to_string())
    }
}

#[tauri::command]
pub fn pty_kill(id: u64) -> Result<(), String> {
    let mut table = PTY_TABLE.lock();
    if table.remove(&id).is_some() {
        Ok(())
    } else {
        Err("pty id not found".to_string())
    }
}
