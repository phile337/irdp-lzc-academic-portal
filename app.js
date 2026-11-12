(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const cfg = window.IRDP_CONFIG || {};
let supabase = null, currentUser = null, currentProfile = null, language = "en";
const labels = {
  en:{signIn:"Sign in",request:"Request account",needConfig:"The secure backend has not been configured yet. This preview will not send or store your information.",badLogin:"Sign-in failed. Check your details or contact the administrator.",requestOk:"Your account request was submitted. An administrator must verify your student registration before access is granted.",requestFail:"Could not submit the request. Check the backend setup or contact the administrator.",noResources:"No published materials match these filters.",loadFail:"Could not load materials. Please try again later.",student:"Student",lecturer:"Lecturer",admin:"Administrator",upload:"Upload a resource",title:"Title",description:"Description",course:"Course",type:"Resource type",file:"Choose file",publish:"Publish resource",question:"Question text",answer:"Model answer",saveQuestion:"Save question",myCourses:"My assigned courses",noCourses:"No courses have been assigned to this account yet.",published:"Published",draft:"Draft",remove:"Hide",confirmHide:"Hide this resource from students?",missingConfig:"Backend not configured."},
  sw:{signIn:"Ingia",request:"Omba akaunti",needConfig:"Backend salama bado haijaunganishwa. Mfano huu hautatuma wala kuhifadhi taarifa zako.",badLogin:"Kuingia kumeshindikana. Kagua taarifa au wasiliana na msimamizi.",requestOk:"Ombi lako limetumwa. Msimamizi lazima athibitishe usajili wako kabla ya kuruhusu ufikiaji.",requestFail:"Ombi halikutumwa. Kagua usanidi wa backend au wasiliana na msimamizi.",noResources:"Hakuna nyenzo zilizochapishwa zinazolingana na vichujio hivi.",loadFail:"Nyenzo hazikuweza kupakiwa. Jaribu tena baadaye.",student:"Mwanafunzi",lecturer:"Mwalimu",admin:"Msimamizi",upload:"Pakia nyenzo",title:"Jina",description:"Maelezo",course:"Kozi",type:"Aina ya nyenzo",file:"Chagua faili",publish:"Chapisha nyenzo",question:"Swali",answer:"Jibu elekezi",saveQuestion:"Hifadhi swali",myCourses:"Kozi nilizopangiwa",noCourses:"Bado hakuna kozi zilizopangiwa akaunti hii.",published:"Imechapishwa",draft:"Rasimu",remove:"Ficha",confirmHide:"Ficha nyenzo hii kwa wanafunzi?",missingConfig:"Backend haijaunganishwa."}
};
function t(key){return (labels[language]||labels.en)[key]||key}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),4500)}
function setLanguage(next){
 language=next==="sw"?"sw":"en";document.documentElement.lang=language;
 document.querySelectorAll("[data-en]").forEach(el=>{el.textContent=el.dataset[language]||el.dataset.en});
 document.querySelectorAll("[data-en-html]").forEach(el=>{el.innerHTML=el.dataset[language+"Html"]||el.dataset.enHtml});
 document.querySelectorAll("[data-en-placeholder]").forEach(el=>{el.placeholder=el.dataset[language+"Placeholder"]||el.dataset.enPlaceholder});
 try{localStorage.setItem("irdp-language",language)}catch(_){}
}
function openModal(mode="login"){$("modalBackdrop").classList.remove("hidden");showPane(mode)}
function closeModal(){$("modalBackdrop").classList.add("hidden")}
function showPane(mode){
 const req=mode==="request";
 const reset=mode==="reset";

 $("loginPane").classList.toggle("hidden",req||reset);
 $("requestPane").classList.toggle("hidden",!req);
 $("resetPasswordPane").classList.toggle("hidden",!reset);

 $("loginTab").classList.toggle("active",!req&&!reset);
 $("requestTab").classList.toggle("active",req);

 $("loginMessage").textContent="";
 $("requestMessage").textContent="";
}
function backendReady(){return !!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase)}
function initBackend(){if(backendReady()){supabase=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return true}return false}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showSignedIn(profile){currentProfile=profile;$("openLogin").classList.add("hidden");$("logout").classList.remove("hidden");$("signedOutLibrary").classList.add("hidden");$("studentLibrary").classList.remove("hidden");$("workspace").classList.remove("hidden");renderWorkspace();loadResources()}
function showSignedOut(){$("openLogin").classList.remove("hidden");$("logout").classList.add("hidden");$("signedOutLibrary").classList.remove("hidden");$("studentLibrary").classList.add("hidden");$("workspace").classList.add("hidden");currentUser=null;currentProfile=null}
async function loadProfile(user){
 const {data,error}=await supabase.from("profiles").select("id,full_name,role,status,programme_id,study_level,year_of_study").eq("id",user.id).maybeSingle();
 if(error)throw error;if(!data||data.status!=="active")throw new Error("Your account is pending approval or inactive.");return data;
}
async function loadResources(){
 const target=$("resourceResults");
 target.innerHTML='<p class="empty-state">Loading…</p>';

 if(!supabase){
  target.innerHTML='<p class="empty-state">'+escapeHtml(t("missingConfig"))+'</p>';
  return;
 }

 let query=supabase.from("materials")
  .select("id,title,description,resource_type,academic_year,year_of_study,semester,course_id,storage_path,external_url,published_at,uploader_name,courses!inner(code,name,programme_id,programmes!inner(name,level))")
  .eq("status","published")
  .order("published_at",{ascending:false});

 const term=$("search").value.trim();
 if(term)query=query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);

 const level=$("levelFilter").value;
 if(level)query=query.eq("courses.programmes.level",level);

 const programme=$("programmeFilter").value;
 if(programme)query=query.eq("courses.programme_id",programme);

 const year=$("yearFilter").value;
