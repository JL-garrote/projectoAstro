interface WinState {
	el: HTMLElement;
	open: boolean;
	minimized: boolean;
	maximized: boolean;
	anim?: Animation;
	revealTimer?: number;
}

const MOBILE = window.matchMedia("(max-width: 768px)");
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const DEFAULT_APP = "sobre-mi";
const BOOT_KEY = "jlos-booted";
const DOCK_SPACE = 80;
const Z_MAX = 700; // por debajo del dock (800) y la barra superior (900)
const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const windows = new Map<string, WinState>();
let zTop = 10;
let cascade = 0;

document.querySelectorAll<HTMLElement>(".window[data-app]").forEach((el) => {
	windows.set(el.dataset.app!, { el, open: false, minimized: false, maximized: false });
});

const os = document.querySelector<HTMLElement>(".os")!;
const desktop = document.getElementById("desktop")!;
const activeLabel = document.getElementById("active-app")!;

/** Fuerza un reflow para poder reiniciar una animación CSS. */
const restart = (el: HTMLElement, cls: string) => {
	el.classList.remove(cls);
	void el.offsetWidth;
	el.classList.add(cls);
};

/** Como animationend con once, pero ignorando las animaciones de los hijos (el evento burbujea). */
function onOwnAnimationEnd(el: HTMLElement, fn: () => void) {
	const handler = (e: AnimationEvent) => {
		if (e.target !== el) return;
		el.removeEventListener("animationend", handler);
		fn();
	};
	el.addEventListener("animationend", handler);
}

/* ── Geometría: las ventanas nunca salen del escritorio ────── */

/** Zona útil: todo el escritorio menos la franja del dock. */
function bounds() {
	return { width: desktop.clientWidth, height: desktop.clientHeight - DOCK_SPACE };
}

function clampPos(w: WinState, x: number, y: number) {
	const b = bounds();
	return {
		left: Math.min(Math.max(x, 0), Math.max(0, b.width - w.el.offsetWidth)),
		top: Math.min(Math.max(y, 0), Math.max(0, b.height - w.el.offsetHeight)),
	};
}

/** Encoge, recoloca y limita el redimensionado para que la ventana quepa entera. */
function fitWindow(w: WinState) {
	if (MOBILE.matches || w.maximized || w.el.hidden) return;
	const b = bounds();
	const el = w.el;
	el.style.maxWidth = el.style.maxHeight = "none";
	if (el.offsetWidth > b.width) el.style.width = `${b.width}px`;
	if (el.offsetHeight > b.height) el.style.height = `${b.height}px`;
	const { left, top } = clampPos(w, el.offsetLeft, el.offsetTop);
	el.style.left = `${left}px`;
	el.style.top = `${top}px`;
	// El tirador nativo de la esquina no puede llevarla más allá del borde
	el.style.maxWidth = `${b.width - left}px`;
	el.style.maxHeight = `${b.height - top}px`;
}

function placeWindow(w: WinState) {
	const b = bounds();
	const width = Math.min(Number(w.el.dataset.width), b.width - 32);
	const height = Math.min(Number(w.el.dataset.height), b.height - 24);
	const offset = (cascade++ % 6) * 28;
	Object.assign(w.el.style, {
		width: `${width}px`,
		height: `${height}px`,
		left: `${(b.width - width) / 2 - 80 + offset}px`,
		top: `${(b.height - height) / 2 + offset}px`,
	});
	fitWindow(w);
}

/* ── Animaciones con Web Animations API ────────────────────── */

/** Transformación que lleva la ventana hasta su icono del dock (efecto «genie»). */
function dockTransform(w: WinState) {
	const btn = document.querySelector(`.dock-btn[data-launch="${w.el.dataset.app}"]`);
	if (!btn || MOBILE.matches || REDUCED.matches) return null;
	const r = w.el.getBoundingClientRect();
	const d = btn.getBoundingClientRect();
	const dx = d.left + d.width / 2 - (r.left + r.width / 2);
	const dy = d.top + d.height / 2 - (r.top + r.height / 2);
	return `translate(${dx}px, ${dy}px) scale(0.06)`;
}

