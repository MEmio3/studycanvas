const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/images-CTlo234R.js","assets/rolldown-runtime-lhHHWwHU.js","assets/db-DL--i787.js","assets/uuid-Cwm_e2Hs.js","assets/AnnotationLayer-CgtKMBro.js"])))=>i.map(i=>d[i]);
import{t as e}from"./index-BQ7shzT3.js";import{t}from"./tts-DqPZvN8W.js";var n=class{constructor(e,t){this.container=e,this.page=t,this.activeImageIndex=0}render(){let e=this.page.textBlock?.sentences||[],t=``;t=e.length>0?e.map((e,t)=>`<span id="sentence-${t}" style="transition: background-color 0.3s;">${e.text}</span>`).join(` `):this.page.textBlock?.rawText||`No text added yet.`;let n=this.page.images.length>0?this.page.images[this.activeImageIndex]:null;this.container.innerHTML=`
      <div class="slide-canvas animate-fade-in" style="display: flex; height: 100%; background: var(--bg-base);">
        <div style="flex: 50%; padding: var(--space-24); display: flex; flex-direction: column; border-right: 1px solid var(--border-default);">
          <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; border-radius: var(--radius-lg); overflow: hidden; position: relative;">
            ${n?`
              <div id="img-wrapper" style="position: relative; display: inline-block; max-width: 100%; max-height: 100%;">
                <img id="slide-img" src="" style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;">
                <div id="annotation-layer-container"></div>
              </div>
            `:`<div style="color: var(--text-tertiary);">No image</div>`}
            ${this.page.images.length>1?`
              <div style="position: absolute; bottom: 16px; display: flex; gap: var(--space-8); justify-content: center; width: 100%;">
                ${this.page.images.map((e,t)=>`<div style="width: 8px; height: 8px; border-radius: 50%; background: ${t===this.activeImageIndex?`var(--text-primary)`:`rgba(255,255,255,0.3)`};"></div>`).join(``)}
              </div>
            `:``}
          </div>
          ${n&&n.caption?`<div style="margin-top: var(--space-12); text-align: center;" class="caption-text">${n.caption}</div>`:``}
        </div>
        <div style="flex: 50%; padding: var(--space-32); overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-24);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="pill">${this.page.textBlock?.source||`Manual`}</div>
              ${this.page.videoTimestamp?`
                <div class="pill" style="cursor: pointer; background: rgba(29, 158, 117, 0.1); color: var(--watch-complete-color); border: 1px solid var(--watch-complete-color);" onclick="document.dispatchEvent(new CustomEvent('app-watch-jump', { detail: { videoId: '${this.page.videoTimestamp.videoId}', time: ${this.page.videoTimestamp.seconds} } }))">
                  <i class="ti ti-brand-youtube"></i> ${this.page.videoTimestamp.formatted}
                </div>
              `:``}
            </div>
            <button class="primary icon-only" id="btn-tts-toggle" style="border-radius: 50%; width: 40px; height: 40px;"><i class="ti ti-player-play" id="tts-icon" style="font-size: 24px;"></i></button>
          </div>
          <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap;" id="slide-text-content">${t}</div>
        </div>
      </div>
    `,n&&this.loadImage(n.storageKey),this.attachEvents()}async loadImage(t){let{getImage:n}=await e(async()=>{let{getImage:e}=await import(`./images-CTlo234R.js`).then(e=>e.n);return{getImage:e}},__vite__mapDeps([0,1,2,3])),{AnnotationLayer:r}=await e(async()=>{let{AnnotationLayer:e}=await import(`./AnnotationLayer-CgtKMBro.js`).then(e=>e.n);return{AnnotationLayer:e}},__vite__mapDeps([4,1])),i=await n(t);if(i&&i.blob){let e=URL.createObjectURL(i.blob),t=this.container.querySelector(`#slide-img`);t&&(t.onload=()=>{this.annotationLayer=new r(this.container.querySelector(`#annotation-layer-container`),this.page.images[this.activeImageIndex],this.page,!0,e=>{e.sentenceIndex>=0&&document.dispatchEvent(new CustomEvent(`scroll-to-sentence`,{detail:{sentenceIndex:e.sentenceIndex}}))}),this.annotationLayer.render()},t.src=e)}}attachEvents(){let e=this.container.querySelector(`#btn-tts-toggle`),n=this.container.querySelector(`#tts-icon`);e&&e.addEventListener(`click`,()=>{t.isPlaying?(t.stop(),n.className=`ti ti-player-play`):(t.play(this.page.textBlock?.rawText||``,()=>{n.className=`ti ti-player-play`}),n.className=`ti ti-player-stop`)}),this.keydownHandler=e=>{e.key===`ArrowRight`?document.dispatchEvent(new CustomEvent(`slide-next`)):e.key===`ArrowLeft`?document.dispatchEvent(new CustomEvent(`slide-prev`)):e.key===`ArrowUp`?this.activeImageIndex>0&&(this.activeImageIndex--,this.render()):e.key===`ArrowDown`&&this.activeImageIndex<this.page.images.length-1&&(this.activeImageIndex++,this.render())},document.addEventListener(`keydown`,this.keydownHandler),this.scrollToSentenceHandler=e=>{let t=this.container.querySelector(`#sentence-${e.detail.sentenceIndex}`);t&&(t.scrollIntoView({behavior:`smooth`,block:`center`}),t.style.backgroundColor=`var(--bg-hover)`,setTimeout(()=>t.style.backgroundColor=`transparent`,2e3))},document.addEventListener(`scroll-to-sentence`,this.scrollToSentenceHandler)}unmount(){t.stop(),document.removeEventListener(`keydown`,this.keydownHandler),document.removeEventListener(`scroll-to-sentence`,this.scrollToSentenceHandler)}};export{n as SlideCanvas};