const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/youtubeApi-ClZm9_33.js","assets/rolldown-runtime-lhHHWwHU.js","assets/playlists-kWP4i6eP.js","assets/db-DL--i787.js","assets/pages-xlalZbIM.js","assets/uuid-Cwm_e2Hs.js"])))=>i.map(i=>d[i]);
import{t as e}from"./db-DL--i787.js";import{t}from"./uuid-Cwm_e2Hs.js";import{i as n,n as r,t as i}from"./pages-xlalZbIM.js";import{t as a}from"./index-BQ7shzT3.js";import{t as o}from"./tts-DqPZvN8W.js";import{getPlaylist as s,savePlaylist as c}from"./playlists-kWP4i6eP.js";import{n as l,t as u}from"./youtubeApi-ClZm9_33.js";async function d(t){let n=await e();return t.updatedAt=new Date().toISOString(),await n.put(`watch_progress`,t),t}async function f(t){return await(await e()).get(`watch_progress`,t)||{deckId:t,updatedAt:new Date().toISOString(),videos:{}}}var p=class{constructor(e,t,n){this.container=e,this.onComplete=t,this.onSkip=n}render(){this.container.innerHTML=`
      <div class="yt-modal-overlay">
        <div class="yt-modal-content">
          <div style="text-align: center; margin-bottom: var(--space-24);">
            <i class="ti ti-brand-youtube" style="font-size: 48px; color: var(--watch-complete-color);"></i>
            <h2 style="margin-top: var(--space-16); font-size: 20px;">Set up YouTube Study Mode</h2>
          </div>
          
          <p style="color: var(--text-secondary); margin-bottom: var(--space-16); font-size: 14px; line-height: 1.5;">
            A free YouTube Data API key is needed to load playlist contents. Your key is stored only on this device and is never shared.
          </p>
          
          <div style="background: var(--bg-base); padding: var(--space-16); border-radius: var(--radius-md); margin-bottom: var(--space-24); font-size: 13px;">
            <p style="margin-bottom: var(--space-8); font-weight: 500;">How to get a free key:</p>
            <ol style="margin-left: var(--space-16); color: var(--text-secondary); line-height: 1.6;">
              <li>Go to console.cloud.google.com</li>
              <li>Create a project &rarr; Enable YouTube Data API v3</li>
              <li>Go to Credentials &rarr; Create API Key &rarr; Copy it</li>
            </ol>
            <a href="https://console.cloud.google.com" target="_blank" style="display: block; margin-top: var(--space-12); color: var(--watch-complete-color); text-decoration: none;">
              Open Google Cloud Console <i class="ti ti-external-link"></i>
            </a>
          </div>

          <label style="display: block; margin-bottom: var(--space-8); font-size: 14px; font-weight: 500;">Your API Key:</label>
          <div style="position: relative; margin-bottom: var(--space-8);">
            <input type="password" id="yt-api-key-input" style="width: 100%; padding: var(--space-12); padding-right: 40px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary);" placeholder="AIzaSy...">
            <button id="yt-toggle-visibility" class="ghost icon-only" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%);">
              <i class="ti ti-eye"></i>
            </button>
          </div>
          <div id="yt-api-error" style="color: var(--danger); font-size: 13px; min-height: 20px; margin-bottom: var(--space-16);"></div>

          <div style="display: flex; justify-content: flex-end; gap: var(--space-12);">
            <button id="yt-btn-skip" class="ghost">Skip for now</button>
            <button id="yt-btn-save" class="primary">Save & Continue</button>
          </div>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){let e=this.container.querySelector(`#yt-api-key-input`),t=this.container.querySelector(`#yt-toggle-visibility`),n=this.container.querySelector(`#yt-btn-skip`),r=this.container.querySelector(`#yt-btn-save`),i=this.container.querySelector(`#yt-api-error`);t.addEventListener(`click`,()=>{e.type===`password`?(e.type=`text`,t.innerHTML=`<i class="ti ti-eye-off"></i>`):(e.type=`password`,t.innerHTML=`<i class="ti ti-eye"></i>`)}),n.addEventListener(`click`,()=>{this.onSkip&&this.onSkip()}),r.addEventListener(`click`,async()=>{let t=e.value.trim();if(!t){i.textContent=`Please enter an API key.`;return}r.disabled=!0,r.textContent=`Validating...`,i.textContent=``,await l(t)?(localStorage.setItem(`studycanvas_yt_apikey`,t),this.onComplete&&this.onComplete()):(i.textContent=`Invalid API key. Please check and try again.`,r.disabled=!1,r.textContent=`Save & Continue`)})}},m=class{constructor(e,t,n,r){this.container=e,this.deckId=t,this.onComplete=n,this.onCancel=r}render(){this.container.innerHTML=`
      <div class="yt-modal-overlay">
        <div class="yt-modal-content">
          <h2 style="font-size: 18px; margin-bottom: var(--space-16);">Link a YouTube Playlist</h2>
          
          <label style="display: block; margin-bottom: var(--space-8); font-size: 14px; font-weight: 500;">Paste playlist URL or ID:</label>
          <input type="text" id="yt-playlist-input" style="width: 100%; padding: var(--space-12); background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); margin-bottom: var(--space-8);" placeholder="e.g. youtube.com/playlist?list=PLxxxx">
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-16);">e.g. youtube.com/playlist?list=PLxxxx or PLxxxx</p>
          
          <div style="display: flex; gap: var(--space-12); align-items: flex-start; padding: var(--space-12); background: rgba(212, 160, 23, 0.1); border-radius: var(--radius-sm); margin-bottom: var(--space-24);">
            <i class="ti ti-alert-triangle" style="color: var(--amber); margin-top: 2px;"></i>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
              <span style="color: var(--amber); font-weight: 500;">Note:</span> This will replace the current linked playlist. Your saved Pages and watch progress will not be deleted.
            </p>
          </div>

          <div id="yt-playlist-error" style="color: var(--danger); font-size: 13px; min-height: 20px; margin-bottom: var(--space-16);"></div>

          <div style="display: flex; justify-content: flex-end; gap: var(--space-12);">
            <button id="yt-btn-cancel" class="ghost">Cancel</button>
            <button id="yt-btn-load" class="primary">Load Playlist</button>
          </div>
        </div>
      </div>
    `,this.attachEvents(),setTimeout(()=>{let e=this.container.querySelector(`#yt-playlist-input`);e&&e.focus()},50)}attachEvents(){let e=this.container.querySelector(`#yt-btn-cancel`),t=this.container.querySelector(`#yt-btn-load`),n=this.container.querySelector(`#yt-playlist-input`),r=this.container.querySelector(`#yt-playlist-error`);e.addEventListener(`click`,()=>{this.onCancel&&this.onCancel()}),t.addEventListener(`click`,async()=>{let e=n.value.trim();if(!e){r.textContent=`Please enter a URL or ID.`;return}let i=e;e.includes(`list=`)&&(i=new URLSearchParams(e.substring(e.indexOf(`?`))).get(`list`)||e);let a=localStorage.getItem(`studycanvas_yt_apikey`);if(!a){r.textContent=`API key is missing. Please set it in Settings.`;return}t.disabled=!0,t.textContent=`Loading...`,r.textContent=``;try{let e=await u(i,a);e.deckId=this.deckId,await c(e),this.onComplete&&this.onComplete(e)}catch(e){r.textContent=e.message||`Failed to load playlist.`,t.disabled=!1,t.textContent=`Load Playlist`}})}},h=class{constructor(e,t,n,r){this.video=e,this.progress=t,this.isActive=n,this.onClick=r}render(){let e=document.createElement(`div`);e.className=`yt-video-card ${this.isActive?`active`:``}`,e.title=this.video.title;let t=``,n=0;return this.progress?this.progress.isComplete?(t=`<i class="ti ti-circle-check yt-status-icon yt-status-complete"></i>`,n=100):this.isActive?(t=`<i class="ti ti-player-play-filled yt-status-icon yt-status-complete"></i>`,n=this.progress.watchedSeconds/this.video.durationSeconds*100):this.progress.watchedSeconds>0?(t=`<i class="ti ti-circle-half-2 yt-status-icon yt-status-partial"></i>`,n=this.progress.watchedSeconds/this.video.durationSeconds*100):t=`<i class="ti ti-circle yt-status-icon yt-status-none"></i>`:t=this.isActive?`<i class="ti ti-player-play-filled yt-status-icon yt-status-complete"></i>`:`<i class="ti ti-circle yt-status-icon yt-status-none"></i>`,e.innerHTML=`
      <div class="yt-thumbnail-wrapper">
        <img src="${this.video.thumbnail}" class="yt-thumbnail" alt="thumbnail">
        <div class="yt-duration-badge">${this.video.durationFormatted||`--:--`}</div>
      </div>
      <div class="yt-card-info">
        <div class="yt-card-title">${this.video.title}</div>
        ${t}
      </div>
      ${n>0&&n<100?`<div class="yt-card-progress-bar" style="width: ${n}%"></div>`:``}
      ${n>=100?`<div class="yt-card-progress-bar" style="width: 100%; background: var(--watch-complete-color);"></div>`:``}
    `,e.addEventListener(`click`,()=>{this.onClick&&this.onClick(this.video)}),e}},g=class{constructor(e,t,n,r,i,a,o){this.container=e,this.playlist=t,this.watchProgress=n||{videos:{}},this.activeVideoId=r,this.onVideoSelect=i,this.onLinkPlaylist=a,this.onRefresh=o,this.searchQuery=``}updateProgress(e){this.watchProgress=e||{videos:{}},this.renderVideoList(),this.renderProgressBar()}setActiveVideo(e){this.activeVideoId=e,this.renderVideoList()}render(){if(this.container.innerHTML=`
      <div class="yt-sidebar">
        ${this.playlist?`
          <div style="padding: var(--space-12); border-bottom: 1px solid var(--border-default);">
            <input type="text" id="yt-search-videos" placeholder="Search videos..." style="width: 100%; padding: var(--space-8); background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px;">
          </div>
          <div id="yt-video-list" style="flex-grow: 1; overflow-y: auto;"></div>
          <div class="yt-playlist-progress-container">
            <div class="yt-playlist-progress-track">
              <div id="yt-playlist-progress-fill" class="yt-playlist-progress-fill" style="width: 0%;"></div>
            </div>
            <div class="yt-playlist-progress-text">
              <span id="yt-playlist-progress-label">0 of ${this.playlist.videos.length} complete</span>
              <span id="yt-playlist-progress-percent">0%</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px;">
              <button id="yt-btn-link" class="ghost" style="flex: 1; font-size: 12px;"><i class="ti ti-link"></i> Link Playlist</button>
              <button id="yt-btn-refresh" class="ghost icon-only" title="Refresh Playlist"><i class="ti ti-refresh"></i></button>
            </div>
          </div>
        `:`
          <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-24); text-align: center;">
            <i class="ti ti-brand-youtube" style="font-size: 48px; color: var(--text-secondary); margin-bottom: var(--space-16);"></i>
            <h3 style="color: var(--text-primary); margin-bottom: var(--space-8);">No playlist linked</h3>
            <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: var(--space-24);">Paste a YouTube playlist URL to get started</p>
            <button id="yt-btn-link" class="primary"><i class="ti ti-link"></i> Link Playlist</button>
          </div>
        `}
      </div>
    `,this.playlist){this.renderVideoList(),this.renderProgressBar();let e=this.container.querySelector(`#yt-search-videos`);e&&e.addEventListener(`input`,e=>{this.searchQuery=e.target.value.toLowerCase(),this.renderVideoList()}),this.container.querySelector(`#yt-btn-refresh`).addEventListener(`click`,()=>{this.onRefresh&&this.onRefresh()})}let e=this.container.querySelector(`#yt-btn-link`);e&&e.addEventListener(`click`,()=>{this.onLinkPlaylist&&this.onLinkPlaylist()})}renderVideoList(){let e=this.container.querySelector(`#yt-video-list`);if(!e||!this.playlist)return;e.innerHTML=``;let t=this.playlist.videos.filter(e=>!this.searchQuery||e.title.toLowerCase().includes(this.searchQuery));if(t.length===0){e.innerHTML=`<div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">No videos match your search</div>`;return}for(let n of t){let t=this.watchProgress.videos[n.videoId],r=n.videoId===this.activeVideoId,i=new h(n,t,r,this.onVideoSelect).render();e.appendChild(i),r&&setTimeout(()=>{i.scrollIntoView({behavior:`smooth`,block:`nearest`})},100)}}renderProgressBar(){if(!this.playlist)return;let e=this.container.querySelector(`#yt-playlist-progress-fill`),t=this.container.querySelector(`#yt-playlist-progress-label`),n=this.container.querySelector(`#yt-playlist-progress-percent`);if(!e||!t||!n)return;let r=this.playlist.videos.length,i=0;for(let e of this.playlist.videos){let t=this.watchProgress.videos[e.videoId];t&&t.isComplete&&i++}let a=r>0?Math.round(i/r*100):0;e.style.width=`${a}%`,t.textContent=`${i} of ${r} complete`,n.textContent=`${a}%`}},_=!1,v=null;function y(){return _?Promise.resolve():v||(v=new Promise((e,t)=>{if(window.YT&&window.YT.Player){_=!0,e();return}window.onYouTubeIframeAPIReady=()=>{_=!0,e()};let n=document.createElement(`script`);n.src=`https://www.youtube.com/iframe_api`,n.onerror=()=>t(Error(`Failed to load YouTube iframe API`));let r=document.getElementsByTagName(`script`)[0];r.parentNode.insertBefore(n,r)}),v)}function b(e,t,n,r){return new window.YT.Player(e,{videoId:t,playerVars:{autoplay:0,controls:1,rel:0,modestbranding:1,fs:1,iv_load_policy:3,cc_load_policy:0},events:{onReady:n,onStateChange:r}})}var x=class{constructor(e,t,n){this.container=e,this.onTimeUpdate=t,this.onVideoEnd=n,this.player=null,this.activeVideoId=null,this.timeUpdateInterval=null,this.playerReady=!1}async loadVideo(e,t=0){if(this.activeVideoId=e,!this.player){await this.initPlayer(e,t);return}this.playerReady&&this.player.loadVideoById({videoId:e,startSeconds:t})}async initPlayer(e,t=0){this.container.innerHTML=`<div id="yt-iframe-placeholder" style="width: 100%; height: 100%;"></div>`;try{await y(),this.player=b(`yt-iframe-placeholder`,e,()=>{this.playerReady=!0,t>0&&this.player.seekTo(t),this.startProgressTracking()},e=>{e.data===0&&this.onVideoEnd&&this.onVideoEnd(this.activeVideoId),e.data===1?this.startProgressTracking():this.stopProgressTracking()})}catch(e){console.error(`Failed to load YouTube player`,e),this.container.innerHTML=`<div class="flex-center" style="height: 100%; color: var(--danger);">Failed to load YouTube player. Check your internet connection.</div>`}}startProgressTracking(){this.stopProgressTracking(),this.timeUpdateInterval=setInterval(()=>{if(this.player&&this.playerReady&&this.player.getCurrentTime){let e=this.player.getCurrentTime();this.onTimeUpdate&&this.onTimeUpdate(this.activeVideoId,e)}},1e3)}stopProgressTracking(){this.timeUpdateInterval&&=(clearInterval(this.timeUpdateInterval),null)}pause(){this.player&&this.playerReady&&this.player.pauseVideo&&this.player.pauseVideo()}play(){this.player&&this.playerReady&&this.player.playVideo&&this.player.playVideo()}destroy(){this.stopProgressTracking(),this.player&&this.player.destroy&&this.player.destroy(),this.player=null,this.playerReady=!1}},S=class{constructor(e,t){this.container=e,this.onMarkComplete=t,this.video=null,this.isComplete=!1,this.currentTime=0,this.position=0,this.total=0}updateState(e,t,n,r,i){this.video=e,this.isComplete=t,this.currentTime=n,this.position=r,this.total=i,this.render()}updateTime(e){this.currentTime=e;let t=this.container.querySelector(`#yt-info-current-time`);t&&(t.textContent=this.formatDuration(Math.floor(this.currentTime)))}updateCompleteState(e){this.isComplete=e;let t=this.container.querySelector(`#yt-btn-mark-complete`);t&&(this.isComplete?(t.innerHTML=`<i class="ti ti-arrow-back-up"></i> Mark Incomplete`,t.classList.add(`ghost`),t.classList.remove(`primary`)):(t.innerHTML=`<i class="ti ti-check"></i> Mark Complete`,t.classList.add(`primary`),t.classList.remove(`ghost`)))}render(){if(!this.video){this.container.innerHTML=`<div class="yt-info-bar"></div>`;return}this.container.innerHTML=`
      <div class="yt-info-bar">
        <div class="yt-info-left">
          <span class="yt-info-title">${this.video.title}</span>
        </div>
        <div class="yt-info-right">
          <span class="yt-info-channel">${this.position} / ${this.total}</span>
          <span class="yt-info-time" id="yt-info-current-time">${this.formatDuration(Math.floor(this.currentTime))}</span>
          <button id="yt-btn-mark-complete" class="${this.isComplete?`ghost`:`primary`}" style="padding: 4px 8px; font-size: 12px; min-width: 120px;">
            ${this.isComplete?`<i class="ti ti-arrow-back-up"></i> Mark Incomplete`:`<i class="ti ti-check"></i> Mark Complete`}
          </button>
        </div>
      </div>
    `;let e=this.container.querySelector(`#yt-btn-mark-complete`);e&&e.addEventListener(`click`,()=>{this.onMarkComplete&&this.onMarkComplete(!this.isComplete)})}formatDuration(e){let t=Math.floor(e/3600),n=Math.floor(e%3600/60),r=e%60;return t>0?`${t}:${n.toString().padStart(2,`0`)}:${r.toString().padStart(2,`0`)}`:`${n}:${r.toString().padStart(2,`0`)}`}},C=class{constructor(e,t){this.container=e,this.onClick=t}render(){this.container.innerHTML=`
      <div id="yt-capture-icon" class="yt-overlay-icon" title="Capture a note for this video (C)">
        <i class="ti ti-clipboard-plus"></i>
      </div>
    `;let e=this.container.querySelector(`#yt-capture-icon`);e&&e.addEventListener(`click`,()=>{this.onClick&&this.onClick()})}},w=class{constructor(e,t,n,r,i,a,o){this.container=e,this.deckId=t,this.videoTitle=n,this.videoId=r,this.currentSeconds=i,this.onSaveComplete=a,this.onClose=o,this.images=[]}formatTimestamp(e){let t=Math.floor(e/3600),n=Math.floor(e%3600/60),r=Math.floor(e%60);return t>0?`${t}:${n.toString().padStart(2,`0`)}:${r.toString().padStart(2,`0`)}`:`${n}:${r.toString().padStart(2,`0`)}`}render(){let e=this.formatTimestamp(this.currentSeconds),t=`${this.videoTitle} @ ${e}`;this.container.innerHTML=`
      <div class="yt-capture-panel-overlay" id="yt-capture-overlay">
        <div class="yt-capture-header" style="gap: 16px;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">Capture Note &bull; ${this.videoTitle} &bull; @ ${e}</span>
          <button id="yt-capture-close" class="ghost icon-only" style="flex-shrink: 0;"><i class="ti ti-x"></i></button>
        </div>
        
        <div class="yt-capture-body">
          <div class="yt-capture-text-area">
            <div class="yt-capture-editor" id="yt-capture-editor" contenteditable="true" data-placeholder="Paste your AI response here..."></div>
            <div style="display: flex; gap: 8px; align-items: center; color: var(--text-secondary); font-size: 13px;">
              <span>Source:</span>
              <select id="yt-capture-source" style="background: var(--bg-surface); border: 1px solid var(--border-default); color: var(--text-primary); border-radius: 4px; padding: 2px 4px;">
                <option value="Gemini">Gemini</option>
                <option value="ChatGPT">ChatGPT</option>
                <option value="Claude">Claude</option>
                <option value="Perplexity">Perplexity</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div class="yt-capture-images">
            <div id="yt-capture-image-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
            <div class="yt-capture-dropzone" id="yt-capture-dropzone">
              <i class="ti ti-photo-plus" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
              + Add Image<br><span style="opacity: 0.6;">(drop / paste / click)</span>
              <input type="file" id="yt-capture-file-input" accept="image/*" style="display:none" multiple>
            </div>
          </div>
        </div>

        <div class="yt-capture-footer">
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
            <input type="text" id="yt-capture-title" value="${t}" style="width: 100%; padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-primary); font-size: 13px;">
            <input type="text" id="yt-capture-topic" placeholder="Topic..." style="width: 100%; padding: 6px 12px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-primary); font-size: 13px;">
            <label style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 13px; cursor: pointer; margin-top: 4px;">
              <input type="checkbox" id="yt-capture-resume" checked> Resume video after save
            </label>
          </div>
          <div style="display: flex; gap: 12px; justify-content: space-between; width: 100%;">
            <button id="yt-capture-btn-discard" class="ghost" style="flex: 1;">Discard</button>
            <button id="yt-capture-btn-save" class="primary" style="flex: 2;"><i class="ti ti-device-floppy"></i> Save as Page</button>
          </div>
        </div>
      </div>
    `,requestAnimationFrame(()=>{this.container.style.width=`450px`}),this.attachEvents(),this.container.querySelector(`#yt-capture-editor`).focus()}attachEvents(){let e=this.container.querySelector(`#yt-capture-close`),t=this.container.querySelector(`#yt-capture-btn-discard`),n=this.container.querySelector(`#yt-capture-btn-save`),r=this.container.querySelector(`#yt-capture-dropzone`),i=this.container.querySelector(`#yt-capture-file-input`),a=this.container.querySelector(`#yt-capture-editor`),o=()=>{this.container.style.width=`0`,setTimeout(()=>{this.onClose&&this.onClose()},300)};e.addEventListener(`click`,o),t.addEventListener(`click`,o),n.addEventListener(`click`,()=>this.handleSave()),r.addEventListener(`click`,()=>i.click()),i.addEventListener(`change`,e=>this.handleFiles(e.target.files)),r.addEventListener(`dragover`,e=>{e.preventDefault(),r.style.borderColor=`var(--primary)`}),r.addEventListener(`dragleave`,()=>{r.style.borderColor=`var(--border-default)`}),r.addEventListener(`drop`,e=>{e.preventDefault(),r.style.borderColor=`var(--border-default)`,e.dataTransfer.files&&this.handleFiles(e.dataTransfer.files)}),a.addEventListener(`paste`,e=>{let t=(e.clipboardData||e.originalEvent.clipboardData).items,n=!1;for(let r of t)if(r.type.indexOf(`image`)===0){let t=r.getAsFile();this.handleFiles([t]),n=!0,e.preventDefault()}if(!n){e.preventDefault();let t=e.clipboardData.getData(`text/plain`);document.execCommand(`insertText`,!1,t)}}),this.keydownHandler=e=>{e.key===`Escape`?o():e.key===`Enter`&&(e.ctrlKey||e.metaKey)&&this.handleSave()},document.addEventListener(`keydown`,this.keydownHandler)}handleFiles(e){if(e)for(let t of e){if(this.images.length>=5)break;t.type.startsWith(`image/`)&&(this.images.push(t),this.renderImageList())}}renderImageList(){let e=this.container.querySelector(`#yt-capture-image-list`),t=this.container.querySelector(`#yt-capture-dropzone`);e.innerHTML=``,this.images.forEach((t,n)=>{let r=URL.createObjectURL(t),i=document.createElement(`div`);i.style.position=`relative`,i.style.width=`100%`,i.style.height=`120px`,i.style.borderRadius=`4px`,i.style.overflow=`hidden`,i.style.border=`1px solid var(--border-default)`,i.innerHTML=`
        <img src="${r}" style="width: 100%; height: 100%; object-fit: cover;">
        <button class="ghost icon-only" style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); padding: 4px;" data-idx="${n}">
          <i class="ti ti-x" style="font-size: 14px;"></i>
        </button>
      `,i.querySelector(`button`).addEventListener(`click`,()=>{this.images.splice(n,1),this.renderImageList()}),e.appendChild(i)}),this.images.length>=5?t.style.display=`none`:t.style.display=`block`}async handleSave(){let r=this.container.querySelector(`#yt-capture-title`).value.trim()||`Untitled Capture`,a=this.container.querySelector(`#yt-capture-topic`).value.trim(),o=this.container.querySelector(`#yt-capture-source`).value,s=this.container.querySelector(`#yt-capture-resume`).checked,c=this.container.querySelector(`#yt-capture-editor`).innerText||``;if(this.images.length===0&&!c.trim()){alert(`Add at least an image or some text before saving.`);return}let l=this.container.querySelector(`#yt-capture-btn-save`);l.disabled=!0,l.innerHTML=`Saving...`;try{let l=await i(this.deckId,r);l.topic=a,l.captureSource=`youtube_capture`,l.videoTimestamp={videoId:this.videoId,seconds:this.currentSeconds,formatted:this.formatTimestamp(this.currentSeconds),videoTitle:this.videoTitle},l.textBlock.rawText=c,l.textBlock.source=o;let u=await e();for(let e of this.images){let n={storageKey:t(),blob:e,type:e.type,name:e.name||`capture.png`};await u.put(`images`,n),l.images.push({storageKey:n.storageKey,name:n.name})}await n(l),document.removeEventListener(`keydown`,this.keydownHandler),this.container.querySelector(`#yt-capture-overlay`).classList.remove(`open`),setTimeout(()=>{this.onSaveComplete&&this.onSaveComplete(l,s)},300)}catch(e){console.error(e),alert(`Failed to save capture.`),l.disabled=!1,l.innerHTML=`<i class="ti ti-device-floppy"></i> Save as Page`}}},T=class{constructor(e,t,n,r){this.container=e,this.onClick=t,this.onHoverStart=n,this.onHoverEnd=r,this.isActive=!1}setActive(e){this.isActive=e;let t=this.container.querySelector(`i`),n=this.container.querySelector(`.yt-overlay-icon`);t&&n&&(e?(t.className=`ti ti-microphone`,n.style.borderColor=`var(--watch-complete-color)`,n.style.color=`var(--watch-complete-color)`,n.style.boxShadow=`0 0 12px rgba(29,158,117,0.4)`):(t.className=`ti ti-microphone`,n.style.borderColor=``,n.style.color=``,n.style.boxShadow=``))}render(){this.container.innerHTML=`
      <div id="yt-tts-mic-icon" class="yt-overlay-icon" title="Select a page to read aloud (T)" style="bottom: 16px; left: 16px; top: auto;">
        <i class="ti ti-microphone"></i>
      </div>
    `;let e=this.container.querySelector(`#yt-tts-mic-icon`);e&&(e.addEventListener(`click`,()=>{this.onClick&&this.onClick()}),e.addEventListener(`mouseenter`,()=>{this.onHoverStart&&this.onHoverStart()}),e.addEventListener(`mouseleave`,()=>{this.onHoverEnd&&this.onHoverEnd()}))}},E=class{constructor(e,t,n){this.container=e,this.page=t,this.onPlay=n}render(){if(!this.page){this.container.innerHTML=``;return}let e=this.page.textBlock?.rawText||``;e.length>80&&(e=e.substring(0,80)+`...`),this.container.innerHTML=`
      <div id="yt-latest-preview" style="
        position: absolute; 
        bottom: 64px; 
        left: 16px; 
        width: 320px; 
        background: var(--preview-card-bg); 
        border: 1px solid var(--preview-card-border); 
        border-radius: var(--radius-md); 
        padding: var(--space-16); 
        box-shadow: var(--preview-card-shadow); 
        z-index: 55;
        backdrop-filter: blur(8px);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s ease;
        pointer-events: none;
      ">
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          Latest: <span style="color: var(--text-primary); font-weight: 500;">${this.page.title}</span>
        </div>
        <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4; font-style: italic; margin-bottom: var(--space-12);">
          "${e}"
        </div>
        <button id="yt-preview-play-btn" class="primary" style="width: 100%;"><i class="ti ti-player-play-filled"></i> Play this page</button>
      </div>
    `,requestAnimationFrame(()=>{let e=this.container.querySelector(`#yt-latest-preview`);e&&(e.style.opacity=`1`,e.style.transform=`translateY(0)`,e.style.pointerEvents=`auto`)});let t=this.container.querySelector(`#yt-preview-play-btn`);t&&t.addEventListener(`click`,()=>{this.onPlay&&this.onPlay(this.page)});let n=this.container.querySelector(`#yt-latest-preview`);n&&(n.addEventListener(`mouseenter`,()=>{let e=new CustomEvent(`yt-preview-hover-in`);document.dispatchEvent(e)}),n.addEventListener(`mouseleave`,()=>{let e=new CustomEvent(`yt-preview-hover-out`);document.dispatchEvent(e)}))}destroy(){let e=this.container.querySelector(`#yt-latest-preview`);e?(e.style.opacity=`0`,e.style.transform=`translateY(10px)`,e.style.pointerEvents=`none`,setTimeout(()=>{this.container.innerHTML=``},200)):this.container.innerHTML=``}},D=class{constructor(e,t,n,r){this.container=e,this.deckId=t,this.onSelect=n,this.onClose=r,this.pages=[],this.searchQuery=``}async render(){this.pages=await r(this.deckId),this.pages.sort((e,t)=>new Date(t.createdAt)-new Date(e.createdAt)),this.container.innerHTML=`
      <div class="yt-modal-overlay" id="yt-tts-selector-overlay">
        <div class="yt-modal-content" style="width: 500px; max-height: 80vh; display: flex; flex-direction: column; padding: 0;">
          <div style="padding: var(--space-16); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center; background: var(--capture-panel-header-bg); border-radius: var(--radius-lg) var(--radius-lg) 0 0;">
            <h3 style="font-size: 16px;">Select a page to listen to</h3>
            <button id="yt-tts-selector-close" class="ghost icon-only"><i class="ti ti-x"></i></button>
          </div>
          
          <div style="padding: var(--space-12); border-bottom: 1px solid var(--border-default);">
            <div style="position: relative;">
              <i class="ti ti-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
              <input type="text" id="yt-tts-search" placeholder="Search pages..." style="width: 100%; padding: var(--space-8) var(--space-8) var(--space-8) 32px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px;">
            </div>
          </div>

          <div id="yt-tts-page-list" style="flex-grow: 1; overflow-y: auto; padding: var(--space-8);">
          </div>
        </div>
      </div>
    `,this.renderPageList(),this.attachEvents(),setTimeout(()=>{let e=this.container.querySelector(`#yt-tts-search`);e&&e.focus()},50)}renderPageList(){let e=this.container.querySelector(`#yt-tts-page-list`);if(!e)return;e.innerHTML=``;let t=this.pages.filter(e=>{if(!this.searchQuery)return!0;let t=this.searchQuery.toLowerCase(),n=(e.title||``).toLowerCase().includes(t),r=(e.textBlock?.rawText||``).toLowerCase().includes(t);return n||r});if(t.length===0){this.pages.length===0?e.innerHTML=`<div style="padding: 32px; text-align: center; color: var(--text-secondary); font-size: 14px;">No pages in this deck yet. Save a capture to get started.</div>`:e.innerHTML=`<div style="padding: 32px; text-align: center; color: var(--text-secondary); font-size: 14px;">No pages match your search.</div>`;return}t.forEach(t=>{let n=document.createElement(`div`);n.style.padding=`var(--space-12)`,n.style.borderBottom=`1px solid var(--border-default)`,n.style.cursor=`pointer`,n.style.display=`flex`,n.style.gap=`var(--space-12)`,n.style.borderRadius=`var(--radius-sm)`,n.style.transition=`background 0.2s ease`,n.addEventListener(`mouseenter`,()=>n.style.background=`var(--bg-hover)`),n.addEventListener(`mouseleave`,()=>n.style.background=`transparent`);let r=t.textBlock?.rawText||``;r.length>80&&(r=r.substring(0,80)+`...`);let i=``;t.videoTimestamp&&(i=`
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
            <i class="ti ti-brand-youtube" style="color: var(--watch-complete-color);"></i> ${t.videoTimestamp.videoTitle} &middot; ${t.videoTimestamp.formatted}
          </div>
        `),n.innerHTML=`
        <div style="width: 48px; height: 36px; background: var(--bg-surface); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-default);">
          <i class="ti ti-photo" style="color: var(--text-tertiary); font-size: 18px;"></i>
        </div>
        <div style="flex-grow: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.title}</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.4; margin-top: 2px;">"${r}"</div>
          ${i}
        </div>
      `,n.addEventListener(`click`,()=>{this.onSelect&&this.onSelect(t),this.close()}),e.appendChild(n)})}attachEvents(){let e=this.container.querySelector(`#yt-tts-selector-close`),t=this.container.querySelector(`#yt-tts-search`);e&&e.addEventListener(`click`,()=>this.close()),t&&t.addEventListener(`input`,e=>{this.searchQuery=e.target.value,this.renderPageList()}),this.keydownHandler=e=>{e.key===`Escape`&&this.close()},document.addEventListener(`keydown`,this.keydownHandler)}close(){document.removeEventListener(`keydown`,this.keydownHandler),this.onClose&&this.onClose()}},O=class{constructor(e,t){this.container=e,this.onClose=t,this.sentences=[],this.currentIndex=-1,this.currentWordIndex=-1}updateText(e){this.sentences=e.match(/[^.!?]+[.!?]*/g)||[e],this.sentences=this.sentences.map(e=>e.trim()).filter(e=>e.length>0),this.currentIndex=0,this.currentWordIndex=-1,this.renderText()}updateProgress(e){if(this.sentences.length===0)return;let t=0,n=0,r=0;for(let i=0;i<this.sentences.length;i++){if(t+this.sentences[i].length>e){n=i,r=e-t;break}t+=this.sentences[i].length+1}n!==this.currentIndex&&(this.currentIndex=n,this.currentWordIndex=-1,this.renderText()),this.highlightWordInCurrentSentence(r)}highlightWordInCurrentSentence(e){let t=this.container.querySelector(`#yt-tts-current-sentence`);if(!t)return;let n=this.sentences[this.currentIndex];if(!n)return;let r=0,i=0,a=n.split(` `);for(let t=0;t<a.length;t++){if(i+a[t].length>=e){r=t;break}i+=a[t].length+1}r!==this.currentWordIndex&&(this.currentWordIndex=r,t.innerHTML=a.map((e,t)=>t===r?`<span style="color: var(--subtitle-word-highlight);">${e}</span>`:e).join(` `))}render(){this.container.innerHTML=`
      <div id="yt-subtitle-bar" style="
        position: absolute; 
        bottom: 0; left: 0; right: 0; 
        background: var(--subtitle-bar-bg); 
        backdrop-filter: blur(8px);
        display: flex; flex-direction: column; 
        padding: var(--space-16) var(--space-24);
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 65;
        border-top: 1px solid var(--border-default);
      ">
        <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 8px; margin-bottom: var(--space-16); min-height: 80px;">
          <div id="yt-tts-prev-sentence" style="font-size: 13px; color: var(--subtitle-adjacent-color); font-style: italic;"></div>
          <div id="yt-tts-current-sentence" style="font-size: 17px; color: var(--subtitle-current-color); font-weight: 500; line-height: 1.4; transition: all 0.2s;"></div>
          <div id="yt-tts-next-sentence" style="font-size: 13px; color: var(--subtitle-adjacent-color); font-style: italic;"></div>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 16px;">
          <button class="ghost icon-only" id="yt-tts-btn-prev" title="Previous sentence"><i class="ti ti-player-skip-back"></i></button>
          <button class="primary icon-only" id="yt-tts-btn-playpause" style="border-radius: 50%; width: 40px; height: 40px;"><i class="ti ti-player-pause" id="yt-tts-icon-playpause"></i></button>
          <button class="ghost icon-only" id="yt-tts-btn-stop" title="Stop"><i class="ti ti-player-stop"></i></button>
          <button class="ghost icon-only" id="yt-tts-btn-next" title="Next sentence"><i class="ti ti-player-skip-forward"></i></button>
        </div>
      </div>
    `,requestAnimationFrame(()=>{let e=this.container.querySelector(`#yt-subtitle-bar`);e&&(e.style.transform=`translateY(0)`)}),this.attachEvents()}renderText(){let e=this.container.querySelector(`#yt-tts-prev-sentence`),t=this.container.querySelector(`#yt-tts-current-sentence`),n=this.container.querySelector(`#yt-tts-next-sentence`);!e||!t||!n||(this.currentIndex>0?e.textContent=this.sentences[this.currentIndex-1]:e.textContent=``,this.currentIndex>=0&&this.currentIndex<this.sentences.length?t.textContent=this.sentences[this.currentIndex]:t.textContent=``,this.currentIndex<this.sentences.length-1?n.textContent=this.sentences[this.currentIndex+1]:n.textContent=``)}updatePlayPauseState(e){let t=this.container.querySelector(`#yt-tts-icon-playpause`);t&&(t.className=e?`ti ti-player-pause`:`ti ti-player-play`)}attachEvents(){let e=this.container.querySelector(`#yt-tts-btn-playpause`),t=this.container.querySelector(`#yt-tts-btn-stop`),n=this.container.querySelector(`#yt-tts-btn-prev`),r=this.container.querySelector(`#yt-tts-btn-next`);e.addEventListener(`click`,()=>{o.isPlaying&&!o.isPaused?o.pause():o.isPaused&&o.resume()}),t.addEventListener(`click`,()=>{o.stop(),this.close()}),n.addEventListener(`click`,()=>{}),r.addEventListener(`click`,()=>{}),this.keydownHandler=t=>{t.key===`Escape`?(o.stop(),this.close()):t.key===` `&&(t.preventDefault(),e.click())},document.addEventListener(`keydown`,this.keydownHandler)}close(){document.removeEventListener(`keydown`,this.keydownHandler);let e=this.container.querySelector(`#yt-subtitle-bar`);e?(e.style.transform=`translateY(100%)`,setTimeout(()=>{this.onClose&&this.onClose()},300)):this.onClose&&this.onClose()}},k=class{constructor(e,t,n){this.container=e,this.deckId=t,this.topBar=n,this.playlist=null,this.watchProgress=null,this.activeVideoId=null,this.sidebarComponent=null,this.playerComponent=null,this.infoBarComponent=null,this.captureIconComponent=null,this.ttsMicComponent=null,this.subtitleBarComponent=null,this.latestPreviewComponent=null,this.lastSavedTime={},this.currentVideoTime=0}async render(){if(this.container.innerHTML=`
      <div style="display: flex; height: 100%; width: 100%;">
        <div id="yt-sidebar-container" style="flex-shrink: 0; width: 320px; height: 100%; border-right: 1px solid var(--border-default);"></div>
        <div class="yt-player-area" id="yt-player-area">
          <div class="yt-iframe-wrapper" id="yt-iframe-wrapper"></div>
          <div id="yt-info-bar-container"></div>
          <div id="yt-capture-icon-container"></div>
          <div id="yt-tts-mic-container"></div>
          <div id="yt-latest-preview-container"></div>
          <div id="yt-tts-subtitle-container"></div>
          <div id="yt-tts-selector-container"></div>
        </div>
        <div id="yt-capture-panel-container" style="width: 0; transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; flex-shrink: 0; background: var(--bg-base); z-index: 50;"></div>
      </div>
    `,this.playlist=await s(this.deckId),this.watchProgress=await f(this.deckId),this.sidebarComponent=new g(this.container.querySelector(`#yt-sidebar-container`),this.playlist,this.watchProgress,this.activeVideoId,e=>this.handleVideoSelect(e),()=>this.showLinkModal(),()=>this.refreshPlaylist()),this.sidebarComponent.render(),this.infoBarComponent=new S(this.container.querySelector(`#yt-info-bar-container`),e=>this.handleMarkComplete(e)),this.infoBarComponent.render(),this.playerComponent=new x(this.container.querySelector(`#yt-iframe-wrapper`),(e,t)=>this.handleTimeUpdate(e,t),e=>this.handleVideoEnd(e)),this.captureIconComponent=new C(this.container.querySelector(`#yt-capture-icon-container`),()=>this.openCapturePanel()),this.captureIconComponent.render(),this.ttsMicComponent=new T(this.container.querySelector(`#yt-tts-mic-container`),()=>this.openTtsSelector(),()=>this.showLatestPagePreview(),()=>this.hideLatestPagePreview()),this.ttsMicComponent.render(),this.subtitleBarComponent=new O(this.container.querySelector(`#yt-tts-subtitle-container`),()=>this.stopTts()),this.setupTtsListeners(),this.attachGlobalShortcuts(),!localStorage.getItem(`studycanvas_yt_apikey`))this.showApiKeySetup();else if(this.playlist&&this.playlist.videos.length>0){this.updateTopBarTitle();let e=this.playlist.videos[0];for(let t of this.playlist.videos){let n=this.watchProgress.videos[t.videoId];if(!n||!n.isComplete){e=t;break}}this.handleVideoSelect(e)}}attachGlobalShortcuts(){this.keydownHandler=e=>{if(!([`INPUT`,`TEXTAREA`].includes(e.target.tagName)||e.target.isContentEditable))switch(e.key.toLowerCase()){case`c`:e.preventDefault(),this.openCapturePanel();break;case`t`:e.preventDefault(),this.openTtsSelector();break;case` `:break}},document.addEventListener(`keydown`,this.keydownHandler)}unmount(){this.playerComponent&&this.playerComponent.destroy(),this.keydownHandler&&document.removeEventListener(`keydown`,this.keydownHandler),this.container.innerHTML=``,this.topBar&&(this.topBar.setPlaylistTitle(null),this.topBar.updateCounter(1,1))}updateTopBarTitle(){this.topBar&&this.playlist&&this.topBar.setPlaylistTitle(this.playlist.playlistTitle)}showApiKeySetup(){let e=document.createElement(`div`);document.body.appendChild(e),new p(e,()=>{document.body.removeChild(e),this.playlist||this.showLinkModal()},()=>{document.body.removeChild(e)}).render()}showLinkModal(){let e=document.createElement(`div`);document.body.appendChild(e),new m(e,this.deckId,t=>{document.body.removeChild(e),this.playlist=t,this.updateTopBarTitle(),this.sidebarComponent.playlist=t,t.videos.length>0&&this.handleVideoSelect(t.videos[0])},()=>{document.body.removeChild(e)}).render()}async refreshPlaylist(){let e=localStorage.getItem(`studycanvas_yt_apikey`);if(!(!e||!this.playlist))try{let{fetchPlaylist:t}=await a(async()=>{let{fetchPlaylist:e}=await import(`./youtubeApi-ClZm9_33.js`).then(e=>e.r);return{fetchPlaylist:e}},__vite__mapDeps([0,1])),{savePlaylist:n}=await a(async()=>{let{savePlaylist:e}=await import(`./playlists-kWP4i6eP.js`);return{savePlaylist:e}},__vite__mapDeps([2,3])),r=await t(this.playlist.playlistId,e);r.deckId=this.deckId,await n(r),this.playlist=r,this.sidebarComponent.playlist=r,this.sidebarComponent.render(),this.showToast(`Refreshed: ${r.playlistTitle}`,`success`)}catch(e){this.showToast(e.message,`error`)}}handleVideoSelect(e){this.activeVideoId=e.videoId,this.watchProgress.videos[e.videoId]||(this.watchProgress.videos[e.videoId]={watchedSeconds:0,durationSeconds:e.durationSeconds,isComplete:!1,lastWatchedAt:null,completedAt:null});let t=this.watchProgress.videos[e.videoId],n=t.isComplete?0:t.watchedSeconds>10?t.watchedSeconds:0;this.playerComponent.loadVideo(e.videoId,n),this.sidebarComponent.setActiveVideo(e.videoId),this.infoBarComponent.updateState(e,t.isComplete,n,e.position+1,this.playlist.videos.length),n>10&&!t.isComplete&&this.showToast(`Resuming from ${this.infoBarComponent.formatDuration(Math.floor(n))}`,`info`)}async handleTimeUpdate(e,t){if(this.activeVideoId!==e)return;this.currentVideoTime=t;let n=this.playlist.videos.find(t=>t.videoId===e);if(!n)return;let r=this.watchProgress.videos[e]||{watchedSeconds:0,durationSeconds:n.durationSeconds,isComplete:!1,lastWatchedAt:null,completedAt:null};t>r.watchedSeconds&&(r.watchedSeconds=t,r.lastWatchedAt=new Date().toISOString(),this.watchProgress.videos[e]=r,!r.isComplete&&r.watchedSeconds>=n.durationSeconds*.92&&(r.isComplete=!0,r.completedAt=new Date().toISOString(),this.showToast(`Marked complete: ${n.title}`,`success`),this.infoBarComponent.updateCompleteState(!0)),t-(this.lastSavedTime[e]||0)>5&&(this.lastSavedTime[e]=t,await d(this.watchProgress),this.sidebarComponent.updateProgress(this.watchProgress))),this.infoBarComponent.updateTime(t)}async handleVideoEnd(e){if(this.activeVideoId!==e)return;let t=this.watchProgress.videos[e];t&&!t.isComplete&&(t.isComplete=!0,t.completedAt=new Date().toISOString(),await d(this.watchProgress),this.infoBarComponent.updateCompleteState(!0),this.sidebarComponent.updateProgress(this.watchProgress))}async handleMarkComplete(e){if(!this.activeVideoId)return;let t=this.watchProgress.videos[this.activeVideoId];t&&(t.isComplete=e,e?t.completedAt=new Date().toISOString():t.completedAt=null,await d(this.watchProgress),this.infoBarComponent.updateCompleteState(e),this.sidebarComponent.updateProgress(this.watchProgress))}openCapturePanel(){if(!this.activeVideoId)return;this.playerComponent&&this.playerComponent.pause();let e=this.playlist.videos.find(e=>e.videoId===this.activeVideoId);if(!e)return;let t=this.container.querySelector(`#yt-capture-panel-container`);new w(t,this.deckId,e.title,this.activeVideoId,this.currentVideoTime,(e,t)=>{this.topBar.updateCounter(this.playlist.videos.length+1,this.playlist.videos.length+1),this.showToast(`Page saved: ${e.title}`,`success`);let n=new CustomEvent(`app-page-captured`,{detail:{pageId:e.pageId}});document.dispatchEvent(n),t&&this.playerComponent&&this.playerComponent.play()},()=>{t.innerHTML=``}).render()}setupTtsListeners(){this.ttsBoundaryHandler=e=>{this.subtitleBarComponent&&this.subtitleBarComponent.updateProgress(e.detail.charIndex)},this.ttsEndHandler=()=>{this.stopTts()},this.ttsPauseHandler=()=>{this.subtitleBarComponent&&this.subtitleBarComponent.updatePlayPauseState(!1)},this.ttsResumeHandler=()=>{this.subtitleBarComponent&&this.subtitleBarComponent.updatePlayPauseState(!0)},document.addEventListener(`tts-boundary`,this.ttsBoundaryHandler),document.addEventListener(`tts-end`,this.ttsEndHandler),document.addEventListener(`tts-pause`,this.ttsPauseHandler),document.addEventListener(`tts-resume`,this.ttsResumeHandler)}async showLatestPagePreview(){if(o.isPlaying)return;let{getPagesForDeck:e}=await a(async()=>{let{getPagesForDeck:e}=await import(`./pages-xlalZbIM.js`).then(e=>e.r);return{getPagesForDeck:e}},__vite__mapDeps([4,1,3,5])),t=await e(this.deckId);if(t.length===0)return;t.sort((e,t)=>new Date(t.createdAt)-new Date(e.createdAt));let n=t[0],r=this.container.querySelector(`#yt-latest-preview-container`);this.latestPreviewComponent?this.latestPreviewComponent.page=n:this.latestPreviewComponent=new E(r,n,e=>{this.hideLatestPagePreview(),this.startTts(e)}),this.latestPreviewComponent.render()}hideLatestPagePreview(){this.latestPreviewComponent&&this.latestPreviewComponent.destroy()}openTtsSelector(){if(o.isPlaying){this.stopTts();return}this.hideLatestPagePreview();let e=this.container.querySelector(`#yt-tts-selector-container`);new D(e,this.deckId,e=>{this.startTts(e)},()=>{e.innerHTML=``}).render()}startTts(e){this.playerComponent&&this.playerComponent.pause();let t=e.textBlock?.rawText||``;if(!t){this.showToast(`No text found on this page.`,`error`);return}this.ttsMicComponent.setActive(!0),this.subtitleBarComponent.render(),this.subtitleBarComponent.updateText(t),this.subtitleBarComponent.updatePlayPauseState(!0),o.play(t)}stopTts(){o.stop(),this.ttsMicComponent&&this.ttsMicComponent.setActive(!1),this.subtitleBarComponent&&this.subtitleBarComponent.close()}showToast(e,t=`info`){let n=new CustomEvent(`app-toast`,{detail:{message:e,type:t}});document.dispatchEvent(n)}};export{k as YouTubeMode};