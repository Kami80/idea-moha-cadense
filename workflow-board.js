(() => {
  "use strict";

  const STORAGE_KEY = "cadence-workflow-studio-v1";
  const GRID = 24;
  const NODE_W = 210;
  const NODE_H = 120;
  const COLLAPSED_LANE_H = 62;
  const GROUP_PAD = 28;
  const THEMES = ["mint", "sky", "sand", "rose", "violet", "slate"];
  const THEME_LABELS = {
    mint: "Mint",
    sky: "Sky",
    sand: "Sand",
    rose: "Rose",
    violet: "Violet",
    slate: "Slate"
  };

  const deepClone = obj => JSON.parse(JSON.stringify(obj));
  const esc = (v="") => String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const xml = (v="") => String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  const uid = prefix => prefix + Math.random().toString(36).slice(2,9);
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

  const viewport = document.getElementById("boardViewport");
  const world = document.getElementById("boardWorld");
  const laneLayer = document.getElementById("laneLayer");
  const groupLayer = document.getElementById("groupLayer");
  const nodeLayer = document.getElementById("nodeLayer");
  const edgeLayer = document.getElementById("edgeLayer");
  const inspectorTitle = document.getElementById("inspectorTitle");
  const inspectorBody = document.getElementById("inspectorBody");
  const saveStateEl = document.getElementById("saveState");
  const toastEl = document.getElementById("boardToast");
  const canvasStatus = document.getElementById("canvasStatus");
  const connectHint = document.getElementById("connectHint");
  const minimap = document.getElementById("minimap");
  const emptySearch = document.getElementById("emptySearch");
  const zoomLabel = document.getElementById("zoomLabel");
  const searchInput = document.getElementById("boardSearch");
  const statusFilter = document.getElementById("statusFilter");
  const contextMenu = document.getElementById("boardContextMenu");
  const contextCoords = document.getElementById("contextCoords");
  const selectionMarquee = document.getElementById("selectionMarquee");
  const floatingActions = document.getElementById("floatingActions");
  const editDrawer = document.getElementById("editDrawer");
  const editDrawerBackdrop = document.getElementById("editDrawerBackdrop");
  const editDrawerTitle = document.getElementById("editDrawerTitle");
  const editDrawerBody = document.getElementById("editDrawerBody");
  const closeEditDrawerBtn = document.getElementById("closeEditDrawerBtn");
  const cancelEditDrawerBtn = document.getElementById("cancelEditDrawerBtn");
  const saveEditDrawerBtn = document.getElementById("saveEditDrawerBtn");
  const groupDialog = document.getElementById("groupDialog");
  const groupDialogForm = document.getElementById("groupDialogForm");
  const groupNameInput = document.getElementById("groupNameInput");
  const groupThemeInput = document.getElementById("groupThemeInput");
  const cancelGroupDialogBtn = document.getElementById("cancelGroupDialogBtn");
  const boardThemeToggleBtn = document.getElementById("boardThemeToggleBtn");
  const UI_THEME_KEY = "cadence-ui-theme";

  let project = loadProject();
  let board = loadOrCreateBoard();
  let mode = "select";
  let selectedNodeIds = new Set();
  let selectedNodeId = null;
  let selectedEdgeId = null;
  let selectedLaneId = null;
  let selectedGroupId = null;
  let connectSourceId = null;
  let history = [];
  let future = [];
  let drag = null;
  let pan = null;
  let marquee = null;
  let spaceDown = false;
  let saveTimer = null;
  let contextPoint = null;
  let suppressNodeClick = false;
  let editorTarget = null;

  const layerState = {
    edges: true,
    grid: true,
    snap: board.settings?.snap !== false,
    minimap: true
  };

  function boardTheme(){ return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }

  function syncBoardThemeControl(){
    if(!boardThemeToggleBtn) return;
    const dark = boardTheme() === "dark";
    boardThemeToggleBtn.classList.toggle("is-dark", dark);
    boardThemeToggleBtn.setAttribute("aria-label", dark ? "فعال کردن حالت روز" : "فعال کردن حالت شب");
    const label=boardThemeToggleBtn.querySelector(".board-theme-label");
    if(label) label.textContent = dark ? "Day" : "Night";
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content", dark ? "#0b1218" : "#1e4650");
  }

  function setBoardTheme(theme, notify=false){
    const next=theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme=next;
    try{localStorage.setItem(UI_THEME_KEY,next);}catch(_){}
    syncBoardThemeControl();
    if(notify) toast(next === "dark" ? "Night mode enabled" : "Day mode enabled");
  }

  function loadProject(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    }catch(err){ console.warn("Could not read shared project state", err); }
    return deepClone(window.CADENCE_DEFAULT_PROJECT || {});
  }

  function loadOrCreateBoard(){
    const stored = project.visualBoard?.board;
    if(stored && Array.isArray(stored.nodes) && Array.isArray(stored.lanes)) return normalizeBoard(deepClone(stored));
    return createBoardFromProject(project);
  }

  function normalizeBoard(input){
    input.version = "1.4";
    input.nodes = input.nodes || [];
    input.edges = input.edges || [];
    input.lanes = input.lanes || [];
    input.groups = input.groups || [];
    input.view = input.view || {x:50,y:40,scale:.72};
    input.settings = {...{snap:true,showEdges:true,showGrid:true},...(input.settings||{})};
    input.nodes.forEach(n=>{
      n.w = Number(n.w)||NODE_W;
      n.h = Number(n.h)||NODE_H;
      n.status = n.status || "proposed";
      n.type = n.type || "normal";
      n.tags = Array.isArray(n.tags) ? n.tags : [];
      n.comments = Array.isArray(n.comments) ? n.comments : [];
      n.source = n.source || "Team board";
    });
    input.lanes.forEach((l,i)=>{
      l.title = l.title || "Workflow Section";
      l.description = l.description || "";
      l.h = Number(l.h)||265;
      l.owner = l.owner || "";
      l.notes = l.notes || "";
      l.order = Number(l.order)||i+1;
      l.theme = THEMES.includes(l.theme) ? l.theme : THEMES[i%THEMES.length];
      l.collapsed = !!l.collapsed;
    });
    input.groups.forEach((g,i)=>{
      g.id = g.id || uid("group");
      g.title = g.title || `Group ${i+1}`;
      g.nodeIds = Array.isArray(g.nodeIds) ? [...new Set(g.nodeIds)] : [];
      g.theme = THEMES.includes(g.theme) ? g.theme : THEMES[i%THEMES.length];
      g.notes = g.notes || "";
    });
    cleanupGroups(input);
    return input;
  }

  function createBoardFromProject(source){
    const lanes = [];
    const nodes = [];
    const edges = [];
    const targetLanes = source.targetWorkflow?.lanes || [];
    const laneHeight = 265;
    const laneGap = 28;
    const startY = 78;
    const startX = 180;
    const stepX = 252;

    targetLanes.forEach((lane, li)=>{
      const laneY = startY + li*(laneHeight+laneGap);
      lanes.push({
        id:lane.id,
        title:lane.name,
        description:lane.description||"",
        owner:"",
        notes:"",
        y:laneY,
        h:laneHeight,
        order:li+1,
        theme:THEMES[li%THEMES.length],
        collapsed:false
      });
      (lane.stages||[]).forEach((stage, si)=>{
        const isQuestion = stage.type === "parallel" || stage.id === "tw12";
        nodes.push({
          id:stage.id,
          title:stage.title,
          owner:stage.owner,
          description:stage.definitionOfDone,
          laneId:lane.id,
          x:startX + si*stepX,
          y:laneY + 86,
          w:NODE_W,
          h:NODE_H,
          type:stage.type || "normal",
          status:isQuestion ? "needs-decision" : "proposed",
          source:source.targetWorkflow?.status === "proposed" ? "Proposed target · Discovery PDF p.17–20" : "Target workflow",
          tags:stage.type === "gate" ? ["Gate"] : stage.type === "parallel" ? ["Parallel candidate"] : [],
          comments:[]
        });
        if(si>0){
          const prev = lane.stages[si-1];
          edges.push({id:uid("e"),from:prev.id,to:stage.id,label:"next",type:"sequence"});
        }
      });
    });

    const has = id => nodes.some(n=>n.id===id);
    if(has("tw4") && has("tw5")) edges.push({id:uid("e"),from:"tw4",to:"tw5",label:"fabric requirement",type:"dependency"});
    if(has("tw4") && has("tw9")) edges.push({id:uid("e"),from:"tw4",to:"tw9",label:"release candidate",type:"dependency"});
    if(has("tw8") && has("tw12")) edges.push({id:uid("e"),from:"tw8",to:"tw12",label:"fabric ready",type:"dependency"});
    if(has("tw11") && has("tw12")) edges.push({id:uid("e"),from:"tw11",to:"tw12",label:"underwork ready",type:"dependency"});

    const maxStages = Math.max(1,...targetLanes.map(l=>(l.stages||[]).length));
    const worldWidth = Math.max(2100,startX + maxStages*stepX + 420);
    const worldHeight = Math.max(1020,startY + targetLanes.length*(laneHeight+laneGap) + 100);

    return normalizeBoard({
      version:"1.5",
      title:"Cadence Target Workflow",
      note:source.targetWorkflow?.note || "",
      lanes,nodes,edges,groups:[],
      world:{width:worldWidth,height:worldHeight},
      view:{x:45,y:48,scale:.68},
      settings:{snap:true,showEdges:true,showGrid:true},
      createdFrom:"Project targetWorkflow",
      createdAt:new Date().toISOString()
    });
  }

  function cleanupGroups(target=board){
    const validNodeIds = new Set((target.nodes||[]).map(n=>n.id));
    target.groups = (target.groups||[]).map(g=>({...g,nodeIds:[...new Set((g.nodeIds||[]).filter(id=>validNodeIds.has(id)))]})).filter(g=>g.nodeIds.length>=2);
  }

  function snapshot(){ return JSON.stringify(board); }
  function pushHistory(){
    history.push(snapshot());
    if(history.length>60) history.shift();
    future = [];
    updateUndoRedo();
  }
  function restore(serialized){
    board = normalizeBoard(JSON.parse(serialized));
    resetSelectionState();
    persist(false);
    renderAll();
  }
  function undo(){ if(!history.length) return; future.push(snapshot()); restore(history.pop()); updateUndoRedo(); toast("Undo انجام شد."); }
  function redo(){ if(!future.length) return; history.push(snapshot()); restore(future.pop()); updateUndoRedo(); toast("Redo انجام شد."); }
  function updateUndoRedo(){
    document.getElementById("undoBtn").disabled = !history.length;
    document.getElementById("redoBtn").disabled = !future.length;
  }

  function persist(show=false){
    clearTimeout(saveTimer);
    saveStateEl.textContent = "Saving…";
    saveStateEl.classList.add("saving");
    saveTimer = setTimeout(()=>{
      try{
        project.visualBoard = {
          version:"1.5",
          lastSaved:new Date().toISOString(),
          board:deepClone(board)
        };
        project.meta = project.meta || {};
        project.meta.lastUpdated = new Date().toISOString().slice(0,10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        saveStateEl.textContent = "Saved";
        saveStateEl.classList.remove("saving");
        if(show) toast("برد در پروژه اصلی ذخیره شد.");
      }catch(err){
        console.error(err);
        saveStateEl.textContent = "Save failed";
        saveStateEl.classList.remove("saving");
      }
    },180);
  }

  function toast(message){
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(()=>toastEl.classList.remove("show"),1900);
  }

  function getNode(id){ return board.nodes.find(n=>n.id===id); }
  function getLane(id){ return board.lanes.find(l=>l.id===id); }
  function getEdge(id){ return board.edges.find(e=>e.id===id); }
  function getGroup(id){ return board.groups.find(g=>g.id===id); }
  function isNodeHidden(node){ return !!getLane(node?.laneId)?.collapsed; }
  function laneDisplayHeight(lane){ return lane?.collapsed ? COLLAPSED_LANE_H : Number(lane?.h)||265; }
  function snap(v){ return layerState.snap ? Math.round(v/GRID)*GRID : v; }

  function setWorldSize(){
    const maxNodeX = Math.max(180,...board.nodes.map(n=>n.x+n.w));
    const maxLaneBottom = Math.max(800,...board.lanes.map(l=>l.y+laneDisplayHeight(l)));
    const width = Math.max(board.world?.width||0,maxNodeX+420,2200);
    const height = Math.max(maxLaneBottom+120,950);
    board.world = {width,height};
    world.style.width = width+"px";
    world.style.height = height+"px";
    edgeLayer.setAttribute("viewBox",`0 0 ${width} ${height}`);
    edgeLayer.setAttribute("width",width);
    edgeLayer.setAttribute("height",height);
  }

  function applyView(){
    const {x,y,scale} = board.view;
    world.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    zoomLabel.value = Math.round(scale*100)+"%";
    zoomLabel.textContent = Math.round(scale*100)+"%";
    renderMinimap();
    requestAnimationFrame(positionFloatingActions);
  }

  function renderAll(){
    setWorldSize();
    renderLanes();
    renderGroups();
    renderEdges();
    renderNodes();
    renderInspector();
    renderHealth();
    applyView();
    applyFilters();
    updateModeUI();
    updateSelectionButtons();
    renderFloatingActions();
  }

  function renderHealth(){
    const counts = board.nodes.reduce((a,n)=>{a[n.status]=(a[n.status]||0)+1;return a;},{});
    const unresolved = (counts["needs-decision"]||0)+(counts.blocked||0);
    document.getElementById("boardHealth").innerHTML = `
      <span class="health-chip"><strong>${board.nodes.length}</strong> cards</span>
      <span class="health-chip"><strong>${board.edges.length}</strong> links</span>
      <span class="health-chip"><strong>${unresolved}</strong> unresolved</span>
      <span class="health-chip"><strong>${board.groups.length}</strong> groups</span>
      <span class="health-chip"><strong>${board.lanes.length}</strong> lanes</span>`;
  }

  function renderLanes(){
    laneLayer.innerHTML = board.lanes.slice().sort((a,b)=>a.order-b.order).map((lane,index)=>`
      <section class="workflow-lane theme-${esc(lane.theme)} ${lane.collapsed?'collapsed':''} ${selectedLaneId===lane.id?'selected':''}" data-lane-id="${esc(lane.id)}" data-lane-select="${esc(lane.id)}" style="top:${lane.y}px;height:${laneDisplayHeight(lane)}px" title="Click برای جزئیات؛ دکمه سمت چپ برای جمع/باز کردن">
        <div class="lane-header ${selectedLaneId===lane.id?'selected':''}">
          <div class="lane-index">${String(index+1).padStart(2,"0")}</div>
          <div class="lane-copy">
            <div class="lane-title"><span class="lane-theme-dot" aria-hidden="true"></span>${esc(lane.title)}</div>
            <div class="lane-subtitle">${esc(lane.collapsed ? `${board.nodes.filter(n=>n.laneId===lane.id).length} cards · collapsed` : lane.description||"")}</div>
          </div>
          <button class="lane-collapse-btn" type="button" data-lane-collapse="${esc(lane.id)}" aria-label="${lane.collapsed?'باز کردن':'جمع کردن'} Section" title="${lane.collapsed?'Expand lane':'Collapse lane'}">${lane.collapsed?'＋':'−'}</button>
        </div>
      </section>`).join("");
  }

  function groupBounds(group, visibleOnly=true){
    const nodes = (group?.nodeIds||[]).map(getNode).filter(Boolean).filter(n=>!visibleOnly || !isNodeHidden(n));
    if(!nodes.length) return null;
    const minX = Math.min(...nodes.map(n=>n.x));
    const minY = Math.min(...nodes.map(n=>n.y));
    const maxX = Math.max(...nodes.map(n=>n.x+n.w));
    const maxY = Math.max(...nodes.map(n=>n.y+n.h));
    return {x:minX-GROUP_PAD,y:minY-GROUP_PAD,w:maxX-minX+GROUP_PAD*2,h:maxY-minY+GROUP_PAD*2};
  }

  function renderGroups(){
    groupLayer.innerHTML = board.groups.map(group=>{
      const b = groupBounds(group,true);
      if(!b) return "";
      return `<section class="workflow-group theme-${esc(group.theme)} ${selectedGroupId===group.id?'selected':''}" data-group-id="${esc(group.id)}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px">
        <div class="group-header" data-group-select="${esc(group.id)}" data-group-drag="${esc(group.id)}">
          <span class="group-title">${esc(group.title)}</span>
          <span class="group-count">${group.nodeIds.length} cards</span>
        </div>
      </section>`;
    }).join("");
  }

  function nodeIcon(type){ return type === "gate" ? "◇" : type === "parallel" ? "∥" : type === "alert" ? "!" : type === "note" ? "N" : "→"; }
  function statusLabel(status){ return {confirmed:"Confirmed",proposed:"Proposed","needs-decision":"Needs decision",blocked:"Blocked"}[status] || status; }

  function renderNodes(){
    nodeLayer.innerHTML = board.nodes.map(n=>{
      const hidden = isNodeHidden(n);
      return `<article class="workflow-node ${esc(n.type)} ${hidden?'hidden-in-collapsed':''} ${selectedNodeIds.has(n.id)?'selected':''} ${connectSourceId===n.id?'connect-source':''}" data-node-id="${esc(n.id)}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;min-height:${n.h}px">
        <div class="node-top">
          <span class="node-type-icon">${nodeIcon(n.type)}</span>
          <span class="node-status ${esc(n.status)}">${esc(statusLabel(n.status))}</span>
        </div>
        <div class="node-title">${esc(n.title)}</div>
        <div class="node-owner">${esc(n.owner||"بدون مسئول")}</div>
        ${n.description?`<div class="node-desc">${esc(n.description)}</div>`:""}
        ${n.tags?.length?`<div class="node-tags">${n.tags.slice(0,3).map(t=>`<span class="node-tag">${esc(t)}</span>`).join("")}</div>`:""}
        <div class="node-source">${esc(n.source||"Team board")}</div>
        <div class="node-detail-hint">Click: details · Shift/Ctrl: multi-select · Drag: move</div>
      </article>`;
    }).join("");
  }

  function edgeGeometry(edge){
    const a = getNode(edge.from), b = getNode(edge.to);
    if(!a||!b||isNodeHidden(a)||isNodeHidden(b)) return null;
    const ax = a.x+a.w, ay = a.y+a.h/2;
    const bx = b.x, by = b.y+b.h/2;
    const sameDirection = bx>=ax;
    const offset = Math.max(70,Math.abs(bx-ax)*.42);
    const c1x = sameDirection ? ax+offset : ax+85;
    const c2x = sameDirection ? bx-offset : bx-85;
    const d = `M ${ax} ${ay} C ${c1x} ${ay}, ${c2x} ${by}, ${bx} ${by}`;
    const mx = (ax+bx)/2;
    const my = (ay+by)/2 - 12;
    return {d,mx,my};
  }

  function renderEdges(){
    if(!layerState.edges){ edgeLayer.innerHTML=""; return; }
    const defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#71858e"></path></marker></defs>`;
    const body = board.edges.map(e=>{
      const g=edgeGeometry(e); if(!g) return "";
      const selected = selectedEdgeId===e.id ? "selected" : "";
      const label = e.label ? `<g><rect class="edge-label-bg" x="${g.mx-42}" y="${g.my-9}" width="84" height="18" rx="8"></rect><text class="edge-label" x="${g.mx}" y="${g.my}">${esc(e.label)}</text></g>` : "";
      return `<path class="edge ${esc(e.type||"sequence")} ${selected}" d="${g.d}"></path><path class="edge-hit" data-edge-id="${esc(e.id)}" d="${g.d}"></path>${label}`;
    }).join("");
    edgeLayer.innerHTML = defs+body;
  }

  function renderInspector(){
    if(selectedGroupId){ renderGroupInspector(getGroup(selectedGroupId)); return; }
    if(selectedNodeIds.size>1){ renderMultiInspector(); return; }
    if(selectedNodeId){ renderNodeInspector(getNode(selectedNodeId)); return; }
    if(selectedEdgeId){ renderEdgeInspector(getEdge(selectedEdgeId)); return; }
    if(selectedLaneId){ renderLaneInspector(getLane(selectedLaneId)); return; }
    inspectorTitle.textContent = "جزئیات برد";
    const counts = board.nodes.reduce((a,n)=>{a[n.status]=(a[n.status]||0)+1;return a;},{});
    inspectorBody.innerHTML = `
      <div class="board-overview">
        <div class="overview-stat"><span>Cards</span><strong>${board.nodes.length}</strong></div>
        <div class="overview-stat"><span>Connections</span><strong>${board.edges.length}</strong></div>
        <div class="overview-stat"><span>Groups</span><strong>${board.groups.length}</strong></div>
        <div class="overview-stat"><span>Confirmed</span><strong>${counts.confirmed||0}</strong></div>
        <div class="overview-stat"><span>Needs decision</span><strong>${counts["needs-decision"]||0}</strong></div>
      </div>
      <div class="board-callout">${esc(board.note || "این برد برای نهایی‌سازی Target Workflow استفاده شود. فرض‌ها تا زمان تصمیم رسمی، پیشنهادی باقی می‌مانند.")}</div>
      <div class="inspector-empty">کارت، اتصال، Group یا Lane را انتخاب کنید. Shift/Ctrl + کلیک برای انتخاب چند کارت و Shift + Drag یا ابزار Marquee برای Selection Rectangle استفاده می‌شود.</div>`;
  }

  function renderMultiInspector(){
    const nodes = [...selectedNodeIds].map(getNode).filter(Boolean);
    inspectorTitle.textContent = `${nodes.length} کارت انتخاب شده`;
    inspectorBody.innerHTML = `
      <div class="multi-selection-summary">
        <span class="selection-count-badge">${nodes.length}</span>
        <div><strong>Multi-selection</strong><p>این کارت‌ها را با هم جابه‌جا، Group، Duplicate یا وضعیت‌دهی کنید.</p></div>
      </div>
      <div class="inspector-actions multi-actions">
        <button type="button" class="inspector-btn primary" data-inspector-action="group-selection">Group</button>
        <button type="button" class="inspector-btn" data-inspector-action="duplicate">Duplicate</button>
        <button type="button" class="inspector-btn" data-inspector-action="bulk-confirm">Confirmed</button>
        <button type="button" class="inspector-btn" data-inspector-action="bulk-proposed">Proposed</button>
      </div>
      <button type="button" class="inspector-btn danger wide-action" data-inspector-action="delete">حذف کارت‌های انتخاب‌شده</button>
      <div class="selection-list">${nodes.map(n=>`<div class="selection-list-item"><span class="node-status ${esc(n.status)}">${esc(statusLabel(n.status))}</span><span>${esc(n.title)}</span></div>`).join("")}</div>`;
  }

  function renderNodeInspector(node){
    if(!node){ clearSelection(); return; }
    inspectorTitle.textContent = node.type === "note" ? "یادداشت" : "مرحله Workflow";
    const laneOptions = [`<option value="">خارج از Lane</option>`,...board.lanes.map(l=>`<option value="${esc(l.id)}" ${node.laneId===l.id?'selected':''}>${esc(l.title)}</option>`)].join("");
    inspectorBody.innerHTML = `
      <div class="inspector-form" data-inspector-node="${esc(node.id)}">
        <div class="field-row"><label for="nodeTitleField">عنوان</label><input id="nodeTitleField" data-field="title" value="${esc(node.title)}" /></div>
        <div class="inspector-grid">
          <div class="field-row"><label for="nodeTypeField">نوع</label><select id="nodeTypeField" data-field="type">${["normal","gate","parallel","alert","note"].map(v=>`<option value="${v}" ${node.type===v?'selected':''}>${v}</option>`).join("")}</select></div>
          <div class="field-row"><label for="nodeStatusField">وضعیت تصمیم</label><select id="nodeStatusField" data-field="status">${[["confirmed","تأییدشده"],["proposed","پیشنهادی"],["needs-decision","نیازمند تصمیم"],["blocked","مسدود"]].map(([v,l])=>`<option value="${v}" ${node.status===v?'selected':''}>${l}</option>`).join("")}</select></div>
        </div>
        <div class="field-row"><label for="nodeOwnerField">مسئول / Owner</label><input id="nodeOwnerField" data-field="owner" value="${esc(node.owner||"")}" /></div>
        <div class="field-row"><label for="nodeLaneField">Lane</label><select id="nodeLaneField" data-field="laneId">${laneOptions}</select></div>
        <div class="field-row"><label for="nodeDescField">Definition of Done / توضیح</label><textarea id="nodeDescField" data-field="description">${esc(node.description||"")}</textarea></div>
        <div class="field-row"><label for="nodeTagsField">Tags</label><input id="nodeTagsField" data-field="tags" value="${esc((node.tags||[]).join(", "))}" /><div class="field-help">با ویرگول جدا کنید.</div></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn primary" data-inspector-action="open-editor">Edit drawer</button><button type="button" class="inspector-btn" data-inspector-action="duplicate">Duplicate</button></div>
        <div class="field-row inspector-divider"><label for="commentAuthor">نظر تیم</label>
          <div class="inspector-grid"><input id="commentAuthor" placeholder="نام" /><input id="commentText" placeholder="کامنت کوتاه" /></div>
          <button type="button" class="inspector-btn primary wide-action" data-inspector-action="comment">افزودن Comment</button>
          <div class="comment-list">${(node.comments||[]).slice().reverse().map(c=>`<div class="comment"><div class="comment-meta">${esc(c.author||"Team")} · ${esc(c.date||"")}</div><div class="comment-text">${esc(c.text)}</div></div>`).join("") || '<div class="field-help">هنوز کامنتی ثبت نشده.</div>'}</div>
        </div>
      </div>`;
  }

  function renderEdgeInspector(edge){
    if(!edge){ selectedEdgeId=null; renderInspector(); return; }
    const from=getNode(edge.from),to=getNode(edge.to);
    inspectorTitle.textContent = "اتصال Workflow";
    inspectorBody.innerHTML = `
      <div class="inspector-form" data-inspector-edge="${esc(edge.id)}">
        <div class="board-callout">${esc(from?.title||edge.from)} → ${esc(to?.title||edge.to)}</div>
        <div class="field-row"><label>Label</label><input data-edge-field="label" value="${esc(edge.label||"")}" /></div>
        <div class="field-row"><label>Connection type</label><select data-edge-field="type">${["sequence","dependency","feedback"].map(v=>`<option value="${v}" ${edge.type===v?'selected':''}>${v}</option>`).join("")}</select></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn primary" data-inspector-action="open-editor">Edit drawer</button><button type="button" class="inspector-btn danger" data-inspector-action="delete-edge">حذف اتصال</button></div>
      </div>`;
  }

  function themeOptions(selected){
    return THEMES.map(v=>`<option value="${v}" ${selected===v?'selected':''}>${THEME_LABELS[v]}</option>`).join("");
  }

  function renderLaneInspector(lane){
    if(!lane){ selectedLaneId=null; renderInspector(); return; }
    inspectorTitle.textContent = "Workflow Lane";
    inspectorBody.innerHTML = `
      <div class="inspector-form" data-inspector-lane="${esc(lane.id)}">
        <div class="board-callout">Theme و Collapse این Section مستقیماً روی خوانایی Workshop اثر می‌گذارد.</div>
        <div class="field-row"><label>عنوان Section / Lane</label><input data-lane-field="title" value="${esc(lane.title)}" /></div>
        <div class="field-row"><label>هدف / توضیح</label><textarea data-lane-field="description">${esc(lane.description||"")}</textarea></div>
        <div class="inspector-grid">
          <div class="field-row"><label>Color theme</label><select data-lane-field="theme">${themeOptions(lane.theme)}</select></div>
          <div class="field-row"><label>ارتفاع Section</label><input type="number" min="180" max="520" step="10" data-lane-field="h" value="${lane.h}" ${lane.collapsed?'disabled':''} /></div>
        </div>
        <label class="drawer-check-row"><input type="checkbox" data-lane-collapse-toggle="${esc(lane.id)}" ${lane.collapsed?'checked':''}><span>Lane جمع‌شده باشد</span></label>
        <div class="field-row"><label>Owner / مسئول</label><input data-lane-field="owner" value="${esc(lane.owner||"")}" placeholder="مثلاً مدیر تولید" /></div>
        <div class="field-row"><label>Team notes</label><textarea data-lane-field="notes" placeholder="تصمیم‌ها، محدودیت‌ها یا نکات این بخش">${esc(lane.notes||"")}</textarea></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn primary" data-inspector-action="open-editor">Edit drawer</button><button type="button" class="inspector-btn" data-inspector-action="toggle-lane">${lane.collapsed?'Expand':'Collapse'}</button></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn" data-inspector-action="lane-up">Move up</button><button type="button" class="inspector-btn" data-inspector-action="lane-down">Move down</button></div>
        <button type="button" class="inspector-btn danger wide-action" data-inspector-action="delete-lane">حذف Section</button>
      </div>`;
  }

  function renderGroupInspector(group){
    if(!group){ selectedGroupId=null; renderInspector(); return; }
    const nodes = group.nodeIds.map(getNode).filter(Boolean);
    inspectorTitle.textContent = "Workflow Group";
    inspectorBody.innerHTML = `
      <div class="inspector-form" data-inspector-group="${esc(group.id)}">
        <div class="multi-selection-summary"><span class="selection-count-badge">${nodes.length}</span><div><strong>${esc(group.title)}</strong><p>Group بصری برای جابه‌جایی و سازمان‌دهی چند مرحله.</p></div></div>
        <div class="field-row"><label>Group title</label><input data-group-field="title" value="${esc(group.title)}"></div>
        <div class="field-row"><label>Color theme</label><select data-group-field="theme">${themeOptions(group.theme)}</select></div>
        <div class="field-row"><label>Notes</label><textarea data-group-field="notes">${esc(group.notes||"")}</textarea></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn primary" data-inspector-action="open-editor">Edit drawer</button><button type="button" class="inspector-btn" data-inspector-action="select-group-members">Select cards</button></div>
        <div class="inspector-actions"><button type="button" class="inspector-btn" data-inspector-action="duplicate-group">Duplicate group</button><button type="button" class="inspector-btn danger" data-inspector-action="ungroup">Ungroup</button></div>
        <div class="selection-list">${nodes.map(n=>`<div class="selection-list-item"><span class="node-status ${esc(n.status)}">${esc(statusLabel(n.status))}</span><span>${esc(n.title)}</span></div>`).join("")}</div>
      </div>`;
  }

  function renderMinimap(){
    if(!layerState.minimap){ minimap.style.display="none"; return; }
    minimap.style.display="block";
    const mw=205,mh=118;
    const sx=mw/board.world.width, sy=mh/board.world.height;
    const scale=Math.min(sx,sy);
    const laneHtml=board.lanes.map(l=>`<div class="minimap-lane theme-${esc(l.theme)}" style="top:${l.y*scale}px;height:${Math.max(5,laneDisplayHeight(l)*scale)}px"></div>`).join("");
    const nodeHtml=board.nodes.filter(n=>!isNodeHidden(n)).map(n=>`<div class="minimap-node" style="left:${n.x*scale}px;top:${n.y*scale}px;width:${Math.max(3,n.w*scale)}px;height:${Math.max(3,n.h*scale)}px"></div>`).join("");
    const vx = Math.max(0,-board.view.x/board.view.scale)*scale;
    const vy = Math.max(0,-board.view.y/board.view.scale)*scale;
    const vw = viewport.clientWidth/board.view.scale*scale;
    const vh = viewport.clientHeight/board.view.scale*scale;
    minimap.innerHTML = laneHtml+nodeHtml+`<div class="minimap-window" style="left:${vx}px;top:${vy}px;width:${Math.min(mw,vw)}px;height:${Math.min(mh,vh)}px"></div>`;
  }

  function resetSelectionState(){
    selectedNodeIds = new Set();
    selectedNodeId = null;
    selectedEdgeId = null;
    selectedLaneId = null;
    selectedGroupId = null;
    connectSourceId = null;
  }

  function setNodeSelection(ids,primary=null){
    const valid = [...new Set(ids)].filter(id=>!!getNode(id));
    selectedNodeIds = new Set(valid);
    selectedNodeId = primary && selectedNodeIds.has(primary) ? primary : valid.at(-1)||null;
    selectedEdgeId = null;
    selectedLaneId = null;
    selectedGroupId = null;
    renderSelectionState();
  }

  function selectSingleNode(id){ setNodeSelection([id],id); }
  function toggleNodeSelection(id){
    const ids = new Set(selectedNodeIds);
    if(ids.has(id)) ids.delete(id); else ids.add(id);
    setNodeSelection([...ids],ids.has(id)?id:[...ids].at(-1)||null);
  }
  function selectEdge(id){ resetSelectionState(); selectedEdgeId=id; renderSelectionState(); }
  function selectLane(id){ resetSelectionState(); selectedLaneId=id; renderSelectionState(); }
  function selectGroup(id){ resetSelectionState(); selectedGroupId=id; renderSelectionState(); }
  function clearSelection(){ resetSelectionState(); renderSelectionState(); }

  function renderSelectionState(){
    renderLanes();
    renderGroups();
    renderNodes();
    renderEdges();
    renderInspector();
    updateSelectionButtons();
    renderFloatingActions();
    applyFilters();
  }

  function updateSelectionButtons(){
    const hasNodes = selectedNodeIds.size>0;
    document.getElementById("duplicateBtn").disabled = !(hasNodes||selectedGroupId);
    document.getElementById("deleteBtn").disabled = !(hasNodes||selectedEdgeId||selectedLaneId||selectedGroupId);
    const groupBtn = document.getElementById("groupBtn");
    if(groupBtn) groupBtn.disabled = selectedNodeIds.size<2;
  }

  function setMode(next){
    mode=next;
    if(mode!=="connect") connectSourceId=null;
    updateModeUI();
    renderNodes();
  }
  function updateModeUI(){
    document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
    viewport.classList.toggle("mode-pan",mode==="pan");
    viewport.classList.toggle("mode-connect",mode==="connect");
    viewport.classList.toggle("mode-marquee",mode==="marquee");
    canvasStatus.textContent = mode==="select"
      ? "Select · Drag فضای خالی = Pan · Shift + Drag = Selection Rectangle · Shift/Ctrl + Click = Multi-select"
      : mode==="marquee"
        ? "Marquee · Drag روی فضای خالی برای انتخاب چند کارت · Esc برای خروج"
        : mode==="pan"
          ? "Hand mode · برای حرکت روی بوم Drag کنید"
          : connectSourceId
            ? "Connect mode · حالا کارت مقصد را انتخاب کنید"
            : "Connect mode · ابتدا کارت مبدا را انتخاب کنید";
    connectHint.hidden = mode!=="connect";
    if(mode==="connect") connectHint.textContent = connectSourceId ? "مقصد اتصال را انتخاب کنید" : "مبدا اتصال را انتخاب کنید";
  }

  function screenToWorld(clientX,clientY){
    const r=viewport.getBoundingClientRect();
    return {x:(clientX-r.left-board.view.x)/board.view.scale,y:(clientY-r.top-board.view.y)/board.view.scale};
  }

  function beginNodeDrag(ev,nodeEl){
    if(mode!=="select" || ev.button!==0) return;
    if(ev.target.closest("button,input,textarea,select")) return;
    const node=getNode(nodeEl.dataset.nodeId); if(!node) return;
    if(!selectedNodeIds.has(node.id)){
      selectedNodeIds=new Set([node.id]);selectedNodeId=node.id;selectedEdgeId=null;selectedLaneId=null;selectedGroupId=null;
      nodeLayer.querySelectorAll(".workflow-node.selected").forEach(x=>x.classList.remove("selected"));
      groupLayer.querySelectorAll(".workflow-group.selected").forEach(x=>x.classList.remove("selected"));
      laneLayer.querySelectorAll(".workflow-lane.selected").forEach(x=>x.classList.remove("selected"));
      nodeEl.classList.add("selected");updateSelectionButtons();
    }
    const ids=[...selectedNodeIds];
    const p=screenToWorld(ev.clientX,ev.clientY);
    drag={kind:"nodes",ids,startWorld:p,origins:Object.fromEntries(ids.map(id=>{const n=getNode(id);return [id,{x:n.x,y:n.y}]})),pointerId:ev.pointerId,moved:false,historyPushed:false};
    ids.forEach(id=>nodeLayer.querySelector(`[data-node-id="${CSS.escape(id)}"]`)?.classList.add("is-dragging"));
  }

  function beginGroupDrag(ev,groupId){
    if(mode!=="select" || ev.button!==0) return;
    const group=getGroup(groupId); if(!group) return;
    resetSelectionState();selectedGroupId=groupId;
    nodeLayer.querySelectorAll(".workflow-node.selected").forEach(x=>x.classList.remove("selected"));
    groupLayer.querySelectorAll(".workflow-group.selected").forEach(x=>x.classList.remove("selected"));
    laneLayer.querySelectorAll(".workflow-lane.selected").forEach(x=>x.classList.remove("selected"));
    ev.target.closest(".workflow-group")?.classList.add("selected");updateSelectionButtons();
    const ids=group.nodeIds.filter(id=>!!getNode(id));
    const p=screenToWorld(ev.clientX,ev.clientY);
    drag={kind:"group",groupId,ids,startWorld:p,origins:Object.fromEntries(ids.map(id=>{const n=getNode(id);return [id,{x:n.x,y:n.y}]})),pointerId:ev.pointerId,moved:false,historyPushed:false};
  }

  function moveNodeDrag(ev){
    if(!drag) return;
    const p=screenToWorld(ev.clientX,ev.clientY);
    const dx=p.x-drag.startWorld.x,dy=p.y-drag.startWorld.y;
    if(Math.abs(dx)+Math.abs(dy)>2){
      drag.moved=true;
      suppressNodeClick=true;
      if(!drag.historyPushed){pushHistory();drag.historyPushed=true;}
    }
    if(!drag.moved)return;
    drag.ids.forEach(id=>{
      const n=getNode(id),o=drag.origins[id];if(!n||!o)return;
      n.x=Math.max(0,o.x+dx);n.y=Math.max(0,o.y+dy);
      const el=nodeLayer.querySelector(`[data-node-id="${CSS.escape(id)}"]`);
      if(el){el.style.left=n.x+"px";el.style.top=n.y+"px";}
    });
    renderGroups();renderEdges();renderMinimap();positionFloatingActions();
  }

  function endNodeDrag(){
    if(!drag) return;
    const state=drag;
    drag=null;
    if(state.moved){
      state.ids.forEach(id=>{
        const node=getNode(id);if(!node)return;
        node.x=snap(node.x);node.y=snap(node.y);
        const centerY=node.y+node.h/2;
        const lane=board.lanes.find(l=>!l.collapsed&&centerY>l.y+54&&centerY<l.y+laneDisplayHeight(l));
        if(lane) node.laneId=lane.id;
      });
      setWorldSize();renderGroups();renderNodes();renderEdges();renderInspector();renderMinimap();persist(false);
    } else {
      state.ids.forEach(id=>nodeLayer.querySelector(`[data-node-id="${CSS.escape(id)}"]`)?.classList.remove("is-dragging"));
    }
    requestAnimationFrame(()=>{suppressNodeClick=false;});
  }

  function beginPan(ev,allowPrimaryBlank=false,clickLaneId=null){
    const primaryBlankPan = allowPrimaryBlank && mode==="select" && ev.button===0 && !ev.shiftKey;
    const shouldPan = mode==="pan" || spaceDown || ev.button===1 || primaryBlankPan;
    if(!shouldPan) return false;
    closeContextMenu();
    pan={pointerId:ev.pointerId,startX:ev.clientX,startY:ev.clientY,viewX:board.view.x,viewY:board.view.y,moved:false,blankSelect:primaryBlankPan,clickLaneId};
    viewport.classList.add("is-panning");
    viewport.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
    return true;
  }
  function movePan(ev){
    if(!pan) return;
    const dx=ev.clientX-pan.startX,dy=ev.clientY-pan.startY;
    if(Math.abs(dx)+Math.abs(dy)>4) pan.moved=true;
    board.view.x=pan.viewX+dx;
    board.view.y=pan.viewY+dy;
    applyView();
  }
  function endPan(){
    if(!pan)return;
    const state=pan;
    const wasPrimaryClick=state.blankSelect&&!state.moved;
    if(wasPrimaryClick){board.view.x=state.viewX;board.view.y=state.viewY;applyView();}
    pan=null;viewport.classList.remove("is-panning");
    if(wasPrimaryClick){
      if(state.clickLaneId){
        resetSelectionState();selectedLaneId=state.clickLaneId;
        nodeLayer.querySelectorAll(".workflow-node.selected").forEach(x=>x.classList.remove("selected"));
        groupLayer.querySelectorAll(".workflow-group.selected").forEach(x=>x.classList.remove("selected"));
        laneLayer.querySelectorAll(".workflow-lane.selected").forEach(x=>x.classList.remove("selected"));
        laneLayer.querySelector(`[data-lane-id="${CSS.escape(state.clickLaneId)}"]`)?.classList.add("selected");
        renderInspector();updateSelectionButtons();renderFloatingActions();
      } else clearSelection();
    }
    persist(false);
  }

  function beginMarquee(ev){
    if(ev.button!==0) return false;
    const allowed = mode==="marquee" || (mode==="select"&&ev.shiftKey);
    if(!allowed) return false;
    const r=viewport.getBoundingClientRect();
    marquee={startX:ev.clientX-r.left,startY:ev.clientY-r.top,endX:ev.clientX-r.left,endY:ev.clientY-r.top,additive:ev.ctrlKey||ev.metaKey};
    selectionMarquee.hidden=false;
    updateMarqueeVisual();
    viewport.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
    return true;
  }
  function updateMarqueeVisual(){
    if(!marquee)return;
    const x=Math.min(marquee.startX,marquee.endX),y=Math.min(marquee.startY,marquee.endY);
    const w=Math.abs(marquee.endX-marquee.startX),h=Math.abs(marquee.endY-marquee.startY);
    Object.assign(selectionMarquee.style,{left:x+"px",top:y+"px",width:w+"px",height:h+"px"});
    const r=viewport.getBoundingClientRect();
    const p1=screenToWorld(r.left+x,r.top+y),p2=screenToWorld(r.left+x+w,r.top+y+h);
    const rect={x1:Math.min(p1.x,p2.x),y1:Math.min(p1.y,p2.y),x2:Math.max(p1.x,p2.x),y2:Math.max(p1.y,p2.y)};
    nodeLayer.querySelectorAll(".workflow-node").forEach(el=>{
      const n=getNode(el.dataset.nodeId);if(!n||isNodeHidden(n))return;
      const hit=n.x<rect.x2&&n.x+n.w>rect.x1&&n.y<rect.y2&&n.y+n.h>rect.y1;
      el.classList.toggle("marquee-preview",hit);
    });
  }
  function moveMarquee(ev){
    if(!marquee)return;
    const r=viewport.getBoundingClientRect();
    marquee.endX=clamp(ev.clientX-r.left,0,r.width);
    marquee.endY=clamp(ev.clientY-r.top,0,r.height);
    updateMarqueeVisual();
  }
  function endMarquee(){
    if(!marquee)return;
    const r=viewport.getBoundingClientRect();
    const x=Math.min(marquee.startX,marquee.endX),y=Math.min(marquee.startY,marquee.endY);
    const w=Math.abs(marquee.endX-marquee.startX),h=Math.abs(marquee.endY-marquee.startY);
    const p1=screenToWorld(r.left+x,r.top+y),p2=screenToWorld(r.left+x+w,r.top+y+h);
    const rect={x1:Math.min(p1.x,p2.x),y1:Math.min(p1.y,p2.y),x2:Math.max(p1.x,p2.x),y2:Math.max(p1.y,p2.y)};
    const hits=board.nodes.filter(n=>!isNodeHidden(n)&&n.x<rect.x2&&n.x+n.w>rect.x1&&n.y<rect.y2&&n.y+n.h>rect.y1).map(n=>n.id);
    const base=marquee.additive?[...selectedNodeIds]:[];
    marquee=null;
    selectionMarquee.hidden=true;
    nodeLayer.querySelectorAll(".marquee-preview").forEach(el=>el.classList.remove("marquee-preview"));
    setNodeSelection([...base,...hits],hits.at(-1)||base.at(-1)||null);
    if(!hits.length&&!base.length) clearSelection();
    toast(hits.length?`${hits.length} کارت انتخاب شد.`:"کارت جدیدی در محدوده نبود.");
  }

  function zoomAt(clientX,clientY,factor){
    const before=screenToWorld(clientX,clientY);
    const next=Math.min(1.65,Math.max(.28,board.view.scale*factor));
    const r=viewport.getBoundingClientRect();
    board.view.scale=next;
    board.view.x=(clientX-r.left)-before.x*next;
    board.view.y=(clientY-r.top)-before.y*next;
    applyView();persist(false);
  }
  function zoomCenter(factor){ const r=viewport.getBoundingClientRect(); zoomAt(r.left+r.width/2,r.top+r.height/2,factor); }

  function fitToView(){
    const visibleNodes=board.nodes.filter(n=>!isNodeHidden(n));
    if(!visibleNodes.length&&!board.lanes.length)return;
    const minX=visibleNodes.length?Math.min(...visibleNodes.map(n=>n.x))-110:40;
    const maxX=visibleNodes.length?Math.max(...visibleNodes.map(n=>n.x+n.w))+110:Math.min(board.world.width,1600);
    const minY=board.lanes.length?Math.min(...board.lanes.map(l=>l.y))-55:Math.min(...visibleNodes.map(n=>n.y))-55;
    const maxY=board.lanes.length?Math.max(...board.lanes.map(l=>l.y+laneDisplayHeight(l)))+55:Math.max(...visibleNodes.map(n=>n.y+n.h))+55;
    const w=Math.max(500,maxX-minX),h=Math.max(400,maxY-minY);
    const scale=Math.min(1.05,Math.max(.3,Math.min(viewport.clientWidth/w,viewport.clientHeight/h))*.94);
    board.view.scale=scale;
    board.view.x=(viewport.clientWidth-w*scale)/2-minX*scale;
    board.view.y=(viewport.clientHeight-h*scale)/2-minY*scale;
    applyView();persist(false);
  }

  function addNode(type="normal",point=null){
    pushHistory();
    const r=viewport.getBoundingClientRect();
    const center=point || screenToWorld(r.left+viewport.clientWidth/2,r.top+viewport.clientHeight/2);
    const lane = board.lanes.find(l=>!l.collapsed&&center.y>l.y&&center.y<l.y+laneDisplayHeight(l)) || board.lanes.find(l=>!l.collapsed) || board.lanes[0];
    const id=uid(type==="note"?"note":"stage");
    const presets={
      normal:{title:"مرحله جدید",description:"Definition of Done را مشخص کنید.",status:"proposed",tags:[]},
      gate:{title:"Decision / Approval Gate",description:"شرط تصمیم، تأییدکننده و مسیر بعدی را مشخص کنید.",status:"needs-decision",tags:["Gate"]},
      parallel:{title:"Parallel step",description:"وابستگی‌ها و شرط شروع/پایان این مسیر موازی را مشخص کنید.",status:"needs-decision",tags:["Parallel candidate"]},
      note:{title:"یادداشت Workshop",description:"فرض، ابهام یا نکته‌ای که باید در جلسه بررسی شود.",status:"needs-decision",tags:["Workshop"]}
    };
    const preset=presets[type]||presets.normal;
    board.nodes.push({id,title:preset.title,owner:type==="note"?"Team":"",description:preset.description,laneId:lane?.id||"",x:snap(Math.max(40,center.x-NODE_W/2)),y:snap(Math.max(40,center.y-NODE_H/2)),w:NODE_W,h:type==="note"?140:NODE_H,type,status:preset.status,source:"Team board · added from canvas",tags:preset.tags,comments:[]});
    setNodeSelection([id],id);
    setWorldSize();persist(false);renderAll();toast(type==="note"?"یادداشت اضافه شد.":"مرحله جدید اضافه شد.");
    openEditor("node",id);
  }

  function addLane(point=null){
    pushHistory();
    const wantedY=point ? Math.max(80,snap(point.y-28)) : Math.max(80,...board.lanes.map(l=>l.y+laneDisplayHeight(l)+28));
    let y=wantedY;
    const overlaps=board.lanes.slice().sort((a,b)=>a.y-b.y).filter(l=>y<l.y+laneDisplayHeight(l)+18&&y+265>l.y-18);
    if(overlaps.length) y=Math.max(...overlaps.map(l=>l.y+laneDisplayHeight(l)+28));
    const lane={id:uid("lane"),title:"New Workflow Section",description:"هدف و محدوده این Section را مشخص کنید.",owner:"",notes:"",y,h:265,order:board.lanes.length+1,theme:THEMES[board.lanes.length%THEMES.length],collapsed:false};
    board.lanes.push(lane);
    selectLane(lane.id);
    setWorldSize();persist(false);renderAll();toast("Section جدید اضافه شد.");
    openEditor("lane",lane.id);
  }

  function createGroupFromSelection(title=null,theme=null){
    if(selectedNodeIds.size<2){toast("برای Group حداقل دو کارت انتخاب کنید.");return;}
    const ids=[...selectedNodeIds];
    pushHistory();
    board.groups.forEach(g=>{g.nodeIds=g.nodeIds.filter(id=>!selectedNodeIds.has(id));});
    cleanupGroups();
    const group={id:uid("group"),title:title||`Workflow group ${board.groups.length+1}`,nodeIds:ids,theme:THEMES.includes(theme)?theme:"violet",notes:""};
    board.groups.push(group);
    selectGroup(group.id);
    persist(false);renderAll();toast("Group ساخته شد؛ کارت‌ها با هم قابل جابه‌جایی هستند.");
  }

  function openGroupDialog(){
    if(selectedNodeIds.size<2){toast("حداقل دو کارت را انتخاب کنید.");return;}
    groupNameInput.value=`Workflow group ${board.groups.length+1}`;
    groupThemeInput.value="violet";
    if(typeof groupDialog.showModal==="function") groupDialog.showModal(); else groupDialog.setAttribute("open","");
    requestAnimationFrame(()=>groupNameInput.select());
  }

  function ungroupSelected(){
    const group=getGroup(selectedGroupId);if(!group)return;
    pushHistory();
    board.groups=board.groups.filter(g=>g.id!==group.id);
    const ids=[...group.nodeIds];
    setNodeSelection(ids,ids.at(-1)||null);
    persist(false);renderAll();toast("Group باز شد؛ کارت‌ها حفظ شدند.");
  }

  function duplicateNodeIds(ids,groupToCopy=null){
    const sourceIds=[...new Set(ids)].filter(id=>!!getNode(id));if(!sourceIds.length)return;
    pushHistory();
    const map={};
    sourceIds.forEach(id=>{
      const node=getNode(id),copy=deepClone(node);
      copy.id=uid("copy");copy.title=node.title+" — Copy";copy.x=snap(node.x+GRID*2);copy.y=snap(node.y+GRID*2);copy.comments=[];
      map[id]=copy.id;board.nodes.push(copy);
    });
    board.edges.filter(e=>sourceIds.includes(e.from)&&sourceIds.includes(e.to)).forEach(e=>board.edges.push({...deepClone(e),id:uid("e"),from:map[e.from],to:map[e.to]}));
    const newIds=sourceIds.map(id=>map[id]);
    if(groupToCopy){
      board.groups.push({id:uid("group"),title:groupToCopy.title+" — Copy",nodeIds:newIds,theme:groupToCopy.theme,notes:groupToCopy.notes||""});
      selectGroup(board.groups.at(-1).id);
    } else setNodeSelection(newIds,newIds.at(-1));
    persist(false);renderAll();toast(`${sourceIds.length} کارت کپی شد.`);
  }

  function duplicateSelected(){
    if(selectedGroupId){const g=getGroup(selectedGroupId);if(g)duplicateNodeIds(g.nodeIds,g);return;}
    if(selectedNodeIds.size) duplicateNodeIds([...selectedNodeIds]);
  }

  function deleteSelected(){
    if(selectedNodeIds.size){
      const ids=[...selectedNodeIds];
      if(!confirm(`${ids.length} کارت انتخاب‌شده حذف شوند؟`))return;
      pushHistory();
      const idSet=new Set(ids);
      board.nodes=board.nodes.filter(n=>!idSet.has(n.id));
      board.edges=board.edges.filter(e=>!idSet.has(e.from)&&!idSet.has(e.to));
      board.groups.forEach(g=>{g.nodeIds=g.nodeIds.filter(id=>!idSet.has(id));});cleanupGroups();resetSelectionState();
    } else if(selectedEdgeId){
      if(!confirm("این اتصال حذف شود؟"))return;pushHistory();board.edges=board.edges.filter(e=>e.id!==selectedEdgeId);selectedEdgeId=null;
    } else if(selectedGroupId){
      const g=getGroup(selectedGroupId);if(!g)return;if(!confirm(`Group «${g.title}» حذف شود؟ کارت‌ها باقی می‌مانند.`))return;pushHistory();board.groups=board.groups.filter(x=>x.id!==g.id);selectedGroupId=null;
    } else if(selectedLaneId){ deleteLane(selectedLaneId);return; }
    else return;
    persist(false);renderAll();toast("حذف شد.");
  }

  function deleteLane(id){
    const lane=getLane(id);if(!lane)return;
    if(!confirm(`Lane «${lane.title}» حذف شود؟ کارت‌ها حذف نمی‌شوند.`))return;
    pushHistory();
    board.lanes=board.lanes.filter(l=>l.id!==id);
    board.nodes.forEach(n=>{if(n.laneId===id)n.laneId=""});
    selectedLaneId=null;renumberLanes();persist(false);renderAll();
  }

  function setBulkStatus(status){
    if(!selectedNodeIds.size)return;
    pushHistory();selectedNodeIds.forEach(id=>{const n=getNode(id);if(n)n.status=status;});persist(false);renderAll();toast(`وضعیت ${selectedNodeIds.size} کارت تغییر کرد.`);
  }

  function connectNodes(fromId,toId){
    if(fromId===toId){toast("مبدا و مقصد نمی‌توانند یکسان باشند.");return;}
    if(board.edges.some(e=>e.from===fromId&&e.to===toId)){toast("این اتصال از قبل وجود دارد.");return;}
    pushHistory();
    board.edges.push({id:uid("e"),from:fromId,to:toId,label:"dependency",type:"dependency"});
    connectSourceId=null;persist(false);renderAll();toast("اتصال ایجاد شد؛ Label را از Inspector ویرایش کنید.");
  }

  function renumberLanes(){ board.lanes.sort((a,b)=>a.order-b.order).forEach((l,i)=>l.order=i+1); }
  function moveLane(id,dir){
    const ordered=board.lanes.slice().sort((a,b)=>a.order-b.order),idx=ordered.findIndex(l=>l.id===id),next=idx+dir;
    if(next<0||next>=ordered.length)return;
    pushHistory();[ordered[idx].order,ordered[next].order]=[ordered[next].order,ordered[idx].order];autoLayout(true);selectedLaneId=id;
  }

  function setLaneCollapsed(id,target,skipHistory=false){
    const lane=getLane(id);if(!lane||lane.collapsed===target)return;
    if(!skipHistory)pushHistory();
    const before=laneDisplayHeight(lane);
    lane.collapsed=target;
    const after=laneDisplayHeight(lane);
    const delta=after-before;
    const lowerLaneIds=new Set(board.lanes.filter(l=>l.id!==lane.id&&l.y>lane.y).map(l=>l.id));
    board.lanes.forEach(l=>{if(lowerLaneIds.has(l.id))l.y+=delta;});
    board.nodes.forEach(n=>{if(lowerLaneIds.has(n.laneId))n.y+=delta;});
    if(target&&[...selectedNodeIds].some(nid=>getNode(nid)?.laneId===id))selectLane(id);
    setWorldSize();persist(false);renderAll();toast(target?"Lane جمع شد.":"Lane باز شد.");
  }
  function toggleLaneCollapsed(id){const lane=getLane(id);if(lane)setLaneCollapsed(id,!lane.collapsed);}
  function cycleLaneTheme(id){const lane=getLane(id);if(!lane)return;pushHistory();const i=THEMES.indexOf(lane.theme);lane.theme=THEMES[(i+1)%THEMES.length];persist(false);renderAll();toast(`Theme: ${THEME_LABELS[lane.theme]}`);}

  function autoLayout(skipHistory=false){
    if(!skipHistory) pushHistory();
    const ordered=board.lanes.slice().sort((a,b)=>a.order-b.order);
    let y=78;
    ordered.forEach(lane=>{
      lane.y=y;
      const laneNodes=board.nodes.filter(n=>n.laneId===lane.id).sort((a,b)=>a.x-b.x);
      laneNodes.forEach((n,i)=>{n.x=180+i*252;n.y=lane.y+86;});
      y+=laneDisplayHeight(lane)+28;
    });
    setWorldSize();persist(false);renderAll();toast("چیدمان برد مرتب شد.");
  }

  function syncFromTarget(){
    if(!confirm("برد فعلی با Target Workflow ذخیره‌شده در Project Studio بازسازی شود؟ ویرایش‌های فعلی برد جایگزین می‌شوند.")) return;
    pushHistory();project=loadProject();board=createBoardFromProject(project);resetSelectionState();persist(false);renderAll();setTimeout(fitToView,0);toast("برد با Target Workflow همگام شد.");
  }

  function applyFilters(){
    const q=searchInput.value.trim().toLowerCase();
    const status=statusFilter.value;
    let visible=0;
    nodeLayer.querySelectorAll(".workflow-node").forEach(el=>{
      const n=getNode(el.dataset.nodeId);if(!n)return;
      const hay=[n.title,n.owner,n.description,n.source,...(n.tags||[])].join(" ").toLowerCase();
      const show=(!q||hay.includes(q))&&(status==="all"||n.status===status)&&!isNodeHidden(n);
      el.classList.toggle("hidden-by-filter",!show);
      el.classList.toggle("search-match",!!q&&show);
      if(show)visible++;
    });
    emptySearch.hidden=visible>0||board.nodes.length===0;
  }

  function selectionBounds(){
    if(selectedNodeIds.size){
      const nodes=[...selectedNodeIds].map(getNode).filter(Boolean).filter(n=>!isNodeHidden(n));if(!nodes.length)return null;
      return {x:Math.min(...nodes.map(n=>n.x)),y:Math.min(...nodes.map(n=>n.y)),w:Math.max(...nodes.map(n=>n.x+n.w))-Math.min(...nodes.map(n=>n.x)),h:Math.max(...nodes.map(n=>n.y+n.h))-Math.min(...nodes.map(n=>n.y))};
    }
    if(selectedGroupId)return groupBounds(getGroup(selectedGroupId),true);
    if(selectedLaneId){const l=getLane(selectedLaneId);return l?{x:80,y:l.y,w:Math.min(800,board.world.width-160),h:laneDisplayHeight(l)}:null;}
    if(selectedEdgeId){const g=edgeGeometry(getEdge(selectedEdgeId));return g?{x:g.mx-20,y:g.my-20,w:40,h:40}:null;}
    return null;
  }

  function renderFloatingActions(){
    let html="";
    if(selectedNodeIds.size){
      html=`<span class="floating-selection-label">${selectedNodeIds.size} selected</span>${selectedNodeIds.size===1?'<button data-quick-action="edit">Edit</button>':''}${selectedNodeIds.size>1?'<button data-quick-action="group">Group</button>':''}<button data-quick-action="duplicate">Duplicate</button><button data-quick-action="confirm">✓</button><button class="danger" data-quick-action="delete">Delete</button>`;
    } else if(selectedGroupId){
      html=`<span class="floating-selection-label">Group</span><button data-quick-action="edit">Edit</button><button data-quick-action="group-members">Select cards</button><button data-quick-action="duplicate">Duplicate</button><button class="danger" data-quick-action="ungroup">Ungroup</button>`;
    } else if(selectedLaneId){
      const lane=getLane(selectedLaneId);
      html=`<span class="floating-selection-label">Section</span><button data-quick-action="edit">Edit</button><button data-quick-action="collapse">${lane?.collapsed?'Expand':'Collapse'}</button><button data-quick-action="theme">Theme</button>`;
    } else if(selectedEdgeId){ html=`<span class="floating-selection-label">Link</span><button data-quick-action="edit">Edit</button><button class="danger" data-quick-action="delete">Delete</button>`; }
    floatingActions.innerHTML=html;
    floatingActions.hidden=!html;
    requestAnimationFrame(positionFloatingActions);
  }

  function positionFloatingActions(){
    if(floatingActions.hidden)return;
    const b=selectionBounds();if(!b){floatingActions.hidden=true;return;}
    const vr=viewport.getBoundingClientRect(),sr=document.querySelector(".canvas-shell").getBoundingClientRect();
    let x=vr.left-sr.left+board.view.x+(b.x+b.w/2)*board.view.scale;
    let y=vr.top-sr.top+board.view.y+(b.y+b.h)*board.view.scale+12;
    const half=floatingActions.offsetWidth/2;
    x=clamp(x,half+12,sr.width-half-12);y=clamp(y,12,sr.height-58);
    floatingActions.style.left=x+"px";floatingActions.style.top=y+"px";
  }

  function openEditor(kind,id){
    const target = kind==="node"?getNode(id):kind==="lane"?getLane(id):kind==="group"?getGroup(id):kind==="edge"?getEdge(id):null;
    if(!target)return;
    editorTarget={kind,id};
    editDrawerTitle.textContent=kind==="node"?"Edit workflow card":kind==="lane"?"Edit section / lane":kind==="group"?"Edit group":"Edit connection";
    if(kind==="node"){
      const laneOptions=[`<option value="">خارج از Lane</option>`,...board.lanes.map(l=>`<option value="${esc(l.id)}" ${target.laneId===l.id?'selected':''}>${esc(l.title)}</option>`)].join("");
      editDrawerBody.innerHTML=`<div class="drawer-section"><h3>Core details</h3><label>عنوان<input data-drawer-field="title" value="${esc(target.title)}"></label><div class="drawer-grid"><label>Type<select data-drawer-field="type">${["normal","gate","parallel","alert","note"].map(v=>`<option value="${v}" ${target.type===v?'selected':''}>${v}</option>`).join("")}</select></label><label>Status<select data-drawer-field="status">${[["confirmed","Confirmed"],["proposed","Proposed"],["needs-decision","Needs decision"],["blocked","Blocked"]].map(([v,l])=>`<option value="${v}" ${target.status===v?'selected':''}>${l}</option>`).join("")}</select></label></div><label>Owner<input data-drawer-field="owner" value="${esc(target.owner||"")}"></label><label>Lane<select data-drawer-field="laneId">${laneOptions}</select></label></div><div class="drawer-section"><h3>Definition & rationale</h3><label>Definition of Done<textarea data-drawer-field="description">${esc(target.description||"")}</textarea></label><label>Tags<input data-drawer-field="tags" value="${esc((target.tags||[]).join(", "))}"></label><label>Source / rationale<input data-drawer-field="source" value="${esc(target.source||"")}"></label></div>`;
    }
    if(kind==="lane"){
      editDrawerBody.innerHTML=`<div class="drawer-section"><h3>Section identity</h3><label>عنوان<input data-drawer-field="title" value="${esc(target.title)}"></label><label>هدف / توضیح<textarea data-drawer-field="description">${esc(target.description||"")}</textarea></label><div class="drawer-grid"><label>Theme<select data-drawer-field="theme">${themeOptions(target.theme)}</select></label><label>Height<input type="number" min="180" max="520" step="10" data-drawer-field="h" value="${target.h}"></label></div><label class="drawer-check-row"><input type="checkbox" data-drawer-field="collapsed" ${target.collapsed?'checked':''}><span>Collapse this lane</span></label></div><div class="drawer-section"><h3>Ownership & team notes</h3><label>Owner<input data-drawer-field="owner" value="${esc(target.owner||"")}"></label><label>Team notes<textarea data-drawer-field="notes">${esc(target.notes||"")}</textarea></label></div>`;
    }
    if(kind==="group"){
      editDrawerBody.innerHTML=`<div class="drawer-section"><h3>Group</h3><label>Group title<input data-drawer-field="title" value="${esc(target.title)}"></label><label>Theme<select data-drawer-field="theme">${themeOptions(target.theme)}</select></label><label>Notes<textarea data-drawer-field="notes">${esc(target.notes||"")}</textarea></label><div class="drawer-member-list">${target.nodeIds.map(id=>`<span>${esc(getNode(id)?.title||id)}</span>`).join("")}</div></div>`;
    }
    if(kind==="edge"){
      const from=getNode(target.from),to=getNode(target.to);
      editDrawerBody.innerHTML=`<div class="drawer-section"><div class="drawer-route">${esc(from?.title||target.from)} <span>→</span> ${esc(to?.title||target.to)}</div><label>Label<input data-drawer-field="label" value="${esc(target.label||"")}"></label><label>Connection type<select data-drawer-field="type">${["sequence","dependency","feedback"].map(v=>`<option value="${v}" ${target.type===v?'selected':''}>${v}</option>`).join("")}</select></label></div>`;
    }
    editDrawer.hidden=false;editDrawerBackdrop.hidden=false;editDrawer.setAttribute("aria-hidden","false");document.body.classList.add("drawer-open");
    requestAnimationFrame(()=>editDrawer.querySelector("input,textarea,select")?.focus());
  }

  function closeEditor(){
    editorTarget=null;editDrawer.hidden=true;editDrawerBackdrop.hidden=true;editDrawer.setAttribute("aria-hidden","true");document.body.classList.remove("drawer-open");
  }

  function saveEditor(){
    if(!editorTarget)return;
    const {kind,id}=editorTarget;
    const target=kind==="node"?getNode(id):kind==="lane"?getLane(id):kind==="group"?getGroup(id):kind==="edge"?getEdge(id):null;if(!target)return;
    const fields=[...editDrawerBody.querySelectorAll("[data-drawer-field]")];
    const beforeCollapsed=kind==="lane"?target.collapsed:null;
    pushHistory();
    fields.forEach(el=>{
      const field=el.dataset.drawerField;
      let value=el.type==="checkbox"?el.checked:el.value;
      if(field==="tags")value=String(value).split(",").map(x=>x.trim()).filter(Boolean);
      if(field==="h")value=clamp(Number(value)||265,180,520);
      target[field]=value;
    });
    if(kind==="node"&&target.laneId){const lane=getLane(target.laneId);if(lane&&!lane.collapsed)target.y=snap(lane.y+86);}
    if(kind==="lane"&&beforeCollapsed!==target.collapsed){
      const desired=target.collapsed;target.collapsed=beforeCollapsed;setLaneCollapsed(target.id,desired,true);closeEditor();return;
    }
    persist(false);renderAll();closeEditor();toast("تغییرات ذخیره شد.");
  }

  function openCurrentEditor(){
    if(selectedNodeIds.size===1)openEditor("node",selectedNodeId);
    else if(selectedLaneId)openEditor("lane",selectedLaneId);
    else if(selectedGroupId)openEditor("group",selectedGroupId);
    else if(selectedEdgeId)openEditor("edge",selectedEdgeId);
  }

  function exportBoardJson(){ download(JSON.stringify({project:project.meta?.projectName||"Cadence",exportedAt:new Date().toISOString(),visualBoard:board},null,2),"cadence-visual-workflow-board.json","application/json;charset=utf-8"); }

  function exportMiroCsv(){
    const rows=[["Type","Title","Body","Lane","Group","Status","Owner","Source","Tags","X","Y","From","To","Label"]];
    board.nodes.forEach(n=>{
      const group=board.groups.find(g=>g.nodeIds.includes(n.id));
      rows.push(["card",n.title,n.description||"",getLane(n.laneId)?.title||"",group?.title||"",n.status,n.owner||"",n.source||"",(n.tags||[]).join(" | "),Math.round(n.x),Math.round(n.y),"","",""]);
    });
    board.edges.forEach(e=>rows.push(["connector","","","","",e.type,"","","","","",getNode(e.from)?.title||e.from,getNode(e.to)?.title||e.to,e.label||""]));
    const csv="\ufeff"+rows.map(r=>r.map(c=>`"${String(c??"").replaceAll('"','""')}"`).join(",")).join("\r\n");
    download(csv,"cadence-visual-board-miro.csv","text/csv;charset=utf-8");
  }

  function statusStroke(s){return s==="confirmed"?"#65a980":s==="needs-decision"?"#d1a23b":s==="blocked"?"#d17b72":"#7fa2ea";}
  function shorten(s,n){s=String(s||"");return s.length>n?s.slice(0,n-1)+"…":s;}
  function exportSvg(){
    const width=board.world.width,height=board.world.height;
    const laneSvg=board.lanes.map(l=>`<g><rect x="60" y="${l.y}" width="${width-120}" height="${laneDisplayHeight(l)}" rx="18" fill="#f7f9fa" stroke="#cbd6db"/><text x="82" y="${l.y+32}" font-family="Tahoma,Arial" font-size="15" font-weight="700" fill="#24343d">${xml(l.title)}</text>${l.collapsed?`<text x="82" y="${l.y+49}" font-family="Arial" font-size="9" fill="#71818b">collapsed</text>`:`<text x="82" y="${l.y+49}" font-family="Tahoma,Arial" font-size="9" fill="#71818b">${xml(l.description||"")}</text>`}</g>`).join("");
    const groupSvg=board.groups.map(g=>{const b=groupBounds(g,true);return b?`<g><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="18" fill="none" stroke="#9b8bc9" stroke-width="2" stroke-dasharray="7 5"/><text x="${b.x+14}" y="${b.y+20}" font-family="Arial" font-size="10" fill="#6d5a9b">${xml(g.title)}</text></g>`:""}).join("");
    const edgeSvg=board.edges.map(e=>{const g=edgeGeometry(e);return g?`<path d="${g.d}" fill="none" stroke="${e.type==='dependency'?'#ad761c':'#71858e'}" stroke-width="2" ${e.type==='dependency'?'stroke-dasharray="7 5"':''} marker-end="url(#a)"/><text x="${g.mx}" y="${g.my}" font-family="Arial" font-size="9" fill="#5a6d77" text-anchor="middle">${xml(e.label||"")}</text>`:""}).join("");
    const nodeSvg=board.nodes.filter(n=>!isNodeHidden(n)).map(n=>`<g><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="14" fill="${n.type==='note'?'#fff8d9':'#ffffff'}" stroke="${statusStroke(n.status)}"/><text x="${n.x+n.w-12}" y="${n.y+32}" font-family="Tahoma,Arial" font-size="12" font-weight="700" fill="#142129" text-anchor="end">${xml(shorten(n.title,28))}</text><text x="${n.x+n.w-12}" y="${n.y+51}" font-family="Tahoma,Arial" font-size="9" fill="#667882" text-anchor="end">${xml(shorten(n.owner||"",34))}</text><text x="${n.x+12}" y="${n.y+n.h-14}" font-family="Arial" font-size="8" fill="#87969d">${xml(n.status)}</text></g>`).join("");
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e9eef0"/><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#71858e"/></marker></defs>${laneSvg}${groupSvg}${edgeSvg}${nodeSvg}</svg>`;
    download(svg,"cadence-visual-workflow-board.svg","image/svg+xml;charset=utf-8");
  }
  function download(text,name,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  function importBoard(file){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(reader.result),incoming=parsed.visualBoard||parsed.board||parsed;
        if(!incoming.nodes||!incoming.lanes)throw new Error("Invalid board schema");
        pushHistory();board=normalizeBoard(incoming);resetSelectionState();persist(false);renderAll();fitToView();toast("برد وارد شد.");
      }catch(err){alert("فایل JSON معتبر برای Visual Workflow Board نیست.");}
    };
    reader.readAsText(file,"utf-8");
  }

  function openContextMenu(ev){
    ev.preventDefault();
    if(mode==="connect")setMode("select");
    contextPoint=screenToWorld(ev.clientX,ev.clientY);
    contextCoords.textContent=`${Math.round(contextPoint.x)}, ${Math.round(contextPoint.y)}`;
    contextMenu.hidden=false;
    const pad=10,menuW=245,menuH=335;
    let left=ev.clientX,top=ev.clientY;
    if(left+menuW>window.innerWidth-pad)left=window.innerWidth-menuW-pad;
    if(top+menuH>window.innerHeight-pad)top=window.innerHeight-menuH-pad;
    contextMenu.style.left=Math.max(pad,left)+"px";contextMenu.style.top=Math.max(pad,top)+"px";
    requestAnimationFrame(()=>contextMenu.querySelector("button")?.focus());
  }
  function closeContextMenu(){if(!contextMenu.hidden)contextMenu.hidden=true;contextPoint=null;}

  // Canvas events ----------------------------------------------------------
  nodeLayer.addEventListener("pointerdown",ev=>{
    const el=ev.target.closest(".workflow-node");if(!el)return;
    if(mode==="connect"){
      const id=el.dataset.nodeId;
      if(!connectSourceId){connectSourceId=id;setNodeSelection([id],id);updateModeUI();renderNodes();renderInspector();}
      else connectNodes(connectSourceId,id);
      ev.preventDefault();return;
    }
    if(mode==="marquee")return;
    if(ev.shiftKey||ev.ctrlKey||ev.metaKey)return;
    if(beginPan(ev))return;
    beginNodeDrag(ev,el);
  });

  nodeLayer.addEventListener("click",ev=>{
    if(suppressNodeClick||mode==="connect"||mode==="marquee")return;
    const el=ev.target.closest(".workflow-node");if(!el||mode!=="select")return;
    const id=el.dataset.nodeId;
    if(ev.shiftKey||ev.ctrlKey||ev.metaKey)toggleNodeSelection(id);
    else if(selectedNodeIds.has(id)){renderInspector();updateSelectionButtons();renderFloatingActions();}
    else selectSingleNode(id);
  });
  nodeLayer.addEventListener("dblclick",ev=>{
    const el=ev.target.closest(".workflow-node");if(!el)return;selectSingleNode(el.dataset.nodeId);openEditor("node",el.dataset.nodeId);
  });

  groupLayer.addEventListener("pointerdown",ev=>{
    const header=ev.target.closest("[data-group-drag]");
    if(header&&mode==="select"){beginGroupDrag(ev,header.dataset.groupDrag);return;}
    if(beginMarquee(ev)){ev.stopPropagation();return;}
  });
  groupLayer.addEventListener("click",ev=>{
    if(drag)return;
    const el=ev.target.closest("[data-group-select]");if(!el||mode!=="select")return;
    const id=el.dataset.groupSelect;
    if(selectedGroupId===id){renderInspector();updateSelectionButtons();renderFloatingActions();}
    else selectGroup(id);
  });
  groupLayer.addEventListener("dblclick",ev=>{
    const el=ev.target.closest("[data-group-select]");if(el){selectGroup(el.dataset.groupSelect);openEditor("group",el.dataset.groupSelect);}
  });

  laneLayer.addEventListener("pointerdown",ev=>{
    if(ev.target.closest("[data-lane-collapse]"))return;
    const section=ev.target.closest("[data-lane-select]");if(!section)return;
    if(beginMarquee(ev)){ev.stopPropagation();return;}
    if(beginPan(ev,true,section.dataset.laneSelect)){ev.stopPropagation();return;}
  });
  laneLayer.addEventListener("click",ev=>{
    const collapseBtn=ev.target.closest("[data-lane-collapse]");
    if(collapseBtn){toggleLaneCollapsed(collapseBtn.dataset.laneCollapse);ev.stopPropagation();return;}
    const section=ev.target.closest("[data-lane-select]");if(section&&mode==="select"){
      const id=section.dataset.laneSelect;
      if(selectedLaneId===id){renderInspector();updateSelectionButtons();renderFloatingActions();}
      else selectLane(id);
      ev.stopPropagation();
    }
  });
  laneLayer.addEventListener("dblclick",ev=>{
    if(ev.target.closest("[data-lane-collapse]"))return;
    const section=ev.target.closest("[data-lane-select]");if(section){selectLane(section.dataset.laneSelect);openEditor("lane",section.dataset.laneSelect);}
  });

  edgeLayer.addEventListener("pointerdown",ev=>{
    const hit=ev.target.closest("[data-edge-id]");if(!hit||mode!=="select")return;
    resetSelectionState();selectedEdgeId=hit.dataset.edgeId;updateSelectionButtons();
  });
  edgeLayer.addEventListener("click",ev=>{
    const hit=ev.target.closest("[data-edge-id]");if(hit&&mode==="select"){
      if(selectedEdgeId===hit.dataset.edgeId){renderInspector();renderFloatingActions();renderEdges();}
      else selectEdge(hit.dataset.edgeId);
      ev.stopPropagation();
    }
  });
  edgeLayer.addEventListener("dblclick",ev=>{const hit=ev.target.closest("[data-edge-id]");if(hit){selectedEdgeId=hit.dataset.edgeId;openEditor("edge",hit.dataset.edgeId);}});

  viewport.addEventListener("pointerdown",ev=>{
    closeContextMenu();
    if(ev.target.closest(".workflow-node,.workflow-lane,.workflow-group,.edge-hit,.minimap"))return;
    if(beginMarquee(ev))return;
    if(beginPan(ev,true))return;
    if(mode==="select")clearSelection();
    if(mode==="connect"&&connectSourceId){connectSourceId=null;updateModeUI();renderNodes();}
  });
  window.addEventListener("pointermove",ev=>{moveNodeDrag(ev);movePan(ev);moveMarquee(ev);});
  window.addEventListener("pointerup",()=>{endNodeDrag();endPan();endMarquee();});

  viewport.addEventListener("wheel",ev=>{
    ev.preventDefault();closeContextMenu();
    if(ev.ctrlKey||ev.metaKey){zoomAt(ev.clientX,ev.clientY,ev.deltaY<0?1.08:.92);return;}
    const dx=ev.shiftKey&&Math.abs(ev.deltaX)<1?ev.deltaY:ev.deltaX;
    const dy=ev.shiftKey&&Math.abs(ev.deltaX)<1?0:ev.deltaY;
    board.view.x-=dx;board.view.y-=dy;applyView();persist(false);
  },{passive:false});

  viewport.addEventListener("contextmenu",openContextMenu);
  contextMenu.addEventListener("click",ev=>{
    const action=ev.target.closest("[data-context-action]")?.dataset.contextAction;if(!action)return;
    const point=contextPoint?{...contextPoint}:null;closeContextMenu();
    if(action==="stage")addNode("normal",point);
    if(action==="gate")addNode("gate",point);
    if(action==="parallel")addNode("parallel",point);
    if(action==="note")addNode("note",point);
    if(action==="lane")addLane(point);
  });
  document.addEventListener("pointerdown",ev=>{if(!contextMenu.hidden&&!ev.target.closest("#boardContextMenu"))closeContextMenu();});

  // Inspector --------------------------------------------------------------
  inspectorBody.addEventListener("change",ev=>{
    const nodeWrap=ev.target.closest("[data-inspector-node]");
    if(nodeWrap&&ev.target.dataset.field){
      const node=getNode(nodeWrap.dataset.inspectorNode);if(!node)return;pushHistory();const field=ev.target.dataset.field;
      node[field]=field==="tags"?ev.target.value.split(",").map(x=>x.trim()).filter(Boolean):ev.target.value;
      if(field==="laneId"){const lane=getLane(node.laneId);if(lane&&!lane.collapsed)node.y=snap(lane.y+86);}
      persist(false);renderAll();return;
    }
    const edgeWrap=ev.target.closest("[data-inspector-edge]");
    if(edgeWrap&&ev.target.dataset.edgeField){const edge=getEdge(edgeWrap.dataset.inspectorEdge);if(!edge)return;pushHistory();edge[ev.target.dataset.edgeField]=ev.target.value;persist(false);renderAll();return;}
    const laneWrap=ev.target.closest("[data-inspector-lane]");
    if(laneWrap&&ev.target.dataset.laneField){const lane=getLane(laneWrap.dataset.inspectorLane);if(!lane)return;pushHistory();const f=ev.target.dataset.laneField;lane[f]=f==="h"?clamp(Number(ev.target.value)||265,180,520):ev.target.value;persist(false);renderAll();return;}
    if(ev.target.dataset.laneCollapseToggle){toggleLaneCollapsed(ev.target.dataset.laneCollapseToggle);return;}
    const groupWrap=ev.target.closest("[data-inspector-group]");
    if(groupWrap&&ev.target.dataset.groupField){const group=getGroup(groupWrap.dataset.inspectorGroup);if(!group)return;pushHistory();group[ev.target.dataset.groupField]=ev.target.value;persist(false);renderAll();return;}
  });

  inspectorBody.addEventListener("click",ev=>{
    const action=ev.target.closest("[data-inspector-action]")?.dataset.inspectorAction;if(!action)return;
    if(action==="duplicate")duplicateSelected();
    if(action==="delete"||action==="delete-edge"||action==="delete-lane")deleteSelected();
    if(action==="lane-up")moveLane(selectedLaneId,-1);
    if(action==="lane-down")moveLane(selectedLaneId,1);
    if(action==="toggle-lane")toggleLaneCollapsed(selectedLaneId);
    if(action==="group-selection")openGroupDialog();
    if(action==="bulk-confirm")setBulkStatus("confirmed");
    if(action==="bulk-proposed")setBulkStatus("proposed");
    if(action==="ungroup")ungroupSelected();
    if(action==="select-group-members"){const g=getGroup(selectedGroupId);if(g)setNodeSelection(g.nodeIds,g.nodeIds.at(-1)||null);}
    if(action==="duplicate-group")duplicateSelected();
    if(action==="open-editor")openCurrentEditor();
    if(action==="comment"){
      const node=getNode(selectedNodeId);if(!node)return;
      const author=document.getElementById("commentAuthor")?.value.trim()||"Team";
      const text=document.getElementById("commentText")?.value.trim();if(!text)return;
      pushHistory();node.comments.push({id:uid("c"),author,text,date:new Date().toLocaleString("fa-IR")});persist(false);renderInspector();renderNodes();toast("Comment ثبت شد.");
    }
  });

  // Floating quick actions -------------------------------------------------
  floatingActions.addEventListener("click",ev=>{
    const action=ev.target.closest("[data-quick-action]")?.dataset.quickAction;if(!action)return;
    if(action==="edit")openCurrentEditor();
    if(action==="group")openGroupDialog();
    if(action==="duplicate")duplicateSelected();
    if(action==="confirm")setBulkStatus("confirmed");
    if(action==="delete")deleteSelected();
    if(action==="ungroup")ungroupSelected();
    if(action==="group-members"){const g=getGroup(selectedGroupId);if(g)setNodeSelection(g.nodeIds,g.nodeIds.at(-1)||null);}
    if(action==="collapse")toggleLaneCollapsed(selectedLaneId);
    if(action==="theme")cycleLaneTheme(selectedLaneId);
  });

  // Drawer + group modal ---------------------------------------------------
  closeEditDrawerBtn.addEventListener("click",closeEditor);
  cancelEditDrawerBtn.addEventListener("click",closeEditor);
  editDrawerBackdrop.addEventListener("click",closeEditor);
  saveEditDrawerBtn.addEventListener("click",saveEditor);
  cancelGroupDialogBtn.addEventListener("click",()=>groupDialog.close());
  groupDialogForm.addEventListener("submit",ev=>{ev.preventDefault();const title=groupNameInput.value.trim()||`Workflow group ${board.groups.length+1}`;const theme=groupThemeInput.value;groupDialog.close();createGroupFromSelection(title,theme);});

  // Toolbar ---------------------------------------------------------------
  syncBoardThemeControl();
  boardThemeToggleBtn?.addEventListener("click",()=>setBoardTheme(boardTheme()==="dark"?"light":"dark",true));
  document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  document.getElementById("addStageBtn").addEventListener("click",()=>addNode("normal"));
  document.getElementById("addNoteBtn").addEventListener("click",()=>addNode("note"));
  document.getElementById("addLaneBtn").addEventListener("click",()=>addLane());
  document.getElementById("undoBtn").addEventListener("click",undo);
  document.getElementById("redoBtn").addEventListener("click",redo);
  document.getElementById("autoLayoutBtn").addEventListener("click",()=>autoLayout(false));
  document.getElementById("syncBtn").addEventListener("click",syncFromTarget);
  document.getElementById("zoomInBtn").addEventListener("click",()=>zoomCenter(1.15));
  document.getElementById("zoomOutBtn").addEventListener("click",()=>zoomCenter(.87));
  document.getElementById("fitBtn").addEventListener("click",fitToView);
  document.getElementById("duplicateBtn").addEventListener("click",duplicateSelected);
  document.getElementById("deleteBtn").addEventListener("click",deleteSelected);
  document.getElementById("groupBtn")?.addEventListener("click",openGroupDialog);
  document.getElementById("exportBoardBtn").addEventListener("click",exportBoardJson);
  document.getElementById("exportMiroBtn").addEventListener("click",exportMiroCsv);
  document.getElementById("exportSvgBtn").addEventListener("click",exportSvg);
  document.getElementById("importBoardInput").addEventListener("change",ev=>{const file=ev.target.files?.[0];if(file)importBoard(file);ev.target.value="";});
  searchInput.addEventListener("input",applyFilters);
  statusFilter.addEventListener("change",applyFilters);

  document.getElementById("toggleEdges").addEventListener("change",ev=>{layerState.edges=ev.target.checked;renderEdges();renderMinimap();});
  document.getElementById("toggleGrid").addEventListener("change",ev=>{layerState.grid=ev.target.checked;viewport.classList.toggle("grid-on",layerState.grid);});
  document.getElementById("toggleSnap").addEventListener("change",ev=>{layerState.snap=ev.target.checked;board.settings.snap=layerState.snap;persist(false);});
  document.getElementById("toggleMinimap").addEventListener("change",ev=>{layerState.minimap=ev.target.checked;renderMinimap();});

  window.addEventListener("keydown",ev=>{
    const active=document.activeElement?.tagName,typing=["INPUT","TEXTAREA","SELECT"].includes(active);
    if(ev.code==="Space"&&!typing){spaceDown=true;ev.preventDefault();}
    if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="z"&&!ev.shiftKey){ev.preventDefault();undo();}
    if((ev.ctrlKey||ev.metaKey)&&((ev.key.toLowerCase()==="y")||(ev.shiftKey&&ev.key.toLowerCase()==="z"))){ev.preventDefault();redo();}
    if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==="g"&&!typing){ev.preventDefault();openGroupDialog();}
    if(!typing&&ev.key.toLowerCase()==="t"&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey){setBoardTheme(boardTheme()==="dark"?"light":"dark",true);}
    if(typing)return;
    if(ev.key==="Delete"||ev.key==="Backspace"){ev.preventDefault();deleteSelected();}
    if(ev.key==="Escape"){closeContextMenu();closeEditor();if(groupDialog.open)groupDialog.close();setMode("select");clearSelection();}
    if(ev.key.toLowerCase()==="v")setMode("select");
    if(ev.key.toLowerCase()==="m")setMode("marquee");
    if(ev.key.toLowerCase()==="h")setMode("pan");
    if(ev.key.toLowerCase()==="c")setMode("connect");
    if(ev.key==="+")zoomCenter(1.15);
    if(ev.key==="-")zoomCenter(.87);
  });
  window.addEventListener("keyup",ev=>{if(ev.code==="Space")spaceDown=false;});
  window.addEventListener("resize",()=>{renderMinimap();positionFloatingActions();});

  minimap.addEventListener("click",ev=>{
    const r=minimap.getBoundingClientRect(),scale=Math.min(205/board.world.width,118/board.world.height);
    const wx=(ev.clientX-r.left)/scale,wy=(ev.clientY-r.top)/scale;
    board.view.x=viewport.clientWidth/2-wx*board.view.scale;board.view.y=viewport.clientHeight/2-wy*board.view.scale;applyView();persist(false);
  });

  // Init ------------------------------------------------------------------
  renderAll();
  updateUndoRedo();
  viewport.classList.toggle("grid-on",layerState.grid);
  requestAnimationFrame(()=>{if(!project.visualBoard?.board)fitToView();persist(false);});
})();
