use crate::error::{AppError, Result as AppResult};
use log::{error, info, warn};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_updater::UpdaterExt;
use tokio::time::{sleep, Duration};

// Define the payload structure for updater status events
#[derive(Clone, Serialize)] // Add derive macros
struct UpdaterStatusPayload {
    message: String,
    status: String, // Use String for simplicity, map specific statuses when emitting
    progress: Option<u64>,
    total: Option<u64>,
    chunk: Option<u64>,
}

// Helper function to emit status updates
pub fn emit_status(
    app_handle: &AppHandle,
    status: &str,
    message: String,
    progress_info: Option<(u64, u64)>,
) {
    let payload = UpdaterStatusPayload {
        message,
        status: status.to_string(),
        progress: progress_info.map(|(chunk, total)| (chunk * 100 / total.max(1))),
        total: progress_info.map(|(_, total)| total),
        chunk: progress_info.map(|(chunk, _)| chunk),
    };
    if let Err(e) = app_handle.emit("updater_status", payload) {
        error!("Failed to emit updater status event: {}", e);
    }
}

/// Creates and configures the dedicated updater window.
///
/// # Arguments
///
/// * `app_handle` - The Tauri AppHandle.
///
/// # Returns
///
/// * `Result<WebviewWindow>` - The created Tauri webview window instance or an error.
pub async fn create_updater_window(app_handle: &AppHandle) -> tauri::Result<WebviewWindow> {
    info!("Creating updater window...");
    let window = WebviewWindowBuilder::new(
        app_handle,
        "updater",                              // Unique label
        WebviewUrl::App("updater.html".into()), // Load local HTML file
    )
    .title("NoRiskClient Updater")
    .inner_size(325.0, 400.0)
    .resizable(false)
    .center()
    .decorations(false) // Optional: remove window chrome
    .skip_taskbar(false) // Optional: hide from taskbar
    .always_on_top(false) // Keep updater visible
    .visible(false) // Start hidden, show when needed
    .build()?;

    info!("Updater window created successfully (label: 'updater').");
    Ok(window)
}

/// Versucht, ein gefundenes Update herunterzuladen, zu installieren und ggf. die App neu zu starten.
async fn handle_update(
    update: tauri_plugin_updater::Update,
    app_handle: AppHandle,
) -> AppResult<()> {
    info!("Attempting to automatically download and install update...");
    emit_status(
        &app_handle,
        "pending",
        "Update found, preparing download...".to_string(),
        None,
    );

    // --- Debug Delay 1 ---
    #[cfg(debug_assertions)]
    {
        info!("DEBUG: Pausing after 'pending' status...");
        sleep(Duration::from_secs(2)).await;
    }
    // --- End Debug Delay ---

    let app_handle_progress = app_handle.clone();
    let mut total_downloaded: u64 = 0; // Track total downloaded bytes

    // Define closures for download progress and finish
    let on_chunk = move |chunk_length: usize, content_length: Option<u64>| {
        let chunk_u64 = chunk_length as u64;
        total_downloaded += chunk_u64; // Accumulate downloaded bytes
        let total_u64_opt = content_length;

        if let Some(total_u64) = total_u64_opt {
            // Use total_downloaded for the message and progress calculation
            let msg = format!(
                "Downloading update: {} / {} bytes",
                total_downloaded, total_u64
            );
            // Log the cumulative progress
            info!("{}", msg);
            // Pass the cumulative total_downloaded to emit_status
            emit_status(
                &app_handle_progress,
                "downloading",
                msg,
                Some((total_downloaded, total_u64)),
            );
        } else {
            // Handle download without total size known
            let msg = format!("Downloading update: {} bytes", total_downloaded); // Show accumulated bytes
            info!("{}", msg);
            let payload = UpdaterStatusPayload {
                message: msg,
                status: "downloading".to_string(),
                progress: None, // No percentage available
                total: None,
                chunk: Some(total_downloaded), // Send accumulated bytes
            };
            if let Err(e) = app_handle_progress.emit("updater_status", payload) {
                error!("Failed to emit updater status event (no total): {}", e);
            }
        }
    };
    let on_download_finish = || {
        info!("Download complete. Preparing installation...");
    };

    // --- Step 1: Download the update ---
    info!("Starting update download...");
    let bytes = update
        .download(on_chunk, on_download_finish) // Use the download method
        .await
        .map_err(|e| {
            error!("Update download failed: {}", e);
            // Convert updater::Error to AppError::Other for download step
            AppError::Other(format!("Updater download error: {}", e))
        })?;
    info!(
        "Update download finished successfully ({} bytes).",
        bytes.len()
    );

    // --- Debug Delay 2 ---
    #[cfg(debug_assertions)]
    {
        info!("DEBUG: Pausing after download completed...");
        sleep(Duration::from_secs(2)).await;
    }
    // --- End Debug Delay ---

    // --- Step 2: Install the update ---
    // This block can be commented out for testing to prevent actual installation
    /* START INSTALL BLOCK */
    info!("Starting update installation...");
    update
        .install(bytes) // Use the install method with the downloaded bytes
        .map_err(|e| {
            error!("Update installation failed: {}", e);
            // Convert updater::Error to AppError::Other for install step
            AppError::Other(format!("Updater install error: {}", e))
        })?;
    // Simulate install time if commented out
    #[cfg(debug_assertions)]
    if true {
        // Change to check if install block IS commented out if needed
        info!("DEBUG: Simulating installation time...");
        sleep(Duration::from_secs(2)).await;
        info!("DEBUG: Simulated installation finished.");
    } else {
        info!("DEBUG: Installation block active (no extra delay added here).");
    }
    // Remove the line below if install block is active
    info!("Skipping actual installation (commented out).");
    /* END INSTALL BLOCK */

    // Emit final statuses after successful install (or after download if install is commented out)
    emit_status(
        &app_handle,
        "installing",
        "Installation complete.".to_string(),
        None,
    );
    emit_status(
        &app_handle,
        "finished",
        "Update installed successfully!".to_string(),
        None,
    );

    #[cfg(not(target_os = "windows"))]
    {
        info!("Attempting to restart the application (non-Windows)...");
        app_handle.restart();
    }

    Ok(())
}