if(year)query=query.eq("year_of_study",year);
 const semester=$("semesterFilter").value;
 if(semester)query=query.eq("semester",semester);

 const type=$("typeFilter").value;
 if(type)query=query.eq("resource_type",type);

 const {data,error}=await query;

 if(error){
  target.innerHTML='<p class="empty-state">'+escapeHtml(t("loadFail"))+'</p>';
  return;
 }

 if(!data?.length){
  target.innerHTML='<p class="empty-state">'+escapeHtml(t("noResources"))+'</p>';
  return;
 }

 target.innerHTML=data.map(m=>{
  const course=m.courses||{};
  const program=course.programmes||{};

  return `
   <article class="resource-card">
    <span class="resource-type">
     ${escapeHtml(m.resource_type.replace("_"," "))}
    </span>

    <h3>${escapeHtml(m.title)}</h3>

    <p>${escapeHtml(m.description||"")}</p>

    <div class="resource-meta">
     <span>${escapeHtml(course.code||"")} · ${escapeHtml(course.name||"")}</span>

     <span>${escapeHtml(program.name||"")} · ${escapeHtml(m.year_of_study||"")} · ${escapeHtml(m.semester||"")}</span>

     <span>Uploaded by: ${escapeHtml(m.uploader_name||"Not recorded")}</span>
    </div>

    <div class="resource-actions">
     <a href="#" data-download="${escapeHtml(m.id)}">Open / Download</a>
    </div>
   </article>
  `;
 }).join("");

 target.querySelectorAll("[data-download]").forEach(a=>
  a.addEventListener("click",async e=>{
   e.preventDefault();
   const item=data.find(x=>x.id===a.dataset.download);
   await openMaterial(item);
  })
 );
}
async function openMaterial(item){
 if(item.external_url){window.open(item.external_url,"_blank","noopener,noreferrer");return}
 if(!item.storage_path){toast("No file is attached to this resource.");return}
 const {data,error}=await supabase.storage.from("learning-materials").createSignedUrl(item.storage_path,90);
 if(error||!data?.signedUrl){
 console.error("Storage error:",error);
 toast("File error: "+(error?.message||"No signed URL returned"));
 return;
}
 window.open(data.signedUrl,"_blank","noopener,noreferrer");
}
async function loadFilters(){
 if(!supabase)return;

 const [{data:programmes},{data:years},{data:semesters}]=await Promise.all([
  supabase.from("programmes")
   .select("id,name")
   .eq("is_active",true)
   .order("name"),

  supabase.from("materials")
   .select("year_of_study")
   .eq("status","published")
   .order("year_of_study"),

  supabase.from("academic_periods")
   .select("semester")
   .order("semester")
 ]);

 if(programmes){
  $("programmeFilter").innerHTML=
   '<option value="">All programmes</option>'+
   programmes.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("");
 }

 if(years){
  const vals=[...new Set(years.map(x=>x.year_of_study).filter(Boolean))];
  $("yearFilter").innerHTML=
   '<option value="">All years</option>'+
   vals.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
 }

 if(semesters){
  const vals=[...new Set(semesters.map(x=>x.semester).filter(Boolean))];
  $("semesterFilter").innerHTML=
   '<option value="">All semesters</option>'+
   vals.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
 }
}
function renderWorkspace(){
 const p=currentProfile;if(!p)return;
 const dashboardTitles = {
 admin: "Administrator Dashboard",
 lecturer: "Lecturer Dashboard",
 student: "Student Dashboard"
};

const dashboardDescriptions = {
 admin: "Manage learning resources, student requests and academic timetables.",
 lecturer: "Manage your assigned courses and publish learning materials.",
 student: "Access learning materials, past papers and academic resources."
};

$("workspaceTitle").textContent = dashboardTitles[p.role] || "Dashboard";
$("workspaceSummary").textContent =
 `${dashboardDescriptions[p.role] || ""} Welcome, ${p.full_name || ""}.`;
 const box=$("workspaceContent");
if(p.role==="student"){
 box.innerHTML=`
  <div class="dashboard-grid">

   <div class="dashboard-tile" role="button" tabindex="0" data-student-view="note" style="cursor:pointer">
    <h3>Notes & Learning Resources</h3>
    <p>Access published lecture notes and learning materials.</p>
    <span class="panel-label">Study Materials</span>
   </div>

   <div class="dashboard-tile" role="button" tabindex="0" data-student-view="past_paper" style="cursor:pointer">
    <h3>Past Papers</h3>
    <p>Find previous examination papers.</p>
    <span class="panel-label">Examination Preparation</span>
   </div>

   <div class="dashboard-tile" role="button" tabindex="0" data-student-view="questions" style="cursor:pointer">
    <h3>Questions & Model Answers</h3>
    <p>Study possible questions and model answers.</p>
    <span class="panel-label">Self Assessment</span>
   </div>

   <div class="dashboard-tile">
    <h3>Academic Timetable</h3>
    <p>View and download published academic timetables.</p>
    <div id="studentTimetables">
     <p class="empty-state">Loading timetables...</p>
    </div>
   </div>

  </div>

  <section class="admin-panel" id="studentContentPanel" style="margin-top:24px">
   <h3 id="studentContentTitle">Select a learning section</h3>
   <div id="studentContent">
    <p class="empty-state">Choose one of the three cards above.</p>
   </div>
  </section>
 `;

 box.querySelectorAll("[data-student-view]").forEach(tile=>{
  tile.addEventListener("click",()=>{
   showStudentContent(tile.dataset.studentView);
  });

  tile.addEventListener("keydown",event=>{
   if(event.key==="Enter" || event.key===" "){
    event.preventDefault();
    showStudentContent(tile.dataset.studentView);
   }
  });
 });

 renderStudentTimetables();
 return;
}
 if(p.role==="lecturer"){renderLecturer(box);return}
 if(p.role==="admin"){renderAdmin(box);return}
 box.textContent="Role not recognised.";
}
async function renderStudentTimetables(){
 const box=$("studentTimetables");
 if(!box)return;

 box.innerHTML='<p class="empty-state">Loading timetables...</p>';

 const {data:timetables,error}=await supabase
  .from("timetables")
  .select("id,title,file_path,file_name,created_at")
  .eq("status","published")
  .order("created_at",{ascending:false});

 if(error){
  box.innerHTML=`<p class="empty-state">Could not load timetables: ${escapeHtml(error.message)}</p>`;
  return;
 }

 if(!timetables?.length){
  box.innerHTML='<p class="empty-state">No published timetables available.</p>';
  return;
 }

 box.innerHTML=timetables.map(t=>`
  <div class="resource-card">
   <h3>${escapeHtml(t.title)}</h3>
   <p>${escapeHtml(t.file_name)}</p>
   <button class="btn btn-primary"
    data-student-timetable="${escapeHtml(t.id)}">
    View Timetable
   </button>
  </div>
 `).join("");

 box.querySelectorAll("[data-student-timetable]").forEach(button=>{
  button.addEventListener("click",async()=>{
   const timetable=timetables.find(
    t=>t.id===button.dataset.studentTimetable
   );

   button.disabled=true;
   button.textContent="Opening...";

   const {data,error}=await supabase.storage
    .from("learning-materials")
    .createSignedUrl(timetable.file_path,300);

   button.disabled=false;
   button.textContent="View Timetable";

   if(error){
    toast("Could not open timetable: "+error.message);
    return;
   }

   window.open(data.signedUrl,"_blank");
  });
 });
}
async function showStudentContent(view){
 const target=$("studentContent");
 const title=$("studentContentTitle");

 const titles={
  note:"Notes & Learning Resources",
  past_paper:"Past Papers",
  questions:"Questions & Model Answers"
 };

 title.textContent=titles[view]||"Learning Resources";
 target.innerHTML='<p class="empty-state">Loading...</p>';

 if(view==="note" || view==="past_paper"){
  const {data,error}=await supabase
   .from("materials")
   .select("id,title,description,resource_type,storage_path,external_url,courses(code,name)")
   .eq("status","published")
   .eq("resource_type",view)
   .order("published_at",{ascending:false});

  if(error){
   target.innerHTML='<p class="empty-state">Could not load materials: '+escapeHtml(error.message)+'</p>';
   return;
  }

  if(!data?.length){
   target.innerHTML='<p class="empty-state">No published materials available yet.</p>';
   return;
  }

  target.innerHTML=data.map(m=>`
   <article class="resource-card">
    <h3>${escapeHtml(m.title)}</h3>
    <p>${escapeHtml(m.description||"")}</p>
    <p>${escapeHtml(m.courses?.code||"")} · ${escapeHtml(m.courses?.name||"")}</p>
    <button class="btn btn-primary" type="button" data-student-material="${escapeHtml(m.id)}">
     Open / Download
    </button>
   </article>
  `).join("");

  target.querySelectorAll("[data-student-material]").forEach(button=>{
   button.addEventListener("click",()=>{
    const item=data.find(m=>m.id===button.dataset.studentMaterial);
    if(item)openMaterial(item);
   });
  });

  return;
 }

 if(view==="questions"){
  const {data:questions,error}=await supabase
   .from("questions")
   .select("id,title,question_text,published_at,courses(code,name)")
   .eq("status","published")
   .order("published_at",{ascending:false});

  if(error){
   target.innerHTML='<p class="empty-state">Could not load questions: '+escapeHtml(error.message)+'</p>';
   return;
  }

  if(!questions?.length){
   target.innerHTML='<p class="empty-state">No published questions available yet.</p>';
   return;
  }

  const ids=questions.map(q=>q.id);

  const {data:answers,error:answerError}=await supabase
   .from("model_answers")
   .select("question_id,answer_text")
   .in("question_id",ids)
   .eq("status","published");

  if(answerError){
   target.innerHTML='<p class="empty-state">Could not load model answers.</p>';
   return;
  }

  target.innerHTML=questions.map(q=>{
   const questionAnswers=(answers||[]).filter(a=>a.question_id===q.id);

   return `
    <article class="resource-card">
     <h3>${escapeHtml(q.title)}</h3>
     <p>${escapeHtml(q.courses?.code||"")} · ${escapeHtml(q.courses?.name||"")}</p>
     <p><strong>Question:</strong></p>
     <p>${escapeHtml(q.question_text||"")}</p>
     <p><strong>Model Answer:</strong></p>
     ${questionAnswers.length
      ? questionAnswers.map(a=>`<p>${escapeHtml(a.answer_text)}</p>`).join("")
      : '<p class="empty-state">Model answer not published yet.</p>'}
    </article>
   `;
  }).join("");
 }
}
async function renderLecturer(box){
 box.innerHTML=`
  <section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>${escapeHtml(t("myCourses"))}</h3>
   <p class="muted">Publish is available only for courses assigned to your account.</p>
  </div>
  <span class="panel-label">Teaching Assignments</span>
 </div>

 <div id="lecturerCourseList" class="resource-grid">
  <p class="empty-state">Loading…</p>
 </div>
</section>

  <section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>${escapeHtml(t("upload"))}</h3>
   <p class="muted">Upload and publish learning materials for your assigned courses.</p>
  </div>
  <span class="panel-label">Resource Management</span>
 </div>

  <form id="uploadForm" class="dashboard-form">
   <div class="field fullrow">
    <label>Course / Module</label>
    <select id="uploadCourse" required></select>
   </div>

   <div class="field">
    <label>Module Code</label>
    <input id="uploadModuleCode" readonly placeholder="Auto-filled">
   </div>

   <div class="field">
    <label>Module Name</label>
    <input id="uploadModuleName" readonly placeholder="Auto-filled">
   </div>

   <div class="field">
    <label>${escapeHtml(t("title"))}</label>
    <input id="materialTitle" maxlength="180" required>
   </div>

   <div class="field">
    <label>${escapeHtml(t("type"))}</label>
    <select id="materialType" required>
     <option value="note">Notes</option>
     <option value="past_paper">Past paper</option>
    </select>
   </div>

   <div class="field">
    <label>Academic year</label>
    <input id="materialYear" maxlength="30"
     placeholder="e.g. 2026/2027" required>
   </div>

   <div class="field">
    <label>Semester</label>
    <select id="materialSemester" required>
     <option>Semester I</option>
     <option>Semester II</option>
     <option>Trimester I</option>
     <option>Trimester II</option>
     <option>Other</option>
    </select>
   </div>

  <div class="field">
  <label>Year of Study</label>
  <select id="materialStudyYear" required>
    <option>Year 1</option>
    <option>Year 2</option>
    <option>Year 3</option>
    <option>Year 4</option>
    <option>Other</option>
  </select>
</div>

   <div class="field fullrow">
    <label>File (PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP)</label>
    <input id="materialFile" type="file"
     accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
     required>
   </div>

   <textarea id="materialDescription" maxlength="2000"
    placeholder="Description (optional)"></textarea>

   <div class="fullrow">
    <button class="btn btn-primary" type="submit">
     ${escapeHtml(t("publish"))}
    </button>
    <p id="uploadMessage" class="message" role="status"></p>
   </div>
  </form>
</section>

  <section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Write Possible Questions and Model Answers</h3>
   <p class="muted">Prepare learning questions and model answers for your assigned courses.</p>
  </div>
  <span class="panel-label">Assessment Resources</span>
 </div>

  <form id="questionForm" class="dashboard-form">
   <div class="field fullrow">
    <label>Course</label>
    <select id="questionCourse" required></select>
   </div>

   <div class="field fullrow">
    <label>Question title</label>
    <input id="questionTitle" maxlength="180" required>
   </div>

   <div class="field fullrow">
  <label>Possible Questions</label>
  <textarea id="questionText"
   maxlength="10000"
   placeholder="Write the possible questions here..."
   required></textarea>
</div>

<div class="field fullrow">
  <label>Model Answers / Guidelines</label>
  <textarea id="answerText"
   maxlength="10000"
   placeholder="Write model answers or guidelines here (optional)"></textarea>
</div>
   <div class="fullrow">
    <button class="btn btn-primary" type="submit">
     ${escapeHtml(t("saveQuestion"))}
    </button>
    <p id="questionMessage" class="message" role="status"></p>
   </div>
  </form>
</section>
 `;

 const {data:assignments,error}=await supabase
  .from("teaching_assignments")
  .select("course_id,courses(id,code,name)")
  .eq("lecturer_id",currentUser.id)
  .eq("is_active",true);

 const courses=(assignments||[])
  .map(a=>a.courses)
  .filter(Boolean);

 const courseOptions=courses.map(c=>`
  <option value="${escapeHtml(c.id)}"
   data-code="${escapeHtml(c.code)}"
   data-name="${escapeHtml(c.name)}">
   ${escapeHtml(c.code)} — ${escapeHtml(c.name)}
  </option>
 `).join("");

 $("lecturerCourseList").innerHTML=
  error
   ?'<p class="empty-state">Could not load assigned courses.</p>'
   :courses.length
    ?courses.map(c=>`
      <article class="resource-card">
       <span class="resource-type">${escapeHtml(c.code)}</span>
       <h3>${escapeHtml(c.name)}</h3>
       <p>Assigned course</p>
      </article>
     `).join("")
    :`<p class="empty-state">${escapeHtml(t("noCourses"))}</p>`;

 $("uploadCourse").innerHTML=
  '<option value="">Choose a course</option>'+courseOptions;

 $("questionCourse").innerHTML=
  '<option value="">Choose a course</option>'+courseOptions;

 $("uploadCourse").addEventListener("change",()=>{
  const selected=$("uploadCourse").selectedOptions[0];

  $("uploadModuleCode").value=selected?.dataset.code||"";
  $("uploadModuleName").value=selected?.dataset.name||"";
 });

 $("uploadForm").addEventListener("submit",uploadMaterial);
 $("questionForm").addEventListener("submit",saveQuestion);
}
async function uploadMaterial(event){
 event.preventDefault();

 const msg=$("uploadMessage");
 msg.textContent="Uploading…";

 if(!currentUser){
  msg.textContent="Please log in first.";
  return;
 }

 const uploaderName=currentProfile?.full_name;
 if(!uploaderName){
  msg.textContent="Account name could not be found.";
  return;
 }

 const courseId=$("uploadCourse").value;
 const file=$("materialFile").files[0];
 const title=$("materialTitle").value.trim();

 if(!courseId||!file||!title){
  msg.textContent="Complete the required fields and choose a file.";
  return;
 }

 const ext=(file.name.split(".").pop()||"").toLowerCase();

 if(!["pdf","doc","docx","ppt","pptx","jpg","jpeg","png","webp"].includes(ext)){
  msg.textContent="Unsupported file type.";
  return;
 }

 if(file.size>20*1024*1024){
  msg.textContent="File is too large. Maximum size is 20 MB.";
  return;
 }

 const path=`${currentUser.id}/${courseId}/${crypto.randomUUID()}.${ext}`;

 const up=await supabase.storage
  .from("learning-materials")
  .upload(path,file,{
   upsert:false,
   contentType:file.type||"application/octet-stream"
  });

 if(up.error){
  msg.textContent="Upload failed: "+up.error.message;
  return;
 }

 const payload={
  course_id:courseId,
  title:title,
  description:$("materialDescription").value.trim(),
  resource_type:$("materialType").value,
  academic_year:$("materialYear").value.trim(),
  semester:$("materialSemester").value,
  year_of_study:$("materialStudyYear").value,
  storage_path:path,
  status:"published",
  uploaded_by:currentUser.id,
  uploader_name:uploaderName,
  published_at:new Date().toISOString()
 };

 const saved=await supabase.from("materials").insert(payload);

 if(saved.error){
  await supabase.storage.from("learning-materials").remove([path]);
  msg.textContent="Metadata save failed: "+saved.error.message;
  return;
 }

 msg.textContent="Published successfully.";
 event.target.reset();
}
async function uploadTimetable(event){
 event.preventDefault();

 const msg=$("timetableMessage");
 msg.textContent="Uploading timetable…";

 if(!currentUser || currentProfile?.role!=="admin"){
  msg.textContent="Admin access required.";
  return;
 }

 const title=$("timetableTitle").value.trim();
 const file=$("timetableFile").files[0];

 if(!title || !file){
  msg.textContent="Enter timetable title and choose a PDF.";
  return;
 }

 const ext=(file.name.split(".").pop()||"").toLowerCase();

 if(ext!=="pdf" || file.type!=="application/pdf"){
  msg.textContent="Please choose a PDF file.";
  return;
 }

 if(file.size>20*1024*1024){
  msg.textContent="Maximum file size is 20 MB.";
  return;
 }

 const path=`${currentUser.id}/timetables/${crypto.randomUUID()}.pdf`;

 const up=await supabase.storage
  .from("learning-materials")
  .upload(path,file,{
   upsert:false,
   contentType:"application/pdf"
  });

 if(up.error){
  msg.textContent="Upload failed: "+up.error.message;
  return;
 }

 const saved=await supabase.from("timetables").insert({
  title:title,
  description:$("timetableDescription").value.trim(),
  programme_id:$("timetableProgramme").value||null,
  academic_period_id:$("timetablePeriod").value||null,
  file_path:path,
  file_name:file.name,
  status:"published",
  uploaded_by:currentUser.id
 });

 if(saved.error){
  await supabase.storage.from("learning-materials").remove([path]);
  msg.textContent="Could not save timetable: "+saved.error.message;
  return;
 }

 msg.textContent="Timetable published successfully.";
 event.target.reset();
}
async function saveQuestion(event){
 event.preventDefault();const msg=$("questionMessage");msg.textContent="Saving…";
 const courseId=$("questionCourse").value;
 const {data:question,error}=await supabase.from("questions").insert({course_id:courseId,title:$("questionTitle").value.trim(),question_text:$("questionText").value.trim(),status:"published",created_by:currentUser.id,published_at:new Date().toISOString()}).select("id").single();
 if(error){msg.textContent="Could not save question: "+error.message;return}
 const answer=$("answerText").value.trim();
 if(answer){const {error:answerError}=await supabase.from("model_answers").insert({question_id:question.id,answer_text:answer,created_by:currentUser.id,status:"published",published_at:new Date().toISOString()});if(answerError){msg.textContent="Question saved but answer failed: "+answerError.message;return}}
 msg.textContent="Question and answer saved.";event.target.reset();
}
async function handleLogin(e){
  e.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const message = $("loginMessage");

  message.textContent = "Inaingia...";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;

    const profile = await loadProfile(data.user);

    showSignedIn(profile);
    closeModal();
    await loadFilters();

  } catch (error) {
    message.textContent = error.message;
  }
}
async function handleRequest(e) {
  e.preventDefault();

  const message = $("requestMessage");
  message.textContent = "Inasajili akaunti...";

  const fullName = $("studentName").value.trim();
  const email = $("studentEmail").value.trim().toLowerCase();
  const password = $("studentPassword").value;
  const confirmPassword = $("confirmPassword").value;

  if (password !== confirmPassword) {
    message.textContent = "Password hazifanani. Tafadhali hakiki.";
    return;
  }

  if (password.length < 8) {
    message.textContent = "Password lazima iwe na angalau herufi 8.";
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          registration_number: $("regNumber").value.trim(),
          study_level: $("studentLevel").value,
          programme_name: $("studentProgramme").value.trim(),
          year_of_study: $("studyYear").value
        }
      }
    });

    if (error) throw error;

    if (!data.session) {
      message.textContent =
        "Akaunti imetengenezwa. Tafadhali ingia kwa email na password yako.";
      return;
    }

    currentUser = data.user;
    const profile = await loadProfile(data.user);

    showSignedIn(profile);
    closeModal();
    await loadFilters();

  } catch (error) {
    message.textContent = error.message;
  }
}
async function renderAdmin(box){
 box.innerHTML=`
  <section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Pending Student Requests</h3>
   <p class="muted">Review and approve verified student requests.</p>
  </div>
  <span class="panel-label">Student Management</span>
 </div>

 <div id="requestsTable" class="table-wrap">
  <p class="empty-state">Loading requests…</p>
 </div>
</section>

 <section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Upload Learning Material</h3>
   <p class="muted">Admin can publish materials for all available courses.</p>
  </div>
  <span class="panel-label">Resource Management</span>
 </div>
  <form id="uploadForm" class="dashboard-form">
   <div class="field fullrow">
    <label>Course / Module</label>
    <select id="uploadCourse" required>
     <option value="">Loading courses…</option>
    </select>
   </div>

   <div class="field">
    <label>Module Code</label>
    <input id="uploadModuleCode" readonly placeholder="Auto-filled">
   </div>

   <div class="field">
    <label>Module Name</label>
    <input id="uploadModuleName" readonly placeholder="Auto-filled">
   </div>

   <div class="field">
    <label>Title</label>
    <input id="materialTitle" maxlength="180" required>
   </div>

   <div class="field">
    <label>Resource type</label>
    <select id="materialType" required>
     <option value="note">Notes</option>
     <option value="past_paper">Past paper</option>
    </select>
   </div>

   <div class="field">
    <label>Academic year</label>
    <input id="materialYear" maxlength="30"
     placeholder="e.g. 2026/2027" required>
   </div>

   <div class="field">
    <label>Semester</label>
    <select id="materialSemester" required>
     <option>Semester I</option>
     <option>Semester II</option>
     <option>Trimester I</option>
     <option>Trimester II</option>
     <option>Other</option>
    </select>
   </div>

   <div class="field">
    <label>Year of study</label>
    <select id="materialStudyYear" required>
     <option>Year 1</option>
     <option>Year 2</option>
     <option>Year 3</option>
     <option>Year 4</option>
     <option>Other</option>
    </select>
   </div>

   <div class="field fullrow">
    <label>File (PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, WEBP)</label>
    <input id="materialFile" type="file"
     accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
     required>
   </div>

   <div class="field fullrow">
    <label>Description (optional)</label>
    <textarea id="materialDescription" maxlength="2000"></textarea>
   </div>

   <div class="fullrow">
    <button class="btn btn-primary" type="submit">
     Publish material
    </button>
    <p id="uploadMessage" class="message" role="status"></p>
   </div>
  </form>
</section>

<section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Manage Timetable</h3>
   <p class="muted">Upload and publish academic timetables.</p>
  </div>
  <span class="panel-label">Timetable Management</span>
 </div>
<form id="timetableForm" class="dashboard-form">

 <div class="field fullrow">
  <label>Timetable Title</label>
  <input id="timetableTitle" maxlength="180" required>
 </div>

 <div class="field">
  <label>Programme</label>
  <select id="timetableProgramme">
   <option value="">All programmes</option>
  </select>
 </div>

 <div class="field">
  <label>Academic Period</label>
  <select id="timetablePeriod">
   <option value="">Select academic period</option>
  </select>
 </div>

 <div class="field fullrow">
  <label>Timetable PDF</label>
  <input id="timetableFile" type="file"
   accept=".pdf,application/pdf" required>
 </div>

 <div class="field fullrow">
  <label>Description</label>
  <textarea id="timetableDescription" maxlength="2000"></textarea>
 </div>

 <div class="fullrow">
  <button class="btn btn-primary" type="submit">
   Publish Timetable
  </button>
  <p id="timetableMessage" class="message" role="status"></p>
 </div>

</form>
</section>

<section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Uploaded Timetables</h3>
   <p class="muted">View and manage published academic timetables.</p>
  </div>
  <span class="panel-label">Timetable Records</span>
 </div>
<div id="adminTimetables" class="table-wrap">
 <p class="empty-state">Loading timetables…</p>
</div>
</section>

<section class="admin-panel">
 <div class="admin-panel-heading">
  <div>
   <h3>Published Resources</h3>
   <p class="muted">View and manage published learning materials.</p>
  </div>
  <span class="panel-label">Learning Resources</span>
 </div>
<div id="adminMaterials" class="table-wrap">
 <p class="empty-state">Loading…</p>
</div>
</section>
 `;
// Load programmes for timetable
 const {data:programmes,error:programmeError}=await supabase
  .from("programmes")
  .select("id,name")
  .order("name");

 const programmeSelect=$("timetableProgramme");

 if(programmeError){
  toast("Could not load programmes: "+programmeError.message);
 }else{
  programmeSelect.innerHTML=
   '<option value="">All programmes</option>'+
   (programmes||[]).map(p=>`
    <option value="${escapeHtml(p.id)}">
     ${escapeHtml(p.name)}
    </option>
   `).join("");
 }

 // Load academic periods for timetable
 const {data:periods,error:periodError}=await supabase
  .from("academic_periods")
  .select("id,academic_year,semester,year_of_study")
  .order("academic_year",{ascending:false});

 const periodSelect=$("timetablePeriod");

 if(periodError){
  toast("Could not load academic periods: "+periodError.message);
 }else{
  periodSelect.innerHTML=
   '<option value="">Select academic period</option>'+
   (periods||[]).map(p=>`
    <option value="${escapeHtml(p.id)}">
     ${escapeHtml(p.academic_year)} — ${escapeHtml(p.semester)} — ${escapeHtml(p.year_of_study)}
    </option>
   `).join("");
 }

 // Connect timetable upload form
 $("timetableForm").addEventListener("submit",uploadTimetable);
 // Load student requests
 const {data:requests,error}=await supabase
  .from("student_requests")
  .select("id,full_name,registration_number,email,study_level,programme_name,year_of_study,status,created_at")
  .order("created_at",{ascending:false})
  .limit(100);

 const rt=$("requestsTable");

 if(error){
  rt.innerHTML=`<p class="empty-state">Could not load requests: ${escapeHtml(error.message)}</p>`;
 }else if(!requests?.length){
  rt.innerHTML='<p class="empty-state">No requests yet.</p>';
 }else{
  rt.innerHTML=`<table>
   <thead><tr>
    <th>Name</th>
    <th>Registration</th>
    <th>Programme / level</th>
    <th>Email</th>
    <th>Status</th>
    <th>Action</th>
   </tr></thead>
   <tbody>${requests.map(r=>`<tr>
    <td>${escapeHtml(r.full_name)}</td>
    <td>${escapeHtml(r.registration_number)}</td>
    <td>${escapeHtml(r.programme_name)}<br>${escapeHtml(r.study_level)} · ${escapeHtml(r.year_of_study)}</td>
    <td>${escapeHtml(r.email)}</td>
    <td><span class="status">${escapeHtml(r.status)}</span></td>
    <td>${r.status==="pending"?`
     <button class="btn btn-primary" data-approve="${escapeHtml(r.id)}">Approve</button>
     <button class="btn btn-outline" data-reject="${escapeHtml(r.id)}">Reject</button>
    `:"—"}</td>
   </tr>`).join("")}</tbody>
  </table>`;

  async function reviewRequest(id,action){
   const message=action==="approve"
    ?"Confirm that you have verified this student's details before approving?"
    :"Are you sure you want to reject this student request?";

   if(!confirm(message))return;

   const {data:{session}}=await supabase.auth.getSession();

   if(!session){
    toast("Please sign in again.");
    return;
   }

   try{
    const response=await fetch(
     `${window.IRDP_CONFIG.SUPABASE_URL}/functions/v1/approve-student`,
     {
      method:"POST",
      headers:{
       "Content-Type":"application/json",
       "apikey":window.IRDP_CONFIG.SUPABASE_ANON_KEY,
       "Authorization":`Bearer ${session.access_token}`
      },
      body:JSON.stringify({requestId:id,action})
     }
    );

    const result=await response.json();

    if(!response.ok){
     toast(result.error||"Request failed.");
     return;
    }

    toast(result.message||"Request updated.");
    await renderAdmin(box);
   }catch(error){
    toast("Connection error. Please try again.");
   }
  }

  rt.querySelectorAll("[data-approve]").forEach(button=>{
   button.addEventListener("click",()=>{
    reviewRequest(button.dataset.approve,"approve");
   });
  });

  rt.querySelectorAll("[data-reject]").forEach(button=>{
   button.addEventListener("click",()=>{
    reviewRequest(button.dataset.reject,"reject");
   });
  });
 }

 // Load all courses for Admin
 const {data:allCourses,error:courseError}=await supabase
  .from("courses")
  .select("id,code,name")
  .order("code");

 const courseSelect=$("uploadCourse");

 if(courseError){
  courseSelect.innerHTML='<option value="">Could not load courses</option>';
  toast("Could not load courses: "+courseError.message);
 }else if(!allCourses?.length){
  courseSelect.innerHTML='<option value="">No courses available</option>';
 }else{
  courseSelect.innerHTML=
   '<option value="">Choose a course</option>'+
   allCourses.map(c=>`
    <option value="${escapeHtml(c.id)}"
     data-code="${escapeHtml(c.code)}"
     data-name="${escapeHtml(c.name)}">
     ${escapeHtml(c.code)} — ${escapeHtml(c.name)}
    </option>
   `).join("");
 }

 // Auto-fill module code and name
 courseSelect.addEventListener("change",()=>{
  const selected=courseSelect.selectedOptions[0];

  $("uploadModuleCode").value=selected?.dataset.code||"";
  $("uploadModuleName").value=selected?.dataset.name||"";
 });

 // Connect Admin upload form
 $("uploadForm").addEventListener("submit",uploadMaterial);
// Load uploaded timetables
const {data:timetables,error:timetableError}=await supabase
 .from("timetables")
 .select(`
  id,
  title,
  file_name,
file_path,
status,
  created_at,
  programmes(name),
  academic_periods(academic_year,semester,year_of_study)
 `)
 .order("created_at",{ascending:false});

const timetableBox=$("adminTimetables");

if(timetableError){
 timetableBox.innerHTML=
  `<p class="message">Could not load timetables: ${escapeHtml(timetableError.message)}</p>`;
}else if(!timetables || timetables.length===0){
 timetableBox.innerHTML=
  `<p class="empty-state">No timetables uploaded yet.</p>`;
}else{
 timetableBox.innerHTML=`
  <table>
   <thead>
    <tr>
     <th>Title</th>
     <th>Programme</th>
     <th>Academic Period</th>
     <th>Status</th>
     <th>Action</th>
    </tr>
   </thead>
   <tbody>
    ${timetables.map(t=>`
     <tr>
      <td>${escapeHtml(t.title)}</td>
      <td>${escapeHtml(t.programmes?.name||"All programmes")}</td>
      <td>${escapeHtml(
       t.academic_periods
        ? `${t.academic_periods.academic_year} — ${t.academic_periods.semester} — ${t.academic_periods.year_of_study}`
        : "Not specified"
      )}</td>
      <td>${escapeHtml(t.status)}</td>
      <td>
 <button class="btn btn-outline" data-open-timetable="${escapeHtml(t.id)}">
  Open PDF
 </button>
</td>
     </tr>
    `).join("")}
   </tbody>
  </table>
 `;
}
timetableBox.querySelectorAll("[data-open-timetable]").forEach(button=>{
 button.addEventListener("click",async()=>{
  const timetable=timetables.find(
   t=>t.id===button.dataset.openTimetable
  );

  if(!timetable?.file_path){
   toast("PDF file path not found.");
   return;
  }

  button.disabled=true;
  button.textContent="Opening...";

  const {data,error}=await supabase.storage
   .from("learning-materials")
   .createSignedUrl(timetable.file_path,300);

  button.disabled=false;
  button.textContent="Open PDF";

  if(error){
   toast("Could not open PDF: "+error.message);
   return;
  }

  window.open(data.signedUrl,"_blank");
 });
});
 // Load published and archived resources
 const {data:materials,error:merror}=await supabase
  .from("materials")
  .select("id,title,resource_type,status,uploader_name,courses(code,name)")
  .order("created_at",{ascending:false})
  .limit(100);

 const mt=$("adminMaterials");

 if(merror){
  mt.innerHTML=`<p class="empty-state">Could not load resources: ${escapeHtml(merror.message)}</p>`;
 }else if(!materials?.length){
  mt.innerHTML='<p class="empty-state">No resources yet.</p>';
 }else{
  mt.innerHTML=`<table>
   <thead><tr>
    <th>Resource</th>
    <th>Course</th>
    <th>Uploaded by</th>
    <th>Status</th>
    <th>Action</th>
   </tr></thead>
   <tbody>${materials.map(m=>`<tr>
    <td>${escapeHtml(m.title)}<br><small>${escapeHtml(m.resource_type)}</small></td>
    <td>${escapeHtml(m.courses?.code||"")} — ${escapeHtml(m.courses?.name||"")}</td>
    <td>${escapeHtml(m.uploader_name||"Not recorded")}</td>
    <td>${escapeHtml(m.status)}</td>
    <td>${m.status==="published"?`
     <button class="btn btn-outline" data-hide="${escapeHtml(m.id)}">Hide</button>
    `:"—"}</td>
   </tr>`).join("")}</tbody>
  </table>`;

  mt.querySelectorAll("[data-hide]").forEach(button=>{
   button.addEventListener("click",async()=>{
    if(!confirm(t("confirmHide")))return;

    const {error}=await supabase.from("materials")
     .update({status:"archived"}).eq("id",button.dataset.hide);

    if(error){
     toast(error.message);
    }else{
     toast("Resource hidden.");
     await renderAdmin(box);
    }
   });
  });
 }
await renderAdminManagement(box);
}

