interface WinState {
	el: HTMLElement;
	open: boolean;
	minimized: boolean;
	maximized: boolean;
}

const MOBILE = window.matchMedia("(max-width: 768px)");
const DEFAULT_APP = "sobre-mi";
const BOOT_KEY = "jlos-booted";
const DOCK_SPACE = 80;
const Z_MAX = 700; // por debajo del dock (800) y la barra superior (900)

const windows = new Map<string, WinState>();
let zTop = 10;
let cascade = 0;

document.querySelectorAll<HTMLElement>(".window[data-app]").forEach((el) => {
	windows.set(el.dataset.app!, { el, open: false, minimized: false, maximized: false });
});

const desktop = document.getElementById("desktop")!;
const activeLabel = document.getElementById("active-app")!;

/* ── Geometría ─────────────────────────────────────────────── */

function workArea() {
	const r = desktop.getBoundingClientRect();
	return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function placeWindow(w: WinState) {
	const area = workArea();
	const width = Math.min(Number(w.el.dataset.width), area.width - 32);
	const height = Math.min(Number(w.el.dataset.height), area.height - DOCK_SPACE - 24);
	const offset = (cascade++ % 6) * 28;
	const left = Math.max(16, (area.width - width) / 2 - 80 + offset);
	const top = Math.max(12, Math.min((area.height - DOCK_SPACE - height) / 2 + offset, area.height - DOCK_SPACE - height));
	Object.assign(w.el.style, { width: `${width}px`, height: `${height}px`, left: `${left}px`, top: `${top}px` });
}

function clampIntoView(w: WinState) {
	const area = workArea();
	const left = Math.min(Math.max(parseFloat(w.el.style.left) || 0, 80 - w.el.offsetWidth), area.width - 80);
	const top = Math.min(Math.max(parseFloat(w.el.style.top) || 0, 0), area.height - 40);
	w.el.style.left = `${left}px`;
	w.el.style.top = `${top}px`;
}

/* ── Estado de ventanas ────────────────────────────────────── */

function topmost(): string | null {
	let best: string | null = null;
	let bestZ = -1;
	windows.forEach((w, id) => {
		const z = Number(w.el.style.zIndex) || 0;
		if (w.open && !w.minimized && z > bestZ) {
			best = id;
			bestZ = z;
		}
	});
	return best;
}

function sync() {
	const active = topmost();
	windows.forEach((w, id) => {
		w.el.classList.toggle("is-active", id === active);
		w.el.classList.toggle("is-maximized", w.maximized);
		document.querySelectorAll(`[data-launch="${id}"]`).forEach((b) => {
			b.classList.toggle("is-running", w.open);
			b.classList.toggle("is-active", id === active);
		});
	});
	activeLabel.textContent = active ? windows.get(active)!.el.getAttribute("aria-label") : "Escritorio";
	document.body.classList.toggle("has-app", active !== null);

	const hash = active ? `#${active}` : "";
	if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname);
}

function focusWin(id: string) {
	const w = windows.get(id);
	if (!w) return;
	if (zTop >= Z_MAX) {
		// Renumera conservando el orden actual
		[...windows.values()]
			.sort((a, b) => Number(a.el.style.zIndex) - Number(b.el.style.zIndex))
			.forEach((win, i) => (win.el.style.zIndex = String(10 + i)));
		zTop = 10 + windows.size;
	}
	w.el.style.zIndex = String(++zTop);
	sync();
}

export function openApp(id: string) {
	const w = windows.get(id);
	if (!w) return;
	closeStartMenu();
	if (!w.open) {
		w.open = true;
		if (!MOBILE.matches) placeWindow(w);
		w.el.classList.remove("is-leaving");
		w.el.classList.add("is-entering");
		w.el.addEventListener("animationend", () => w.el.classList.remove("is-entering"), { once: true });
	}
	w.minimized = false;
	w.el.hidden = false;
	focusWin(id);
	const target = w.el.querySelector<HTMLElement>("[autofocus], .term-input") ?? w.el;
	target.focus({ preventScroll: true });
}

function hide(w: WinState, after: () => void) {
	w.el.classList.add("is-leaving");
	const done = () => {
		w.el.classList.remove("is-leaving");
		// Si se reabrió durante la animación de salida, no la ocultamos
		if (!w.open || w.minimized) w.el.hidden = true;
		after();
	};
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
	else w.el.addEventListener("animationend", done, { once: true });
}

function closeApp(id: string) {
	const w = windows.get(id);
	if (!w || !w.open) return;
	w.open = false;
	w.minimized = false;
	w.maximized = false;
	hide(w, sync);
	sync();
	refocus();
}

function minimizeApp(id: string) {
	const w = windows.get(id);
	if (!w || !w.open) return;
	w.minimized = true;
	hide(w, sync);
	sync();
	refocus();
}

function toggleMaximize(id: string) {
	const w = windows.get(id);
	if (!w) return;
	w.maximized = !w.maximized;
	focusWin(id);
}

function refocus() {
	const next = topmost();
	(next ? windows.get(next)!.el : desktop).focus({ preventScroll: true });
}

/** Clic en el dock: abre, trae al frente o minimiza (como cualquier barra de tareas). */
function launch(id: string) {
	const w = windows.get(id);
	if (!w) return;
	if (w.open && !w.minimized && topmost() === id) minimizeApp(id);
	else openApp(id);
}

/* ── Arrastrar ventanas ────────────────────────────────────── */

