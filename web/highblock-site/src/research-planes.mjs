// Selected research planes visual. Investment copy is supplied by the approved bilingual source.
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function nodeButtons(c, key, extraClass = '') {
  return `<div class="concept-node-tabs ${extraClass}" role="tablist" aria-orientation="vertical" aria-label="${esc(c.philosophy)}">${c.nodes.map((label,i)=>`<button type="button" role="tab" class="${i===0?'is-active':''}" id="${key}-node-tab-${i}" aria-controls="${key}-node-panel-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-concept-node="${i}">${esc(label)}</button>`).join('')}</div>`;
}

function nodePanels(c, key, extraClass = '') {
  return c.nodeText.map(([title,body],i)=>`<div class="concept-node-panel ${extraClass}" role="tabpanel" id="${key}-node-panel-${i}" aria-labelledby="${key}-node-tab-${i}" tabindex="0" data-concept-panel="${i}" ${i?'hidden':''}><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`).join('');
}

function glassPlane(id, index, offset, active = false) {
  const y = n => n + offset;
  return `<g class="research-plane plane-${index}${active ? ' is-active' : ''}" data-concept-mark="${index}">
    <path class="plane-thickness" d="M106 ${y(206)}L428 ${y(82)}L674 ${y(230)}V${y(244)}L352 ${y(368)}L106 ${y(220)}Z" fill="url(#${id}-side)"/>
    <path class="plane-face" d="M106 ${y(206)}L428 ${y(82)}L674 ${y(230)}L352 ${y(354)}Z" fill="url(#${id}-glass)"/>
    <path class="plane-inner" d="M140 ${y(208)}L427 ${y(98)}L639 ${y(227)}L352 ${y(337)}Z"/>
    <g class="plane-grain">
      ${Array.from({ length: 13 }, (_, j) => {
        const f = (j + 1) / 14;
        const x1 = 106 + 246 * f;
        const yy1 = 206 + 148 * f;
        return `<path d="M${x1.toFixed(2)} ${y(yy1).toFixed(2)}l322 -124"/>`;
      }).join('')}
      ${Array.from({ length: 8 }, (_, j) => {
        const f = (j + 1) / 9;
        return `<path d="M${(106 + 322 * f).toFixed(2)} ${y(206 - 124 * f).toFixed(2)}l246 148"/>`;
      }).join('')}
    </g>
    <path class="plane-rim" d="M106 ${y(206)}L428 ${y(82)}L674 ${y(230)}L352 ${y(354)}Z"/>
    <path class="plane-front-edge" d="M106 ${y(206)}L352 ${y(354)}L674 ${y(230)}"/>
    <path class="plane-cut" d="M352 ${y(354)}v14M106 ${y(206)}v14M674 ${y(230)}v14"/>
    <path class="plane-reflection" d="M106 ${y(206)}L428 ${y(82)}L674 ${y(230)}"/>
  </g>`;
}

function planesVisual() {
  const id = 'research-planes-a';
  return `<div class="planes-visual" aria-hidden="true"><svg class="planes-art" viewBox="0 0 780 650" fill="none">
    <defs>
      <linearGradient id="${id}-glass" x1="184" y1="112" x2="540" y2="510" gradientUnits="userSpaceOnUse"><stop stop-color="#223149" stop-opacity=".94"/><stop offset=".44" stop-color="#182337" stop-opacity=".89"/><stop offset="1" stop-color="#0A111F" stop-opacity=".97"/></linearGradient>
      <linearGradient id="${id}-side" x1="220" y1="120" x2="580" y2="545" gradientUnits="userSpaceOnUse"><stop stop-color="#0E1728"/><stop offset=".5" stop-color="#293246"/><stop offset="1" stop-color="#101725"/></linearGradient>
      <radialGradient id="${id}-light"><stop stop-color="#26354D" stop-opacity=".48"/><stop offset="1" stop-color="#0A0E17" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-floor" x1="170" y1="540" x2="640" y2="540" gradientUnits="userSpaceOnUse"><stop stop-color="#C9A87C" stop-opacity="0"/><stop offset=".5" stop-color="#C9A87C" stop-opacity=".3"/><stop offset="1" stop-color="#C9A87C" stop-opacity="0"/></linearGradient>
    </defs>
    <ellipse cx="403" cy="315" rx="359" ry="300" fill="url(#${id}-light)"/>
    <g class="plane-scaffold"><path d="M106 185V456M428 61V332M674 209V480M352 333V604"/><path d="M82 458L352 621L704 485"/></g>
    ${glassPlane(id, 2, 170)}
    ${glassPlane(id, 1, 85)}
    ${glassPlane(id, 0, 0, true)}
    <path d="M126 554L351 690L652 574" stroke="url(#${id}-floor)" stroke-width=".8"/>
  </svg></div>`;
}


export function researchPlanes(c) {
  return `<div class="research-planes reveal" data-research-planes><div class="planes-layout">${planesVisual()}<div class="planes-content"><div class="planes-tabs">${nodeButtons(c, 'research')}</div><div class="planes-detail">${nodePanels(c, 'research')}</div></div></div></div>`;
}

