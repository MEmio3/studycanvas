// src/services/youtubePlayer.js

let isApiLoaded = false;
let apiPromise = null;

export function loadYouTubeApi() {
  if (isApiLoaded) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    // If the iframe API is already somehow available globally
    if (window.YT && window.YT.Player) {
      isApiLoaded = true;
      resolve();
      return;
    }

    // Set up the global callback required by YouTube
    window.onYouTubeIframeAPIReady = () => {
      isApiLoaded = true;
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => reject(new Error('Failed to load YouTube iframe API'));
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });

  return apiPromise;
}

export function createPlayer(elementId, videoId, onReady, onStateChange) {
  return new window.YT.Player(elementId, {
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      fs: 1,
      iv_load_policy: 3,
      cc_load_policy: 0
    },
    events: {
      onReady: onReady,
      onStateChange: onStateChange
    }
  });
}
