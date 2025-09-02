import "./toolbar.css";

export function createToolbar() {
  const toolbar = document.createElement("nav");
  toolbar.className = "iconbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Editor toolbar");

  toolbar.innerHTML = `
    <button type="button" class="iconbtn" data-action="open" aria-label="Open (Ctrl+O)" title="Open (Ctrl+O)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path d="M3 10h18" stroke="currentColor" stroke-width="1.6" />
      </svg>
    </button>

    <button type="button" class="iconbtn" data-action="save" aria-label="Save (Ctrl+S)" title="Save (Ctrl+S)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5z" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M8 4v6h8V6" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="8" y="14" width="8" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>
      </svg>
    </button>

    <span class="sep" aria-hidden="true"></span>

    <button type="button" class="iconbtn" data-action="undo" aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 17a7 7 0 0 0-7-7H3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>

    <button type="button" class="iconbtn" data-action="redo" aria-label="Redo (Ctrl+Y)" title="Redo (Ctrl+Y)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 7l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 17a7 7 0 0 1 7-7h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>

    <span class="sep" aria-hidden="true"></span>

    <button type="button" class="iconbtn" data-action="cut" aria-label="Cut (Ctrl+X)" title="Cut (Ctrl+X)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="7" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="6" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M20 5L8 12l12 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button type="button" class="iconbtn" data-action="copy" aria-label="Copy (Ctrl+C)" title="Copy (Ctrl+C)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.7"/>
      </svg>
    </button>

    <button type="button" class="iconbtn" data-action="paste" aria-label="Paste (Ctrl+V)" title="Paste (Ctrl+V)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4h6v3H9z" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="6" y="6" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="9" y="10" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/>
      </svg>
    </button>

    <span class="sep" aria-hidden="true"></span>

    <button type="button" class="iconbtn" data-action="search" aria-label="Search (Ctrl+F)" title="Search (Ctrl+F)">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M16 16l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  return toolbar;
}