function enableDrag(w: WinState, id: string) {
	const bar = w.el.querySelector<HTMLElement>("[data-drag]")!;
	let startX = 0;
	let startY = 0;
	let originX = 0;
	let originY = 0;

	bar.addEventListener("pointerdown", (e) => {
		if (MOBILE.matches || w.maximized || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
		startX = e.clientX;
		startY = e.clientY;
		originX = w.el.offsetLeft;
		originY = w.el.offsetTop;
		bar.setPointerCapture(e.pointerId);
		w.el.classList.add("is-dragging");
	});

	bar.addEventListener("pointermove", (e) => {
		if (!bar.hasPointerCapture(e.pointerId)) return;
		w.el.style.left = `${originX + e.clientX - startX}px`;
		w.el.style.top = `${Math.max(0, originY + e.clientY - startY)}px`;
	});

	const stop = (e: PointerEvent) => {
		if (!bar.hasPointerCapture(e.pointerId)) return;
		bar.releasePointerCapture(e.pointerId);
		w.el.classList.remove("is-dragging");
		clampIntoView(w);
	};
	bar.addEventListener("pointerup", stop);
	bar.addEventListener("pointercancel", stop);

	bar.addEventListener("dblclick", (e) => {
		if (!MOBILE.matches && !(e.target as HTMLElement).closest("button")) toggleMaximize(id);
	});
}

windows.forEach((w, id) => {
	enableDrag(w, id);
	w.el.tabIndex = -1;
	w.el.addEventListener("pointerdown", () => {
		if (topmost() !== id) focusWin(id);
	});
	w.el.addEventListener("focusin", () => {
		if (topmost() !== id && w.open && !w.minimized) focusWin(id);
	});
	w.el.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) =>
		btn.addEventListener("click", () => {
			const action = btn.dataset.action;
			if (action === "close") closeApp(id);
			else if (action === "minimize") minimizeApp(id);
			else if (action === "maximize") toggleMaximize(id);
		}),
	);
});

/* ── Lanzadores, menú y teclado ────────────────────────────── */

const startBtn = document.getElementById("start-btn")!;
const startMenu = document.getElementById("start-menu")!;

function closeStartMenu() {
	startMenu.hidden = true;
	startBtn.setAttribute("aria-expanded", "false");
}

startBtn.addEventListener("click", (e) => {
	e.stopPropagation();
	startMenu.hidden = !startMenu.hidden;
	startBtn.setAttribute("aria-expanded", String(!startMenu.hidden));
});

document.addEventListener("click", (e) => {
	const el = e.target as HTMLElement;
	const opener = el.closest<HTMLElement>("[data-open]");
	const launcher = el.closest<HTMLElement>("[data-launch]");
	if (opener) openApp(opener.dataset.open!);
	else if (launcher) launch(launcher.dataset.launch!);
	if (!el.closest("#start-menu")) closeStartMenu();
});

document.addEventListener("keydown", (e) => {
	if (e.key !== "Escape") return;
	if (!startMenu.hidden) return closeStartMenu();
	const active = topmost();
	if (active) closeApp(active);
});

window.addEventListener("os:open", (e) => openApp((e as CustomEvent<string>).detail));
window.addEventListener("os:close", (e) => closeApp((e as CustomEvent<string>).detail));
window.addEventListener("hashchange", () => {
	const id = location.hash.slice(1);
	if (windows.has(id)) openApp(id);
});
window.addEventListener("resize", () => windows.forEach((w) => w.open && clampIntoView(w)));

/* ── Reloj ─────────────────────────────────────────────────── */

const clock = document.getElementById("clock")!;
function tick() {
	const now = new Date();
	clock.textContent = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
	clock.title = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
tick();
setInterval(tick, 15_000);

/* ── Arranque ──────────────────────────────────────────────── */

const BOOT_LINES = [
	"JL-BIOS v2.4.0 — Juan Luis Gil Garrote",
	"Comprobando memoria ............ OK",
	"Montando /home/jl/proyectos ..... OK",
	"Cargando frontend.d backend.d arch.d",
	"Iniciando servicios de red ...... OK",
	"Estado: OPEN TO WORK",
	"Bienvenido a JL-OS.",
];

function startDesktop() {
	const fromHash = location.hash.slice(1);
	if (windows.has(fromHash)) openApp(fromHash);
	else if (!MOBILE.matches) openApp(DEFAULT_APP);
	else sync();
}

function boot(force = false) {
	const screen = document.getElementById("boot")!;
	const log = document.getElementById("boot-log")!;
	let booted = false;
	try {
		booted = sessionStorage.getItem(BOOT_KEY) === "1";
	} catch {}

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if ((booted || reduced) && !force) {
		screen.hidden = true;
		startDesktop();
		return;
	}

	windows.forEach((w, id) => w.open && closeApp(id));
	log.textContent = "";
	screen.hidden = false;
	screen.classList.remove("is-done");

	let i = 0;
	let finished = false;
	const finish = () => {
		if (finished) return;
		finished = true;
		clearInterval(timer);
		try {
			sessionStorage.setItem(BOOT_KEY, "1");
		} catch {}
		screen.classList.add("is-done");
		setTimeout(() => (screen.hidden = true), 400);
		document.removeEventListener("keydown", finish);
		screen.removeEventListener("click", finish);
		startDesktop();
	};
	const timer = setInterval(() => {
		if (i < BOOT_LINES.length) log.textContent += BOOT_LINES[i++] + "\n";
		else finish();
	}, 230);
	document.addEventListener("keydown", finish);
	screen.addEventListener("click", finish);
}

document.getElementById("reboot")?.addEventListener("click", () => {
	closeStartMenu();
	boot(true);
});

boot();