export const researchPlanesCss = String.raw`
.research-planes{position:relative;overflow:hidden;background:#0A0E17;border:1px solid rgba(201,168,124,.17);border-radius:var(--radius-card);max-width:1440px;margin:48px auto 0;--pointer-x:0;--pointer-y:0}
.research-planes .planes-layout{display:grid;grid-template-columns:minmax(0,1.22fr) minmax(290px,.78fr);align-items:center;gap:clamp(24px,5vw,78px);padding:48px clamp(24px,5.5vw,88px) 48px 0;min-height:600px}
.research-planes .planes-visual{min-width:0;position:relative;isolation:isolate;align-self:center}
.research-planes .planes-art{display:block;width:100%;height:auto;overflow:visible;transform:translate(calc(var(--pointer-x,0)*6px),calc(var(--pointer-y,0)*4px));transition:transform .65s ease-out}
.research-planes .plane-scaffold{stroke:#62718A;stroke-width:.6;stroke-dasharray:2 7;opacity:.24}
.research-planes .research-plane{transform-box:fill-box;transform-origin:center;animation:hb-research-breathe 10s ease-in-out infinite}
.research-planes .plane-1{animation-delay:-3.5s}.research-planes .plane-2{animation-delay:-7s}
.research-planes .plane-face{opacity:.85;transition:opacity .6s}.research-planes .plane-rim{stroke:#71819A;stroke-width:.85;opacity:.34;transition:stroke .65s,opacity .65s}
.research-planes .plane-inner{stroke:#8091AC;stroke-width:.6;opacity:.12;transition:opacity .65s}
.research-planes .plane-grain{stroke:#8091AC;stroke-width:.4;opacity:.1;transition:opacity .65s}
.research-planes .plane-front-edge{stroke:#A38C6D;stroke-width:1;opacity:.32;transition:opacity .65s}
.research-planes .plane-cut{stroke:#A38C6D;stroke-width:.9;opacity:.44}
.research-planes .plane-reflection{stroke:#E2C69E;stroke-width:1.25;stroke-dasharray:80 730;stroke-dashoffset:0;opacity:0;transition:opacity .65s;animation:hb-research-reflection 9s ease-in-out infinite}
.research-planes .research-plane.is-active .plane-face{opacity:1}.research-planes .research-plane.is-active .plane-rim{stroke:#C9A87C;opacity:.86}.research-planes .research-plane.is-active .plane-inner{opacity:.3}.research-planes .research-plane.is-active .plane-grain{opacity:.2}.research-planes .research-plane.is-active .plane-front-edge{opacity:.85}.research-planes .research-plane.is-active .plane-reflection{opacity:.8}
.research-planes .planes-content{position:relative;z-index:1;min-width:0;padding:20px 0}
.research-planes .planes-tabs [role="tablist"]{display:flex;flex-direction:column;gap:0;border-top:1px solid rgba(201,168,124,.2)}
.research-planes .planes-tabs [role="tab"]{display:flex;align-items:center;text-align:left;justify-content:space-between;gap:20px;width:100%;padding:24px 0;background:transparent;border:0;border-bottom:1px solid rgba(201,168,124,.16);border-radius:0;color:#8D95A6;font-size:clamp(16px,1.5vw,21px);line-height:1.5;letter-spacing:.04em;transition:color .3s}
.research-planes .planes-tabs [role="tab"]::after{content:"";width:24px;height:1px;background:#C9A87C;opacity:.2;transform:scaleX(.55);transform-origin:right;transition:opacity .3s,transform .3s;flex-shrink:0}
.research-planes .planes-tabs [role="tab"][aria-selected="true"]{color:#E7D5B9}.research-planes .planes-tabs [role="tab"][aria-selected="true"]::after{opacity:1;transform:scaleX(1)}
.research-planes .planes-tabs [role="tab"]:hover{color:#E2C69E}.research-planes .planes-tabs [role="tab"]:focus-visible{outline:1px solid #C9A87C;outline-offset:5px}
.research-planes .planes-detail{padding-top:34px;min-height:185px}
.research-planes .planes-detail [role="tabpanel"]{max-width:460px}.research-planes .planes-detail h3{font-family:var(--display);margin:0 0 17px;font-weight:400;font-size:27px;line-height:1.5;color:#E7E8EB;letter-spacing:.03em}
.research-planes .planes-detail p{margin:0;color:#9BA3B3;font-size:14px;line-height:2}
@keyframes hb-research-breathe{0%,100%{transform:translateY(-3px)}50%{transform:translateY(3px)}}
@keyframes hb-research-reflection{0%,15%{stroke-dashoffset:80}85%,100%{stroke-dashoffset:-730}}

@media(max-width:1000px){.research-planes .planes-layout{gap:22px;padding-right:32px;min-height:500px}.research-planes .planes-tabs [role="tab"]{padding:19px 0}.research-planes .planes-detail{padding-top:25px;min-height:210px}.research-planes .planes-detail h3{font-size:20px}}
@media(max-width:700px){.research-planes{margin-top:30px}.research-planes .planes-layout{grid-template-columns:1fr;gap:0;padding:0 24px 36px;min-height:0}.research-planes .planes-visual{width:calc(100% + 48px);margin:0 -24px;max-height:420px;overflow:hidden}.research-planes .planes-art{max-height:440px}.research-planes .planes-content{padding:0}.research-planes .planes-tabs [role="tab"]{padding:18px 0;font-size:17px}.research-planes .planes-detail{min-height:170px;padding-top:25px}.research-planes .planes-detail h3{font-size:21px}.research-planes .planes-detail p{font-size:13px;line-height:1.95}}
@media(prefers-reduced-motion:reduce){.research-planes .research-plane,.research-planes .plane-reflection{animation:none}.research-planes .planes-art{transform:none;transition:none}.research-planes .plane-face,.research-planes .plane-rim,.research-planes .plane-inner,.research-planes .plane-grain,.research-planes .plane-front-edge,.research-planes .plane-reflection{transition:none}}
`;
