use crate::{
    config::HTTP_CLIENT,
    error::{AppError, Result},
};
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use serde_json;

pub struct WordPressApi;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OgImage {
    pub url: Option<String>,
    #[serde(rename = "type")]
    pub image_type: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct YoastHeadJson {
    pub title: Option<String>,
    pub description: Option<String>,
    pub og_description: Option<String>,
    pub og_url: Option<String>,
    pub og_image: Option<Vec<OgImage>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BlogPost {
    pub id: i64,
    pub date: Option<String>,
    pub yoast_head_json: Option<YoastHeadJson>,
}

impl WordPressApi {
    pub fn new() -> Self {
        Self
    }

    /// Retrieves the base URL for the GEG JSON API
    pub fn get_api_base() -> String {
        String::from("https://api.grueneeule.de/v1/geg/launcher/blog")
    }

    /// Fetch blog posts from GEG JSON API
    ///
    /// # Returns
    ///
    /// * `Result<Vec<BlogPost>>` - A vector of blog posts or an error
    pub async fn get_blog_posts() -> Result<Vec<BlogPost>> {
        let base_url = Self::get_api_base();
        let url = format!("{}/posts.json", base_url);

        info!("[GEG Blog API] Fetching blog posts");
        debug!("[GEG Blog API] Full URL: {}", url);

        debug!("[GEG Blog API] Sending GET request");
        let response = HTTP_CLIENT.get(url).send().await.map_err(|e| {
            error!("[GEG Blog API] Request failed: {}", e);
            AppError::RequestError(format!("Failed to send request to GEG Blog API: {}", e))
        })?;

        let status = response.status();
        debug!("[GEG Blog API] Response status: {}", status);

        if !status.is_success() {
            error!("[GEG Blog API] Error response: Status {}", status);
            return Err(AppError::RequestError(format!(
                "GEG Blog API returned error status: {}",
                status
            )));
        }

        // Read the response body as text first for debugging
        let response_text = response.text().await.map_err(|e| {
            error!("[GEG Blog API] Failed to read response body as text: {}", e);
            AppError::RequestError(format!("Failed to read GEG Blog API response body: {}", e))
        })?;

        debug!(
            "[GEG Blog API] Received response body ({} bytes). Attempting to parse as JSON...",
            response_text.len()
        );
        // Log the first 1000 characters for brevity in logs, or the full response if shorter
        let log_preview = if response_text.len() > 1000 {
            format!("{}... (truncated)", &response_text[..1000])
        } else {
            response_text.clone()
        };
        debug!("[GEG Blog API] Response preview: {}", log_preview);

        // Now attempt to parse the text into the target structure
        serde_json::from_str::<Vec<BlogPost>>(&response_text).map_err(|e| {
            error!(
                "[GEG Blog API] Failed to parse JSON response: {}. Raw response: {}",
                e,
                log_preview // Log the preview again on error
            );
            AppError::ParseError(format!(
                "Failed to parse GEG Blog API JSON response: {}. Response: {}",
                e,
                log_preview // Include preview in the AppError as well
            ))
        })
    }

    /// Fetches news and changelog posts from GEG JSON API
    ///
    /// # Returns
    ///
    /// * `Result<Vec<BlogPost>>` - A vector of blog posts or an error
    pub async fn get_news_and_changelogs() -> Result<Vec<BlogPost>> {
        info!("[GEG Blog API] Fetching news and changelog posts");
        Self::get_blog_posts().await
    }

    /// Fetches only news posts
    ///
    /// # Returns
    ///
    /// * `Result<Vec<BlogPost>>` - A vector of blog posts or an error
    pub async fn get_news() -> Result<Vec<BlogPost>> {
        info!("[GEG Blog API] Fetching news posts");
        Self::get_blog_posts().await
    }

    /// Fetches only changelog posts
    ///
    /// # Returns
    ///
    /// * `Result<Vec<BlogPost>>` - A vector of blog posts or an error
    pub async fn get_changelogs() -> Result<Vec<BlogPost>> {
        info!("[GEG Blog API] Fetching changelog posts");
        Self::get_blog_posts().await
    }
}
