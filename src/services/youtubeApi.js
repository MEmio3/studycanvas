// src/services/youtubeApi.js

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function fetchPlaylist(playlistId, apiKey) {
  if (!apiKey) throw new Error('API key is required');
  
  try {
    // 1. Fetch playlist metadata
    const playlistRes = await fetch(`${API_BASE}/playlists?part=snippet&id=${playlistId}&key=${apiKey}`);
    const playlistData = await playlistRes.json();
    
    if (playlistData.error) {
      if (playlistData.error.code === 403) throw new Error('API quota exceeded or invalid key');
      throw new Error(playlistData.error.message);
    }
    
    if (!playlistData.items || playlistData.items.length === 0) {
      throw new Error('Playlist not found');
    }
    
    const playlistInfo = playlistData.items[0].snippet;
    const title = playlistInfo.title;
    const channelTitle = playlistInfo.channelTitle;

    // 2. Fetch playlist items (videos)
    let videos = [];
    let pageToken = '';
    
    do {
      const itemsRes = await fetch(`${API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`);
      const itemsData = await itemsRes.json();
      
      if (itemsData.error) throw new Error(itemsData.error.message);
      
      for (const item of itemsData.items) {
        // Skip private/deleted videos that don't have snippets
        if (!item.snippet.thumbnails || Object.keys(item.snippet.thumbnails).length === 0) continue;

        videos.push({
          videoId: item.contentDetails.videoId,
          position: item.snippet.position,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.mqdefault?.url || item.snippet.thumbnails.default?.url,
          // We don't get duration from playlistItems, need a separate call for durations
        });
      }
      
      pageToken = itemsData.nextPageToken;
    } while (pageToken);

    // 3. Fetch video durations
    // The videos API allows fetching up to 50 IDs at once
    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50);
      const ids = batch.map(v => v.videoId).join(',');
      
      const detailsRes = await fetch(`${API_BASE}/videos?part=contentDetails&id=${ids}&key=${apiKey}`);
      const detailsData = await detailsRes.json();
      
      if (!detailsData.error && detailsData.items) {
        for (const detail of detailsData.items) {
          const video = videos.find(v => v.videoId === detail.id);
          if (video) {
            video.durationSeconds = parseISO8601Duration(detail.contentDetails.duration);
            video.durationFormatted = formatDuration(video.durationSeconds);
          }
        }
      }
    }

    return {
      playlistId,
      playlistTitle: title,
      channelTitle,
      totalVideos: videos.length,
      fetchedAt: new Date().toISOString(),
      videos
    };

  } catch (error) {
    throw error;
  }
}

export async function validateApiKey(apiKey) {
  try {
    const res = await fetch(`${API_BASE}/channels?part=id&forUsername=youtube&key=${apiKey}`);
    const data = await res.json();
    return !data.error;
  } catch (e) {
    return false;
  }
}

// Utility to parse YouTube ISO 8601 durations (e.g., PT1H2M10S)
function parseISO8601Duration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
