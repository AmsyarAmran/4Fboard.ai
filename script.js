const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let activeMode = "topic";
let currentTitle = "";
let currentPrompt = "";
let currentTool = "pen";
let currentColor = "#26334a";
let currentSize = 4;
let saved = [];
let recent = [];
let files = [];
let undoStack = [];
let drawing = false;
let lastPoint = null;
const canvas = $("#drawingCanvas");
const ctx = canvas.getContext("2d");
const toast = (message) => {
  const el = $("#toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>el.classList.remove("show"),2400);
};
function showView(name){
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  const target = $(`#${name}View`); if(target) target.classList.add("active-view");
  $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  $("#crumbCurrent").textContent = ({learn:"Learn",lessons:"My lessons",library:"Library",settings:"Settings"})[name]||"Learn";
  $("#sidebar").classList.remove("open");
}
$$(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("#newLesson").addEventListener("click",()=>{showView("learn");$("#topicInput").focus();});
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#helpButton").addEventListener("click",()=>$("#helpModal").classList.add("open"));
$("#closeHelp").addEventListener("click",()=>$("#helpModal").classList.remove("open"));
$("#gotIt").addEventListener("click",()=>$("#helpModal").classList.remove("open"));
$("#exploreButton").addEventListener("click",()=>toast("You're already exploring 4Fboard.ai."));
$("#backToLearn").addEventListener("click",()=>showView("learn"));
$("#createFirstLesson").addEventListener("click",()=>showView("learn"));
$$(".mode-tab").forEach(btn=>btn.addEventListener("click",()=>{
  activeMode=btn.dataset.mode;
  $$(".mode-tab").forEach(b=>{b.classList.toggle("selected",b===btn);b.setAttribute("aria-selected",b===btn?"true":"false");});
  const placeholders={topic:"What would you like to understand today?",exam:"Which subject or exam topic are you preparing for?",homework:"Paste your homework question. We'll work through it step by step."};
  $("#topicInput").placeholder=placeholders[activeMode];
}));
$$(".idea-card").forEach(btn=>btn.addEventListener("click",()=>{$("#topicInput").value=btn.dataset.prompt;$("#topicInput").focus();window.scrollTo({top:0,behavior:"smooth"});}));
$("#shuffleIdeas").addEventListener("click",()=>{
  const prompts=["Explain Newton's laws of motion with everyday examples.","How does the human heart circulate blood?","Show me how to solve simultaneous equations.","Explain the water cycle with a simple diagram.","What were the main causes of World War I?"];
  const p=prompts[Math.floor(Math.random()*prompts.length)];$("#topicInput").value=p;$("#topicInput").focus();
});
$("#fileInput").addEventListener("change",e=>{files=[...files,...e.target.files];$("#fileCount").textContent=files.length?`${files.length} file(s) added`:"";toast(`${e.target.files.length} file(s) selected for this session`);});
$("#promptForm").addEventListener("submit",e=>{
  e.preventDefault();const value=$("#topicInput").value.trim();
  if(!value){toast("Enter a topic or question first.");$("#topicInput").focus();return;}
  createLesson(value);
});
function createLesson(prompt){
  currentPrompt=prompt;currentTitle=prompt.length>58?prompt.slice(0,55)+"…":prompt;
  $("#lessonTitle").textContent=currentTitle;
  $("#lessonSubtitle").textContent=({topic:"Let's break this idea down into clear, visual steps.",exam:"Let's organise your revision into key ideas and checkpoints.",homework:"Let's understand the question before working towards an answer."})[activeMode];
  $("#lessonModeLabel").textContent=({topic:"TOPIC LESSON",exam:"EXAM PREP",homework:"HOMEWORK GUIDE"})[activeMode];
  const modeText={topic:"Explore the core idea\n\n1. Start with the main concept.\n2. Connect it to a simple example.\n3. Check what you understand and what needs another look.",exam:"Revision roadmap\n\n1. Identify the key facts and definitions.\n2. Group related ideas into a short summary.\n3. Practise recalling the information.\n\nAdd your notes or study guide to build a focused revision session.",homework:"A step-by-step approach\n\n1. Read the question and identify what it asks.\n2. List the information you already know.\n3. Work through one step at a time and check your reasoning.\n\nTry the follow-up box if you want a hint."};
  $("#lessonExplanation").textContent=modeText[activeMode];
  drawStarter(prompt);showView("lesson");recent.unshift(prompt);renderRecent();
  $("#followupAnswer").textContent="";
}
function drawStarter(prompt){
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#26364d";ctx.font="700 31px Manrope, sans-serif";ctx.fillText("Let's explore",55,90);
  ctx.fillStyle="#b69a42";ctx.font="700 18px DM Sans, sans-serif";ctx.fillText("YOUR QUESTION",57,133);
  ctx.fillStyle="#536174";ctx.font="500 22px DM Sans, sans-serif";
  const words=prompt.split(" ");let line="",y=185;
  for(const word of words){const test=line+word+" ";if(ctx.measureText(test).width>900){ctx.fillText(line,57,y);line=word+" ";y+=34;}else line=test;}
  if(line)ctx.fillText(line,57,y);
  ctx.strokeStyle="#e7dba9";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(57,y+35);ctx.lineTo(350,y+35);ctx.stroke();
  ctx.fillStyle="#8c9695";ctx.font="14px DM Sans, sans-serif";ctx.fillText("Use the board to sketch ideas, steps and connections.",57,y+78);
  undoStack=[];
}
function renderRecent(){
  const el=$("#recentList");el.innerHTML="";
  if(!recent.length){el.innerHTML='<p class="empty-recent">Your lessons will appear here.</p>';return;}
  recent.slice(0,5).forEach(t=>{const b=document.createElement("button");b.className="recent-item";b.textContent=t;b.title=t;b.addEventListener("click",()=>{createLesson(t);});el.appendChild(b);});
}
function renderSaved(){
  const el=$("#savedLessons");el.innerHTML="";
  if(!saved.length){el.innerHTML='<div class="empty-state"><span>▤</span><strong>No saved lessons yet</strong><p>Create a lesson and save it to see it here.</p><button class="start-button" id="createFirstLesson">Create a lesson ↗</button></div>';$("#createFirstLesson").addEventListener("click",()=>showView("learn"));return;}
  saved.forEach((item,i)=>{const card=document.createElement("div");card.className="file-row";const name=document.createElement("strong");name.textContent=item;const open=document.createElement("button");open.className="secondary-button";open.textContent="Open lesson";open.addEventListener("click",()=>createLesson(item));card.append(name,open);el.appendChild(card);});
}
$("#saveLesson").addEventListener("click",()=>{if(!currentPrompt)return; if(!saved.includes(currentPrompt))saved.unshift(currentPrompt);renderSaved();toast("Lesson saved in this session.");});
$("#followupForm").addEventListener("submit",e=>{e.preventDefault();const q=$("#followupInput").value.trim();if(!q){toast("Type a follow-up question first.");return;}$("#followupAnswer").textContent="Good question. Try connecting it to the main idea: “"+currentPrompt+"”. This preview does not generate live AI answers yet; connect an AI backend to enable personalised help.";$("#followupInput").value="";});
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
function saveUndo(){try{undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(undoStack.length>20)undoStack.shift();}catch{}}
canvas.addEventListener("pointerdown",e=>{drawing=true;canvas.setPointerCapture(e.pointerId);saveUndo();lastPoint=point(e);});
canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=point(e);ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=currentTool==="eraser"?24:currentSize;ctx.strokeStyle=currentTool==="eraser"?"#ffffff":currentColor;ctx.stroke();lastPoint=p;});
function stopDraw(){drawing=false;lastPoint=null;}
canvas.addEventListener("pointerup",stopDraw);canvas.addEventListener("pointercancel",stopDraw);
$$(".tool-button[data-tool]").forEach(b=>b.addEventListener("click",()=>{$$(".tool-button[data-tool]").forEach(x=>x.classList.toggle("active",x===b));currentTool=b.dataset.tool;}));
$("#penColor").addEventListener("input",e=>currentColor=e.target.value);
$("#penSize").addEventListener("input",e=>currentSize=Number(e.target.value));
$("#undoButton").addEventListener("click",()=>{const img=undoStack.pop();if(img)ctx.putImageData(img,0,0);else toast("Nothing to undo.");});
$("#clearBoard").addEventListener("click",()=>{saveUndo();ctx.clearRect(0,0,canvas.width,canvas.height);});
$("#downloadBoard").addEventListener("click",()=>{const a=document.createElement("a");a.download="4fboard-learning-board.png";a.href=canvas.toDataURL("image/png");a.click();});
function addFiles(fileList,target){
  [...fileList].forEach(file=>{const row=document.createElement("div");row.className="file-row";const name=document.createElement("span");name.textContent="▧  "+file.name;const size=document.createElement("small");size.textContent=(file.size/1024).toFixed(0)+" KB";row.append(name,size);target.appendChild(row);});
}
$("#libraryFile").addEventListener("change",e=>{addFiles(e.target.files,$("#libraryFiles"));toast(`${e.target.files.length} file(s) added to this session.`);});
$("#libraryDrop").addEventListener("dragover",e=>{e.preventDefault();$("#libraryDrop").style.borderColor="#c7a944";});
$("#libraryDrop").addEventListener("dragleave",()=>$("#libraryDrop").style.borderColor="");
$("#libraryDrop").addEventListener("drop",e=>{e.preventDefault();$("#libraryDrop").style.borderColor="";addFiles(e.dataTransfer.files,$("#libraryFiles"));toast("Files added to this session.");});
const translations={
  en:{crumb:"Learn",heading:"Make every",copy:"Ask anything. Explore every step. Learn it your way.",question:"What are we learning today?",start:"Create lesson",inspire:"Need a little inspiration?"},
  ms:{crumb:"Belajar",heading:"Jadikan setiap",copy:"Tanya apa sahaja. Teroka setiap langkah. Belajar cara anda.",question:"Apa yang kita belajar hari ini?",start:"Cipta pelajaran",inspire:"Perlukan sedikit inspirasi?"}
};
let language="en";
function setLanguage(lang){
  language=lang;const t=translations[lang];$("#crumbCurrent").textContent=t.crumb;$(".panel-heading strong").textContent=t.question;$("#topicInput").placeholder=lang==="ms"?"Apakah yang ingin anda fahami hari ini?":"What would you like to understand today?";$(".start-button",$("#promptForm")).innerHTML=t.start+' <span>↗</span>';$(".welcome-copy").textContent=t.copy;$(".section-title-row strong").textContent=t.inspire;$("#languageButton").innerHTML=(lang==="en"?"EN":"MS")+' <span>⌄</span>';$("#settingsLanguage").value=lang;
}
$("#languageButton").addEventListener("click",()=>setLanguage(language==="en"?"ms":"en"));
$("#settingsLanguage").addEventListener("change",e=>setLanguage(e.target.value));
setLanguage("en");
