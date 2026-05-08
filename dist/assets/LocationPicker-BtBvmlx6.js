var e=class{constructor(e,t,n,r,i,a,o){this.anchorEl=e,this.sections=t,this.subsections=n,this.lastSubsectionId=r,this.onSelect=i,this.onCreateNew=a,this.onCancel=o,this.el=null}render(){this.close(),this.el=document.createElement(`div`),this.el.className=`location-picker`,this.el.setAttribute(`role`,`dialog`),this.el.setAttribute(`aria-label`,`Choose where to save this page`),this.el.style.cssText=`
      position: absolute; z-index: 200;
      background: var(--bg-elevated); border: 1px solid var(--border-default);
      border-radius: var(--radius-md); box-shadow: var(--shadow-elevated);
      width: 300px; max-height: 260px; overflow-y: auto;
      padding: 8px 0; font-size: 13px;
    `;let e=this.anchorEl.getBoundingClientRect();this.el.style.top=e.bottom+4+`px`,this.el.style.left=e.left+`px`,this.el.style.position=`fixed`;let t=`<div style="padding: 4px 12px 8px; font-weight: 600; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">Save to:</div>`;this.sections.forEach(e=>{let n=this.subsections.filter(t=>t.sectionId===e.sectionId).sort((e,t)=>e.order-t.order);t+=`<div style="padding: 4px 12px; font-weight: 600; color: var(--section-header-text); font-size: 12px;">${e.title}</div>`,n.forEach(n=>{let r=n.subsectionId===this.lastSubsectionId;t+=`
          <div class="lp-item" data-sub-id="${n.subsectionId}" data-section-id="${e.sectionId}" style="
            padding: 5px 12px 5px 24px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;
            ${r?`background: rgba(29,158,117,0.1);`:``}
          ">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--text-tertiary);">●</span>
              ${n.title}
              ${r?`<span style="font-size: 10px; color: var(--accent-primary);">last used</span>`:``}
            </span>
            <span class="lp-select-btn" style="font-size: 11px; color: var(--accent-primary); font-weight: 500;">Select</span>
          </div>
        `})}),t+=`
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="lp-item lp-create-new" style="padding: 6px 12px; cursor: pointer; color: var(--accent-primary); font-size: 12px;">
        <i class="ti ti-plus" style="font-size: 12px;"></i> Create new section & subsection
      </div>
      <div style="border-top: 1px solid var(--border-default); margin: 4px 0;"></div>
      <div class="lp-item lp-cancel" style="padding: 6px 12px; cursor: pointer; color: var(--text-secondary); text-align: center; font-size: 12px;">Cancel</div>
    `,this.el.innerHTML=t,document.body.appendChild(this.el),this.el.querySelectorAll(`.lp-item[data-sub-id]`).forEach(e=>{e.addEventListener(`mouseenter`,()=>e.style.background=`var(--bg-hover)`),e.addEventListener(`mouseleave`,()=>{let t=e.getAttribute(`data-sub-id`)===this.lastSubsectionId;e.style.background=t?`rgba(29,158,117,0.1)`:`transparent`}),e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-sub-id`),n=e.getAttribute(`data-section-id`);localStorage.setItem(`studycanvas_last_subsection`,t),this.close(),this.onSelect&&this.onSelect(n,t)})});let n=this.el.querySelector(`.lp-create-new`);n&&(n.addEventListener(`mouseenter`,()=>n.style.background=`var(--bg-hover)`),n.addEventListener(`mouseleave`,()=>n.style.background=`transparent`),n.addEventListener(`click`,()=>{this.close(),this.onCreateNew&&this.onCreateNew()}));let r=this.el.querySelector(`.lp-cancel`);r&&(r.addEventListener(`mouseenter`,()=>r.style.background=`var(--bg-hover)`),r.addEventListener(`mouseleave`,()=>r.style.background=`transparent`),r.addEventListener(`click`,()=>this.close())),setTimeout(()=>{this._outsideHandler=e=>{this.el?.contains(e.target)||this.close()},document.addEventListener(`click`,this._outsideHandler)},10)}close(){this.el&&=(this.el.remove(),null),this._outsideHandler&&=(document.removeEventListener(`click`,this._outsideHandler),null),this.onCancel&&this.onCancel()}};export{e as LocationPicker};