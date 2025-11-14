use crate::error::{AppError, Result as AppResult};
use log::{error, info};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// Response structure for update check
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateInfo {
    pub version: String,
    pub windows: Option<String>,
    pub linux: Option<String>,
    pub macos: Option<String>,
}

/// Checks if the application is running inside a Flatpak environment.
pub fn is_flatpak() -> bool {
    let is_flatpak = std::env::var("FLATPAK_ID").is_ok();
    if is_flatpak {
        info!("Flatpak environment detected");
    }
    is_flatpak
}

/// Gets the appropriate download URL for the current platform
fn get_download_url_for_platform(update_info: &UpdateInfo) -> AppResult<String> {
    if cfg!(target_os = "windows") {
        update_info
            .windows
            .clone()
            .ok_or_else(|| AppError::Other("No Windows download URL available".to_string()))
    } else if cfg!(target_os = "linux") {
        update_info
            .linux
            .clone()
            .ok_or_else(|| AppError::Other("No Linux download URL available".to_string()))
    } else if cfg!(target_os = "macos") {
        update_info
            .macos
            .clone()
            .ok_or_else(|| AppError::Other("No macOS download URL available".to_string()))
    } else {
        Err(AppError::Other("Unsupported operating system".to_string()))
    }
}

/// Fetches the latest release information from the GEG Launcher releases JSON API
pub async fn check_update_available(_app_handle: &AppHandle) -> AppResult<Option<UpdateInfo>> {
    let url = "https://api.grueneeule.de/v1/geg/launcher/releases/releases.json";

    info!("[GEG Updater] Checking for updates from {}", url);

    let client = reqwest::Client::new();
    let response = client.get(url).send().await.map_err(|e| {
        error!("[GEG Updater] Failed to fetch releases: {}", e);
        AppError::RequestError(format!("Failed to fetch update information: {}", e))
    })?;

    if !response.status().is_success() {
        error!("[GEG Updater] HTTP error: {}", response.status());
        return Err(AppError::RequestError(format!(
            "HTTP error: {}",
            response.status()
        )));
    }

    let update_info: UpdateInfo = response.json().await.map_err(|e| {
        error!("[GEG Updater] Failed to parse JSON: {}", e);
        AppError::ParseError(format!("Failed to parse update information: {}", e))
    })?;

    let app_version = env!("CARGO_PKG_VERSION");

    if update_info.version != app_version {
        info!(
            "[GEG Updater] Update available: {} (current: {})",
            update_info.version, app_version
        );
        Ok(Some(update_info))
    } else {
        info!("[GEG Updater] Application is up to date");
        Ok(None)
    }
}

/// Downloads the appropriate installer/binary for the current platform
/// Opens the download folder
pub async fn download_and_install_update(update_info: &UpdateInfo) -> AppResult<()> {
    let download_url = get_download_url_for_platform(update_info)?;

    info!("[GEG Updater] Starting download from: {}", download_url);

    let client = reqwest::Client::new();
    let response = client.get(&download_url).send().await.map_err(|e| {
        error!("[GEG Updater] Download failed: {}", e);
        AppError::RequestError(format!("Download failed: {}", e))
    })?;

    // Get the Downloads folder
    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| AppError::Other("Could not determine downloads folder".to_string()))?;

    // Extract filename from URL or use default
    let filename = download_url
        .split('/')
        .last()
        .unwrap_or("GEG-Launcher-Update");

    let file_path = downloads_dir.join(filename);

    // Download the file
    let bytes = response.bytes().await.map_err(|e| {
        error!("[GEG Updater] Failed to read response body: {}", e);
        AppError::RequestError(format!("Failed to read download: {}", e))
    })?;

    // Write to file
    tokio::fs::write(&file_path, bytes).await.map_err(|e| {
        error!("[GEG Updater] Failed to write file: {}", e);
        AppError::Io(e)
    })?;

    info!("[GEG Updater] Download completed: {}", file_path.display());

    // Open the downloads folder
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer")
            .arg(&downloads_dir)
            .spawn();
    }

    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(&downloads_dir)
            .spawn();
    }

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg(&downloads_dir)
            .spawn();
    }

    Ok(())
}