async function renderAdminManagement(box) {
  box.insertAdjacentHTML("beforeend", `
    <section class="panel" style="margin-top:20px">
      <h2>Academic Management</h2>

      <h3>Add Programme</h3>
      <form id="addProgrammeForm">
        <input id="programmeName" placeholder="Programme name" required>
        <select id="programmeLevel" required>
          <option value="">Select level</option>
          <option value="Degree">Degree</option>
          <option value="Master's">Master's</option>
          <option value="Non-Degree">Non-Degree</option>
        </select>
        <textarea id="programmeDescription" placeholder="Description"></textarea>
        <button type="submit">Add Programme</button>
        <p id="programmeMessage"></p>
      </form>

      <hr>

      <h3>Add Academic Period</h3>
      <form id="addPeriodForm">
        <input id="academicYear" placeholder="Academic year e.g. 2026/2027" required>
        <input id="academicSemester" placeholder="Semester e.g. Semester I" required>
<select id="academicYearOfStudy" required>
  <option value="">Select Year of Study</option>
  <option value="Year 1">Year 1</option>
  <option value="Year 2">Year 2</option>
  <option value="Year 3">Year 3</option>
  <option value="Year 4">Year 4</option>
</select>
        <button type="submit">Add Academic Period</button>
        <p id="periodMessage"></p>
      </form>

      <hr>

      <h3>Add Course / Module</h3>
      <form id="addCourseForm">
        <select id="courseProgramme" required>
          <option value="">Select Programme</option>
        </select>
        <input id="newCourseCode" placeholder="Course code" required>
        <input id="newCourseName" placeholder="Course / Module name" required>
        <textarea id="newCourseDescription" placeholder="Description"></textarea>
        <button type="submit">Add Course</button>
        <p id="courseMessage"></p>
      </form>
    </section>
  `);

  const programmeSelect = document.getElementById("courseProgramme");

  async function loadProgrammes() {
    const { data, error } = await supabase
      .from("programmes")
      .select("id,name,level")
      .eq("is_active", true)
      .order("name");

    if (error) {
      programmeSelect.innerHTML = '<option value="">Could not load programmes</option>';
      return;
    }

    programmeSelect.innerHTML = '<option value="">Select Programme</option>';

    (data || []).forEach(programme => {
      const option = document.createElement("option");
      option.value = programme.id;
      option.textContent = `${programme.name} (${programme.level})`;
      programmeSelect.appendChild(option);
    });
  }

  await loadProgrammes();

  document.getElementById("addProgrammeForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("programmeMessage");
    const { error } = await supabase.from("programmes").insert({
      name: document.getElementById("programmeName").value.trim(),
      level: document.getElementById("programmeLevel").value,
      description: document.getElementById("programmeDescription").value.trim(),
      is_active: true
    });

    message.textContent = error ? error.message : "Programme added successfully.";
    if (!error) {
      event.target.reset();
      await loadProgrammes();
    }
  });

  document.getElementById("addPeriodForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("periodMessage");

    const { error } = await supabase.from("academic_periods").insert({
      academic_year: document.getElementById("academicYear").value.trim(),
      semester: document.getElementById("academicSemester").value.trim(),
      year_of_study: document.getElementById("academicYearOfStudy").value,
      is_active: true
    });

    message.textContent = error
      ? error.message
      : "Academic period added successfully.";

    if (!error) event.target.reset();
  });
