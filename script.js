/* MOG MEDIAZ — navigation, local booking list, and email notifications */
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // Owner authentication is handled by secure Vercel serverless endpoints.
  // No secrets or authentication credentials are stored in this public file.
  const roleScreen = document.getElementById("mog-role-screen");
  const ownerLogin = document.getElementById("mog-owner-login");
  const ownerDenied = document.getElementById("mog-owner-denied");
  const ownerChoice = document.getElementById("mog-owner-choice");
  const visitorChoice = document.getElementById("mog-visitor-choice");
  const ownerLoginBack = document.getElementById("mog-owner-login-back");
  const deniedBack = document.getElementById("mog-denied-back");
  const ownerLoginForm = document.getElementById("mog-owner-login-form");
  const ownerLoginStatus = document.getElementById("mog-owner-login-status");
  const ownerLoginSubmit = document.getElementById("mog-owner-login-submit");
  const ownerEmailInput = document.getElementById("mog-owner-email");
  const ownerOtpInput = document.getElementById("mog-owner-otp");
  const ownerOtpStage = document.getElementById("mog-owner-otp-stage");
  const resendOtpButton = document.getElementById("mog-owner-resend-code");
  const adminOnlyControls = document.querySelectorAll("[data-admin-only]");
  let otpRequested = false;

  adminOnlyControls.forEach(function (element) { element.hidden = true; });
  function setLoginStatus(message, success) {
    if (!ownerLoginStatus) return;
    ownerLoginStatus.textContent = message || "";
    ownerLoginStatus.className = "mog-owner-login-status" + (success ? " success" : "");
  }
  function showRoleScreen() {
    if (ownerLogin) ownerLogin.hidden = true;
    if (ownerDenied) ownerDenied.hidden = true;
    if (roleScreen) roleScreen.hidden = false;
  }
  function showDenied() {
    if (ownerLogin) ownerLogin.hidden = true;
    if (ownerDenied) ownerDenied.hidden = false;
  }
  function revealOwnerWebsite() {
    if (roleScreen) roleScreen.hidden = true;
    if (ownerLogin) ownerLogin.hidden = true;
    if (ownerDenied) ownerDenied.hidden = true;
    adminOnlyControls.forEach(function (element) { element.hidden = false; });
  }
  function revealVisitorWebsite() {
    if (roleScreen) roleScreen.hidden = true;
    if (ownerLogin) ownerLogin.hidden = true;
    if (ownerDenied) ownerDenied.hidden = true;
    adminOnlyControls.forEach(function (element) { element.hidden = true; });
  }
  async function checkOwnerSession() {
    try {
      const response = await fetch("/api/auth/session", { method: "GET", credentials: "same-origin", cache: "no-store" });
      const result = await response.json();
      return response.ok && result && result.authenticated === true;
    } catch (_) { return false; }
  }
  async function requestOwnerCode() {
    const email = String(ownerEmailInput && ownerEmailInput.value || "").trim();
    if (!email) { setLoginStatus("Enter your owner email address."); return false; }
    const response = await fetch("/api/auth/request-otp", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 403) { showDenied(); return false; }
      throw new Error(result.message || "The authentication code could not be sent. Please try again.");
    }
    otpRequested = true;
    if (ownerOtpStage) ownerOtpStage.hidden = false;
    if (ownerOtpInput) { ownerOtpInput.required = true; ownerOtpInput.focus(); }
    if (ownerEmailInput) ownerEmailInput.readOnly = true;
    if (ownerLoginSubmit) ownerLoginSubmit.textContent = "VERIFY CODE & SIGN IN";
    if (resendOtpButton) resendOtpButton.hidden = false;
    setLoginStatus("A 6-digit authentication code has been sent to the authorised owner email. It expires in 5 minutes.", true);
    return true;
  }
  async function verifyOwnerCode() {
    const email = String(ownerEmailInput && ownerEmailInput.value || "").trim();
    const otp = String(ownerOtpInput && ownerOtpInput.value || "").trim();
    if (!/^[0-9]{6}$/.test(otp)) { setLoginStatus("Enter the 6-digit code sent to your email."); return; }
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, otp: otp })
    });
    const result = await response.json().catch(function () { return {}; });
    if (!response.ok) {
      if (response.status === 403) { showDenied(); return; }
      throw new Error(result.message || "The code is invalid or has expired. Request a new code.");
    }
    setLoginStatus("Owner verified. Opening the website...", true);
    revealOwnerWebsite();
  }
  function resetOtpForm() {
    otpRequested = false;
    if (ownerLoginForm) ownerLoginForm.reset();
    if (ownerOtpStage) ownerOtpStage.hidden = true;
    if (ownerOtpInput) ownerOtpInput.required = false;
    if (ownerEmailInput) ownerEmailInput.readOnly = false;
    if (ownerLoginSubmit) ownerLoginSubmit.textContent = "SEND AUTHENTICATION CODE";
    if (resendOtpButton) resendOtpButton.hidden = true;
    setLoginStatus("");
  }
  if (visitorChoice) visitorChoice.addEventListener("click", revealVisitorWebsite);
  if (ownerChoice) ownerChoice.addEventListener("click", async function () {
    if (await checkOwnerSession()) { revealOwnerWebsite(); return; }
    if (roleScreen) roleScreen.hidden = true;
    if (ownerLogin) ownerLogin.hidden = false;
    resetOtpForm();
  });
  if (ownerLoginBack) ownerLoginBack.addEventListener("click", function () { resetOtpForm(); showRoleScreen(); });
  if (deniedBack) deniedBack.addEventListener("click", showRoleScreen);
  if (resendOtpButton) resendOtpButton.addEventListener("click", async function () {
    resendOtpButton.disabled = true;
    try { await requestOwnerCode(); } catch (error) { setLoginStatus(error.message); }
    finally { resendOtpButton.disabled = false; }
  });
  if (ownerLoginForm) ownerLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!ownerLoginSubmit) return;
    ownerLoginSubmit.disabled = true;
    ownerLoginSubmit.textContent = otpRequested ? "VERIFYING..." : "SENDING CODE...";
    setLoginStatus("");
    try {
      if (otpRequested) await verifyOwnerCode();
      else await requestOwnerCode();
    } catch (error) {
      setLoginStatus(error && error.message ? error.message : "Authentication failed. Please try again.");
    } finally {
      ownerLoginSubmit.disabled = false;
      if (ownerLoginSubmit.textContent === "VERIFYING..." || ownerLoginSubmit.textContent === "SENDING CODE...") {
        ownerLoginSubmit.textContent = otpRequested ? "VERIFY CODE & SIGN IN" : "SEND AUTHENTICATION CODE";
      }
    }
  });

  // Restore owner-only controls only when the server validates the HttpOnly session cookie.
  checkOwnerSession().then(function (authenticated) {
    if (authenticated) revealOwnerWebsite();
  });

  const menuButton = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-links");
  const navItems = document.querySelectorAll(".nav-link");
  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");
  const year = document.getElementById("year");
  const backToTop = document.querySelector(".back-top");
  if (backToTop) {
    backToTop.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  const cartButton = document.getElementById("cart-button");
  const cartDialog = document.getElementById("booking-cart");
  const cartClose = document.getElementById("cart-close");
  const cartItems = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const clearBookingsButton = document.getElementById("clear-bookings");
  const cartBookLink = document.getElementById("cart-book-link");
  const STORAGE_KEY = "mogMediazBookings";
  // Formspree endpoint connected to the owner's verified email account.
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/mdeeylla";
  const serviceCategory = document.getElementById("service-category");
  const ratePicker = document.getElementById("rate-card-picker");
  const selectedWrap = document.getElementById("selected-services-wrap");
  const selectedList = document.getElementById("selected-services-list");
  const selectedTotal = document.getElementById("selected-total");
  const serviceInput = document.getElementById("service");
  const selectedServices = new Map();
  const rateGroups = {
    "Videography": [
      ["BASIC PACKAGE", [ ["2 Hours Coverage",45000], ["0–5 Content shoot",15000] ]],
      ["STANDARD PACKAGE", [ ["Half Day Coverage (6 hrs)",85000], ["Promo Video Shoot",75000] ]],
      ["PREMIUM PACKAGE", [ ["Full Day Coverage",150000], ["Social Media Content Shoot",90000] ]]
    ],
    "Photography": [
      ["BASIC PACKAGE", [["2 Hours Shoot",40000],["10 Edited Photos",25000]]],
      ["STANDARD PACKAGE", [["Half Day Coverage",70000],["Studio/Outdoor Session",95000]]],
      ["PREMIUM PACKAGE", [["Full Day Coverage",130000],["Corporate Portrait Session",65000]]]
    ],
    "Video Editing": [
      ["BASIC PACKAGE", [["Short Video (0–5 mins)",15000]]],
      ["STANDARD PACKAGE", [["YouTube Video",40000],["Event Highlight (0–5 mins)",55000]]],
      ["PREMIUM PACKAGE", [["Advanced Editing (from)",65000],["Documentary / Wedding Film",85000]]]
    ],
    "Graphics": [
      ["BASIC PACKAGE", [["Single Flyer",5000],["YouTube Thumbnail",7000]]],
      ["STANDARD PACKAGE", [["3 Flyers",30000],["Logo Design",15000]]],
      ["PREMIUM PACKAGE", [["Brand Identity Kit",90000],["5 Social Media Designs",45000]]]
    ],
    "Form Creations": [["DIGITAL DOCUMENTS", [["Google Forms / Cognito Forms / Slides / Presentations",10000]]]],
    "Ceremony": [
      ["WEDDING & MARRIAGE — BASIC (CAMERA PHOTOGRAPHY + PHONE VIDEOGRAPHY)", [
        ["Marriage & Wedding Basic — camera photography + phone videography",250000]
      ]],
      ["BURIAL — BASIC (CAMERA PHOTOGRAPHY + PHONE VIDEOGRAPHY)", [
        ["Burial Basic — camera photography + phone videography",200000]
      ]],
      ["WEDDING & MARRIAGE — PREMIUM (2 CAMERAS FOR PHOTOGRAPHY & VIDEOGRAPHY)", [

        ["Marriage & Wedding Premium — 2 cameras for photography and videography",350000]
      ]],
      ["BURIAL — PREMIUM (2 CAMERAS FOR PHOTOGRAPHY & VIDEOGRAPHY)", [
        ["Burial Premium — 2 cameras for photography and videography",250000]
      ]]
    ],
    "Combo Deals": [["COMBO DEALS", [["Content Creator Pack — 1 shoot day + 10 reels + photos",160000],["Wedding Premium — full photo + full video + highlight film",280000],["Church Monthly Media — 4 services coverage + weekly designs",250000]]]],
    "Monthly Content": [["BUSINESS OWNERS — MONTHLY CONTENT", [["Starter Monthly — (Weekly) 1 shoot day, 8 reels, 10 product photos, 4 graphics",180000,],["Growth Monthly — (Weekly) 2 shoot days, 16 reels, 20 product photos, 8 graphics, 1 promo ad",250000],["Premium Monthly — (Weekly) 4 shoot days, 30 reels, 40 product photos, 12 graphics, 2 ads, priority delivery",350000]]]],
    "Contracts": [["CONTRACT RATE CARD", [["3 Month Contract — (Weekly) 1 shoot day/month, 12 reels + 8 graphics/month",500000],["6 Month Contract — (Weekly) 1 shoot day/month, 16 reels + 12 graphics/month + monthly promo video",950000],["9 Month Contract — (Weekly) 2 shoot days/month, 20 reels + 16 graphics/month, priority delivery",1350000],["12 Month Contract — (Weekly) 2 shoot days/month, 25 reels + 20 graphics/month, 2 promo videos/month + one free event coverage",1700000]]]]
  };
  const money = function (amount) {
    return "₦" + Number(amount).toLocaleString("en-NG");
  };
  function renderSelectedServices() {
    if (!selectedList || !selectedWrap || !selectedTotal || !serviceInput) return;
    selectedList.replaceChildren();
    let total = 0;
    selectedServices.forEach(function (item, key) {
      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = item.name + " — " + money(item.price) + (item.from ? "+" : "");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "selected-remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove " + item.name);
      remove.addEventListener("click", function () {
        selectedServices.delete(key);
        const checkbox = ratePicker && ratePicker.querySelector('input[data-service-key="' + CSS.escape(key) + '"]');
        if (checkbox) checkbox.checked = false;
        renderSelectedServices();
      });
      li.append(label, remove);
      selectedList.appendChild(li);
      total += item.price;
    });
    selectedWrap.hidden = selectedServices.size === 0;
    selectedTotal.textContent = money(total);
    serviceInput.value = Array.from(selectedServices.values()).map(function (item) {
      return item.name + " (" + money(item.price) + (item.from ? "+" : "") + ")";
    }).join("; ");
  }
  function renderRateCards() {
    if (!serviceCategory || !ratePicker) return;
    ratePicker.replaceChildren();
    const category = serviceCategory.value;
    if (!category || !rateGroups[category]) {
      const empty = document.createElement("p");
      empty.className = "rate-card-empty";
      empty.textContent = "Choose a service category to view available services and rates.";
      ratePicker.appendChild(empty);
      return;
    }
    const intro = document.createElement("p");
    intro.className = "rate-card-help";
    intro.textContent = "Select one or more services below. You can switch categories and your selections will be kept.";
    ratePicker.appendChild(intro);
    rateGroups[category].forEach(function (group) {
      const section = document.createElement("section");
      section.className = "rate-group";
      const heading = document.createElement("h4");
      heading.textContent = group[0];
      section.appendChild(heading);
      const list = document.createElement("div");
      list.className = "rate-options";
      group[1].forEach(function (service, index) {
        const name = service[0];
        const price = service[1];
        const from = name.toLowerCase().includes("from");
        const key = category + "::" + group[0] + "::" + name;
        const label = document.createElement("label");
        label.className = "rate-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedServices.has(key);
        checkbox.dataset.serviceKey = key;
        checkbox.addEventListener("change", function () {
          if (checkbox.checked) selectedServices.set(key, { name: category + " / " + name, price: price, from: from });
          else selectedServices.delete(key);
          renderSelectedServices();
        });
        const text = document.createElement("span");
        text.className = "rate-option-name";
        text.textContent = name;
        const cost = document.createElement("strong");
        cost.className = "rate-option-price";
        cost.textContent = money(price) + (from ? "+" : "");
        label.append(checkbox, text, cost);
        list.appendChild(label);
      });
      section.appendChild(list);
      ratePicker.appendChild(section);
    });
  }
  if (serviceCategory) serviceCategory.addEventListener("change", renderRateCards);

  if (year) year.textContent = String(new Date().getFullYear());

  function closeMenu() {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation menu");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  }

  // Standard single-page navigation: sections remain in normal document flow.
  // Clicking a navigation link scrolls to its section; users can continue scrolling
  // naturally through the sections above and below it.
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const opening = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(opening));
      menuButton.setAttribute("aria-label", opening ? "Close navigation menu" : "Open navigation menu");
      nav.classList.toggle("open", opening);
      document.body.classList.toggle("menu-open", opening);
    });

    navItems.forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu();
        // Do not prevent the browser's normal #section anchor navigation.
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  // All booking links use normal anchor navigation to the booking section.
  document.querySelectorAll('a[href="#book-us"]:not(#cart-book-link)').forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
      // Keep the default anchor behaviour; the full page remains scrollable.
    });
  });

  // Keep the active navigation item in sync with the section currently in view.
  if ("IntersectionObserver" in window && navItems.length) {
    const sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navItems.forEach(function (link) {
          const target = link.dataset.section || link.getAttribute("href").replace("#", "");
          link.classList.toggle("active", target === entry.target.id);
        });
      });
    }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  // Keep an in-memory fallback so the cart still works if browser storage is blocked.
  let memoryBookings = [];
  function readBookings() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(stored)) {
        memoryBookings = stored;
        return stored;
      }
    } catch (error) {
      // Fall back to the current page's in-memory booking list.
    }
    return memoryBookings;
  }

  function writeBookings(bookings) {
    memoryBookings = Array.isArray(bookings) ? bookings : [];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryBookings));
    } catch (error) {
      // The booking remains available in the cart until this page is closed.
    }
    return true;
  }

  // Show the requested confirmation only after the booking is saved and the email is accepted.
  function showBookingSuccessPopup() {
    const popup = document.createElement("div");
    popup.textContent = "Your Order has been successfully booked";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");
    popup.style.cssText = [
      "position:fixed",
      "top:24px",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:99999",
      "background:#198754",
      "color:#ffffff",
      "padding:16px 24px",
      "border-radius:8px",
      "box-shadow:0 8px 24px rgba(0,0,0,.22)",
      "font-weight:700",
      "font-size:15px",
      "text-align:center",
      "max-width:calc(100% - 32px)",
      "width:max-content"
    ].join(";");
    document.body.appendChild(popup);
    window.setTimeout(function () {
      popup.style.transition = "opacity .3s ease, transform .3s ease";
      popup.style.opacity = "0";
      popup.style.transform = "translate(-50%, -10px)";
      window.setTimeout(function () { popup.remove(); }, 350);
    }, 3500);
  }

  function renderBookings() {
    if (!cartItems || !cartCount) return;
    const bookings = readBookings();
    cartCount.textContent = String(bookings.length);
    cartItems.replaceChildren();

    if (!bookings.length) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "You haven't made a booking on this device yet.";
      cartItems.appendChild(empty);
      return;
    }

    bookings.slice().reverse().forEach(function (booking) {
      const card = document.createElement("article");
      card.className = "cart-item";

      const top = document.createElement("div");
      top.className = "cart-item-top";
      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = booking.service || "Project inquiry";
      const date = document.createElement("time");
      date.textContent = "Submitted " + new Date(booking.createdAt).toLocaleString();
      titleWrap.append(title, date);

      const remove = document.createElement("button");
      remove.className = "cart-remove";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove booking for " + (booking.service || "project"));
      remove.addEventListener("click", function () {
        writeBookings(readBookings().filter(function (item) { return item.id !== booking.id; }));
        renderBookings();
      });
      top.append(titleWrap, remove);

      const details = document.createElement("p");
      details.textContent = booking.name + " · " + booking.clientType + "\n" +
        booking.email + "\nPhone / WhatsApp: " + (booking.phone || "Not provided") +
        "\nPreferred date: " + (booking.date || "Not specified") + "\n" + booking.message;
      card.append(top, details);
      cartItems.appendChild(card);
    });
  }

  if (cartButton && cartDialog) {
    cartButton.addEventListener("click", function () {
      renderBookings();
      if (typeof cartDialog.showModal === "function") cartDialog.showModal();
      else cartDialog.setAttribute("open", "");
    });
  }

  if (cartClose && cartDialog) {
    cartClose.addEventListener("click", function () {
      if (typeof cartDialog.close === "function") cartDialog.close();
      else cartDialog.removeAttribute("open");
    });
  }

  if (cartDialog) {
    cartDialog.addEventListener("click", function (event) {
      if (event.target === cartDialog && typeof cartDialog.close === "function") cartDialog.close();
    });
  }

  if (clearBookingsButton) {
    clearBookingsButton.addEventListener("click", function () {
      writeBookings([]);
      renderBookings();
    });
  }

  if (cartBookLink && cartDialog) {
    cartBookLink.addEventListener("click", function () {
      if (typeof cartDialog.close === "function") cartDialog.close();
      else cartDialog.removeAttribute("open");
    });
  }

  renderBookings();

  if (form && status) {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      if (!form.checkValidity()) {
        form.reportValidity();
        status.classList.add("error");
        status.textContent = "Please complete all required fields using valid information.";
        return;
      }
      if (!selectedServices.size) {
        status.classList.add("error");
        status.textContent = "Please choose at least one priced service before preparing your inquiry.";
        if (serviceCategory) serviceCategory.focus();
        return;
      }

      const data = new FormData(form);
      const booking = {
        id: (window.crypto && typeof window.crypto.randomUUID === "function")
          ? window.crypto.randomUUID()
          : String(Date.now()) + "-" + Math.random().toString(16).slice(2),
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        clientType: String(data.get("clientType") || "").trim(),
        service: String(data.get("service") || "").trim(),
        date: String(data.get("date") || "").trim(),
        message: String(data.get("message") || "").trim() + "\n\nSelected services: " + (serviceInput.value || "None") + "\nEstimated service total: " + (selectedTotal ? selectedTotal.textContent : "Not calculated"),
        createdAt: new Date().toISOString()
      };

      const submitButton = form.querySelector('button[type="submit"]');
      let bookingConfirmed = false;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending inquiry...";
      }

      const payload = new FormData();
      payload.append("name", booking.name);
      payload.append("email", booking.email);
      payload.append("_replyto", booking.email);
      payload.append("phone_whatsapp", booking.phone);
      payload.append("client_type", booking.clientType);
      payload.append("service", booking.service);
      payload.append("service_category", String(data.get("serviceCategory") || "").trim());
      payload.append("estimated_total", selectedTotal ? selectedTotal.textContent : "Not calculated");
      payload.append("preferred_date", booking.date || "Not specified");
      payload.append("message", booking.message);
      payload.append("_subject", "New MOG MEDIAZ booking — " + booking.service);
      payload.append("_template", "table");

      // Save the booking first so it is not lost if the email provider is offline or
      // its recipient activation has not yet been completed.
      const bookings = readBookings();
      bookings.push(booking);
      const saved = writeBookings(bookings);
      renderBookings();

      // As soon as the booking is safely added to My Bookings, stop showing
      // the loading label and display the requested confirmation. The email
      // notification continues separately and its result is reported below.
      if (saved) {
        if (submitButton) submitButton.textContent = "Book Now";
        showBookingSuccessPopup();
      }

      try {
        const response = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          body: payload,
          headers: { "Accept": "application/json" }
        });
        const responseText = await response.text();
        let result = null;
        if (responseText) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            // Some form backends return a plain-text confirmation. HTTP success still
            // indicates the POST was accepted; do not treat HTML/text as JSON failure.
            result = { message: responseText };
          }
        }
        if (!response.ok || (result && result.ok === false)) {
          const providerMessage = result && (result.errors || result.error || result.message);
          const readableMessage = Array.isArray(providerMessage)
            ? providerMessage.map(function (item) { return item.message || String(item); }).join(" ")
            : (providerMessage && typeof providerMessage === "object" ? JSON.stringify(providerMessage) : providerMessage);
          throw new Error(readableMessage || "Formspree did not accept the booking. Please check the form details and try again.");
        }

        status.classList.add("success");
        status.textContent = "Your booking has been saved in My Bookings and has been recieved. MOG MEDIAZ will contact you using the details provided.";
        form.reset();
        selectedServices.clear();
        renderSelectedServices();
        renderRateCards();
      } catch (error) {
        status.classList.add(saved ? "success" : "error");
        status.textContent = (saved ? "Your booking has been saved in My Bookings, but the email notification was not confirmed. " : "Your browser could not save the booking locally. ") +
          (error && error.message ? error.message : "Please check your connection and try again.");
        if (saved) {
          form.reset();
          selectedServices.clear();
          renderSelectedServices();
          renderRateCards();
        }
      } finally {
        // Always finish the loading state after the email request settles.
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Book Now";
        }
      }
    });
  }

  // Cinematic scroll-in effects for existing sections and cards.
  // This does not alter booking, navigation, or cart behavior.
  try {
    const prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionTargets = document.querySelectorAll(
      ".section-heading, .intro-copy, .intro-image, .visual-frame, .ceo-visual, " +
      ".service-card, .review-card, .contact-item, .booking-copy, .booking-form, " +
      ".contact-details, .hero-bottom"
    );

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      motionTargets.forEach(function (element) {
        element.classList.add("is-visible");
      });
    } else {
      const motionObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

      motionTargets.forEach(function (element, index) {
        element.classList.add("motion-reveal");
        if (element.matches(".visual-frame, .intro-image, .ceo-visual")) {
          element.classList.add("motion-zoom");
        } else if (index % 3 === 1) {
          element.classList.add("motion-from-right");
        } else if (index % 3 === 2) {
          element.style.setProperty("--motion-delay", "85ms");
        } else {
          element.classList.add("motion-from-left");
        }
        motionObserver.observe(element);
      });
    }
  } catch (motionError) {
    document.querySelectorAll(".motion-reveal").forEach(function (element) {
      element.classList.add("is-visible");
    });
  }


  // Event portfolio: gallery filters, media preview, and local-only upload manager.
  // Production-wide uploads and email broadcasts need a secured backend/API.
  (function initMogPortfolio() {
    const grid = document.getElementById("mog-gallery-grid");
    const filters = document.querySelectorAll(".mog-filter");
    const adminDialog = document.getElementById("mog-admin-dialog");
    const openAdmin = document.getElementById("mog-admin-open");
    const closeAdmin = document.getElementById("mog-admin-close");
    const uploadForm = document.getElementById("mog-upload-form");
    const uploadStatus = document.getElementById("mog-upload-status");
    const lightbox = document.getElementById("mog-lightbox");
    const lightboxContent = document.getElementById("mog-lightbox-content");
    const lightboxClose = document.getElementById("mog-lightbox-close");
    const emptyState = document.getElementById("mog-gallery-empty");
    const DB_NAME = "mogMediazPortfolio";
    const STORE_NAME = "projects";
    let activeFilter = "all";
    let db = null;

    function openDialog(dialog) {
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
      else if (dialog) dialog.setAttribute("open", "");
    }
    function closeDialog(dialog) {
      if (dialog && typeof dialog.close === "function") dialog.close();
      else if (dialog) dialog.removeAttribute("open");
    }
    function openDatabase() {
      return new Promise(function(resolve, reject) {
        if (!("indexedDB" in window)) return reject(new Error("This browser does not support local project storage."));
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = function() {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: "id" });
        };
        request.onsuccess = function() { db = request.result; resolve(db); };
        request.onerror = function() { reject(request.error || new Error("Could not open local project storage.")); };
      });
    }
    function storeProject(project) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(project);
        tx.oncomplete = resolve;
        tx.onerror = function() { reject(tx.error || new Error("Could not save this project.")); };
      });
    }
    function getProjects() {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = function() { resolve(request.result || []); };
        request.onerror = function() { reject(request.error); };
      });
    }
    function makeCard(project) {
      const card = document.createElement("article");
      card.className = "mog-project-card";
      card.dataset.category = project.category;
      const mediaButton = document.createElement("button");
      mediaButton.type = "button";
      mediaButton.className = "mog-project-media";
      mediaButton.setAttribute("aria-label", "Preview " + project.title);
      const media = project.mediaType === "video" ? document.createElement("video") : document.createElement("img");
      media.src = project.mediaUrl;
      if (media.tagName === "VIDEO") { media.muted = true; media.playsInline = true; }
      else { media.alt = project.title; media.loading = "lazy"; }
      const badge = document.createElement("span");
      badge.className = "mog-media-badge";
      badge.textContent = project.mediaType === "video" ? "VIDEO" : "PHOTO";
      const view = document.createElement("span");
      view.className = "mog-project-view";
      view.textContent = "View project ↗";
      mediaButton.append(media, badge, view);
      mediaButton.addEventListener("click", function() { showPreview(project.mediaUrl, project.mediaType); });
      const meta = document.createElement("div");
      meta.className = "mog-project-meta";
      const category = document.createElement("span");
      category.textContent = project.category.replace(/-/g, " ").toUpperCase();
      const date = document.createElement("span");
      date.textContent = project.date || "MOG MEDIAZ";
      meta.append(category, date);
      const title = document.createElement("h3");
      title.textContent = project.title;
      const description = document.createElement("p");
      description.textContent = project.description || "A project by MOG MEDIAZ.";
      card.append(mediaButton, meta, title, description);
      return card;
    }
    function showPreview(src, type) {
      if (!lightboxContent || !lightbox) return;
      lightboxContent.replaceChildren();
      const media = type === "video" ? document.createElement("video") : document.createElement("img");
      media.src = src;
      if (type === "video") { media.controls = true; media.autoplay = true; }
      else { media.alt = "MOG MEDIAZ portfolio preview"; }
      lightboxContent.appendChild(media);
      openDialog(lightbox);
    }
    function applyFilter() {
      if (!grid) return;
      let visible = 0;
      grid.querySelectorAll(".mog-project-card").forEach(function(card) {
        const show = activeFilter === "all" || card.dataset.category === activeFilter;
        card.hidden = !show;
        if (show) visible++;
      });
      if (emptyState) emptyState.hidden = visible > 0;
    }
    async function renderSavedProjects() {
      if (!grid || !db) return;
      try {
        const projects = await getProjects();
        projects.sort(function(a,b) { return b.createdAt.localeCompare(a.createdAt); });
        projects.forEach(function(project) { grid.prepend(makeCard(project)); });
        applyFilter();
      } catch (error) {
        console.warn("MOG MEDIAZ local portfolio could not be loaded.", error);
      }
    }

    filters.forEach(function(button) {
      button.addEventListener("click", function() {
        activeFilter = button.dataset.filter || "all";
        filters.forEach(function(item) { item.classList.toggle("is-active", item === button); });
        applyFilter();
      });
    });
    if (grid) {
      grid.addEventListener("click", function(event) {
        const button = event.target.closest("[data-preview-src]");
        if (button) showPreview(button.dataset.previewSrc, button.dataset.previewType || "image");
      });
    }
    if (openAdmin) openAdmin.addEventListener("click", function() { openDialog(adminDialog); });
    if (closeAdmin) closeAdmin.addEventListener("click", function() { closeDialog(adminDialog); });
    if (lightboxClose) lightboxClose.addEventListener("click", function() { closeDialog(lightbox); });
    [adminDialog, lightbox].forEach(function(dialog) {
      if (dialog) dialog.addEventListener("click", function(event) {
        if (event.target === dialog) closeDialog(dialog);
      });
    });
    if (uploadForm) uploadForm.addEventListener("submit", async function(event) {
      event.preventDefault();
      if (!uploadStatus) return;
      uploadStatus.className = "mog-upload-status";
      uploadStatus.textContent = "";
      const formData = new FormData(uploadForm);
      const files = Array.from(formData.getAll("media")).filter(function(file) { return file && file.size; });
      if (!files.length) {
        uploadStatus.classList.add("error");
        uploadStatus.textContent = "Choose at least one photo or video.";
        return;
      }
      if (files.some(function(file) { return file.size > 8 * 1024 * 1024; })) {
        uploadStatus.classList.add("error");
        uploadStatus.textContent = "Each file must be 8 MB or smaller for this local preview.";
        return;
      }
      try {
        if (!db) await openDatabase();
        const title = String(formData.get("title") || "").trim();
        const category = String(formData.get("category") || "");
        const description = String(formData.get("description") || "").trim();
        const date = String(formData.get("date") || "");
        for (const file of files) {
          const mediaUrl = await new Promise(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function() { reject(new Error("Could not read " + file.name)); };
            reader.readAsDataURL(file);
          });
          const project = {
            id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random(),
            title: files.length > 1 ? title + " — " + file.name : title,
            category: category,
            description: description,
            date: date,
            mediaType: file.type.startsWith("video/") ? "video" : "image",
            mediaUrl: mediaUrl,
            createdAt: new Date().toISOString()
          };
          await storeProject(project);
          grid.prepend(makeCard(project));
        }
        applyFilter();
        uploadForm.reset();
        uploadStatus.classList.add("success");
        uploadStatus.textContent = "Project saved in this browser. It is not yet published to the live website or emailed to clients.";
      } catch (error) {
        uploadStatus.classList.add("error");
        uploadStatus.textContent = error && error.message ? error.message : "Upload could not be saved.";
      }
    });

    openDatabase().then(renderSavedProjects).catch(function(error) {
      console.warn("MOG MEDIAZ local upload storage unavailable.", error);
      if (openAdmin) openAdmin.disabled = true;
    });
  })();

});
