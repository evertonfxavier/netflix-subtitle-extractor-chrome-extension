var g=Object.defineProperty;var S=(c,e,t)=>e in c?g(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var a=(c,e,t)=>S(c,typeof e!="symbol"?e+"":e,t);import{g as b,c as p}from"./formatters-DC878O5G.js";class m{constructor(){a(this,"isCapturing",!1);a(this,"observer",null);a(this,"currentSession",null);a(this,"lastSubtitleText","");a(this,"subtitleCheckInterval",null);a(this,"videoElement",null);a(this,"STYLES",`
    .nse-capture-indicator {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      background: rgba(229, 9, 20, 0.9);
      color: white;
      font-family: "Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    .nse-capture-indicator::before {
      content: "";
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      animation: nse-blink 1s infinite;
    }
    @keyframes nse-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .nse-live-panel {
      position: fixed;
      top: 50px;
      right: 10px;
      width: 350px;
      max-height: 400px;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid rgba(229, 9, 20, 0.5);
      border-radius: 8px;
      z-index: 999998;
      overflow: hidden;
      font-family: "Netflix Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .nse-live-header {
      padding: 10px 15px;
      background: rgba(229, 9, 20, 0.9);
      color: white;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nse-live-content {
      max-height: 340px;
      overflow-y: auto;
      padding: 10px;
    }
    .nse-live-content::-webkit-scrollbar {
      width: 6px;
    }
    .nse-live-content::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    .nse-live-content::-webkit-scrollbar-thumb {
      background: #e50914;
      border-radius: 3px;
    }
    .nse-subtitle-item {
      padding: 8px 10px;
      margin-bottom: 6px;
      background: rgba(40, 40, 40, 0.8);
      border-radius: 4px;
      border-left: 3px solid #e50914;
    }
    .nse-subtitle-time {
      font-size: 10px;
      color: #e50914;
      margin-bottom: 4px;
    }
    .nse-subtitle-text {
      font-size: 12px;
      color: #e5e5e5;
      line-height: 1.4;
    }
    .nse-subtitle-item.nse-latest {
      background: rgba(229, 9, 20, 0.2);
      border-left-color: #fff;
    }
    .nse-empty-message {
      text-align: center;
      color: #808080;
      font-size: 12px;
      padding: 20px;
    }
  `);a(this,"SELECTORS",{subtitleContainer:".player-timedtext",subtitleContainerAlt:'[data-uia="player-timedtext"]',subtitleText:".player-timedtext-text-container",subtitleSpan:".player-timedtext span",videoPlayer:"video",titleElement:'[data-uia="video-title"]',episodeInfo:'[data-uia="video-title"] span'});this.init()}init(){console.log("[Netflix Subtitle Extractor] Initializing..."),this.injectStyles(),chrome.runtime.onMessage.addListener((e,t,i)=>(this.handleMessage(e,i),!0)),this.observeUrlChanges(),this.checkForPlayer(),console.log("[Netflix Subtitle Extractor] Ready!")}injectStyles(){const e=document.createElement("style");e.id="nse-styles",e.textContent=this.STYLES,document.head.appendChild(e)}handleMessage(e,t){switch(e.type){case"START_CAPTURE":this.startCapture(),t({success:!0});break;case"STOP_CAPTURE":this.stopCapture(),t({success:!0,session:this.currentSession});break;case"GET_STATUS":t(this.getStatus());break;case"GET_CONTENT_INFO":t(this.getContentInfo());break;case"GET_CURRENT_SESSION":t({session:this.currentSession});break;case"CLEAR_SESSION":this.clearCurrentSession(),t({success:!0});break;default:t({error:"Unknown message type"})}}getStatus(){var e,t;return{isCapturing:this.isCapturing,subtitleCount:((e=this.currentSession)==null?void 0:e.entries.length)||0,currentTitle:((t=this.currentSession)==null?void 0:t.title)||null,contentInfo:this.getContentInfo()}}getContentInfo(){var u,d,h;const e=document.querySelector(this.SELECTORS.titleElement),t=this.findSubtitleContainer(),i=document.querySelector(this.SELECTORS.videoPlayer);if(!i)return null;const o=((d=(((u=e==null?void 0:e.textContent)==null?void 0:u.split(":"))||[])[0])==null?void 0:d.trim())||"Unknown";let s,l;const r=(h=e==null?void 0:e.textContent)==null?void 0:h.match(/S(\d+):E(\d+)|(?:Season\s*(\d+).*Episode\s*(\d+))|(?:T(\d+):E(\d+))/i);return r&&(s=r[1]||r[3]||r[5],l=r[2]||r[4]||r[6]),{title:o,season:s,episode:l,isPlaying:!i.paused,hasSubtitles:!!t}}findSubtitleContainer(){return document.querySelector(this.SELECTORS.subtitleContainer)||document.querySelector(this.SELECTORS.subtitleContainerAlt)||document.querySelector(this.SELECTORS.subtitleText)}startCapture(){if(this.isCapturing){console.log("[Netflix Subtitle Extractor] Already capturing");return}console.log("[Netflix Subtitle Extractor] Starting capture..."),this.isCapturing=!0;const e=this.getContentInfo();this.currentSession={id:b(),title:(e==null?void 0:e.title)||"Unknown",season:e==null?void 0:e.season,episode:e==null?void 0:e.episode,language:this.detectLanguage(),entries:[],createdAt:Date.now(),updatedAt:Date.now()},this.videoElement=document.querySelector(this.SELECTORS.videoPlayer),this.showLivePanel(),this.startSubtitleObserver(),this.startSubtitlePolling(),chrome.runtime.sendMessage({type:"CAPTURE_STARTED",data:{session:this.currentSession}})}stopCapture(){this.isCapturing&&(console.log("[Netflix Subtitle Extractor] Stopping capture..."),this.isCapturing=!1,this.hideLivePanel(),this.observer&&(this.observer.disconnect(),this.observer=null),this.subtitleCheckInterval&&(clearInterval(this.subtitleCheckInterval),this.subtitleCheckInterval=null),this.currentSession&&(this.currentSession.updatedAt=Date.now(),chrome.runtime.sendMessage({type:"SAVE_SESSION",data:{session:this.currentSession}})),chrome.runtime.sendMessage({type:"CAPTURE_STOPPED",data:{session:this.currentSession}}))}startSubtitleObserver(){this.observer=new MutationObserver(e=>{for(const t of e)(t.type==="childList"||t.type==="characterData")&&this.checkAndCaptureSubtitle()}),this.observer.observe(document.body,{childList:!0,subtree:!0,characterData:!0})}startSubtitlePolling(){this.subtitleCheckInterval=window.setInterval(()=>{this.checkAndCaptureSubtitle()},100)}checkAndCaptureSubtitle(){var s;if(!this.isCapturing||!this.currentSession)return;const e=this.findSubtitleContainer();if(!e)return;let t="";if(t=((s=e.textContent)==null?void 0:s.trim())||"",!t){const l=e.querySelectorAll("span");t=Array.from(l).map(r=>r.textContent).join(" ").trim()}if(t||(t=p(e.innerHTML)),!t||t===this.lastSubtitleText)return;this.lastSubtitleText=t;const i=this.videoElement?Math.floor(this.videoElement.currentTime*1e3):Date.now()-this.currentSession.createdAt,n=this.currentSession.entries[this.currentSession.entries.length-1];n&&!n.endTime&&(n.endTime=i);const o={index:this.currentSession.entries.length+1,startTime:i,endTime:0,text:p(t)};this.currentSession.entries.push(o),this.currentSession.updatedAt=Date.now(),console.log(`[Netflix Subtitle Extractor] Captured: "${t.substring(0,50)}..."`),this.updateLivePanel(o),chrome.runtime.sendMessage({type:"SUBTITLE_CAPTURED",data:{entry:o,totalCount:this.currentSession.entries.length}})}formatTime(e){const t=Math.floor(e/1e3),i=Math.floor(t/60),n=t%60;return`${i.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`}showLivePanel(){this.hideLivePanel();const e=document.createElement("div");e.id="nse-capture-indicator",e.className="nse-capture-indicator",e.innerHTML="<span>GRAVANDO</span>",document.body.appendChild(e);const t=document.createElement("div");t.id="nse-live-panel",t.className="nse-live-panel",t.innerHTML=`
      <div class="nse-live-header">
        <span>📝 Legendas Capturadas</span>
        <span id="nse-count">0</span>
      </div>
      <div class="nse-live-content" id="nse-live-content">
        <div class="nse-empty-message">Aguardando legendas...</div>
      </div>
    `,document.body.appendChild(t)}hideLivePanel(){var e,t;(e=document.getElementById("nse-capture-indicator"))==null||e.remove(),(t=document.getElementById("nse-live-panel"))==null||t.remove()}updateLivePanel(e){const t=document.getElementById("nse-live-content"),i=document.getElementById("nse-count");if(!t||!this.currentSession)return;const n=t.querySelector(".nse-empty-message");n&&n.remove();const o=t.querySelector(".nse-latest");o&&o.classList.remove("nse-latest");const s=document.createElement("div");s.className="nse-subtitle-item nse-latest",s.innerHTML=`
      <div class="nse-subtitle-time">${this.formatTime(e.startTime)} - #${e.index}</div>
      <div class="nse-subtitle-text">${e.text}</div>
    `,t.insertBefore(s,t.firstChild),i&&(i.textContent=this.currentSession.entries.length.toString());const l=t.querySelectorAll(".nse-subtitle-item");l.length>50&&l[l.length-1].remove()}detectLanguage(){const e=document.querySelector(".watch-video"),t=e==null?void 0:e.getAttribute("lang"),i=document.querySelector('[data-uia="track-selector-subtitle"] .track-selector-item-selected');return(i==null?void 0:i.getAttribute("data-track-id"))||t||"unknown"}observeUrlChanges(){let e=location.href;new MutationObserver(()=>{location.href!==e&&(e=location.href,console.log("[Netflix Subtitle Extractor] URL changed:",e),this.isCapturing&&this.stopCapture(),this.checkForPlayer())}).observe(document.body,{subtree:!0,childList:!0})}checkForPlayer(){/\/watch\//.test(location.href)&&console.log("[Netflix Subtitle Extractor] Watch page detected")}clearCurrentSession(){this.currentSession=null,this.lastSubtitleText=""}}new m;
