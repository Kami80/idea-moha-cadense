window.CADENCE_DEFAULT_PROJECT = {
  meta: {
    projectName: "سیستم مدیریت فرآیندهای فروش و تولید مبلمان کادنس",
    workspaceName: "Cadence Workflow Studio",
    sourceDocument: "Project-Discovery Document 1.pdf",
    sourceDate: "1405/05/17",
    preparedBy: "محدثه ابوالحسنی",
    scope: "عملیات کارخانه، سفارش تولید، برنامه‌ریزی، رهگیری مراحل، تحویل",
    outOfScope: "ERP کامل، CRM مشتری نهایی، جزئیات پرداخت و قیمت فروش در MVP",
    version: "Workflow baseline v1.5.1",
    lastUpdated: "2026-08-19",
    miroBoardUrl: "",
    notes: "این Workspace متن سند شناخت را به یک مدل اجرایی، قابل ویرایش و قابل تصمیم‌گیری تبدیل می‌کند. موارد پیشنهادی که در سند قطعی نشده‌اند با برچسب «پیشنهادی» یا «نیازمند تصمیم» مشخص شده‌اند."
  },
  facts: [
    {label:"سفارش تولیدی در ماه", value:"≈ 50", note:"فقط سفارش‌های تولید داخل کارخانه", source:"PDF p.6"},
    {label:"سهم فروشگاه‌های مجموعه", value:"70%", note:"از حجم تولید", source:"PDF p.3"},
    {label:"سهم B2B / نمایندگی", value:"30%", note:"از حجم تولید", source:"PDF p.3"},
    {label:"مدل‌های استاندارد", value:"6–10", note:"هر مدل می‌تواند چند جزء داشته باشد", source:"PDF p.2"}
  ],
  businessContext: {
    summary: "کارخانه کادنس در تولید مبلمان خانگی فعالیت دارد و تمرکز آن روی تولید زیرکار/محصولات نیمه‌آماده و تکمیل سفارش‌های تولیدی است. سفارش‌ها عمدتاً از فروشگاه‌های مجموعه و بخشی از نمایندگان بیرونی وارد می‌شوند. پارچه به‌صورت جداگانه تأمین می‌شود و هماهنگی آن با ظرفیت و پیشرفت واحدهای تولیدی یک وابستگی کلیدی است.",
    problemStatement: "فرآیند فعلی به‌شدت Person-Centric و Human-Driven است: سفارش از پیام‌رسان وارد می‌شود، دوباره در Excel ثبت می‌شود، بیجک کاغذی صادر می‌شود و وضعیت تولید با تماس و پیام پیگیری می‌شود. نتیجه، دوباره‌کاری، نبود منبع واحد حقیقت، گلوگاه‌های نامرئی و وابستگی زیاد به مسئول سفارشات است.",
    northStar: "یک Workflow Engine داخلی که وضعیت واقعی هر سفارش را در سطح مرحله و تعداد، همراه با پارچه، برنامه تولید، بیجک، کنترل کیفیت و خروج ثبت کند و برای مدیر و مسئول سفارشات دید لحظه‌ای بسازد.",
    principles: [
      "Workflow-first، نه Form-first: سفارش باید بین حالت‌ها و مراحل واقعی حرکت کند.",
      "Stage-level tracking: وضعیت هر واحد و تعداد انجام‌شده مستقل ثبت شود.",
      "Event-driven: پایان یک مرحله، رویداد و اعلان برای مرحله/مسئول بعدی ایجاد کند.",
      "Single source of truth: داده سفارش، بیجک، پیشرفت تولید و تحویل از یک مرجع خوانده شود.",
      "Auditability: هر تغییر وضعیت، کاربر، زمان، توضیح و در صورت نیاز فایل داشته باشد.",
      "Progressive digitization: MVP ابتدا کاغذ/Excel/پیگیری دستی را حذف کند؛ ERP کامل بعداً."
    ]
  },
  currentWorkflow: [
    {id:"cw1", order:1, title:"ثبت سفارش در فروشگاه", owner:"کارشناس فروش / نمایندگی", input:"درخواست مشتری، مدل، تعداد، پارچه، تاریخ تحویل", output:"فرم تولید اولیه", tool:"فرم + پیام‌رسان", pain:"اطلاعات ساخت‌یافته و یکپارچه نیست", source:"PDF p.8,10"},
    {id:"cw2", order:2, title:"ایجاد فرم تولید", owner:"فروشنده", input:"جزئیات سفارش", output:"فرم تولید تکمیل‌شده", tool:"فرم دستی", pain:"ورود دستی و احتمال خطا", source:"PDF p.8"},
    {id:"cw3", order:3, title:"ارسال به مسئول سفارشات", owner:"فروشنده", input:"فرم تولید", output:"پیام/فایل ارسالی", tool:"WhatsApp / Telegram", pain:"ورودی از کانال غیرساخت‌یافته", source:"PDF p.8,11"},
    {id:"cw4", order:4, title:"ثبت در Excel", owner:"مسئول سفارشات", input:"اطلاعات فرم", output:"رکورد سفارش", tool:"Excel", pain:"بزرگترین نقطه ورود مجدد داده", source:"PDF p.8,9"},
    {id:"cw5", order:5, title:"صدور بیجک تولید", owner:"مسئول سفارشات", input:"رکورد سفارش + اطلاعات تولید", output:"بیجک / Work Order", tool:"کاغذ / فایل", pain:"کار دستی و تکرار اطلاعات", source:"PDF p.8,10"},
    {id:"cw6", order:6, title:"برنامه‌ریزی هفتگی", owner:"مسئول سفارشات / مدیر تولید", input:"اولویت، زمان تحویل، سفارش‌های فعال", output:"برنامه هفتگی", tool:"Excel", pain:"هماهنگی ظرفیت واحدها دشوار است", source:"PDF p.8,10"},
    {id:"cw7", order:7, title:"اجرای تولید", owner:"نجاری، زیرکار، برش و خیاطی، رویه‌کوبی", input:"بیجک + برنامه", output:"محصول در حال تکمیل", tool:"بیجک کاغذی + هماهنگی شفاهی", pain:"واحدها همگام نیستند و WIP دیده نمی‌شود", source:"PDF p.8,11,12"},
    {id:"cw8", order:8, title:"کنترل کیفیت", owner:"واحد کنترل کیفیت", input:"محصول تکمیل‌شده", output:"تأیید / رد", tool:"فرآیند فعلی نامشخص", pain:"مسیر Rework و ثبت نتیجه نیازمند تعریف است", source:"PDF p.8,10,12"},
    {id:"cw9", order:9, title:"صدور برگه خروج", owner:"مسئول تحویل", input:"تأیید QC + سفارش", output:"برگه خروج", tool:"فرم / امضا", pain:"ارتباط با سیستم مالی نامشخص است", source:"PDF p.9"},
    {id:"cw10", order:10, title:"تحویل و ارسال", owner:"مسئول تحویل / ارسال", input:"محصول + برگه خروج", output:"تحویل به فروشگاه/نمایندگی", tool:"هماهنگی دستی", pain:"زمان و وضعیت تحویل در منبع واحد ثبت نمی‌شود", source:"PDF p.9,10"}
  ],
  targetWorkflow: {
    status:"proposed",
    note:"این مدل، نسخه پیشنهادی برای جلسه نهایی‌سازی است. اجرای موازی نجاری و مسیر پارچه در سند محتمل است اما هنوز باید تأیید شود.",
    lanes:[
      {
        id:"lane-order",
        name:"Order & Approval",
        description:"ورود ساخت‌یافته سفارش و حذف ورود مجدد اطلاعات",
        stages:[
          {id:"tw1",title:"ثبت دیجیتال سفارش",owner:"فروش / مسئول سفارشات",type:"gate",definitionOfDone:"Order + Order Items کامل و دارای تاریخ تحویل مورد انتظار"},
          {id:"tw2",title:"اعتبارسنجی کارخانه",owner:"مسئول سفارشات",type:"gate",definitionOfDone:"مدل، تعداد، پارچه، فایل‌ها و داده‌های لازم بررسی شده"},
          {id:"tw3",title:"تأیید سفارش",owner:"فروشنده / نقش تأییدکننده",type:"gate",definitionOfDone:"Approval event ثبت شده"},
          {id:"tw4",title:"صدور خودکار بیجک",owner:"سیستم",type:"gate",definitionOfDone:"Work Order یکتا برای Scope تعیین‌شده ساخته شده"}
        ]
      },
      {
        id:"lane-fabric",
        name:"Fabric Track — parallel candidate",
        description:"مسیر حیاتی پارچه؛ پیشنهاد می‌شود مستقل اما وابسته به سفارش رهگیری شود.",
        stages:[
          {id:"tw5",title:"محاسبه متراژ پارچه",owner:"سیستم / مسئول سفارشات",type:"parallel",definitionOfDone:"Fabric Requirement بر اساس مدل × تعداد ثبت شده"},
          {id:"tw6",title:"خرید / رزرو پارچه",owner:"مسئول خرید / انبار",type:"parallel",definitionOfDone:"وضعیت خرید و مقدار تأمین ثبت شده"},
          {id:"tw7",title:"دریافت پارچه",owner:"انبار / مسئول سفارشات",type:"parallel",definitionOfDone:"مقدار دریافت‌شده و تاریخ ثبت شده"},
          {id:"tw8",title:"برش و خیاطی",owner:"سرپرست برش و خیاطی",type:"parallel",definitionOfDone:"تعداد/مقدار آماده برای مونتاژ ثبت شده"}
        ]
      },
      {
        id:"lane-production",
        name:"Production Track",
        description:"رهگیری Stage-level و Quantity-level برای حذف عدم توازن واحدها",
        stages:[
          {id:"tw9",title:"برنامه‌ریزی و Release",owner:"مسئول سفارشات / مدیر تولید",type:"gate",definitionOfDone:"اولویت، هفته برنامه و ظرفیت موردنیاز مشخص شده"},
          {id:"tw10",title:"نجاری",owner:"سرپرست نجاری",type:"normal",definitionOfDone:"Completed Qty و زمان پایان ثبت شده"},
          {id:"tw11",title:"زیرکار",owner:"سرپرست زیرکار",type:"normal",definitionOfDone:"Completed Qty و زمان پایان ثبت شده"},
          {id:"tw12",title:"رویه‌کوبی و مونتاژ",owner:"سرپرست رویه‌کوبی",type:"gate",definitionOfDone:"نیازمندی‌های زیرکار + پارچه آماده و Completed Qty ثبت شده"},
          {id:"tw13",title:"کنترل کیفیت",owner:"کنترل کیفیت",type:"gate",definitionOfDone:"Pass / Rework / Reject برای هر آیتم یا تعداد ثبت شده"},
          {id:"tw14",title:"آماده تحویل",owner:"مسئول سفارشات / تحویل",type:"normal",definitionOfDone:"کل Scope قابل خروج است"},
          {id:"tw15",title:"خروج و تحویل",owner:"مسئول تحویل",type:"gate",definitionOfDone:"Dispatch Slip + تاریخ + گیرنده ثبت شده"}
        ]
      }
    ]
  },
  requirements:[
    {id:"r1",title:"ثبت دیجیتال سفارش تولید",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Product/BA",why:"حذف فرم کاغذی و ورود مجدد",acceptance:"Order با چند Order Item، مدل، تعداد، پارچه، تاریخ مورد انتظار، فایل و توضیح ثبت شود.",source:"PDF p.18-21"},
    {id:"r2",title:"صدور خودکار بیجک",phase:"MVP",priority:"High",status:"Blocked by question",owner:"Product/BA",why:"حذف کار دستی مسئول سفارشات",acceptance:"پس از تأیید سفارش، Work Order با شماره یکتا و اطلاعات تولید ساخته و چاپ/دانلود شود.",source:"PDF p.19-21"},
    {id:"r3",title:"گردش تأیید سفارش",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Product/BA",why:"کاهش خطا و دوباره‌کاری",acceptance:"درخواست تأیید، زمان، کاربر، نتیجه و کامنت در Audit Log ثبت شود.",source:"PDF p.19-21"},
    {id:"r4",title:"رهگیری وضعیت تولید در سطح مرحله و تعداد",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Production",why:"کاهش تماس و ایجاد دید WIP",acceptance:"برای هر Stage مقدار برنامه، انجام‌شده، مردود/برگشتی، شروع و پایان ثبت شود.",source:"PDF p.12,19-21"},
    {id:"r5",title:"مدیریت وضعیت پارچه",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Order/Fabric",why:"پارچه یکی از دو موضوع اصلی پیگیری روزانه است",acceptance:"خرید، دریافت، برش، خیاطی با مقدار، تاریخ و مسئول ثبت شود.",source:"PDF p.13,17,19"},
    {id:"r6",title:"داشبورد عملیاتی سفارش‌ها",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Product",why:"دید لحظه‌ای مسئول سفارشات",acceptance:"جدید، منتظر پارچه، در نجاری، در خیاطی، آماده تحویل، معوق و گلوگاه نمایش داده شود.",source:"PDF p.22"},
    {id:"r7",title:"جستجوی وضعیت سفارش",phase:"MVP",priority:"High",status:"Ready for definition",owner:"Product",why:"کاهش Status Inquiry Overload",acceptance:"با شماره سفارش، مرحله فعلی، وضعیت هر واحد، ETA و Blocker نمایش داده شود.",source:"PDF p.13-14"},
    {id:"r8",title:"Audit/Event Log",phase:"MVP",priority:"High",status:"Enhanced",owner:"Tech",why:"حل مشکل نبود ثبت رویداد تولید",acceptance:"تمام تغییرهای وضعیت و مقدار، user/time/from/to/comment/attachment را ثبت کنند.",source:"PDF p.13,18"},
    {id:"r9",title:"برنامه هفتگی تولید",phase:"V1",priority:"High",status:"Blocked by question",owner:"Planning",why:"هماهنگ‌کردن واحدها و جلوگیری از عدم توازن",acceptance:"سفارش‌ها بر اساس اولویت/ظرفیت در هفته و واحدها برنامه‌ریزی شوند.",source:"PDF p.19-20,23"},
    {id:"r10",title:"پیش‌بینی زمان آماده شدن",phase:"V1",priority:"Medium",status:"Needs model",owner:"Planning",why:"کاهش پیگیری زمان تحویل",acceptance:"ETA از ظرفیت، WIP، وابستگی پارچه و زمان‌های استاندارد محاسبه یا پیشنهاد شود.",source:"PDF p.19-20"},
    {id:"r11",title:"اعلان‌های داخلی / تلگرام",phase:"V1",priority:"Medium",status:"Needs channel decision",owner:"Tech",why:"جایگزینی بخشی از هماهنگی پیام‌رسانی",acceptance:"رویدادهای مهم به نقش بعدی و مسئول سفارشات اعلان شوند.",source:"PDF p.11,20"},
    {id:"r12",title:"کنترل گلوگاه و سفارش متوقف‌شده",phase:"V1",priority:"High",status:"Enhanced",owner:"Production",why:"Lack of Synchronization",acceptance:"Stageهایی با توقف بیش از آستانه یا کمبود ورودی شناسایی و برجسته شوند.",source:"PDF p.11-12"},
    {id:"r13",title:"گزارش‌های پیشرفته تولید",phase:"V2",priority:"Medium",status:"Backlog",owner:"Management",why:"تحلیل روند، ظرفیت و بهره‌وری",acceptance:"Lead time، throughput، WIP، delayed orders و stage cycle time گزارش شوند.",source:"PDF p.19-20,22"},
    {id:"r14",title:"موجودی مواد و پارچه",phase:"V2",priority:"Medium",status:"Backlog",owner:"Inventory",why:"یکپارچه‌سازی تأمین و برنامه‌ریزی",acceptance:"موجودی قابل تخصیص، رزرو، دریافت و مصرف قابل رهگیری باشد.",source:"PDF p.20"},
    {id:"r15",title:"اتصال نرم‌افزار مالی",phase:"V2",priority:"Medium",status:"Backlog",owner:"Finance/Tech",why:"استفاده از خروجی فاکتور/فرم در سیستم مالی",acceptance:"فرمت تبادل و نقاط Integration بعد از شناخت نرم‌افزار مالی تعریف شود.",source:"PDF p.3,20"},
    {id:"r16",title:"Role-based access + audit",phase:"MVP",priority:"High",status:"Enhanced",owner:"Tech",why:"تفکیک دسترسی تیم‌ها و حفظ صحت داده",acceptance:"هر نقش فقط سفارش/مرحله مجاز را ببیند یا تغییر دهد؛ عملیات حساس log شود.",source:"PDF p.14-15"},
    {id:"r17",title:"مدیریت Rework پس از QC",phase:"MVP",priority:"High",status:"Blocked by question",owner:"QC/Production",why:"مسیر رد QC در سند مشخص نشده",acceptance:"QC بتواند نوع مشکل، تعداد، مرحله بازگشت و تأیید رفع را ثبت کند.",source:"PDF p.12"}
  ],
  entities:[
    {name:"Order",purpose:"هدر سفارش تولید",fields:["order_no","source/store","order_date","expected_delivery","priority","status","notes"]},
    {name:"OrderItem",purpose:"آیتم تولیدی مستقل داخل سفارش",fields:["order_id","product_model_id","component","qty","fabric_spec_id","image/file","item_notes"]},
    {name:"ProductModel",purpose:"مدل استاندارد مبل",fields:["code","name","active","default_components","fabric_formula_version"]},
    {name:"ProductComponent",purpose:"سه‌نفره/دو‌نفره/تک‌نفره/میز و ...",fields:["product_model_id","component_type","standard_fabric_meter","routing"]},
    {name:"FabricSpec",purpose:"مشخصات پارچه سفارش",fields:["code/name","color","supplier","lot","status"]},
    {name:"FabricRequirement",purpose:"نیاز محاسبه‌شده و وضعیت تأمین",fields:["order_item_id","required_meter","reserved_meter","received_meter","cut_meter","status"]},
    {name:"WorkOrder / Bijak",purpose:"سند داخلی تولید",fields:["work_order_no","scope(order/item)","issued_at","approved_at","print_version"]},
    {name:"StageRun",purpose:"رهگیری مرحله‌ای و تعدادی",fields:["work_order_id","stage","planned_qty","completed_qty","rework_qty","started_at","completed_at","owner"]},
    {name:"ProductionPlan",purpose:"برنامه هفتگی و اولویت",fields:["week","work_order_id","stage","planned_qty","planned_date","sequence","capacity_bucket"]},
    {name:"QCInspection",purpose:"نتیجه کنترل کیفیت",fields:["order_item_id","qty","result","defect","return_stage","inspector","timestamp"]},
    {name:"DispatchSlip",purpose:"برگه خروج",fields:["dispatch_no","order_id","qty","approved_by","dispatched_at","receiver"]},
    {name:"Approval",purpose:"گردش تأیید",fields:["entity_id","step","requested_to","decision","comment","timestamp"]},
    {name:"Attachment",purpose:"تصویر/فایل/سند",fields:["entity_type","entity_id","file_name","type","uploaded_by","timestamp"]},
    {name:"AuditEvent",purpose:"منبع قابل حسابرسی رویدادها",fields:["entity","action","from","to","qty","user","timestamp","comment"]}
  ],
  documents:[
    {name:"فرم اولیه سفارش",english:"Production Request Form",role:"ورودی سیستم",digitalTarget:"Order + Order Items",source:"PDF p.16"},
    {name:"بیجک تولید",english:"Production Ticket / Work Order",role:"سند داخلی اجرای تولید",digitalTarget:"WorkOrder + printable view",source:"PDF p.5,16"},
    {name:"برگه خروج",english:"Delivery / Dispatch Slip",role:"سند تحویل و خروج",digitalTarget:"DispatchSlip + printable view",source:"PDF p.16"}
  ],
  roles:[
    {id:"factory_manager",name:"مدیر کارخانه",view:"همه سفارش‌ها، برنامه، KPI، ظرفیت، گلوگاه",actions:"مشاهده همه، تأیید سیاست‌ها، گزارش",restricted:"ویرایش عملیاتی روزمره بهتر است محدود باشد"},
    {id:"order_coordinator",name:"مسئول سفارشات",view:"همه سفارش‌های تولیدی، پارچه، برنامه، وضعیت",actions:"ثبت/ویرایش سفارش، برنامه‌ریزی، صدور بیجک، اولویت‌بندی",restricted:"داده مالی خارج از Scope کارخانه"},
    {id:"production_manager",name:"مدیر تولید",view:"برنامه تولید، WIP، ظرفیت و همه Stageها",actions:"تأیید/تنظیم برنامه، حل Blocker، مشاهده عملکرد",restricted:"ویرایش داده تجاری سفارش مگر با مجوز"},
    {id:"carpentry_supervisor",name:"سرپرست نجاری",view:"Work Orderهای نجاری و اطلاعات لازم",actions:"شروع/پایان، ثبت مقدار انجام‌شده، Blocker",restricted:"سایر Stageها فقط مشاهده وابستگی"},
    {id:"substructure_supervisor",name:"سرپرست زیرکار",view:"Work Orderهای زیرکار",actions:"شروع/پایان، مقدار انجام‌شده، Blocker",restricted:"ویرایش سفارش/پارچه"},
    {id:"sewing_supervisor",name:"سرپرست برش و خیاطی",view:"نیاز پارچه و سفارش‌های خیاطی",actions:"ثبت برش/خیاطی و مقدار آماده",restricted:"ویرایش سایر Stageها"},
    {id:"upholstery_supervisor",name:"سرپرست رویه‌کوبی",view:"سفارش‌های آماده Merge",actions:"شروع/پایان، مقدار مونتاژ",restricted:"ویرایش ورودی‌های قبلی"},
    {id:"qc",name:"کنترل کیفیت",view:"محصولات آماده QC + سابقه Stage",actions:"Pass/Rework/Reject، Defect note",restricted:"ویرایش برنامه"},
    {id:"delivery",name:"مسئول تحویل",view:"آماده تحویل، QC Pass، مقصد",actions:"ثبت خروج، صدور برگه، زمان تحویل",restricted:"ویرایش مراحل تولید"},
    {id:"inventory",name:"انبار / مسئول پارچه",view:"نیاز پارچه و دریافت‌ها",actions:"ثبت دریافت/رزرو/مقدار",restricted:"ویرایش Production Stage"}
  ],
  permissions:[
    {action:"ثبت سفارش",factory_manager:"L",order_coordinator:"Y",production_manager:"N",carpentry_supervisor:"N",substructure_supervisor:"N",sewing_supervisor:"N",upholstery_supervisor:"N",qc:"N",delivery:"N",inventory:"N"},
    {action:"ویرایش اطلاعات سفارش",factory_manager:"L",order_coordinator:"Y",production_manager:"L",carpentry_supervisor:"N",substructure_supervisor:"N",sewing_supervisor:"N",upholstery_supervisor:"N",qc:"N",delivery:"N",inventory:"N"},
    {action:"برنامه‌ریزی تولید",factory_manager:"L",order_coordinator:"Y",production_manager:"Y",carpentry_supervisor:"L",substructure_supervisor:"L",sewing_supervisor:"L",upholstery_supervisor:"L",qc:"N",delivery:"N",inventory:"L"},
    {action:"تغییر وضعیت Stage خود",factory_manager:"L",order_coordinator:"L",production_manager:"L",carpentry_supervisor:"Y",substructure_supervisor:"Y",sewing_supervisor:"Y",upholstery_supervisor:"Y",qc:"Y",delivery:"Y",inventory:"Y"},
    {action:"ثبت Rework/QC",factory_manager:"L",order_coordinator:"L",production_manager:"L",carpentry_supervisor:"N",substructure_supervisor:"N",sewing_supervisor:"N",upholstery_supervisor:"N",qc:"Y",delivery:"N",inventory:"N"},
    {action:"ثبت خروج",factory_manager:"L",order_coordinator:"L",production_manager:"L",carpentry_supervisor:"N",substructure_supervisor:"N",sewing_supervisor:"N",upholstery_supervisor:"N",qc:"L",delivery:"Y",inventory:"N"}
  ],
  planning: {
    rules:[
      {id:"pr1",rule:"هیچ سفارش برای Release به تولید نباید بدون Work Order معتبر باشد.",status:"proposed"},
      {id:"pr2",rule:"اولویت برنامه باید ترکیبی از تاریخ تحویل، آماده‌بودن پارچه، WIP و ظرفیت مرحله بعد باشد.",status:"proposed"},
      {id:"pr3",rule:"هر Stage باید Planned Qty و Completed Qty مستقل داشته باشد تا عدم توازن قابل مشاهده شود.",status:"derived from problem"},
      {id:"pr4",rule:"رویه‌کوبی/مونتاژ فقط وقتی Release شود که ورودی زیرکار و پارچه دوخته‌شده برای همان Qty آماده باشد.",status:"proposed"},
      {id:"pr5",rule:"سفارش‌های Blocked باید دلیل توقف و Next Action داشته باشند.",status:"enhanced"},
      {id:"pr6",rule:"تغییر اولویت پس از Release باید ثبت رویداد و دلیل داشته باشد.",status:"needs decision"}
    ],
    priorityWeights:{deliveryDate:40,fabricReady:25,stageBalance:20,manualPriority:15},
    horizonWeeks:2,
    planningCadence:"هفتگی + بازبینی روزانه",
    note:"وزن‌های اولویت فقط مدل پیشنهادی برای Workshop هستند و از سند به‌عنوان واقعیت عملیاتی استخراج نشده‌اند."
  },
  metrics:[
    {id:"k1",name:"زمان ثبت سفارش",baseline:"≈ 15 دقیقه (مثال سند؛ نیازمند اندازه‌گیری)",target:"< 5 دقیقه",formula:"submitted_at - started_at",owner:"مسئول سفارشات",source:"PDF p.22"},
    {id:"k2",name:"زمان صدور بیجک",baseline:"دستی",target:"خودکار / چند ثانیه",formula:"work_order_issued_at - approval_at",owner:"سیستم",source:"PDF p.22"},
    {id:"k3",name:"تعداد ورود مجدد اطلاعات",baseline:"چند بار",target:"1 بار",formula:"manual_reentry_count per order",owner:"Product",source:"PDF p.22"},
    {id:"k4",name:"تماس‌های پیگیری وضعیت",baseline:"بالا",target:"حداقل 50% کاهش",formula:"status_inquiry_count / week",owner:"مسئول سفارشات",source:"PDF p.22-23"},
    {id:"k5",name:"زمان یافتن وضعیت سفارش",baseline:"چند دقیقه",target:"چند ثانیه",formula:"status_lookup_duration",owner:"Product",source:"PDF p.23"},
    {id:"k6",name:"افق برنامه‌ریزی قابل مشاهده",baseline:"ندارد",target:"2 هفته آینده",formula:"future_plan_coverage_days",owner:"Planning",source:"PDF p.23"},
    {id:"k7",name:"Stage Cycle Time",baseline:"ثبت نمی‌شود",target:"Baseline پس از 4 هفته",formula:"stage_completed_at - stage_started_at",owner:"Production",source:"Enhanced from event logging"},
    {id:"k8",name:"WIP Age / توقف",baseline:"نامشخص",target:"هشدار بر اساس SLA هر Stage",formula:"now - last_progress_event",owner:"Production",source:"Enhanced from bottleneck requirement"},
    {id:"k9",name:"On-time readiness",baseline:"نامشخص",target:"پس از baseline تعیین شود",formula:"ready_at <= promised_ready_at",owner:"Management",source:"Enhanced from delivery objective"},
    {id:"k10",name:"Rework Rate",baseline:"نامشخص",target:"پس از ثبت QC تعیین شود",formula:"rework_qty / inspected_qty",owner:"QC",source:"Enhanced from QC ambiguity"}
  ],
  dashboardWidgets:[
    {name:"سفارش‌های جدید",audience:"عملیاتی",type:"count",definition:"Orders created and not yet production-released"},
    {name:"منتظر پارچه",audience:"عملیاتی",type:"count/list",definition:"Fabric dependency not ready"},
    {name:"WIP بر اساس Stage",audience:"عملیاتی",type:"funnel/bar",definition:"Active qty per production stage"},
    {name:"سفارش‌های معوق",audience:"عملیاتی/مدیریتی",type:"count/list",definition:"Expected delivery / plan date breached"},
    {name:"گلوگاه فعلی",audience:"مدیریتی",type:"alert",definition:"Stage with highest normalized load / aged WIP"},
    {name:"ظرفیت هر واحد",audience:"مدیریتی",type:"capacity",definition:"Planned load vs available capacity"},
    {name:"میانگین زمان تولید",audience:"مدیریتی",type:"trend",definition:"Order released → ready for dispatch"},
    {name:"عملکرد هفتگی تولید",audience:"مدیریتی",type:"trend",definition:"Completed qty by week and stage"}
  ],
  questions:[
    {id:"q1",category:"Product Model",question:"هر مدل مبلمان دقیقاً از چه اجزایی تشکیل می‌شود و Routing هر جزء چیست؟",priority:"High",owner:"تولید",status:"Open",answer:"",source:"PDF p.3"},
    {id:"q2",category:"Fabric",question:"فرمول متراژ پارچه برای هر مدل/جزء چیست؟ ثابت، نسخه‌پذیر یا قابل Override؟",priority:"High",owner:"مسئول سفارشات",status:"Open",answer:"",source:"PDF p.3,20"},
    {id:"q3",category:"Order",question:"آیا یک سفارش می‌تواند چند مدل و چند نوع پارچه داشته باشد؟",priority:"High",owner:"فروش/سفارشات",status:"Open",answer:"",source:"PDF p.3,16"},
    {id:"q4",category:"Work Order",question:"بیجک برای کل سفارش صادر می‌شود، برای هر Order Item یا برای هر جزء تولیدی؟",priority:"High",owner:"مسئول سفارشات",status:"Open",answer:"",source:"PDF p.5,9,16"},
    {id:"q5",category:"Work Order",question:"آیا بیجک شماره یکتا دارد و آیا هر واحد آن را امضا/تأیید می‌کند؟",priority:"High",owner:"کارخانه",status:"Open",answer:"",source:"PDF p.9"},
    {id:"q6",category:"Workflow",question:"چه کسی وضعیت هر مرحله را ثبت می‌کند: سرپرست، اپراتور یا مسئول سفارشات؟",priority:"High",owner:"مدیر تولید",status:"Open",answer:"",source:"PDF p.5,10"},
    {id:"q7",category:"Workflow",question:"آیا نجاری و مسیر پارچه/خیاطی می‌توانند به‌صورت موازی اجرا شوند؟",priority:"High",owner:"مدیر تولید",status:"Open",answer:"",source:"PDF p.9,18"},
    {id:"q8",category:"Workflow",question:"آیا هر Stage می‌تواند بخشی از تعداد سفارش را تکمیل و تحویل Stage بعد دهد؟",priority:"High",owner:"مدیر تولید",status:"Open",answer:"",source:"PDF p.12,18"},
    {id:"q9",category:"QC",question:"اگر QC رد کند، سفارش/تعداد به کدام Stage برمی‌گردد و چه کسی تأیید رفع می‌کند؟",priority:"High",owner:"QC/مدیر تولید",status:"Open",answer:"",source:"PDF p.12"},
    {id:"q10",category:"Planning",question:"برنامه تولید دقیقاً روزانه، هفتگی یا Rolling است و ظرفیت هر واحد چگونه تعریف می‌شود؟",priority:"High",owner:"مسئول سفارشات/تولید",status:"Open",answer:"",source:"PDF p.5,20"},
    {id:"q11",category:"Planning",question:"اولویت سفارش‌ها بر چه اساسی تعیین می‌شود و آیا حین تولید قابل تغییر است؟",priority:"High",owner:"مدیر کارخانه",status:"Open",answer:"",source:"PDF p.5,20"},
    {id:"q12",category:"Planning",question:"تاریخ تحویل دستی است یا باید از ظرفیت و WIP پیشنهاد شود؟",priority:"Medium",owner:"مدیریت",status:"Open",answer:"",source:"PDF p.20"},
    {id:"q13",category:"Fabric",question:"آیا پارچه باید قبل از برنامه‌ریزی/نجاری رسیده باشد یا فقط قبل از Merge نهایی؟",priority:"High",owner:"تولید/خرید",status:"Open",answer:"",source:"PDF p.9,18"},
    {id:"q14",category:"Roles",question:"آیا اپراتورها وارد سیستم می‌شوند یا فقط سرپرست هر واحد؟",priority:"Medium",owner:"مدیریت",status:"Open",answer:"",source:"PDF p.10,15"},
    {id:"q15",category:"Roles",question:"چه کسی مجاز به ویرایش سفارش پس از تأیید و Release است؟",priority:"High",owner:"مدیریت",status:"Open",answer:"",source:"PDF p.15"},
    {id:"q16",category:"Documents",question:"تصویر/فایل به سطح سفارش متصل است یا Order Item؟",priority:"Medium",owner:"فروش/سفارشات",status:"Open",answer:"",source:"PDF p.16"},
    {id:"q17",category:"Integration",question:"برگه خروج و خروجی فاکتور دقیقاً باید با کدام نرم‌افزار مالی و چه فرمتی تبادل شود؟",priority:"Medium",owner:"حسابداری/Tech",status:"Open",answer:"",source:"PDF p.3,9"},
    {id:"q18",category:"Measurement",question:"Baseline واقعی زمان ثبت سفارش، صدور بیجک، تعداد تماس‌ها و Lead Time چقدر است؟",priority:"High",owner:"BA/مدیریت",status:"Open",answer:"",source:"PDF p.22-24"},
    {id:"q19",category:"Success",question:"اگر فقط 3 قابلیت در Release اول بماند، اولویت نهایی کارفرما چیست؟",priority:"High",owner:"مدیر کارخانه",status:"Open",answer:"",source:"PDF p.20"},
    {id:"q20",category:"Success",question:"معیار رسمی پذیرش و موفقیت پروژه بعد از 30/60/90 روز چیست؟",priority:"High",owner:"مدیر کارخانه",status:"Open",answer:"",source:"PDF p.24"}
  ],
  risks:[
    {id:"risk1",risk:"دیجیتال‌سازی فرم‌ها بدون تغییر رفتار Workflow",impact:"High",probability:"High",mitigation:"طراحی State Machine و Event Log قبل از UI فرم‌ها",owner:"Product"},
    {id:"risk2",risk:"نامشخص بودن Scope بیجک و سطح رهگیری",impact:"High",probability:"High",mitigation:"تصمیم Workshop قبل از طراحی دیتابیس نهایی",owner:"BA"},
    {id:"risk3",risk:"ثبت نکردن وضعیت توسط سرپرست‌ها",impact:"High",probability:"Medium",mitigation:"UX بسیار سریع، ثبت Qty با یک اقدام، مسئولیت روشن و داشبورد Adoption",owner:"Production"},
    {id:"risk4",risk:"محاسبه اشتباه پارچه به دلیل فرمول‌های متغیر",impact:"High",probability:"Medium",mitigation:"Formula versioning + manual override with audit",owner:"Order/Fabric"},
    {id:"risk5",risk:"Planning بیش از حد پیچیده در MVP",impact:"Medium",probability:"High",mitigation:"MVP فقط visibility؛ V1 ابتدا assisted planning نه optimizer کامل",owner:"Product"},
    {id:"risk6",risk:"دسترسی Local Network و Backup نامطمئن",impact:"High",probability:"Medium",mitigation:"Backup schedule، UPS/DB backup و مرورگرهای پشتیبانی‌شده تعریف شود",owner:"Tech"},
    {id:"risk7",risk:"تعریف نکردن Rework و partial completion",impact:"High",probability:"Medium",mitigation:"سناریوهای واقعی QC و تولید در Workshop تست شود",owner:"QC/Production"}
  ],
  decisions:[],
  changelog:[
    {date:"2026-08-19",author:"Workflow Studio",type:"UI shell v1.5",note:"بازطراحی کامل Sidebar با navigation groups، search، collapse، quick Visual Board shortcut و status utilities؛ افزودن Night Mode هماهنگ به Workflow Studio و Visual Board با dark clay/neumorphism اختصاصی."},
    {date:"2026-08-19",author:"Workflow Studio",type:"Board UX v1.4",note:"Second-pass Visual Board UX: multi-select، Selection Rectangle، Grouping، رنگ‌بندی Sectionها، Laneهای collapsible، Floating Quick Actions و Edit Drawer/Group modal."},
    {date:"2026-08-19",author:"Workflow Studio",type:"UI v1.3",note:"بازطراحی کل Workflow Studio و Visual Board با Claymorphism و دکمه‌های Neumorphism."},
    {date:"2026-08-19",author:"Workflow Studio",type:"Visual Board",note:"افزودن صفحه مستقل Visual Workflow Board با canvas قابل Pan/Zoom، Drag، اتصال، Lane، یادداشت Workshop، Inspector، Comment، Undo/Redo، فیلتر و خروجی Miro/JSON/SVG."},
    {date:"2026-08-19",author:"Workflow Studio",type:"Baseline",note:"تبدیل سند 25 صفحه‌ای Discovery به Workflow Studio قابل ویرایش؛ تفکیک Source Facts از پیشنهادهای طراحی؛ افزودن Data Model، Risk Register، KPI definitions و Miro export."}
  ],
  visualBoard:{
    version:"1.5.1",
    lastSaved:"",
    board:null,
    note:"برد در اولین اجرا از Target Workflow ساخته می‌شود و سپس داخل همان localStorage پروژه ذخیره می‌شود."
  },
  miro: {
    boardFrames:[
      {id:"mf1",name:"01 — Project North Star",purpose:"هدف، Scope، مسئله، اصول طراحی"},
      {id:"mf2",name:"02 — Current State",purpose:"As-Is workflow + pain points"},
      {id:"mf3",name:"03 — Future State",purpose:"Target workflow با مسیر پارچه و تولید"},
      {id:"mf4",name:"04 — Open Questions",purpose:"ابهامات قابل تصمیم در Workshop"},
      {id:"mf5",name:"05 — MVP / V1 / V2",purpose:"Feature prioritization و release roadmap"},
      {id:"mf6",name:"06 — Data Model",purpose:"Entities، documents و relationships"},
      {id:"mf7",name:"07 — Roles & RACI",purpose:"نقش‌ها، دسترسی‌ها و مسئولیت"},
      {id:"mf8",name:"08 — KPIs & Success",purpose:"Baseline/target و تعریف اندازه‌گیری"},
      {id:"mf9",name:"09 — Risks & Decisions",purpose:"ریسک‌ها، تصمیم‌ها و Action Items"}
    ],
    workshopAgenda:[
      "15 min — تأیید Scope و North Star",
      "25 min — مرور As-Is و نقاط ورود مجدد داده",
      "35 min — تصمیم درباره Target Workflow و parallelism",
      "25 min — بیجک، Order Item و سطح رهگیری Quantity",
      "20 min — نقش‌ها، ثبت Stage و Rework",
      "20 min — فرمول پارچه و Planning rules",
      "15 min — قفل MVP و Success Metrics",
      "10 min — Owners / next actions"
    ]
  }
};
