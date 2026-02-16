/* SecuriWise Training — interactions */

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const toast = $("#toast");
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove("show"), 2200);
}

/* Theme */
(function initTheme(){
  const saved = localStorage.getItem("sw_theme");
  if(saved) document.documentElement.setAttribute("data-theme", saved);

  $("#themeToggle")?.addEventListener("click", ()=>{
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sw_theme", next);
    showToast(`Theme: ${next}`);
  });
})();

/* Mobile nav */
(function nav(){
  const btn = $("#navToggle");
  const menu = $("#navMenu");
  if(!btn || !menu) return;

  btn.addEventListener("click", ()=>{
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Close on link click (mobile)
  $$(".nav__link", menu).forEach(a=>{
    a.addEventListener("click", ()=>{
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });

  // Close on outside click
  document.addEventListener("click", (e)=>{
    if(!menu.classList.contains("open")) return;
    const inMenu = menu.contains(e.target) || btn.contains(e.target);
    if(!inMenu){
      menu.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();

/* Reveal on scroll */
(function reveal(){
  const items = $$(".reveal");
  if(!("IntersectionObserver" in window)){
    items.forEach(i=>i.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add("in");
        io.unobserve(en.target);
      }
    });
  }, {threshold: .12});
  items.forEach(i=>io.observe(i));
})();

/* Copy-to-clipboard */
(function copy(){
  $("[data-copy]") && document.addEventListener("click", async (e)=>{
    const btn = e.target.closest("[data-copy]");
    if(!btn) return;
    const val = btn.getAttribute("data-copy");
    try{
      await navigator.clipboard.writeText(val);
      showToast(`Copied: ${val}`);
    }catch{
      showToast("Copy not supported on this browser");
    }
  });
})();

/* Smooth scroll offset for sticky header */
(function smoothOffset(){
  // native smooth scroll is on; we just adjust when clicking hashes
  document.addEventListener("click", (e)=>{
    const a = e.target.closest("a[href^='#']");
    if(!a) return;
    const id = a.getAttribute("href");
    if(!id || id === "#") return;
    const el = $(id);
    if(!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({top: y, behavior:"smooth"});
    history.pushState(null, "", id);
  });
})();

/* Scroll progress bar */
(function progress(){
  const bar = $(".scroll-progress span");
  const onScroll = ()=>{
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = `${pct}%`;
  };
  addEventListener("scroll", onScroll, {passive:true});
  onScroll();
})();

/* Count-up stats */
(function countUp(){
  const nums = $$(".trust__num[data-count]");
  const run = (el)=>{
    const end = parseInt(el.getAttribute("data-count"), 10) || 0;
    const start = 0;
    const dur = 900;
    const t0 = performance.now();
    const tick = (t)=>{
      const p = Math.min(1, (t - t0)/dur);
      const val = Math.floor(start + (end - start) * (0.1 + 0.9*p));
      el.textContent = val;
      if(p < 1) requestAnimationFrame(tick);
      else el.textContent = end;
    };
    requestAnimationFrame(tick);
  };

  if(!("IntersectionObserver" in window)){
    nums.forEach(run);
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        run(en.target);
        io.unobserve(en.target);
      }
    });
  }, {threshold:.6});
  nums.forEach(n=>io.observe(n));
})();

/* Course filter chips (affects both course & CPD sections visually) */
(function filters(){
  const chips = $$(".path__chips .chip");
  const courses = $$("#courseGrid .card");
  const cpd = $$("#cpdGrid .card");

  function apply(tag){
    // Set active chip
    chips.forEach(c=>c.classList.toggle("chip--active", c.dataset.filter === tag));

    // courses: show all unless tag matches
    courses.forEach(card=>{
      const tags = card.getAttribute("data-tags") || "";
      const show = tag === "all" ? true : tags.includes(tag);
      card.style.display = show ? "" : "none";
    });

    // CPD is its own category; only show when tag is all or cpd
    cpd.forEach(card=>{
      const show = (tag === "all" || tag === "cpd");
      card.style.display = show ? "" : "none";
    });

    // Nudge scroll to relevant section when filtering
    if(tag === "cpd"){
      document.querySelector("#elearning")?.scrollIntoView({behavior:"smooth", block:"start"});
    }else{
      document.querySelector("#courses")?.scrollIntoView({behavior:"smooth", block:"start"});
    }
  }

  chips.forEach(ch=>{
    ch.addEventListener("click", ()=>apply(ch.dataset.filter));
  });
})();

/* CPD search + tag filtering */
(function cpdSearch(){
  const input = $("#cpdSearch");
  const tagChips = $$(".tagRow .chip");
  const cards = $$("#cpdGrid .card");
  let active = "all";

  function apply(){
    const q = (input.value || "").trim().toLowerCase();
    cards.forEach(card=>{
      const tags = (card.getAttribute("data-cpd-tags") || "").toLowerCase();
      const text = card.innerText.toLowerCase();
      const okTag = active === "all" ? true : tags.includes(active);
      const okQ = !q ? true : text.includes(q);
      card.style.display = (okTag && okQ) ? "" : "none";
    });
  }

  tagChips.forEach(ch=>{
    ch.addEventListener("click", ()=>{
      active = ch.dataset.cpd;
      tagChips.forEach(c=>c.classList.toggle("chip--active", c === ch));
      apply();
    });
  });

  input?.addEventListener("input", apply);
})();

/* Coverage checker (simple: checks CB24 or PE29 prefix) */
(function checker(){
  const inp = $("#postcode");
  const btn = $("#checkBtn");
  const out = $("#checkOut");

  function norm(v){ return (v||"").toUpperCase().replace(/\s+/g,"").trim(); }

  function check(){
    const v = norm(inp.value);
    if(!v){ out.textContent = "Enter a postcode to check."; return; }
    const ok = v.startsWith("CB24") || v.startsWith("PE29");
    out.textContent = ok
      ? "✅ Yes — that’s within our stated coverage areas."
      : "ℹ️ Outside listed areas — still enquire, we may be able to help.";
  }

  btn?.addEventListener("click", check);
  inp?.addEventListener("keydown", (e)=>{ if(e.key === "Enter"){ e.preventDefault(); check(); }});
})();

/* Modal content */
(function modal(){
  const dialog = $("#modal");
  const title = $("#modalTitle");
  const body = $("#modalBody");
  const cta = $("#modalCta");

  const content = {
    "l2": {
      title: "Level 2 First Aid",
      bullets: [
        "Life-saving actions and prioritising response",
        "Managing common workplace incidents",
        "Practical scenarios to build confidence",
        "Clear notes and escalation basics"
      ],
      cta: "Enquire about Level 2"
    },
    "l3": {
      title: "Level 3 First Aid",
      bullets: [
        "Deeper incident response and decision-making",
        "Scenario-led practical elements",
        "Leadership and communication under pressure",
        "Reviewing risk and prevention basics"
      ],
      cta: "Enquire about Level 3"
    },
    "act-awareness": {
      title: "ACT Awareness",
      bullets: [
        "Situational awareness fundamentals",
        "Recognise suspicious behaviour and indicators",
        "Respond and report pathways in a clear structure",
        "Personal safety and communication"
      ],
      cta: "Enquire about ACT Awareness"
    },
    "act-security": {
      title: "ACT Security",
      bullets: [
        "Security-role responsibilities and procedures",
        "Threat response principles and coordination",
        "Communications, escalation and post-incident actions",
        "Scenario thinking and professional judgement"
      ],
      cta: "Enquire about ACT Security"
    },
    "cpd-lone": {
      title: "CPD: Lone Working",
      bullets: [
        "Risk awareness and common hazards",
        "Pre-planning and check-in routines",
        "Decision-making and escalation",
        "Personal safety and reporting"
      ],
      cta: "Request access"
    },
    "cpd-ethics": {
      title: "CPD: Security Operative Ethics at Workplace",
      bullets: [
        "Professional boundaries and conduct",
        "Integrity, accountability and decision-making",
        "Confidentiality and respectful communication",
        "Practical examples and reflection prompts"
      ],
      cta: "Request access"
    },
    "cpd-conflict": {
      title: "CPD: Conflict Management Refresher",
      bullets: [
        "Communication skills refresh",
        "De-escalation techniques",
        "Professional presence and safety",
        "What to do when things escalate"
      ],
      cta: "Request access"
    },
    "cpd-safeguarding": {
      title: "CPD: Safeguarding & Duty of Care",
      bullets: [
        "Recognising safeguarding concerns",
        "Appropriate actions and reporting",
        "Professional boundaries and care",
        "Practical workplace examples"
      ],
      cta: "Request access"
    },
    "cpd-reporting": {
      title: "CPD: Incident Reporting & Evidence Handling",
      bullets: [
        "Writing clear, factual notes",
        "Evidence handling basics and continuity thinking",
        "Professional reporting structure",
        "Common pitfalls and how to avoid them"
      ],
      cta: "Request access"
    }
  };

  function open(key){
    const item = content[key];
    if(!item) return;
    title.textContent = item.title;
    body.innerHTML = `<p>Overview:</p><ul>${item.bullets.map(b=>`<li>${b}</li>`).join("")}</ul>`;
    cta.textContent = item.cta;
    cta.setAttribute("href", "#contact");
    dialog?.showModal();
  }

  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-open]");
    if(!btn) return;
    open(btn.getAttribute("data-open"));
  });

  // close when clicking backdrop
  dialog?.addEventListener("click", (e)=>{
    const rect = dialog.getBoundingClientRect();
    const inBox = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
    if(!inBox) dialog.close();
  });
})();

