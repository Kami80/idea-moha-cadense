(() => {
  const STORAGE_KEY = "cadence-workflow-studio-v1";
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
  let state = loadState();
  let currentView = "overview";
  let pendingEditor = null;

  const workspace = document.getElementById("workspace");
  const titleEl = document.getElementById("viewTitle");
  const subtitleEl = document.getElementById("viewSubtitle");
  const toastEl = document.getElementById("toast");
  const dialog = document.getElementById("editDialog");
  const editForm = document.getElementById("editForm");
  const editDialogBody = document.getElementById("editDialogBody");
  const editDialogTitle = document.getElementById("editDialogTitle");

  const viewMeta = {
    overview:["نمای کلی پروژه","Context، Scope، مسئله اصلی، Facts و اصولی که طراحی باید روی آن‌ها قفل شود."],
    current:["فرایند فعلی (As-Is)","جریان واقعی اطلاعات از فروش تا تحویل و نقاطی که اکنون باعث دوباره‌کاری و اتلاف می‌شوند."],
    target:["فرایند پیشنهادی (To-Be)","State-based و Event-driven، با رهگیری مرحله‌ای/تعدادی و مسیر پارچه به‌عنوان dependency مستقل."],
    requirements:["نیازمندی‌ها و Roadmap","Backlog قابل ویرایش با فاز MVP / V1 / V2، اولویت، وضعیت، مالک و Acceptance Criteria."],
    data:["مدل داده و اسناد","ساختار پیشنهادی برای جلوگیری از تبدیل سیستم به مجموعه‌ای از فرم‌های جدا و ناسازگار."],
    roles:["نقش‌ها و دسترسی‌ها","پیشنهاد اولیه RBAC و ماتریس اختیار برای نهایی‌سازی در جلسه تیم."],
    planning:["برنامه‌ریزی تولید","مدل Assisted Planning برای افق دو هفته، هماهنگی ظرفیت، WIP و آماده‌بودن پارچه."],
    metrics:["KPI و داشبورد","تعریف اندازه‌گیری موفقیت و Widgetهای عملیاتی/مدیریتی، بدون اختراع داده واقعی."],
    questions:["ابهام‌ها، ریسک‌ها و تصمیم‌ها","مرکز تصمیم‌گیری پروژه؛ هر ابهام باید Owner و وضعیت داشته باشد تا قبل از توسعه بسته شود."],
    miro:["Miro و همکاری تیمی","Blueprint برد تیم، Workshop agenda و خروجی CSV/brief برای انتقال سریع ساختار به Miro."],
    changelog:["تاریخچه تغییرات","ثبت تصمیم‌ها و تغییرات Scope تا Workflow Studio به منبع واحد حقیقت پروژه تبدیل شود."]
  };

  function loadState(){
    try{
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : deepClone(window.CADENCE_DEFAULT_PROJECT);
    }catch(err){
      console.warn("Could not load saved state", err);
      return deepClone(window.CADENCE_DEFAULT_PROJECT);
    }
  }

  function saveState(show=true){
    state.meta.lastUpdated = new Date().toISOString().slice(0,10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderHealth();
    if(show) toast("تغییرات در مرورگر ذخیره شد.");
  }

  function h(value=""){
    return String(value)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function toast(message){
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(()=>toastEl.classList.remove("show"),2200);
  }

  function sourceBadge(source){
    return source ? `<span class="source-badge">${h(source)}</span>` : "";
  }

  function priorityBadge(priority){
    const c = String(priority||"").toLowerCase();
    return `<span class="badge ${c}">${h(priority)}</span>`;
  }

  function phaseBadge(phase){
    return `<span class="badge ${String(phase||"").toLowerCase()}">${h(phase)}</span>`;
  }

  function statusBadge(status){
    const s = String(status||"");
    const cls = /decided|closed|done|answer/i.test(s) ? "decided" : /progress|ready|enhanced/i.test(s) ? "progress" : "open";
    return `<span class="badge ${cls}">${h(status)}</span>`;
  }

  function renderHealth(){
    const total = state.questions.length || 1;
    const closed = state.questions.filter(q => !/^open$/i.test(q.status) || (q.answer||"").trim()).length;
    const pct = Math.round((closed/total)*100);
    document.getElementById("projectHealth").innerHTML = `
      <div class="health-head">
        <span class="health-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 18V9M9 18V5M14 18v-7M19 18V3"/></svg></span>
        <div class="health-copy"><strong>آمادگی Workshop</strong><span>${closed} از ${total} ابهام بررسی شده</span></div>
        <strong class="health-percent ltr">${pct}%</strong>
      </div>
      <div class="health-track" aria-label="Workshop readiness ${pct}%"><div class="health-fill" style="width:${pct}%"></div></div>`;
  }

  function setView(view){
    currentView = view;
    const meta = viewMeta[view] || viewMeta.overview;
    titleEl.textContent = meta[0];
    subtitleEl.textContent = meta[1];
    document.querySelectorAll(".nav-item").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function render(){
    const views = {overview:renderOverview,current:renderCurrent,target:renderTarget,requirements:renderRequirements,data:renderData,roles:renderRoles,planning:renderPlanning,metrics:renderMetrics,questions:renderQuestions,miro:renderMiro,changelog:renderChangelog};
    workspace.innerHTML = (views[currentView] || renderOverview)();
  }

  function renderOverview(){
    const estOwned = Math.round(50*.7), estB2B = Math.round(50*.3);
    return `
      <div class="grid grid-4">
        ${state.facts.map(f=>`<div class="stat-card"><div class="stat-value">${h(f.value)}</div><div class="stat-label">${h(f.label)}</div><div class="stat-caption">${h(f.note)} · ${h(f.source)}</div></div>`).join("")}
      </div>

      <div class="grid grid-2" style="margin-top:18px">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Problem framing</div><h2>مسئله‌ای که واقعاً باید حل شود</h2></div><button class="btn btn-small btn-secondary" data-action="edit-context">ویرایش</button></div>
          <p>${h(state.businessContext.problemStatement)}</p>
          <div class="callout"><strong>North Star:</strong> ${h(state.businessContext.northStar)}</div>
          <p class="card-note">Source basis: PDF p.5–14, 22–23. این صورت‌بندی، جمع‌بندی تحلیلی از مشکلات ثبت‌شده در سند است.</p>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Scope guardrail</div><h2>مرز پروژه</h2></div><button class="btn btn-small btn-secondary" data-action="edit-meta">ویرایش</button></div>
          <div class="callout info"><strong>In scope:</strong> ${h(state.meta.scope)}</div>
          <div class="callout warning" style="margin-top:10px"><strong>Not now:</strong> ${h(state.meta.outOfScope)}</div>
          <p>${h(state.meta.notes)}</p>
        </article>
      </div>

      <div class="grid grid-2" style="margin-top:18px">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Known production mix</div><h2>تقسیم تقریبی 50 سفارش ماهانه</h2></div>${sourceBadge("PDF p.3,6")}</div>
          <div class="donut-wrap">
            <div class="donut"><div class="donut-center"><span><strong>50</strong>سفارش / ماه</span></div></div>
            <div class="legend">
              <div class="legend-item"><span class="legend-dot"></span><span>فروشگاه‌های مجموعه — 70% ≈ ${estOwned} سفارش</span></div>
              <div class="legend-item"><span class="legend-dot orange"></span><span>B2B / نمایندگی — 30% ≈ ${estB2B} سفارش</span></div>
              <div class="small">اعداد 35/15 از ترکیب دو داده سند مشتق شده‌اند و فقط تخمین ترکیب ماهانه هستند.</div>
            </div>
          </div>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Design principles</div><h2>اصول غیرقابل مذاکره طراحی</h2></div><button class="btn btn-small btn-secondary" data-action="add-principle">+ اصل</button></div>
          <ul class="list-clean">${state.businessContext.principles.map((p,i)=>`<li><div class="inline-actions" style="justify-content:space-between"><span>${h(p)}</span><button class="icon-btn" data-action="edit-principle" data-index="${i}">✎</button></div></li>`).join("")}</ul>
        </article>
      </div>

      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">System architecture at a glance</div><h2>چهار هسته‌ای که سند روی آن‌ها همگراست</h2></div>${sourceBadge("PDF p.23")}</div>
        <div class="grid grid-4">
          ${[
            ["Dashboard","دید لحظه‌ای مدیر و مسئول سفارشات","WIP · delay · bottleneck"],
            ["Orders","ثبت سفارش + Order Items + بیجک","single source of truth"],
            ["Production","Stage/Qty tracking + event log","real-time shopfloor status"],
            ["Planning","برنامه هفتگی + اولویت + ظرفیت","2-week visibility"]
          ].map(x=>`<div class="stat-card"><div class="kicker">${x[0]}</div><h3>${x[1]}</h3><div class="small ltr">${x[2]}</div></div>`).join("")}
        </div>
      </article>
    `;
  }

  function renderCurrent(){
    return `
      <article class="card">
        <div class="card-head"><div><div class="kicker">As-Is workflow</div><h2>جریان فعلی از فروش تا تحویل</h2></div><button class="btn btn-small btn-primary" data-action="add-current-stage">+ مرحله</button></div>
        <div class="flow-row">
          ${state.currentWorkflow.sort((a,b)=>a.order-b.order).map((s,i)=>`
            <div class="flow-node ${i===3||i===4?'alert':''}">
              <div class="flow-node-title">${String(s.order).padStart(2,"0")} · ${h(s.title)}</div>
              <div class="flow-node-meta"><strong>Owner:</strong> ${h(s.owner)}<br><strong>Tool:</strong> ${h(s.tool)}</div>
              <div class="badges"><span class="badge">${h(s.source)}</span>${i===3||i===4?'<span class="badge high">گلوگاه اصلی</span>':''}</div>
              <div class="stage-edit-row"><button class="btn btn-small btn-secondary" data-action="edit-current-stage" data-id="${h(s.id)}">ویرایش</button><button class="btn btn-small btn-danger" data-action="delete-current-stage" data-id="${h(s.id)}">حذف</button></div>
            </div>`).join("")}
        </div>
      </article>
      <div class="grid grid-2" style="margin-top:18px">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Information handoff</div><h2>چرا جریان فعلی شکننده است؟</h2></div>${sourceBadge("PDF p.5,9,11-13")}</div>
          <div class="pipeline">
            ${[
              ["Sales",100,"فرم/پیام"],["Order Coordinator",100,"بازثبت Excel"],["Production Planning",82,"Excel"],["Production Teams",65,"کاغذ/شفاهی"],["Delivery",45,"فرم خروج"]
            ].map(([l,v,t])=>`<div class="pipeline-row"><div class="pipeline-label">${l}</div><div class="pipeline-track"><div class="pipeline-fill" style="width:${v}%"></div></div><div class="pipeline-value">${t}</div></div>`).join("")}
          </div>
          <p class="card-note">عرض نوارها «داده واقعی عملکرد» نیست؛ فقط نمایش مفهومی کاهش ساخت‌یافتگی/visibility در handoffهاست.</p>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Pain map</div><h2>گلوگاه‌های ثبت‌شده</h2></div></div>
          <ul class="list-clean">
            ${state.currentWorkflow.filter(s=>s.pain).map(s=>`<li><strong>${h(s.title)}:</strong> ${h(s.pain)}</li>`).join("")}
          </ul>
        </article>
      </div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Process matrix</div><h2>ماتریس مرحله / مسئول / ورودی / خروجی</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>مرحله</th><th>مسئول</th><th>ورودی</th><th>خروجی</th><th>ابزار فعلی</th><th>مشکل</th></tr></thead><tbody>
          ${state.currentWorkflow.sort((a,b)=>a.order-b.order).map(s=>`<tr><td>${s.order}</td><td><strong>${h(s.title)}</strong><br>${sourceBadge(s.source)}</td><td>${h(s.owner)}</td><td>${h(s.input)}</td><td>${h(s.output)}</td><td>${h(s.tool)}</td><td>${h(s.pain)}</td></tr>`).join("")}
        </tbody></table></div>
      </article>`;
  }

  function renderTarget(){
    const allStages = state.targetWorkflow.lanes.flatMap(l=>l.stages);
    return `
      <div class="callout warning"><strong>وضعیت:</strong> پیشنهادی و نیازمند تأیید Workshop. موازی بودن مسیر پارچه و نجاری و Gateهای Merge هنوز در سند قطعی نشده‌اند.</div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Future-state workflow</div><h2>State Machine پیشنهادی</h2></div><button class="btn btn-small btn-secondary" data-action="edit-target-note">ویرایش توضیح</button></div>
        <div class="workflow-shell">
          ${state.targetWorkflow.lanes.map(lane=>`
            <div class="flow-lane">
              <div class="flow-lane-head"><div><div class="flow-lane-title ltr">${h(lane.name)}</div><div class="small">${h(lane.description)}</div></div><button class="btn btn-small btn-secondary" data-action="add-target-stage" data-lane="${h(lane.id)}">+ مرحله</button></div>
              <div class="flow-row">
                ${lane.stages.map(s=>`<div class="flow-node ${s.type==='parallel'?'parallel':s.type==='gate'?'gate':''}">
                  <div class="flow-node-title">${h(s.title)}</div>
                  <div class="flow-node-meta"><strong>Owner:</strong> ${h(s.owner)}<br><strong>DoD:</strong> ${h(s.definitionOfDone)}</div>
                  <div class="badges"><span class="badge">${h(s.type)}</span></div>
                  <div class="stage-edit-row"><button class="btn btn-small btn-secondary" data-action="edit-target-stage" data-lane="${h(lane.id)}" data-id="${h(s.id)}">ویرایش</button><button class="btn btn-small btn-danger" data-action="delete-target-stage" data-lane="${h(lane.id)}" data-id="${h(s.id)}">حذف</button></div>
                </div>`).join("")}
              </div>
            </div>`).join("")}
        </div>
      </article>

      <div class="grid grid-3" style="margin-top:18px">
        <div class="stat-card"><div class="stat-value">${allStages.length}</div><div class="stat-label">حالت/مرحله پیشنهادی</div><div class="stat-caption">در 3 Lane برای جداکردن Order، Fabric و Production</div></div>
        <div class="stat-card"><div class="stat-value">Qty</div><div class="stat-label">واحد رهگیری پیشنهادی</div><div class="stat-caption">Order-level به‌تنهایی کافی نیست؛ Stage + Quantity لازم است.</div></div>
        <div class="stat-card"><div class="stat-value">Event</div><div class="stat-label">موتور تغییر وضعیت</div><div class="stat-caption">هر تغییر باید user/time/from/to/qty/comment داشته باشد.</div></div>
      </div>

      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">State contract</div><h2>قاعده پیشنهادی برای هر انتقال وضعیت</h2></div></div>
        <div class="grid grid-4">
          ${[
            ["Who","کاربر یا سیستم ایجادکننده رویداد"],["When","timestamp شروع/پایان/تغییر"],["How much","planned/completed/rework qty"],["Why","comment + blocker + attachment"]
          ].map(x=>`<div class="stat-card"><div class="kicker ltr">${x[0]}</div><h3>${x[1]}</h3></div>`).join("")}
        </div>
      </article>`;
  }

  function renderRequirements(){
    const phases = ["MVP","V1","V2"];
    const phaseCounts = Object.fromEntries(phases.map(p=>[p,state.requirements.filter(r=>r.phase===p).length]));
    return `
      <div class="grid grid-3">
        ${phases.map(p=>`<div class="stat-card"><div class="stat-value">${phaseCounts[p]}</div><div class="stat-label">${p} requirement</div><div class="stat-caption">${p==='MVP'?'هسته ارزش‌آفرین و حذف کار دستی':p==='V1'?'Planning، ETA و automation':'تحلیل و Integrationهای پیشرفته'}</div></div>`).join("")}
      </div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Release backlog</div><h2>نیازمندی‌های محصول</h2></div><button class="btn btn-small btn-primary" data-action="add-requirement">+ نیازمندی</button></div>
        <div class="kanban">
          ${phases.map(p=>`<div class="kanban-col"><div class="kanban-head"><span>${p}</span><span class="badge">${phaseCounts[p]}</span></div>
            ${state.requirements.filter(r=>r.phase===p).map(r=>`<div class="kanban-card"><div class="badges">${priorityBadge(r.priority)} ${statusBadge(r.status)}</div><h4>${h(r.title)}</h4><p>${h(r.why)}</p><div class="inline-actions" style="margin-top:9px"><button class="btn btn-small btn-secondary" data-action="edit-requirement" data-id="${r.id}">ویرایش</button><button class="btn btn-small btn-danger" data-action="delete-requirement" data-id="${r.id}">حذف</button></div></div>`).join("")}
          </div>`).join("")}
        </div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Definition detail</div><h2>Backlog کامل و Acceptance Criteria</h2></div></div>
        <div class="table-wrap"><table><thead><tr><th>Feature</th><th>Phase</th><th>Priority</th><th>Status</th><th>Owner</th><th>Business why</th><th>Acceptance Criteria</th><th>Source</th></tr></thead><tbody>
          ${state.requirements.map(r=>`<tr><td><strong>${h(r.title)}</strong></td><td>${phaseBadge(r.phase)}</td><td>${priorityBadge(r.priority)}</td><td>${statusBadge(r.status)}</td><td>${h(r.owner)}</td><td>${h(r.why)}</td><td>${h(r.acceptance)}</td><td>${sourceBadge(r.source)}</td></tr>`).join("")}
        </tbody></table></div>
      </article>`;
  }

  function renderData(){
    return `
      <div class="callout"><strong>Design decision:</strong> Product ≠ Order. هر سفارش می‌تواند چند Order Item داشته باشد و وضعیت تولید باید برای Scope دقیق (Order/Item/Component) تعریف شود. ${sourceBadge("PDF p.3,6")}</div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Proposed domain model</div><h2>Entity Map</h2></div><button class="btn btn-small btn-primary" data-action="add-entity">+ Entity</button></div>
        <div class="mermaid-like">
          ${state.entities.map((e,i)=>`<div class="entity"><strong class="ltr">${h(e.name)}</strong><ul><li>${h(e.purpose)}</li>${e.fields.map(f=>`<li class="ltr">• ${h(f)}</li>`).join("")}</ul><div style="padding:0 8px 8px"><button class="btn btn-small btn-secondary" data-action="edit-entity" data-index="${i}">ویرایش</button></div></div>`).join("")}
        </div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Factory documents</div><h2>سه سند کلیدی و معادل دیجیتال</h2></div>${sourceBadge("PDF p.16")}</div>
        <div class="grid grid-3">${state.documents.map(d=>`<div class="stat-card"><div class="kicker ltr">${h(d.english)}</div><h3>${h(d.name)}</h3><p>${h(d.role)}</p><div class="code">${h(d.digitalTarget)}</div></div>`).join("")}</div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Relationship rules</div><h2>روابطی که باید قبل از دیتابیس نهایی تأیید شوند</h2></div></div>
        <ul class="list-clean">
          <li><strong>Order 1 → N OrderItem:</strong> مطابق نیاز سند برای سفارش چندآیتمی.</li>
          <li><strong>OrderItem N → 1 ProductModel:</strong> مدل محصول مستقل از سفارش نگهداری شود.</li>
          <li><strong>OrderItem 1 → N StageRun:</strong> هر مرحله وضعیت/تعداد/زمان مستقل دارد.</li>
          <li><strong>OrderItem 1 → N FabricRequirement (در صورت چندپارچه):</strong> نیازمند تصمیم q3.</li>
          <li><strong>WorkOrder Scope:</strong> Order یا Item/Component؟ این تصمیم روی همه اسناد و tracking اثر دارد.</li>
          <li><strong>AuditEvent:</strong> Append-only برای تمام انتقال‌ها و اصلاح‌های حساس.</li>
        </ul>
      </article>`;
  }

  function permCell(v){
    if(v==="Y") return '<span class="perm yes" title="Allowed">✓</span>';
    if(v==="L") return '<span class="perm limited" title="Limited / view / approval">~</span>';
    return '<span class="perm no" title="No access">–</span>';
  }

  function renderRoles(){
    const keys = state.roles.map(r=>r.id);
    return `
      <article class="card">
        <div class="card-head"><div><div class="kicker">RBAC proposal</div><h2>نقش‌ها و حدود اختیار</h2></div><button class="btn btn-small btn-primary" data-action="add-role">+ نقش</button></div>
        <div class="grid grid-3">
          ${state.roles.map(r=>`<div class="stat-card"><div class="kicker ltr">${h(r.id)}</div><h3>${h(r.name)}</h3><p><strong>می‌بیند:</strong> ${h(r.view)}</p><p><strong>انجام می‌دهد:</strong> ${h(r.actions)}</p><p class="small"><strong>محدودیت:</strong> ${h(r.restricted)}</p><button class="btn btn-small btn-secondary" data-action="edit-role" data-id="${r.id}">ویرایش</button></div>`).join("")}
        </div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Permission matrix</div><h2>ماتریس پیشنهادی اختیار</h2></div><div class="badges"><span class="badge decided">✓ مجاز</span><span class="badge medium">~ محدود/مشاهده</span><span class="badge">– بدون دسترسی</span></div></div>
        <div class="table-wrap"><table class="permission-matrix"><thead><tr><th>Action</th>${state.roles.map(r=>`<th>${h(r.name)}</th>`).join("")}</tr></thead><tbody>
          ${state.permissions.map(row=>`<tr><td>${h(row.action)}</td>${keys.map(k=>`<td>${permCell(row[k]||"N")}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>
        <p class="card-note">این ماتریس enhancement پیشنهادی است. سند فقط نقش‌ها و بخشی از دسترسی‌ها را پیشنهاد کرده و هنوز پاسخ رسمی سؤال 13 کامل نشده است.</p>
      </article>`;
  }

  function renderPlanning(){
    const w = state.planning.priorityWeights;
    const max = Math.max(...Object.values(w));
    return `
      <div class="grid grid-3">
        <div class="stat-card"><div class="stat-value">${h(state.planning.horizonWeeks)}w</div><div class="stat-label">افق برنامه‌ریزی پیشنهادی</div><div class="stat-caption">همسو با KPI «قابلیت برنامه‌ریزی 2 هفته آینده» در سند</div></div>
        <div class="stat-card"><div class="stat-value">Weekly</div><div class="stat-label">Cadence اصلی</div><div class="stat-caption">${h(state.planning.planningCadence)}</div></div>
        <div class="stat-card"><div class="stat-value">WIP</div><div class="stat-label">سیگنال کلیدی Planning</div><div class="stat-caption">توازن مرحله‌ها مهم‌تر از صرفاً شمار سفارش فعال است.</div></div>
      </div>
      <div class="grid grid-2" style="margin-top:18px">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Priority model — proposal</div><h2>وزن‌های آزمایشی اولویت‌بندی</h2></div><button class="btn btn-small btn-secondary" data-action="edit-planning">ویرایش</button></div>
          <div class="pipeline">
            ${Object.entries({"تاریخ تحویل":w.deliveryDate,"آماده بودن پارچه":w.fabricReady,"توازن Stageها":w.stageBalance,"اولویت دستی":w.manualPriority}).map(([l,v])=>`<div class="pipeline-row"><div class="pipeline-label">${l}</div><div class="pipeline-track"><div class="pipeline-fill" style="width:${(v/max)*100}%"></div></div><div class="pipeline-value">${v}%</div></div>`).join("")}
          </div>
          <div class="callout warning" style="margin-top:14px">${h(state.planning.note)}</div>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Planning rules</div><h2>قواعد Release و کنترل WIP</h2></div><button class="btn btn-small btn-primary" data-action="add-planning-rule">+ Rule</button></div>
          <ul class="list-clean">${state.planning.rules.map((r,i)=>`<li><div class="inline-actions" style="justify-content:space-between"><span>${h(r.rule)} <span class="badge">${h(r.status)}</span></span><button class="icon-btn" data-action="edit-planning-rule" data-index="${i}">✎</button></div></li>`).join("")}</ul>
        </article>
      </div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Suggested planning sequence</div><h2>روال Assisted Planning قبل از ساخت optimizer</h2></div></div>
        <div class="flow-row">
          ${[
            ["1. Candidate orders","تاریخ تحویل + Approval + Scope"],["2. Fabric gate","نیاز/دریافت/خیاطی"],["3. Stage capacity","بار برنامه + WIP موجود"],["4. Sequence proposal","امتیاز اولویت"],["5. Human confirmation","مسئول سفارشات/مدیر تولید"],["6. Release","قفل نسخه برنامه + event log"]
          ].map((x,i)=>`<div class="flow-node ${i===1||i===2?'parallel':'gate'}"><div class="flow-node-title ltr">${x[0]}</div><div class="flow-node-meta">${x[1]}</div></div>`).join("")}
        </div>
      </article>`;
  }

  function renderMetrics(){
    return `
      <div class="grid grid-2">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Source KPIs</div><h2>اهداف ذکرشده در Discovery</h2></div>${sourceBadge("PDF p.22-23")}</div>
          <div class="pipeline">
            <div class="pipeline-row"><div class="pipeline-label">ثبت سفارش</div><div class="pipeline-track"><div class="pipeline-fill" style="width:33%"></div></div><div class="pipeline-value">15m → &lt;5m*</div></div>
            <div class="pipeline-row"><div class="pipeline-label">پیگیری وضعیت</div><div class="pipeline-track"><div class="pipeline-fill" style="width:50%"></div></div><div class="pipeline-value">≥ 50%↓</div></div>
            <div class="pipeline-row"><div class="pipeline-label">ورود مجدد</div><div class="pipeline-track"><div class="pipeline-fill" style="width:25%"></div></div><div class="pipeline-value">→ 1 بار</div></div>
            <div class="pipeline-row"><div class="pipeline-label">Planning horizon</div><div class="pipeline-track"><div class="pipeline-fill" style="width:80%"></div></div><div class="pipeline-value">→ 2 هفته</div></div>
          </div>
          <p class="card-note">* «15 دقیقه» در جدول سند با واژه «مثلاً» آمده و باید به‌عنوان baseline واقعی اندازه‌گیری شود.</p>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Dashboard split</div><h2>دو داشبورد، دو تصمیم متفاوت</h2></div></div>
          <div class="grid grid-2">
            <div class="stat-card"><div class="kicker">Operational</div><h3>مسئول سفارشات</h3><p>جدید، منتظر پارچه، هر Stage، آماده تحویل، معوق، Blocker و Next Action.</p></div>
            <div class="stat-card"><div class="kicker">Management</div><h3>مدیر کارخانه</h3><p>کل Active، ظرفیت، گلوگاه، Lead Time، دیرکرد و عملکرد هفتگی.</p></div>
          </div>
        </article>
      </div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Metric dictionary</div><h2>KPI Dictionary قابل توسعه</h2></div><button class="btn btn-small btn-primary" data-action="add-metric">+ KPI</button></div>
        <div class="table-wrap"><table><thead><tr><th>KPI</th><th>Baseline</th><th>Target</th><th>Formula / event source</th><th>Owner</th><th>Source</th><th></th></tr></thead><tbody>
          ${state.metrics.map(m=>`<tr><td><strong>${h(m.name)}</strong></td><td>${h(m.baseline)}</td><td>${h(m.target)}</td><td class="ltr">${h(m.formula)}</td><td>${h(m.owner)}</td><td>${sourceBadge(m.source)}</td><td><button class="btn btn-small btn-secondary" data-action="edit-metric" data-id="${m.id}">ویرایش</button></td></tr>`).join("")}
        </tbody></table></div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Widget catalog</div><h2>Widgetهای پیشنهادی داشبورد</h2></div></div>
        <div class="grid grid-4">${state.dashboardWidgets.map(w=>`<div class="stat-card"><div class="kicker">${h(w.audience)} · ${h(w.type)}</div><h3>${h(w.name)}</h3><p>${h(w.definition)}</p></div>`).join("")}</div>
      </article>`;
  }

  function renderQuestions(){
    const categories = [...new Set(state.questions.map(q=>q.category))];
    const open = state.questions.filter(q=>/^open$/i.test(q.status)&&!(q.answer||"").trim()).length;
    const high = state.questions.filter(q=>q.priority==="High"&&/^open$/i.test(q.status)&&!(q.answer||"").trim()).length;
    return `
      <div class="grid grid-3">
        <div class="stat-card"><div class="stat-value">${open}</div><div class="stat-label">ابهام باز</div><div class="stat-caption">باید Owner و پاسخ/تصمیم داشته باشند.</div></div>
        <div class="stat-card"><div class="stat-value">${high}</div><div class="stat-label">High-priority blocker</div><div class="stat-caption">قبل از قفل Schema/MVP حل شوند.</div></div>
        <div class="stat-card"><div class="stat-value">${state.risks.length}</div><div class="stat-label">ریسک ثبت‌شده</div><div class="stat-caption">با Mitigation قابل پیگیری.</div></div>
      </div>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Decision backlog</div><h2>ابهام‌های Discovery و سؤال‌های Workshop</h2></div><button class="btn btn-small btn-primary" data-action="add-question">+ سؤال</button></div>
        <div class="table-wrap"><table><thead><tr><th>Category</th><th>Question</th><th>Priority</th><th>Owner</th><th>Status</th><th>Answer / Decision</th><th>Source</th><th></th></tr></thead><tbody>
          ${state.questions.map(q=>`<tr><td>${h(q.category)}</td><td><strong>${h(q.question)}</strong></td><td>${priorityBadge(q.priority)}</td><td>${h(q.owner)}</td><td>${statusBadge(q.status)}</td><td>${q.answer? h(q.answer):'<span class="small">— هنوز ثبت نشده —</span>'}</td><td>${sourceBadge(q.source)}</td><td><button class="btn btn-small btn-secondary" data-action="edit-question" data-id="${q.id}">پاسخ/ویرایش</button></td></tr>`).join("")}
        </tbody></table></div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Risk register</div><h2>ریسک‌ها و Mitigation</h2></div><button class="btn btn-small btn-primary" data-action="add-risk">+ ریسک</button></div>
        <div class="table-wrap"><table><thead><tr><th>Risk</th><th>Impact</th><th>Probability</th><th>Mitigation</th><th>Owner</th><th></th></tr></thead><tbody>
          ${state.risks.map(r=>`<tr><td><strong>${h(r.risk)}</strong></td><td>${priorityBadge(r.impact)}</td><td>${priorityBadge(r.probability)}</td><td>${h(r.mitigation)}</td><td>${h(r.owner)}</td><td><button class="btn btn-small btn-secondary" data-action="edit-risk" data-id="${r.id}">ویرایش</button></td></tr>`).join("")}
        </tbody></table></div>
      </article>
      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Decision log</div><h2>تصمیم‌های نهایی‌شده</h2></div><button class="btn btn-small btn-primary" data-action="add-decision">+ تصمیم</button></div>
        ${state.decisions.length?`<div class="timeline">${state.decisions.map(d=>`<div class="timeline-item"><h4>${h(d.title)}</h4><p>${h(d.decision)} · Owner: ${h(d.owner)} · ${h(d.date)}</p></div>`).join("")}</div>`:'<div class="empty">هنوز تصمیم رسمی ثبت نشده. در Workshop هر پاسخ قطعی را به Decision Log منتقل کنید.</div>'}
      </article>`;
  }

  function renderMiro(){
    const url = state.meta.miroBoardUrl || "";
    return `
      <div class="grid grid-2">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Team board connection</div><h2>برد اصلی Miro</h2></div></div>
          <div class="form-group"><label>MIRO BOARD URL</label><input type="url" id="miroUrlField" value="${h(url)}" placeholder="https://miro.com/app/board/..." /></div>
          <div class="inline-actions" style="margin-top:10px"><button class="btn btn-primary" data-action="save-miro-url">ذخیره لینک</button><button class="btn btn-secondary" data-action="open-miro">باز کردن برد</button></div>
          <p class="card-note">نسخه Local این Workspace عمداً Token/OAuth را ذخیره نمی‌کند. برای همکاری زنده، برد Miro مرجع جلسه است و این اپ مرجع ساختار/تصمیم/خروجی.</p>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Export bridge</div><h2>انتقال سریع به Miro</h2></div></div>
          <p>دو خروجی ساخته شده تا بدون وابستگی به Backend بتوانید ساختار Discovery را به برد تیم منتقل کنید:</p>
          <div class="inline-actions"><button class="btn btn-primary" data-action="export-miro-csv">دانلود Miro CSV</button><button class="btn btn-secondary" data-action="copy-miro-brief">Copy board brief</button><a class="btn btn-secondary" href="workflow-board.html">Visual Board ↗</a></div>
          <div class="callout info" style="margin-top:12px">بعداً، اگر Workflow Studio از Local-only به Web App تیمی ارتقا پیدا کند، می‌توان Miro Live Embed یا REST API/OAuth را به‌عنوان Integration جدا اضافه کرد.</div>
        </article>
      </div>

      <article class="card" style="margin-top:18px">
        <div class="card-head"><div><div class="kicker">Board blueprint</div><h2>Frameهای پیشنهادی برد تیم</h2></div></div>
        <div class="grid grid-3">${state.miro.boardFrames.map(f=>`<div class="stat-card"><div class="kicker ltr">${h(f.name)}</div><p>${h(f.purpose)}</p></div>`).join("")}</div>
      </article>

      <div class="grid grid-2" style="margin-top:18px">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Workshop agenda</div><h2>جلسه نهایی‌سازی نیازمندی‌ها</h2></div></div>
          <ul class="list-clean">${state.miro.workshopAgenda.map(a=>`<li class="ltr">${h(a)}</li>`).join("")}</ul>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Team protocol</div><h2>پیشنهاد روش کار بین این App و Miro</h2></div></div>
          <ol style="font-size:12px;line-height:2;color:#475761;margin:0;padding-right:20px">
            <li>Miro برای Workshop، sticky notes، رأی‌گیری، discussion و visual mapping.</li>
            <li>Workflow Studio برای نسخه رسمی requirements، answers، decisions، metrics و exports.</li>
            <li>بعد از هر جلسه، تصمیم‌های قطعی از Miro در بخش Questions/Decisions این App ثبت شوند.</li>
            <li>قبل از Sprint/فاز طراحی، JSON/Markdown snapshot گرفته شود تا baseline قابل بازگشت باشد.</li>
          </ol>
        </article>
      </div>`;
  }

  function renderChangelog(){
    return `
      <div class="grid grid-2">
        <article class="card">
          <div class="card-head"><div><div class="kicker">Change log</div><h2>نسخه‌ها و تغییرات</h2></div><button class="btn btn-small btn-primary" data-action="add-changelog">+ تغییر</button></div>
          <div class="timeline">${state.changelog.slice().reverse().map(c=>`<div class="timeline-item"><h4>${h(c.type)} — ${h(c.date)}</h4><p>${h(c.note)} · ${h(c.author)}</p></div>`).join("")}</div>
        </article>
        <article class="card">
          <div class="card-head"><div><div class="kicker">Version control habit</div><h2>چطور این Workspace منبع واحد حقیقت بماند؟</h2></div></div>
          <div class="checklist">
            ${[
              "بعد از هر Workshop، Questions و Decisions را به‌روز کنید.",
              "قبل از تغییر بزرگ Scope یک JSON snapshot بگیرید.",
              "Requirement بدون Acceptance Criteria وارد توسعه نشود.",
              "هر فرض پیشنهادی بعد از تأیید به Decision تبدیل شود.",
              "KPIهایی که baseline ندارند در 2–4 هفته اول اندازه‌گیری شوند."
            ].map(t=>`<div class="check-row"><input type="checkbox"><label>${h(t)}</label></div>`).join("")}
          </div>
        </article>
      </div>`;
  }

  // Generic editor ---------------------------------------------------------
  function openEditor(title, fields, initial, onSave){
    pendingEditor = {fields,onSave};
    editDialogTitle.textContent = title;
    editDialogBody.innerHTML = `<div class="form-grid">${fields.map((f,i)=>{
      const value = initial[f.key] ?? "";
      const wide = f.wide ? 'style="grid-column:1/-1"' : '';
      if(f.type==="textarea") return `<div class="form-group" ${wide}><label>${h(f.label)}</label><textarea name="${h(f.key)}">${h(value)}</textarea></div>`;
      if(f.type==="select") return `<div class="form-group" ${wide}><label>${h(f.label)}</label><select name="${h(f.key)}">${f.options.map(o=>`<option value="${h(o)}" ${String(o)===String(value)?'selected':''}>${h(o)}</option>`).join("")}</select></div>`;
      if(f.type==="number") return `<div class="form-group" ${wide}><label>${h(f.label)}</label><input type="number" name="${h(f.key)}" value="${h(value)}" /></div>`;
      return `<div class="form-group" ${wide}><label>${h(f.label)}</label><input type="text" name="${h(f.key)}" value="${h(value)}" /></div>`;
    }).join("")}</div>`;
    dialog.showModal();
  }

  editForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!pendingEditor) return;
    const fd = new FormData(editForm);
    const result = {};
    pendingEditor.fields.forEach(f=>result[f.key] = f.type==="number" ? Number(fd.get(f.key)) : String(fd.get(f.key)||"").trim());
    pendingEditor.onSave(result);
    pendingEditor = null;
    dialog.close();
    saveState(false);
    render();
    toast("تغییر ثبت شد.");
  });
  document.getElementById("closeDialogBtn").addEventListener("click",()=>dialog.close());
  document.getElementById("cancelEditBtn").addEventListener("click",()=>dialog.close());

  function uid(prefix){return prefix+Math.random().toString(36).slice(2,8)}
  function addChange(type,note){state.changelog.push({date:new Date().toISOString().slice(0,10),author:"Team",type,note});}

  workspace.addEventListener("click",(e)=>{
    const btn = e.target.closest("[data-action]");
    if(!btn) return;
    const a = btn.dataset.action;

    if(a==="edit-context") openEditor("ویرایش صورت مسئله",[
      {key:"summary",label:"Business context",type:"textarea",wide:true},{key:"problemStatement",label:"Problem statement",type:"textarea",wide:true},{key:"northStar",label:"North Star",type:"textarea",wide:true}
    ],state.businessContext,v=>Object.assign(state.businessContext,v));

    if(a==="edit-meta") openEditor("ویرایش Scope",[
      {key:"scope",label:"In scope",type:"textarea",wide:true},{key:"outOfScope",label:"Out of scope",type:"textarea",wide:true},{key:"notes",label:"Workspace note",type:"textarea",wide:true}
    ],state.meta,v=>Object.assign(state.meta,v));

    if(a==="add-principle") openEditor("افزودن اصل طراحی",[{key:"text",label:"Principle",type:"textarea",wide:true}],{},v=>{if(v.text)state.businessContext.principles.push(v.text)});
    if(a==="edit-principle"){
      const i=Number(btn.dataset.index); openEditor("ویرایش اصل طراحی",[{key:"text",label:"Principle",type:"textarea",wide:true}],{text:state.businessContext.principles[i]},v=>state.businessContext.principles[i]=v.text);
    }

    if(a==="add-current-stage") editCurrentStage(null);
    if(a==="edit-current-stage") editCurrentStage(btn.dataset.id);
    if(a==="delete-current-stage" && confirm("این مرحله از As-Is حذف شود؟")){state.currentWorkflow=state.currentWorkflow.filter(x=>x.id!==btn.dataset.id);saveState(false);render();}

    if(a==="edit-target-note") openEditor("ویرایش توضیح Target Workflow",[{key:"note",label:"Note",type:"textarea",wide:true}],{note:state.targetWorkflow.note},v=>state.targetWorkflow.note=v.note);
    if(a==="add-target-stage") editTargetStage(btn.dataset.lane,null);
    if(a==="edit-target-stage") editTargetStage(btn.dataset.lane,btn.dataset.id);
    if(a==="delete-target-stage" && confirm("مرحله پیشنهادی حذف شود؟")){const lane=state.targetWorkflow.lanes.find(l=>l.id===btn.dataset.lane);lane.stages=lane.stages.filter(s=>s.id!==btn.dataset.id);saveState(false);render();}

    if(a==="add-requirement") editRequirement(null);
    if(a==="edit-requirement") editRequirement(btn.dataset.id);
    if(a==="delete-requirement" && confirm("نیازمندی حذف شود؟")){state.requirements=state.requirements.filter(r=>r.id!==btn.dataset.id);saveState(false);render();}

    if(a==="add-entity") editEntity(null);
    if(a==="edit-entity") editEntity(Number(btn.dataset.index));
    if(a==="add-role") editRole(null);
    if(a==="edit-role") editRole(btn.dataset.id);

    if(a==="edit-planning") openEditor("ویرایش مدل Planning",[
      {key:"horizonWeeks",label:"Horizon (weeks)",type:"number"},{key:"planningCadence",label:"Cadence"},{key:"deliveryDate",label:"Delivery date weight %",type:"number"},{key:"fabricReady",label:"Fabric-ready weight %",type:"number"},{key:"stageBalance",label:"Stage balance weight %",type:"number"},{key:"manualPriority",label:"Manual priority weight %",type:"number"},{key:"note",label:"Note",type:"textarea",wide:true}
    ],{...state.planning,...state.planning.priorityWeights},v=>{state.planning.horizonWeeks=v.horizonWeeks;state.planning.planningCadence=v.planningCadence;state.planning.note=v.note;state.planning.priorityWeights={deliveryDate:v.deliveryDate,fabricReady:v.fabricReady,stageBalance:v.stageBalance,manualPriority:v.manualPriority};});
    if(a==="add-planning-rule") editPlanningRule(null);
    if(a==="edit-planning-rule") editPlanningRule(Number(btn.dataset.index));

    if(a==="add-metric") editMetric(null);
    if(a==="edit-metric") editMetric(btn.dataset.id);

    if(a==="add-question") editQuestion(null);
    if(a==="edit-question") editQuestion(btn.dataset.id);
    if(a==="add-risk") editRisk(null);
    if(a==="edit-risk") editRisk(btn.dataset.id);
    if(a==="add-decision") editDecision();

    if(a==="save-miro-url"){
      state.meta.miroBoardUrl=document.getElementById("miroUrlField").value.trim(); saveState();
    }
    if(a==="open-miro") openMiro();
    if(a==="export-miro-csv") exportMiroCsv();
    if(a==="copy-miro-brief") copyMiroBrief();
    if(a==="add-changelog") openEditor("ثبت تغییر",[{key:"type",label:"Type"},{key:"author",label:"Author"},{key:"note",label:"Change note",type:"textarea",wide:true}],{type:"Update",author:"Team"},v=>state.changelog.push({date:new Date().toISOString().slice(0,10),...v}));
  });

  function editCurrentStage(id){
    const item = id ? state.currentWorkflow.find(x=>x.id===id) : {order:state.currentWorkflow.length+1,title:"",owner:"",input:"",output:"",tool:"",pain:"",source:"Team update"};
    openEditor(id?"ویرایش مرحله فعلی":"افزودن مرحله فعلی",[
      {key:"order",label:"Order",type:"number"},{key:"title",label:"Stage title"},{key:"owner",label:"Owner"},{key:"tool",label:"Current tool"},{key:"input",label:"Input",type:"textarea",wide:true},{key:"output",label:"Output",type:"textarea",wide:true},{key:"pain",label:"Pain point",type:"textarea",wide:true},{key:"source",label:"Source / note"}
    ],item,v=>{if(id)Object.assign(item,v);else state.currentWorkflow.push({id:uid("cw"),...v});});
  }

  function editTargetStage(laneId,id){
    const lane=state.targetWorkflow.lanes.find(l=>l.id===laneId);
    const item=id?lane.stages.find(s=>s.id===id):{title:"",owner:"",type:"normal",definitionOfDone:""};
    openEditor(id?"ویرایش Target Stage":"افزودن Target Stage",[
      {key:"title",label:"Stage title"},{key:"owner",label:"Owner"},{key:"type",label:"Type",type:"select",options:["normal","gate","parallel","alert"]},{key:"definitionOfDone",label:"Definition of Done",type:"textarea",wide:true}
    ],item,v=>{if(id)Object.assign(item,v);else lane.stages.push({id:uid("tw"),...v});});
  }

  function editRequirement(id){
    const item=id?state.requirements.find(r=>r.id===id):{title:"",phase:"MVP",priority:"High",status:"Ready for definition",owner:"",why:"",acceptance:"",source:"Team update"};
    openEditor(id?"ویرایش نیازمندی":"افزودن نیازمندی",[
      {key:"title",label:"Feature",wide:true},{key:"phase",label:"Phase",type:"select",options:["MVP","V1","V2"]},{key:"priority",label:"Priority",type:"select",options:["High","Medium","Low"]},{key:"status",label:"Status"},{key:"owner",label:"Owner"},{key:"why",label:"Business why",type:"textarea",wide:true},{key:"acceptance",label:"Acceptance Criteria",type:"textarea",wide:true},{key:"source",label:"Source"}
    ],item,v=>{if(id)Object.assign(item,v);else state.requirements.push({id:uid("r"),...v});});
  }

  function editEntity(index){
    const item=index===null?{name:"",purpose:"",fields:[]}:state.entities[index];
    openEditor(index===null?"افزودن Entity":"ویرایش Entity",[
      {key:"name",label:"Entity name"},{key:"purpose",label:"Purpose"},{key:"fieldsText",label:"Fields (one per line)",type:"textarea",wide:true}
    ],{name:item.name,purpose:item.purpose,fieldsText:(item.fields||[]).join("\n")},v=>{const obj={name:v.name,purpose:v.purpose,fields:v.fieldsText.split(/\n|,/).map(x=>x.trim()).filter(Boolean)};if(index===null)state.entities.push(obj);else state.entities[index]=obj;});
  }

  function editRole(id){
    const item=id?state.roles.find(r=>r.id===id):{id:uid("role_"),name:"",view:"",actions:"",restricted:""};
    openEditor(id?"ویرایش نقش":"افزودن نقش",[
      {key:"id",label:"Role key"},{key:"name",label:"Role name"},{key:"view",label:"Can view",type:"textarea",wide:true},{key:"actions",label:"Can do",type:"textarea",wide:true},{key:"restricted",label:"Restricted",type:"textarea",wide:true}
    ],item,v=>{if(id)Object.assign(item,v);else state.roles.push(v);});
  }

  function editPlanningRule(index){
    const item=index===null?{rule:"",status:"proposed"}:state.planning.rules[index];
    openEditor(index===null?"افزودن Planning Rule":"ویرایش Planning Rule",[{key:"rule",label:"Rule",type:"textarea",wide:true},{key:"status",label:"Status"}],item,v=>{if(index===null)state.planning.rules.push({id:uid("pr"),...v});else Object.assign(item,v);});
  }

  function editMetric(id){
    const item=id?state.metrics.find(m=>m.id===id):{name:"",baseline:"نامشخص",target:"",formula:"",owner:"",source:"Team update"};
    openEditor(id?"ویرایش KPI":"افزودن KPI",[
      {key:"name",label:"KPI"},{key:"baseline",label:"Baseline"},{key:"target",label:"Target"},{key:"owner",label:"Owner"},{key:"formula",label:"Formula / event source",type:"textarea",wide:true},{key:"source",label:"Source"}
    ],item,v=>{if(id)Object.assign(item,v);else state.metrics.push({id:uid("k"),...v});});
  }

  function editQuestion(id){
    const item=id?state.questions.find(q=>q.id===id):{category:"General",question:"",priority:"High",owner:"",status:"Open",answer:"",source:"Team update"};
    openEditor(id?"پاسخ / ویرایش سؤال":"افزودن سؤال",[
      {key:"category",label:"Category"},{key:"priority",label:"Priority",type:"select",options:["High","Medium","Low"]},{key:"owner",label:"Owner"},{key:"status",label:"Status",type:"select",options:["Open","In progress","Decided","Closed"]},{key:"question",label:"Question",type:"textarea",wide:true},{key:"answer",label:"Answer / decision",type:"textarea",wide:true},{key:"source",label:"Source"}
    ],item,v=>{if(id){Object.assign(item,v);if(v.answer&&v.status==="Open")item.status="Decided";}else state.questions.push({id:uid("q"),...v});});
  }

  function editRisk(id){
    const item=id?state.risks.find(r=>r.id===id):{risk:"",impact:"High",probability:"Medium",mitigation:"",owner:""};
    openEditor(id?"ویرایش ریسک":"افزودن ریسک",[
      {key:"risk",label:"Risk",type:"textarea",wide:true},{key:"impact",label:"Impact",type:"select",options:["High","Medium","Low"]},{key:"probability",label:"Probability",type:"select",options:["High","Medium","Low"]},{key:"owner",label:"Owner"},{key:"mitigation",label:"Mitigation",type:"textarea",wide:true}
    ],item,v=>{if(id)Object.assign(item,v);else state.risks.push({id:uid("risk"),...v});});
  }

  function editDecision(){
    openEditor("ثبت Decision",[
      {key:"title",label:"Decision title"},{key:"owner",label:"Owner"},{key:"decision",label:"Final decision",type:"textarea",wide:true}
    ],{},v=>{state.decisions.push({id:uid("d"),date:new Date().toISOString().slice(0,10),...v});addChange("Decision",`${v.title}: ${v.decision}`);});
  }

  function openMiro(){
    if(state.meta.miroBoardUrl){window.open(state.meta.miroBoardUrl,"_blank","noopener");}
    else{setView("miro");toast("ابتدا لینک برد Miro را ثبت کنید.");}
  }

  function exportJson(){
    downloadBlob(JSON.stringify(state,null,2),`cadence-workflow-${new Date().toISOString().slice(0,10)}.json`,"application/json;charset=utf-8");
  }

  function markdown(){
    const lines=[];
    lines.push(`# ${state.meta.projectName}`,``,`> ${state.meta.version} — updated ${state.meta.lastUpdated}`,``,`## Project framing`,state.businessContext.summary,``,`### Problem`,state.businessContext.problemStatement,``,`### North Star`,state.businessContext.northStar,``,`## Scope`,`- In: ${state.meta.scope}`,`- Out: ${state.meta.outOfScope}`,``,`## Known facts`);
    state.facts.forEach(f=>lines.push(`- **${f.label}: ${f.value}** — ${f.note} (${f.source})`));
    lines.push(``,`## Current workflow`);
    state.currentWorkflow.sort((a,b)=>a.order-b.order).forEach(s=>lines.push(`${s.order}. **${s.title}** — Owner: ${s.owner}. Input: ${s.input}. Output: ${s.output}. Tool: ${s.tool}. Pain: ${s.pain}. [${s.source}]`));
    lines.push(``,`## Proposed target workflow`,`> ${state.targetWorkflow.note}`);
    state.targetWorkflow.lanes.forEach(l=>{lines.push(``,`### ${l.name}`,l.description);l.stages.forEach(s=>lines.push(`- **${s.title}** — Owner: ${s.owner}; Type: ${s.type}; DoD: ${s.definitionOfDone}`));});
    lines.push(``,`## Requirements`);
    state.requirements.forEach(r=>lines.push(`- [${r.phase}] **${r.title}** (${r.priority}; ${r.status}) — ${r.why}. Acceptance: ${r.acceptance}. Owner: ${r.owner}. ${r.source}`));
    lines.push(``,`## Domain entities`);
    state.entities.forEach(e=>lines.push(`- **${e.name}** — ${e.purpose}: ${e.fields.join(", ")}`));
    lines.push(``,`## Roles`);
    state.roles.forEach(r=>lines.push(`- **${r.name}** — View: ${r.view}; Actions: ${r.actions}; Restricted: ${r.restricted}`));
    lines.push(``,`## KPIs`);
    state.metrics.forEach(m=>lines.push(`- **${m.name}** — Baseline: ${m.baseline}; Target: ${m.target}; Formula: ${m.formula}; Owner: ${m.owner}; ${m.source}`));
    lines.push(``,`## Open questions`);
    state.questions.forEach(q=>lines.push(`- **[${q.status}] ${q.question}** — Priority: ${q.priority}; Owner: ${q.owner}; Answer: ${q.answer||"—"}; ${q.source}`));
    lines.push(``,`## Risks`);
    state.risks.forEach(r=>lines.push(`- **${r.risk}** — Impact ${r.impact}; Probability ${r.probability}; Mitigation: ${r.mitigation}; Owner: ${r.owner}`));
    lines.push(``,`## Decisions`);
    state.decisions.forEach(d=>lines.push(`- ${d.date} — **${d.title}**: ${d.decision} (Owner: ${d.owner})`));
    lines.push(``,`## Miro frames`);
    state.miro.boardFrames.forEach(f=>lines.push(`- **${f.name}** — ${f.purpose}`));
    return lines.join("\n");
  }

  function exportMarkdown(){downloadBlob(markdown(),`cadence-workflow-${new Date().toISOString().slice(0,10)}.md`,"text/markdown;charset=utf-8");}

  function exportMiroCsv(){
    const rows=[["Frame","Type","Title","Body","Priority","Status","Owner","Source"]];
    rows.push(["01 — Project North Star","context","Problem",state.businessContext.problemStatement,"High","Review","Product/BA","Discovery"]);
    rows.push(["01 — Project North Star","context","North Star",state.businessContext.northStar,"High","Review","Team","Discovery"]);
    state.currentWorkflow.forEach(s=>rows.push(["02 — Current State","stage",s.title,`Owner: ${s.owner}\nPain: ${s.pain}`,"", "As-Is",s.owner,s.source]));
    state.targetWorkflow.lanes.forEach(l=>l.stages.forEach(s=>rows.push(["03 — Future State","stage",s.title,`Lane: ${l.name}\nDoD: ${s.definitionOfDone}`,s.type==="gate"?"High":"Medium","Proposed",s.owner,"Workflow Studio"])));
    state.questions.forEach(q=>rows.push(["04 — Open Questions","question",q.question,q.answer||"",q.priority,q.status,q.owner,q.source]));
    state.requirements.forEach(r=>rows.push(["05 — MVP / V1 / V2","requirement",r.title,`${r.why}\nAcceptance: ${r.acceptance}`,r.priority,`${r.phase} · ${r.status}`,r.owner,r.source]));
    state.entities.forEach(e=>rows.push(["06 — Data Model","entity",e.name,`${e.purpose}\n${e.fields.join(" | ")}`,"", "Proposed","Tech/Product","Workflow Studio"]));
    state.roles.forEach(r=>rows.push(["07 — Roles & RACI","role",r.name,`View: ${r.view}\nActions: ${r.actions}`,"", "Proposed",r.name,"Discovery + enhancement"]));
    state.metrics.forEach(m=>rows.push(["08 — KPIs & Success","kpi",m.name,`Baseline: ${m.baseline}\nTarget: ${m.target}\nFormula: ${m.formula}`,"", "Define baseline",m.owner,m.source]));
    state.risks.forEach(r=>rows.push(["09 — Risks & Decisions","risk",r.risk,`Mitigation: ${r.mitigation}`,r.impact,r.probability,r.owner,"Workflow Studio"]));
    state.decisions.forEach(d=>rows.push(["09 — Risks & Decisions","decision",d.title,d.decision,"High","Decided",d.owner,d.date]));
    const csv='\ufeff'+rows.map(row=>row.map(cell=>`"${String(cell??"").replaceAll('"','""')}"`).join(",")).join("\r\n");
    downloadBlob(csv,"cadence-miro-board-blueprint.csv","text/csv;charset=utf-8");
  }

  async function copyMiroBrief(){
    const brief = `Build a Miro board for the Cadence furniture manufacturing workflow project. Create these frames in order:\n${state.miro.boardFrames.map(f=>`- ${f.name}: ${f.purpose}`).join("\n")}\n\nUse the following open questions as sticky notes in the Open Questions frame:\n${state.questions.map(q=>`- [${q.priority}] ${q.question} — Owner: ${q.owner} — Status: ${q.status}`).join("\n")}\n\nCreate an MVP/V1/V2 roadmap using these requirements:\n${state.requirements.map(r=>`- ${r.phase} | ${r.title} | ${r.priority} | ${r.status}`).join("\n")}\n\nFor the Future State frame, use three swimlanes: ${state.targetWorkflow.lanes.map(l=>l.name).join(", ")}. Connect stages in each lane and visually mark gates and parallel steps.`;
    try{await navigator.clipboard.writeText(brief);toast("Miro board brief کپی شد.");}
    catch{downloadBlob(brief,"cadence-miro-board-brief.txt","text/plain;charset=utf-8");toast("Clipboard در دسترس نبود؛ فایل brief دانلود شد.");}
  }

  function downloadBlob(text,name,type){
    const blob=new Blob([text],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  // UI shell / theme -------------------------------------------------------
  const THEME_KEY = "cadence-ui-theme";
  const SIDEBAR_KEY = "cadence-sidebar-collapsed";
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
  const sidebarSearch = document.getElementById("sidebarSearch");

  function currentTheme(){
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function syncThemeControl(){
    if(!themeToggleBtn) return;
    const dark = currentTheme() === "dark";
    themeToggleBtn.classList.toggle("is-dark", dark);
    themeToggleBtn.setAttribute("aria-label", dark ? "فعال کردن حالت روز" : "فعال کردن حالت شب");
    const label = themeToggleBtn.querySelector(".utility-label");
    if(label) label.textContent = dark ? "حالت روز" : "حالت شب";
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute("content", dark ? "#101820" : "#1e4650");
  }

  function setTheme(theme, notify=false){
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try{ localStorage.setItem(THEME_KEY, next); }catch(_){}
    syncThemeControl();
    if(notify) toast(next === "dark" ? "حالت شب فعال شد." : "حالت روز فعال شد.");
  }

  function setSidebarCollapsed(collapsed){
    document.body.classList.toggle("sidebar-collapsed", !!collapsed);
    if(sidebarCollapseBtn){
      sidebarCollapseBtn.setAttribute("aria-expanded", String(!collapsed));
      sidebarCollapseBtn.setAttribute("aria-label", collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری");
    }
    try{ localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }catch(_){}
  }

  function filterSidebar(query=""){
    const q = String(query).trim().toLocaleLowerCase("fa");
    document.querySelectorAll("#mainNav .nav-item").forEach(item=>{
      const text = (item.textContent || "").toLocaleLowerCase("fa");
      item.hidden = !!q && !text.includes(q);
    });
    document.querySelectorAll("#mainNav [data-nav-group]").forEach(group=>{
      const visible = [...group.querySelectorAll(".nav-item")].some(item=>!item.hidden);
      group.hidden = !visible;
    });
  }

  try{ setSidebarCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1"); }catch(_){}
  syncThemeControl();

  // Global controls ---------------------------------------------------------
  document.getElementById("mainNav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)setView(b.dataset.view)});
  themeToggleBtn?.addEventListener("click",()=>setTheme(currentTheme()==="dark"?"light":"dark",true));
  sidebarCollapseBtn?.addEventListener("click",()=>setSidebarCollapsed(!document.body.classList.contains("sidebar-collapsed")));
  sidebarSearch?.addEventListener("input",e=>filterSidebar(e.target.value));
  sidebarSearch?.addEventListener("keydown",e=>{if(e.key==="Escape"){e.target.value="";filterSidebar("");e.target.blur();}});
  window.addEventListener("keydown",e=>{
    const tag=(document.activeElement?.tagName||"").toLowerCase();
    if(e.key==="/" && !["input","textarea","select"].includes(tag) && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();sidebarSearch?.focus();}
  });
  document.getElementById("saveBtn").addEventListener("click",()=>saveState());
  document.getElementById("resetBtn").addEventListener("click",()=>{if(confirm("تمام ویرایش‌های محلی پاک و نسخه پایه بازیابی شود؟")){state=deepClone(window.CADENCE_DEFAULT_PROJECT);saveState(false);render();renderHealth();toast("نسخه پایه بازیابی شد.");}});
  document.getElementById("exportJsonBtn").addEventListener("click",exportJson);
  document.getElementById("exportMdBtn").addEventListener("click",exportMarkdown);
  document.getElementById("openMiroBtn").addEventListener("click",openMiro);
  document.getElementById("focusBtn").addEventListener("click",()=>document.body.classList.toggle("focus-mode"));
  document.getElementById("importJsonInput").addEventListener("change",e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(!obj.meta||!obj.requirements||!obj.questions)throw new Error("Invalid schema");state=obj;saveState(false);render();renderHealth();toast("JSON وارد شد.");}catch(err){alert("فایل JSON معتبر برای این پروژه نیست.");}};reader.readAsText(file,"utf-8");e.target.value="";
  });

  renderHealth();
  setView("overview");
})();