/** FLIP: anima suavemente un cambio de tamaño/posición (maximizar y restaurar). */
function animateGeometry(el: HTMLElement, change: () => void) {
	const first = el.getBoundingClientRect();
	change();
	if (REDUCED.matches) return;
	const last = el.getBoundingClientRect();
	if (!last.width || !last.height) return;
	el.animate(
		[
			{
				transformOrigin: "top left",
				transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})`,
			},
			{ transformOrigin: "top left", transform: "none" },
		],
		{ duration: 260, easing: EASE_OUT },
	);
}

/** Escalona la entrada del contenido marcado con .reveal al abrir una app. */
function reveal(w: WinState) {
	clearTimeout(w.revealTimer);
	restart(w.el, "is-revealing");
	w.revealTimer = window.setTimeout(() => w.el.classList.remove("is-revealing"), 1600);
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

	const label = active ? windows.get(active)!.el.getAttribute("aria-label")! : "Escritorio";
	if (activeLabel.textContent !== label) {
		activeLabel.textContent = label;
		restart(activeLabel, "is-swapping");
	}
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

function bounceDock(id: string) {
	const btn = document.querySelector<HTMLElement>(`.dock-btn[data-launch="${id}"]`);
	if (btn) restart(btn, "is-bouncing");
}

export function openApp(id: string) {
	const w = windows.get(id);
	if (!w) return;
	closeStartMenu();
	w.anim?.cancel();

	if (!w.open) {
		// Apertura nueva: aparece con zoom y su contenido entra escalonado
		w.open = true;
		w.el.hidden = false;
		w.el.classList.remove("is-leaving");
		if (!MOBILE.matches) placeWindow(w);
		restart(w.el, "is-entering");
		onOwnAnimationEnd(w.el, () => w.el.classList.remove("is-entering"));
		reveal(w);
		bounceDock(id);
	} else if (w.minimized) {
		// Restaurar: sale del icono del dock
		w.el.hidden = false;
		const from = dockTransform(w);
		if (from) {
			w.anim = w.el.animate([{ transform: from, opacity: 0 }, { transform: "none", opacity: 1 }], {
				duration: 340,
				easing: EASE_OUT,
			});
		} else restart(w.el, "is-entering");
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
	if (REDUCED.matches) done();
	else onOwnAnimationEnd(w.el, done);
}

function closeApp(id: string) {
	const w = windows.get(id);
	if (!w || !w.open) return;
	w.anim?.cancel();
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
	const to = dockTransform(w);
	if (to) {
		w.anim?.cancel();
		w.anim = w.el.animate([{ transform: "none", opacity: 1 }, { transform: to, opacity: 0 }], {
			duration: 320,
			easing: "cubic-bezier(0.5, 0, 0.75, 0.4)",
			fill: "forwards",
		});
		w.anim.onfinish = () => {
			if (w.minimized) w.el.hidden = true;
			w.anim?.cancel();
			sync();
		};
	} else hide(w, sync);
	sync();
	refocus();
}

function toggleMaximize(id: string) {
	const w = windows.get(id);
	if (!w || MOBILE.matches) return;
	animateGeometry(w.el, () => {
		w.maximized = !w.maximized;
		w.el.classList.toggle("is-maximized", w.maximized);
		fitWindow(w);
	});
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
		// Durante el arrastre el límite de tamaño no debe encoger la ventana
		w.el.style.maxWidth = w.el.style.maxHeight = "none";
		bar.setPointerCapture(e.pointerId);
		w.el.classList.add("is-dragging");
	});

	bar.addEventListener("pointermove", (e) => {
		if (!bar.hasPointerCapture(e.pointerId)) return;
		const { left, top } = clampPos(w, originX + e.clientX - startX, originY + e.clientY - startY);
		w.el.style.left = `${left}px`;
		w.el.style.top = `${top}px`;
	});

	const stop = (e: PointerEvent) => {
		if (!bar.hasPointerCapture(e.pointerId)) return;
		bar.releasePointerCapture(e.pointerId);
		w.el.classList.remove("is-dragging");
		fitWindow(w);
	};
	bar.addEventListener("pointerup", stop);
	bar.addEventListener("pointercancel", stop);

	bar.addEventListener("dblclick", (e) => {
		if (!(e.target as HTMLElement).closest("button")) toggleMaximize(id);
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

function openStartMenu() {
	startMenu.classList.remove("is-closing");
	startMenu.hidden = false;
	startBtn.setAttribute("aria-expanded", "true");
}

export function closeStartMenu() {
	if (startMenu.hidden || startMenu.classList.contains("is-closing")) return;
	startBtn.setAttribute("aria-expanded", "false");
	if (REDUCED.matches) {
		startMenu.hidden = true;
		return;
	}
	startMenu.classList.add("is-closing");
	onOwnAnimationEnd(startMenu, () => {
		if (!startMenu.classList.contains("is-closing")) return;
		startMenu.classList.remove("is-closing");
		startMenu.hidden = true;
	});
}

startBtn.addEventListener("click", (e) => {
	e.stopPropagation();
	if (startMenu.hidden || startMenu.classList.contains("is-closing")) openStartMenu();
	else closeStartMenu();
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
window.addEventListener("resize", () => windows.forEach((w) => w.open && fitWindow(w)));

// Tras redimensionar con el tirador nativo, recalcula el límite restante
windows.forEach((w) => w.el.addEventListener("pointerup", () => w.open && !w.el.classList.contains("is-dragging") && fitWindow(w)));

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
	// Entrada escalonada de barra superior, iconos, fondo y dock
	restart(os, "is-ready");
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

	if ((booted || REDUCED.matches) && !force) {
		screen.hidden = true;
		startDesktop();
		return;
	}

	windows.forEach((w, id) => w.open && closeApp(id));
	os.classList.remove("is-ready");
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
		setTimeout(() => (screen.hidden = true), 500);
		document.removeEventListener("keydown", finish);
		screen.removeEventListener("click", finish);
		startDesktop();
	};
	const timer = setInterval(() => {
		if (i < BOOT_LINES.length) {
			const line = document.createElement("span");
			line.className = "boot-line";
			line.textContent = BOOT_LINES[i++];
			log.appendChild(line);
		} else finish();
	}, 230);
	document.addEventListener("keydown", finish);
	screen.addEventListener("click", finish);
}

document.getElementById("reboot")?.addEventListener("click", () => {
	closeStartMenu();
	boot(true);
});

boot();
