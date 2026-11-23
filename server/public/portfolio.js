"use strict";
(() => {
  const GH = "https://github.com/BayazidHabibSiddikee/";
  const sectors = [
    {id:"robotics",number:"01",glyph:"⌘",title:"ROBOTICS & AUTONOMY",short:"Machines that sense, decide and move.",color:"#78f0dc",count:"06 PROJECTS",description:"Autonomous navigation, machine vision, motion systems and physical computing. This space collects projects where code meets sensors, actuators and the real world.",projects:[
      ["Semi-Autonomous Weeding Robot","ROS 2 · Raspberry Pi 4 · ESP32 · RGB-D","A field rover architecture with closed-loop navigation, crop-row vision, wheel odometry, watchdog and hardware emergency-stop interlocks.","Semi-Autonomous-Weeding-Robot"],
      ["CNC Mathematical Plotter","ESP32 · CoreXY · Python · NLP","A Wi-Fi-enabled equation plotting machine with natural-language and Telegram interfaces, coordinate generation and motion control.","CNC-Math-Plotter"],
      ["7-DOF Robotic Hand","Robotics · Mechanism design","A dedicated repository for a seven-degree-of-freedom robotic hand project.","robotic_hand_7DOF"],
      ["Supercar FPV RC Platform","ESP32-CAM · FreeCAD · KiCad","A compact FPV RC car project with FreeCAD assembly work, carrier PCB design and an interactive board guide.","Super-car"],
      ["SignFrame / OpenCV Deaf","Computer vision · PyTorch · RGB-D","A vision suite for ASL fingerspelling, hand tracking, depth sensing and assistive text composition.","OpenCV-Deaf"],
      ["ROS 2 Learning Path","ROS 2 · Nav2 · TF2","A structured workspace for learning ROS 2 concepts, navigation and robot integration.","ROS_Learning"]
    ]},
    {id:"mechatronics",number:"02",glyph:"⌁",title:"MECHATRONICS & SIMULATION",short:"Engineering models, controls and digital systems.",color:"#8ca7ff",count:"04 WORKSPACES",description:"The engineering layer: physical systems, fluid power, electrical circuits, control, CAD and technical documentation.",projects:[
      ["FluidSim Studio","TypeScript · React · Physics engine","A multi-domain hydraulic, pneumatic, electrical and digital mechatronics simulator with schematic editing and real-time telemetry.","Fluidsim-Linux"],
      ["Engineering Lab Reports","CAD · Simulation · Power electronics","A central technical workspace containing governor design, blower analysis, inverter work, regulator PCB documentation and lab reports.","Lab_Reports"],
      ["CNC Plotter Engineering Report","Mechatronics · Embedded systems","RUET group project documentation for the ESP32-based mathematical equation plotting robot.","CNC-Math-Plotter"],
      ["Industrial Training — BSRM","Steelmaking · Maintenance · Plant systems","Industrial training experience in Melting Shop 2, including induction furnace operations, material handling, utilities and maintenance exposure.","The-Journey-Continues"]
    ]},
    {id:"ai",number:"03",glyph:"⟁",title:"AI & INTELLIGENT SYSTEMS",short:"Agents, local models and cognitive software.",color:"#c19cff",count:"07 PROJECTS",description:"AI systems built around orchestration, retrieval, local inference, tool use, language models and human-facing interfaces.",projects:[
      ["Marin — Cognitive System","Python · LangGraph · Ollama · OpenRouter","An AI system with intent routing, verified tool execution, local and cloud model support and a multi-stage reasoning workflow.","Marin_Kitagawa_v3"],
      ["Sentinel","FastAPI · RAG · FAISS · PostgreSQL","A self-hosted academic assistant designed around course materials, retrieval-grounded answers and guided learning for RUET students.","Sentinel"],
      ["Marin Evil Sentinel","FastAPI · LangChain · LangGraph","A study partner with dual learning modes, retrieval, PDF library tools and multi-agent workflows.","Marin_Evil_Sentinel"],
      ["SwordCLI","Node.js · MCP · LangGraph · Multi-provider LLMs","A terminal-first AI coding assistant with multi-provider routing, MCP integration, multi-agent teamwork and persistent sessions.","Sword-CLI"],
      ["Bengali Hallucination Detection","Bangla NLP · Transformers · Retrieval","A Bengali-language LLM faithfulness detection pipeline developed for a 2026 datathon challenge.","bengali_hallucination_detection_challange"],
      ["AI Debate Simulator","FastAPI · RAG · Multi-agent","A platform for synthetic character conversations, autonomous debates and research-oriented retrieval.","AI_Debate"],
      ["Unified LLM Proxy","OpenAI-compatible API · Provider routing","A single API surface for multiple LLM providers with fallback and key rotation.","proxy_llm"]
    ]},
    {id:"systems",number:"04",glyph:"⌘",title:"SYSTEMS & DEVELOPER TOOLS",short:"Operating systems, browsers and maker utilities.",color:"#f0bd75",count:"08 PROJECTS",description:"Tools and environments designed from the ground up: Linux desktop components, browsers, developer utilities, operating-system experiments and web platforms.",projects:[
      ["SwordFish Browser","C++ · Qt6 · WebEngine","A privacy-first desktop browser with integrated productivity tools, media utilities and cross-platform packaging.","SwordFish"],
      ["SwordWM / SwordDeck","C · X11 · C++ · Qt6","A tiling X11 window manager paired with a desktop overlay, file manager and browser components.","SwordWM"],
      ["SwordFM","C++20 · Qt6","A desktop file manager with cloud mounts, previews, keyboard navigation and companion file utilities.","SwordFM"],
      ["BHS Operating System","NASM · x86 BIOS · exFAT","A bootable x86 real-mode operating-system experiment with a two-stage bootloader and disk-image builder.","BHS-OS"],
      ["Toolforge","Vanilla JS · Node.js · Python","A browser-based collection of Python utilities with a zero-dependency Node server and Python execution bridge.","Tools"],
      ["AVR Control Plane","Python · AVR-GCC · avrdude","A web-based terminal for compiling and flashing AVR microcontrollers from a browser interface.","web_based_terminal"],
      ["Web Scraper Toolkit","Python · Browser automation · LLM","A scraping and browser-task toolkit with multiple extraction workflows and configurable LLM providers.","Web-Scrapper"],
      ["Web Cockpit","FastAPI · WebSockets · Linux","A remote Linux management console for terminal access, process and service management.","Web-Cockpit"]
    ]},
    {id:"creative",number:"05",glyph:"◈",title:"PRODUCTS & CREATIVE TECH",short:"Apps, media pipelines and human interfaces.",color:"#ff91b5",count:"05 PROJECTS",description:"Product experiments that combine software engineering with interfaces, media, interaction and personal computing.",projects:[
      ["CupCake","Android · Kotlin · llama.cpp · ESP32","An on-device AI companion concept combining local language models, voice, expressive UI and a physical ESP32 companion.","CupCake"],
      ["WidgetBoard","Flutter · WebSockets · Mobile widgets","A social app concept for friend-to-friend home-screen notes, voice and image chat, and multiplayer mini-games.","Widgetable"],
      ["YT-Flow","Python · Video processing · Automation","A video production and release workflow for editing, subtitles, AI-assisted review and scheduling.","YT-Flow"],
      ["Review Engine","Python · LangGraph · FFmpeg","An automated video workflow for transcription, highlight selection, rendering, review and release preparation.","review-engine"],
      ["Cyberdeck / Desktop HUD","Python · PySide6 · Linux","An animated desktop HUD with a mission graph, system telemetry, app launcher and audio visualization.","CyberPaper"]
    ]},
    {id:"research",number:"06",glyph:"⌬",title:"RESEARCH & DOCUMENTATION",short:"Experiments, learning logs and technical writing.",color:"#8ce0a5",count:"04 ARCHIVES",description:"The documentation layer: technical reports, learning roadmaps, competition work and the long-form record of the engineering journey.",projects:[
      ["The Journey Continues","Portfolio · Certifications · Project log","A curated record of projects, learning milestones, certificates and technical direction.","The-Journey-Continues"],
      ["Engineering Lab Reports","Mechatronics · Mechanical · Electrical","Technical reports, CAD studies, simulation artifacts and engineering documentation.","Lab_Reports"],
      ["Bengali Hallucination Detection","Datathon 2026 · Bengali NLP","Competition documentation and model pipeline for Bengali response faithfulness detection.","bengali_hallucination_detection_challange"],
      ["ROS 2 Learning","Robotics · Middleware · Navigation","A structured roadmap for ROS 2 fundamentals, robot integration and navigation.","ROS_Learning"]
    ]}
  ];

  const grid = document.getElementById("doorGrid");
  const overlay = document.getElementById("portalOverlay");
  const title = document.getElementById("portalTitle");
  const kicker = document.getElementById("portalKicker");
  const description = document.getElementById("portalDescription");
  const projects = document.getElementById("portalProjects");
  const toast = document.getElementById("toast");
  let lastFocus = null;
  let toastTimer;

  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderDoors(){
    grid.innerHTML = sectors.map((s) => `
      <button class="door-card" type="button" data-sector="${s.id}" style="--door-color:${s.color}" aria-haspopup="dialog">
        <span class="door-top"><span class="door-index">SECTOR / ${s.number}</span><span class="door-count">${s.count}</span></span>
        <span class="door-art"><span class="door-arch"><span class="door-glyph">${s.glyph}</span></span></span>
        <span class="door-copy"><h3>${s.title}</h3><p>${s.short}</p></span>
        <span class="door-bottom"><span class="door-open">OPEN PORTAL</span><span class="door-arrow">↗</span></span>
      </button>`).join("");
  }
  function openSector(id, trigger){
    const sector = sectors.find((s) => s.id === id);
    if (!sector) return;
    lastFocus = trigger || document.activeElement;
    kicker.textContent = `SECTOR / ${sector.number} — ${sector.count}`;
    title.textContent = sector.title;
    description.textContent = sector.description;
    projects.innerHTML = sector.projects.map(([name, stack, desc, repo]) => `
      <article class="project-card">
        <span class="project-type">${esc(stack)}</span>
        <h3>${esc(name)}</h3><p>${esc(desc)}</p>
        <a href="${GH + encodeURIComponent(repo)}" target="_blank" rel="noopener noreferrer">OPEN REPOSITORY ↗</a>
      </article>`).join("");
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    overlay.querySelector(".close-button").focus();
  }
  function closeSector(){
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }
  function showToast(message){
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  renderDoors();
  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-sector]");
    if (card) openSector(card.dataset.sector, card);
  });
  overlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-close]")) closeSector();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSector();
    if (event.key === "Tab" && !overlay.hidden) {
      const focusable = [...overlay.querySelectorAll('a[href],button:not([disabled])')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.getElementById("menuButton").addEventListener("click", () => {
    document.getElementById("connect").scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
    showToast("CONNECT PORTAL OPENED");
  });
})();