/* Forms -> mailto draft */
function openMailDraft({name, email, phone, topic, interest, message}){
  const to = "info@securiwisetraining.co.uk";
  const subject = `Enquiry — ${topic || interest || "Training"} (${name || "No name"})`;
  const lines = [
    `Name: ${name || ""}`,
    `Email: ${email || ""}`,
    phone ? `Phone: ${phone}` : "",
    "",
    `Interest: ${topic || interest || ""}`,
    "",
    "Message:",
    message || ""
  ].filter(Boolean);

  const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  window.location.href = href;
}

(function forms(){
  $("#quickForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    openMailDraft({
      name: fd.get("name"),
      email: fd.get("email"),
      topic: fd.get("topic"),
      message: fd.get("message")
    });
  });

  $("#contactForm")?.addEventListener("submit", (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    openMailDraft({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      interest: fd.get("interest"),
      message: fd.get("message")
    });
  });
})();

/* Call-back helper button */
(function callback(){
  $("#callBtn")?.addEventListener("click", ()=>{
    const msg = "If you’d like a call-back, please include your best contact number and preferred times in the message box.";
    showToast("Tip: add your call-back times in the message.");
    // jump to message field
    const area = $("#contactForm textarea[name='message']");
    area?.focus();
    area?.setSelectionRange(area.value.length, area.value.length);
  });
})();

/* Footer year */
$("#year").textContent = new Date().getFullYear();
