use log::{error, info};
use tauri::{AppHandle, WebviewWindow, WebviewWindowBuilder};

pub async fn create_updater_window(
    _app_handle: &AppHandle,
) -> Result<WebviewWindow, Box<dyn std::error::Error>> {
    info!("Updater is currently disabled");
    Err("Updater is disabled".into())
}

pub async fn check_for_updates(
    _app_handle: AppHandle,
    _check_beta_channel: bool,
    _updater_window: Option<WebviewWindow>,
) {
    info!("Update checking is currently disabled");
}

pub fn emit_status(
    _app_handle: &AppHandle,
    _status: &str,
    _message: String,
    _progress: Option<u64>,
) {
    // No-op when updater is disabled
}
