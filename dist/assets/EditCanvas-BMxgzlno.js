const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/images-D8yy03Ac.js","assets/rolldown-runtime-lhHHWwHU.js","assets/db-CmEX-cIt.js","assets/uuid-BG5b7wHq.js"])))=>i.map(i=>d[i]);
import{a as e}from"./pages-CIjfpH2s.js";import{t}from"./index-CN19KrK4.js";import{t as n}from"./AnnotationLayer-CgtKMBro.js";import{r}from"./images-D8yy03Ac.js";var i=class{constructor(e,t,n,r,i,a){this.page=e,this.imageRecord=t,this.annotation=n,this.annotationIndex=r,this.onSave=i,this.onCancel=a}render(){this.overlay=document.createElement(`div`),this.overlay.className=`modal-overlay flex-center animate-fade-in`,this.overlay.style.position=`fixed`,this.overlay.style.top=`0`,this.overlay.style.left=`0`,this.overlay.style.width=`100vw`,this.overlay.style.height=`100vh`,this.overlay.style.backgroundColor=`rgba(0,0,0,0.5)`,this.overlay.style.zIndex=`1000`;let e=(this.page.textBlock?.sentences||[]).map((e,t)=>`<option value="${t}" ${this.annotation.sentenceIndex===t?`selected`:``}>${t+1}: ${e.text.substring(0,30)}...</option>`).join(``);this.overlay.innerHTML=`
      <div class="modal-content" style="background: var(--bg-surface); padding: var(--space-24); border-radius: var(--radius-lg); width: 400px; max-width: 90vw; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <h3 style="margin-bottom: var(--space-16);">Edit Annotation</h3>
        
        <div style="margin-bottom: var(--space-16);">
          <label style="display: block; margin-bottom: var(--space-4); font-size: 14px;">Link to Sentence</label>
          <select id="ann-sentence" style="width: 100%; padding: var(--space-8); border-radius: var(--radius-md); border: 1px solid var(--border-default); background: var(--bg-base);">
            <option value="-1">-- Unlinked --</option>
            ${e}
          </select>
        </div>

        <div style="margin-bottom: var(--space-24);">
          <label style="display: block; margin-bottom: var(--space-4); font-size: 14px;">Marker Color</label>
          <input type="color" id="ann-color" value="${this.annotation.color||`#3B82F6`}" style="width: 100%; height: 40px;">
        </div>

        <div class="flex-between">
          <button class="ghost" id="btn-ann-delete" style="color: var(--danger);">Delete</button>
          <div style="display: flex; gap: var(--space-8);">
            <button class="ghost" id="btn-ann-cancel">Cancel</button>
            <button class="primary" id="btn-ann-save">Save</button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.overlay),this.attachEvents()}attachEvents(){this.overlay.querySelector(`#btn-ann-cancel`).addEventListener(`click`,()=>{this.close(),this.onCancel&&this.onCancel()}),this.overlay.querySelector(`#btn-ann-delete`).addEventListener(`click`,async()=>{this.annotationIndex>=0&&(this.imageRecord.annotations.splice(this.annotationIndex,1),await e(this.page)),this.close(),this.onSave&&this.onSave()}),this.overlay.querySelector(`#btn-ann-save`).addEventListener(`click`,async()=>{let t=parseInt(this.overlay.querySelector(`#ann-sentence`).value,10),n=this.overlay.querySelector(`#ann-color`).value;this.annotation.sentenceIndex=t,this.annotation.color=n,this.imageRecord.annotations||(this.imageRecord.annotations=[]),this.annotationIndex>=0?this.imageRecord.annotations[this.annotationIndex]=this.annotation:this.imageRecord.annotations.push(this.annotation),await e(this.page),this.close(),this.onSave&&this.onSave()})}close(){this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay)}},a=class{constructor(e,t){this.container=e,this.page=t,this.activeImageIndex=0}render(){if(this.page.images.length===0)this.container.innerHTML=`
        <div class="flex-center" style="height: 100%; padding: var(--space-32);">
          <div id="drop-zone" style="border: 2px dashed var(--border-default); border-radius: var(--radius-lg); width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; transition: border-color var(--transition-fast);">
            <i class="ti ti-photo-plus" style="font-size: 48px; margin-bottom: var(--space-16); color: var(--text-tertiary);"></i>
            <p>Drop screenshots here or click to upload</p>
            <p style="font-size: 12px; margin-top: var(--space-8);">(Ctrl+V to paste)</p>
            <input type="file" id="file-input" accept="image/*" style="display: none;" multiple>
          </div>
        </div>
      `,this.attachDropEvents();else{let t=this.page.images[this.activeImageIndex],n=this.page.images.length>1?`
        <div style="display: flex; gap: var(--space-8); padding: var(--space-8); overflow-x: auto; border-top: 1px solid var(--border-default); background: var(--bg-surface);">
          ${this.page.images.map((e,t)=>`
            <div class="thumbnail-btn" data-index="${t}" style="width: 48px; height: 36px; background: #000; border-radius: var(--radius-sm); border: 2px solid ${t===this.activeImageIndex?`var(--accent-primary)`:`transparent`}; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="ti ti-photo" style="color: white; font-size: 16px;"></i>
            </div>
          `).join(``)}
        </div>
      `:``;this.container.innerHTML=`
        <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative;">
          <div style="padding: var(--space-8); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center;">
            <span class="meta-text">${this.activeImageIndex+1} / ${this.page.images.length} images</span>
            <div>
              <button class="ghost icon-only" id="btn-add-img" title="Add Image"><i class="ti ti-plus"></i></button>
              <button class="ghost icon-only" id="btn-delete-img" title="Delete Image" style="color: var(--danger);"><i class="ti ti-trash"></i></button>
            </div>
            <input type="file" id="add-img-input" accept="image/*" style="display: none;" multiple>
          </div>
          <div style="flex-grow: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; position: relative;" id="img-display-area">
             <div id="img-wrapper" style="position: relative; display: inline-block; max-width: 100%; max-height: 100%;">
               <img id="active-image" src="" style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;">
               <div id="annotation-layer-container"></div>
             </div>
          </div>
          ${n}
          <div style="padding: var(--space-12); border-top: 1px solid var(--border-default); background: var(--bg-surface);">
            <input type="text" placeholder="Add image caption..." value="${t.caption||``}" id="img-caption">
          </div>
        </div>
      `,this.loadImage(t.storageKey),this.attachCaptionEvents(t);let r=this.container.querySelector(`#btn-add-img`),i=this.container.querySelector(`#add-img-input`);r.addEventListener(`click`,()=>i.click()),i.addEventListener(`change`,e=>this.handleFiles(Array.from(e.target.files))),this.container.querySelector(`#btn-delete-img`).addEventListener(`click`,async()=>{confirm(`Delete this image?`)&&(this.page.images.splice(this.activeImageIndex,1),this.activeImageIndex=Math.max(0,this.activeImageIndex-1),await e(this.page),this.render())}),this.container.querySelectorAll(`.thumbnail-btn`).forEach(e=>{e.addEventListener(`click`,e=>{this.activeImageIndex=parseInt(e.currentTarget.getAttribute(`data-index`),10),this.render()})})}}async loadImage(e){let{getImage:r}=await t(async()=>{let{getImage:e}=await import(`./images-D8yy03Ac.js`).then(e=>e.n);return{getImage:e}},__vite__mapDeps([0,1,2,3])),a=await r(e);if(a&&a.blob){let e=URL.createObjectURL(a.blob),t=this.container.querySelector(`#active-image`);t&&(t.onload=()=>{this.annotationLayer=new n(this.container.querySelector(`#annotation-layer-container`),this.page.images[this.activeImageIndex],this.page,!0,(e,t)=>{new i(this.page,this.page.images[0],e,t,()=>this.render(),null).render()}),this.annotationLayer.render()},t.src=e)}}attachDropEvents(){let e=this.container.querySelector(`#drop-zone`),t=this.container.querySelector(`#file-input`);e&&(e.addEventListener(`click`,()=>t.click()),t.addEventListener(`change`,e=>{this.handleFiles(Array.from(e.target.files))}),e.addEventListener(`dragover`,t=>{t.preventDefault(),e.style.borderColor=`var(--accent-primary)`,e.style.backgroundColor=`var(--bg-hover)`}),e.addEventListener(`dragleave`,t=>{t.preventDefault(),e.style.borderColor=`var(--border-default)`,e.style.backgroundColor=`transparent`}),e.addEventListener(`drop`,t=>{t.preventDefault(),e.style.borderColor=`var(--border-default)`,e.style.backgroundColor=`transparent`,t.dataTransfer.files&&this.handleFiles(Array.from(t.dataTransfer.files))}),this.pasteHandler=this.handlePaste.bind(this),document.addEventListener(`paste`,this.pasteHandler))}handlePaste(e){if(!this.container.isConnected){document.removeEventListener(`paste`,this.pasteHandler);return}let t=(e.clipboardData||e.originalEvent.clipboardData).items,n=[];for(let e of t)e.type.indexOf(`image`)!==-1&&n.push(e.getAsFile());n.length>0&&this.handleFiles(n)}async handleFiles(n){let i=n.filter(e=>e.type.startsWith(`image/`));if(i.length!==0){for(let e of i){let n=await r(e,e.type,0,0),{generateId:i}=await t(async()=>{let{generateId:e}=await import(`./uuid-BG5b7wHq.js`).then(e=>e.n);return{generateId:e}},__vite__mapDeps([3,1]));this.page.images.push({imageId:i(),storageKey:n,filename:e.name,mimeType:e.type,width:0,height:0,caption:``,annotations:[]})}await e(this.page),this.render()}}attachCaptionEvents(t){let n=this.container.querySelector(`#img-caption`);n&&n.addEventListener(`blur`,async()=>{t.caption=n.value,await e(this.page)})}},o=class{constructor(e,t){this.container=e,this.page=t}render(){if(this.container.innerHTML=`
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div style="padding: var(--space-8) var(--space-16); border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between;">
          <div class="pill" style="cursor: pointer; background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-default);">${this.page.textBlock.source||`Manual`} <i class="ti ti-chevron-down" style="font-size: 10px;"></i></div>
          <div class="meta-text" id="word-count">0 words</div>
        </div>
        <div style="flex-grow: 1; padding: var(--space-16); overflow-y: auto;">
          <div id="text-editor" contenteditable="true" style="min-height: 100%; outline: none; white-space: pre-wrap; line-height: 1.6;" data-placeholder="Paste your AI response here, or type your explanation..."></div>
        </div>
        <div style="padding: var(--space-8) var(--space-16); border-top: 1px solid var(--border-default); background: var(--bg-surface); display: flex; gap: var(--space-8);">
          <button class="ghost icon-only" title="Paste from AI"><i class="ti ti-clipboard"></i></button>
          <button class="ghost icon-only" title="Clear text" id="btn-clear"><i class="ti ti-eraser"></i></button>
          <button class="ghost icon-only" title="Edit Sentences" id="btn-edit-sentences"><i class="ti ti-cut"></i></button>
          <div style="flex-grow: 1;"></div>
          <button class="ghost icon-only" title="Preview TTS"><i class="ti ti-player-play"></i></button>
        </div>
      </div>
    `,!document.getElementById(`editor-placeholder-css`)){let e=document.createElement(`style`);e.id=`editor-placeholder-css`,e.textContent=`
        #text-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text-tertiary);
          pointer-events: none;
        }
      `,document.head.appendChild(e)}this.attachEvents(),this.populateText()}populateText(){let e=this.container.querySelector(`#text-editor`);this.page.textBlock&&this.page.textBlock.rawText&&(e.innerText=this.page.textBlock.rawText),this.updateWordCount()}attachEvents(){let t=this.container.querySelector(`#text-editor`),n;t.addEventListener(`input`,()=>{this.updateWordCount(),clearTimeout(n),n=setTimeout(async()=>{this.page.textBlock.rawText=t.innerText,this.segmentSentences(t.innerText),await e(this.page)},1e3)}),this.container.querySelector(`#btn-clear`).addEventListener(`click`,async()=>{confirm(`Clear all text?`)&&(t.innerText=``,this.page.textBlock.rawText=``,this.page.textBlock.sentences=[],await e(this.page),this.updateWordCount())});let r=this.container.querySelector(`#btn-edit-sentences`);r&&r.addEventListener(`click`,()=>this.toggleEditSentences())}toggleEditSentences(){this.isEditSentencesMode=!this.isEditSentencesMode;let t=this.container.querySelector(`#text-editor`),n=this.container.querySelector(`#btn-edit-sentences`);this.isEditSentencesMode?(n.classList.replace(`ghost`,`primary`),t.contentEditable=`false`,this.renderSentencesForEditing()):(n.classList.replace(`primary`,`ghost`),t.contentEditable=`true`,this.page.textBlock.rawText=this.page.textBlock.sentences.map(e=>e.text).join(` `),t.innerText=this.page.textBlock.rawText,e(this.page),this.updateWordCount())}renderSentencesForEditing(){let e=this.container.querySelector(`#text-editor`);e.innerHTML=``,this.page.textBlock.sentences.forEach((t,n)=>{let r=document.createElement(`span`);if(r.className=`sentence-chunk`,r.style.lineHeight=`2`,t.text.split(/(\\s+)/).forEach((e,t)=>{let i=document.createElement(`span`);i.textContent=e,e.trim().length>0&&(i.style.cursor=`crosshair`,i.title=`Click to split sentence here`,i.addEventListener(`click`,e=>{e.stopPropagation(),this.splitSentence(n,t)}),i.addEventListener(`mouseenter`,()=>i.style.background=`rgba(29, 158, 117, 0.2)`),i.addEventListener(`mouseleave`,()=>i.style.background=`transparent`)),r.appendChild(i)}),e.appendChild(r),n<this.page.textBlock.sentences.length-1){let t=document.createElement(`span`);t.innerHTML=`<i class="ti ti-arrows-join-2"></i>`,t.className=`boundary-marker`,t.style.cursor=`pointer`,t.style.color=`var(--text-secondary)`,t.style.margin=`0 6px`,t.style.display=`inline-flex`,t.style.alignItems=`center`,t.style.justifyContent=`center`,t.style.background=`var(--bg-hover)`,t.style.padding=`2px 4px`,t.style.borderRadius=`4px`,t.style.border=`1px solid var(--border-default)`,t.title=`Click to merge sentences`,t.addEventListener(`click`,()=>{this.mergeSentences(n)}),e.appendChild(t)}})}mergeSentences(e){let t=this.page.textBlock.sentences[e],n=this.page.textBlock.sentences[e+1];t.text=t.text.trim()+` `+n.text.trim(),this.page.textBlock.sentences.splice(e+1,1),this.page.textBlock.sentences.forEach((e,t)=>e.index=t),this.renderSentencesForEditing()}splitSentence(e,t){let n=this.page.textBlock.sentences[e],r=n.text.split(/(\\s+)/),i=r.slice(0,t+1).join(``).trim(),a=r.slice(t+1).join(``).trim();i&&a&&(n.text=i,this.page.textBlock.sentences.splice(e+1,0,{index:e+1,text:a}),this.page.textBlock.sentences.forEach((e,t)=>e.index=t),this.renderSentencesForEditing())}updateWordCount(){let e=this.container.querySelector(`#text-editor`).innerText.trim(),t=e?e.split(/\s+/).length:0,n=this.container.querySelector(`#word-count`);n&&(n.textContent=`${t} words`)}segmentSentences(e){let t=e.match(/[^.!?]+[.!?]+/g)||(e?[e]:[]);this.page.textBlock.sentences=t.map((e,t)=>({index:t,text:e.trim()})).filter(e=>e.text.length>0)}},s=class{constructor(e,t){this.container=e,this.page=t}render(){this.container.innerHTML=`
      <div class="edit-canvas" style="display: flex; height: 100%;">
        <div id="image-zone-container" style="flex: 55%; border-right: 1px solid var(--border-default); display: flex; flex-direction: column;"></div>
        <div style="flex: 45%; display: flex; flex-direction: column; background: var(--bg-surface);">
          ${this.page.videoTimestamp?`
            <div style="padding: 8px 16px; background: rgba(29, 158, 117, 0.1); border-bottom: 1px solid var(--border-default); display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
              <span style="color: var(--text-secondary);"><i class="ti ti-video" style="margin-right: 4px;"></i> Captured from: <span style="color: var(--text-primary);">${this.page.videoTimestamp.videoTitle}</span> &middot; at ${this.page.videoTimestamp.formatted}</span>
              <button class="ghost" style="padding: 2px 8px; font-size: 11px; color: var(--watch-complete-color);" onclick="document.dispatchEvent(new CustomEvent('app-watch-jump', { detail: { videoId: '${this.page.videoTimestamp.videoId}', time: ${this.page.videoTimestamp.seconds} } }))">
                <i class="ti ti-player-play-filled"></i> Open in Watch mode
              </button>
            </div>
          `:``}
          <div id="text-zone-container" style="flex-grow: 1; display: flex; flex-direction: column; overflow: hidden;"></div>
        </div>
      </div>
    `,this.imageZone=new a(this.container.querySelector(`#image-zone-container`),this.page),this.imageZone.render(),this.textZone=new o(this.container.querySelector(`#text-zone-container`),this.page),this.textZone.render()}};export{s as EditCanvas};