document.getElementById("addCourseForm").addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("courseMessage");
    message.textContent = "Saving course...";

    const { error } = await supabase.from("courses").insert({
      programme_id: document.getElementById("courseProgramme").value,
      code: document.getElementById("newCourseCode").value.trim(),
      name: document.getElementById("newCourseName").value.trim()
    });

    message.textContent = error
      ? "Could not add course: " + error.message
      : "Course added successfully.";

    if (!error) {
      event.target.reset();
      await loadProgrammes();
    }
  });
}

async function restoreSession(){
 if(!supabase){
  showSignedOut();
  return;
 }

 const {data}=await supabase.auth.getSession();

 if(!data.session){
  showSignedOut();
  return;
 }

 currentUser=data.session.user;

 const isPasswordRecovery =
  window.location.hash.includes("type=recovery");

 if(isPasswordRecovery){
  openModal("login");
  showPane("reset");
  return;
 }

 try{
  currentProfile=await loadProfile(currentUser);
  showSignedIn(currentProfile);
  await loadFilters();
 }
 catch(_){
  await supabase.auth.signOut();
  showSignedOut();
 }
}
function wire(){
 $("openLogin").onclick=()=>openModal("login");$("heroLogin").onclick=()=>openModal("login");$("libraryLogin").onclick=()=>openModal("login");
 $("heroRequest").onclick=()=>openModal("request");$("bottomRequest").onclick=()=>openModal("request");$("closeModal").onclick=closeModal;
 $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal()});
 $("loginTab").onclick=()=>showPane("login");$("requestTab").onclick=()=>showPane("request");
 $("loginForm").addEventListener("submit",handleLogin);$("requestForm").addEventListener("submit",handleRequest);