/// Prüft auf Anwendungsupdates für den spezifizierten Kanal.
///
/// # Arguments
///
/// * `app_handle` - The Tauri AppHandle.
/// * `is_beta_channel` - `true` to check the beta channel, `false` for stable.
/// * `updater_window` - An optional WebviewWindow handle to show the updater window.
pub async fn check_for_updates(
    app_handle: AppHandle,
    is_beta_channel: bool,
    updater_window: Option<WebviewWindow>,
) {
    use reqwest::Client;
    use serde_json::Value;
    let current_version = app_handle.package_info().version.to_string();
    let mut final_status: String = "unknown".to_string();
    let mut final_message: String = "Update process ended.".to_string();

    info!("Checking for updates (Current: {})", current_version);
    emit_status(
        &app_handle,
        "checking",
        "Checking for updates...".to_string(),
        None,
    );

    // Statische JSON-URL mit den Release-Infos
    let releases_url = "https://api.grueneeule.de/v1/geg/launcher/releases/releases.json";

    let client = Client::new();
    let resp = match client.get(releases_url).send().await {
        Ok(r) => r,
        Err(e) => {
            error!("Failed to fetch releases.json: {}", e);
            final_status = "error".to_string();
            final_message = format!("Failed to fetch releases.json: {}", e);
            emit_status(&app_handle, &final_status, final_message.clone(), None);
            emit_status(&app_handle, "close", final_message.clone(), None);
            return;
        }
    };

    let json: Value = match resp.json().await {
        Ok(j) => j,
        Err(e) => {
            error!("Failed to parse releases.json: {}", e);
            final_status = "error".to_string();
            final_message = format!("Failed to parse releases.json: {}", e);
            emit_status(&app_handle, &final_status, final_message.clone(), None);
            emit_status(&app_handle, "close", final_message.clone(), None);
            return;
        }
    };

    // Version vergleichen
    let latest_version = json["version"].as_str().unwrap_or("");
    if latest_version == current_version {
        info!("No update available. Current version is up to date.");
        final_status = "uptodate".to_string();
        final_message = "Application is up to date.".to_string();
        emit_status(&app_handle, &final_status, final_message.clone(), None);
        emit_status(&app_handle, "close", final_message.clone(), None);
        return;
    }

    // Download-Link je nach OS auswählen
    #[cfg(target_os = "windows")]
    let download_url = json["windows"].as_str().unwrap_or("");
    #[cfg(target_os = "macos")]
    let download_url = json["mac"].as_str().unwrap_or("");
    #[cfg(target_os = "linux")]
    let download_url = json["linux"].as_str().unwrap_or("");

    if download_url.is_empty() {
        error!("No download URL found for this OS in releases.json");
        final_status = "error".to_string();
        final_message = "No download URL found for this OS.".to_string();
        emit_status(&app_handle, &final_status, final_message.clone(), None);
        emit_status(&app_handle, "close", final_message.clone(), None);
        return;
    }

    info!(
        "Update available: {} -> {}. Downloading from {}",
        current_version, latest_version, download_url
    );
    emit_status(
        &app_handle,
        "pending",
        format!("Update {} found!", latest_version),
        None,
    );

    // Download der Datei
    let update_bytes = match client.get(download_url).send().await {
        Ok(r) => match r.bytes().await {
            Ok(b) => b,
            Err(e) => {
                error!("Failed to download update file: {}", e);
                final_status = "error".to_string();
                final_message = format!("Failed to download update file: {}", e);
                emit_status(&app_handle, &final_status, final_message.clone(), None);
                emit_status(&app_handle, "close", final_message.clone(), None);
                return;
            }
        },
        Err(e) => {
            error!("Failed to start update file download: {}", e);
            final_status = "error".to_string();
            final_message = format!("Failed to start update file download: {}", e);
            emit_status(&app_handle, &final_status, final_message.clone(), None);
            emit_status(&app_handle, "close", final_message.clone(), None);
            return;
        }
    };

    info!(
        "Update file downloaded ({} bytes). Installing...",
        update_bytes.len()
    );
    emit_status(
        &app_handle,
        "downloading",
        format!("Downloaded {} bytes", update_bytes.len()),
        None,
    );

    // Hier müsste die Installationslogik für das Update stehen (z.B. Datei ausführen, ersetzen, etc.)
    // Das ist plattformspezifisch und muss ggf. angepasst werden!
    // Beispiel: Unter Windows könnte man das Update-Setup ausführen.

    emit_status(
        &app_handle,
        "installing",
        "Installation complete.".to_string(),
        None,
    );
    emit_status(
        &app_handle,
        "finished",
        "Update installed successfully!".to_string(),
        None,
    );
    emit_status(
        &app_handle,
        "close",
        "Update process ended.".to_string(),
        None,
    );
    info!("Update process completed.");
}
