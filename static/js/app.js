(() => {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const sidebar = document.getElementById("app-sidebar");

  const closeMenu = () => {
    if (!menuButton || !sidebar) return;
    sidebar.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };

  if (menuButton && sidebar) {
    menuButton.addEventListener("click", () => {
      const open = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });
    sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement?.querySelector("input");
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  const passwordStrength = document.querySelector("[data-password-strength]");
  const strengthMeter = document.querySelector(".strength-meter");
  if (passwordStrength && strengthMeter) {
    const bars = [...strengthMeter.querySelectorAll("span")];
    const label = strengthMeter.querySelector("small");
    const updateStrength = () => {
      const value = passwordStrength.value;
      let level = value.length >= 12 ? 4 : value.length >= 8 ? 3 : value.length >= 5 ? 2 : value.length ? 1 : 0;
      if (/[A-Z]/.test(value) && /\d/.test(value) && level === 3) level = 4;
      strengthMeter.dataset.level = String(level);
      bars.forEach((bar, index) => bar.classList.toggle("active", index < level));
      if (label) label.textContent = ["Use at least 8 characters", "Weak", "Fair", "Good", "Strong"][level];
    };
    passwordStrength.addEventListener("input", updateStrength);
  }

  document.querySelectorAll("[data-tabs]").forEach((tabs) => {
    const buttons = [...tabs.querySelectorAll("[data-tab-target]")];
    const panels = [...tabs.querySelectorAll("[data-tab-panel]")];
    const activate = (name) => {
      buttons.forEach((button) => {
        const active = button.dataset.tabTarget === name;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== name;
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => activate(button.dataset.tabTarget)));
    if (window.location.hash === "#personal-notes") activate("notes");
  });

  document.querySelectorAll("[data-share-button]").forEach((button) => {
    button.addEventListener("click", async () => {
      const original = button.textContent;
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, url: window.location.href });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          button.textContent = "Link copied";
          window.setTimeout(() => { button.textContent = original; }, 1800);
        }
      } catch (error) {
        if (error?.name !== "AbortError") button.textContent = "Copy unavailable";
      }
    });
  });

  const debounce = (callback, delay = 300) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const updateSuggestions = async (input) => {
    const query = input.value.trim();
    if (query.length < 3) return;
    const list = document.getElementById(`${input.id}-suggestions`);
    if (!list) return;
    try {
      const response = await fetch(`/autocomplete?q=${encodeURIComponent(query)}`);
      if (!response.ok) return;
      const payload = await response.json();
      list.replaceChildren(
        ...(payload.features || []).slice(0, 8).map((feature) => {
          const option = document.createElement("option");
          option.value = feature.properties?.label || "";
          return option;
        }),
      );
    } catch (_) {
      // Autocomplete is optional; the route form remains usable without it.
    }
  };

  ["start", "destination"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", debounce(() => updateSuggestions(input)));
  });
})();