$("resetPasswordForm").addEventListener("submit",async e=>{
 e.preventDefault();

 const password=$("newPassword").value;
 const confirm=$("confirmNewPassword").value;
 const message=$("resetPasswordMessage");

 if(password.length<8){
  message.textContent="Password must be at least 8 characters.";
  return;
 }

 if(password!==confirm){
  message.textContent="Passwords do not match.";
  return;
 }

 message.textContent="Updating password…";

 const {error}=await supabase.auth.updateUser({
  password:password
 });

 if(error){
  message.textContent="Error: "+error.message;
  return;
 }

 message.textContent="Password updated successfully.";

 e.target.reset();
});
$("forgotPassword").onclick=async e=>{
 e.preventDefault();

 const email=$("loginEmail").value.trim();
 const message=$("forgotMessage");

 if(!email){
  message.textContent="Please enter your email address first.";
  $("loginEmail").focus();
  return;
 }

 message.textContent="Sending password reset link…";

 const {error}=await supabase.auth.resetPasswordForEmail(email,{
  redirectTo:window.location.origin
 });

 message.textContent=error
  ? "Error: "+error.message
  : "Password reset link sent. Check your email.";
};
 $("logout").onclick=async()=>{if(supabase)await supabase.auth.signOut();showSignedOut();toast("Signed out.")};
 $("language").addEventListener("change",e=>setLanguage(e.target.value));
 $("searchButton").onclick=loadResources;$("search").addEventListener("keydown",e=>{if(e.key==="Enter")loadResources()});
 ["levelFilter","programmeFilter","yearFilter","semesterFilter","typeFilter"].forEach(id=>$(id).addEventListener("change",loadResources));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
}
async function start(){
 $("year").textContent=new Date().getFullYear();
 try{const saved=localStorage.getItem("irdp-language");if(saved)$("language").value=saved}catch(_){}
 setLanguage($("language").value);wire();
 if(!initBackend()){showSignedOut();$("signedOutLibrary").querySelector("p").textContent="Preview mode: configure config.js and the Supabase project before using account features.";return}
 supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){showSignedOut()}else if(session&&event==="SIGNED_IN"){setTimeout(()=>restoreSession(),0)}});
 await restoreSession();
}
start();
})();