
document.addEventListener("DOMContentLoaded",()=>{
  const m=document.querySelector(".menu-btn"), n=document.querySelector(".nav");
  if(m&&n) m.addEventListener("click",()=>n.classList.toggle("open"));
  document.querySelectorAll(".acc-btn").forEach(b=>b.addEventListener("click",()=>{
    b.closest(".acc-item").classList.toggle("open");
  }));
  const form=document.querySelector("#contactForm");
  if(form){
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      const box=document.querySelector("#formStatus");
      box.textContent="Your enquiry has been prepared. This static website package does not yet have a mail server connected. Please call 020 8965 0955 to submit your enquiry, or connect the form to your preferred email/form service.";
      box.style.display="block";
    });
  }
  document.querySelectorAll("[data-year]").forEach(el=>el.textContent=new Date().getFullYear());
});
