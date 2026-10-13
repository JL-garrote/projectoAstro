/**
 * Iconos del escritorio arrastrables: se colocan en una cuadrícula, se encajan
 * en la celda libre más cercana al soltarlos y recuerdan su posición.
 * En móvil se deja la cuadrícula fija tipo teléfono.
 */

interface Cell {
	col: number;
	row: number;
}

const MOBILE = window.matchMedia("(max-width: 768px)");
const STORAGE_KEY = "jlos-icons";
const CELL_W = 100;
const CELL_H = 100;
const PAD_X = 16;
const PAD_Y = 20;
const DOCK_SPACE = 80;
const DRAG_THRESHOLD = 5;

const list = document.querySelector<HTMLElement>(".desktop-icons")!;
const desktop = document.getElementById("desktop")!;
const items = [...list.querySelectorAll<HTMLLIElement>("li")];
const idOf = (li: HTMLElement) => li.querySelector<HTMLElement>("[data-open]")!.dataset.open!;

const ghost = document.createElement("li");
ghost.className = "icon-ghost";
ghost.setAttribute("aria-hidden", "true");

let cells = new Map<string, Cell>();

/* ── Cuadrícula ────────────────────────────────────────────── */

function grid() {
	return {
		cols: Math.max(1, Math.floor((desktop.clientWidth - PAD_X) / CELL_W)),
		rows: Math.max(1, Math.floor((desktop.clientHeight - DOCK_SPACE - PAD_Y) / CELL_H)),
	};
}

const toPx = ({ col, row }: Cell) => ({ x: PAD_X + col * CELL_W, y: PAD_Y + row * CELL_H });
const key = ({ col, row }: Cell) => `${col}:${row}`;

/** Celda libre más cercana a la deseada (por distancia), ignorando el icono `except`. */
function nearestFree(target: Cell, except?: string): Cell {
	const { cols, rows } = grid();
	const taken = new Set([...cells].filter(([id]) => id !== except).map(([, c]) => key(c)));
	const want = { col: Math.min(Math.max(target.col, 0), cols - 1), row: Math.min(Math.max(target.row, 0), rows - 1) };
	let best = want;
	let bestDist = Infinity;
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			if (taken.has(key({ col, row }))) continue;
			const d = (col - want.col) ** 2 + (row - want.row) ** 2;
			if (d < bestDist) {
				best = { col, row };
				bestDist = d;
			}
		}
	}
	return best;
}

function place(li: HTMLElement, cell: Cell) {
	const { x, y } = toPx(cell);
	li.style.left = `${x}px`;
	li.style.top = `${y}px`;
}

/** Orden por defecto: en columnas, de arriba abajo (como el diseño original). */
function defaultCells() {
	const { rows } = grid();
	const result = new Map<string, Cell>();
	items.forEach((li, i) => result.set(idOf(li), { col: Math.floor(i / rows), row: i % rows }));
	return result;
}

function load(): Map<string, Cell> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? new Map(Object.entries(JSON.parse(raw))) : null;
	} catch {
		return null;
	}
}

function save() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(cells)));
	} catch {}
}

/** Recoloca todos los iconos dentro de la cuadrícula actual sin solapes. */
function layout(source: Map<string, Cell>) {
	cells = new Map();
	items.forEach((li) => {
		const id = idOf(li);
		const cell = nearestFree(source.get(id) ?? { col: 0, row: 0 });
		cells.set(id, cell);
		place(li, cell);
	});
}

/* ── Activar / desactivar según el tamaño ──────────────────── */

function enable() {
	list.classList.add("is-free");
	layout(load() ?? defaultCells());
}

function disable() {
	list.classList.remove("is-free");
	items.forEach((li) => {
		li.style.removeProperty("left");
		li.style.removeProperty("top");
	});
}

const apply = () => (MOBILE.matches ? disable() : enable());
apply();
MOBILE.addEventListener("change", apply);
// Al redimensionar se parte de la posición elegida (guardada), no de la reacomodada
window.addEventListener("resize", () => !MOBILE.matches && layout(load() ?? defaultCells()));

export function resetIcons() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {}
	if (!MOBILE.matches) layout(defaultCells());
}

/* ── Arrastrar ─────────────────────────────────────────────── */

items.forEach((li) => {
	const btn = li.querySelector<HTMLButtonElement>("button")!;
	const id = idOf(li);
	let startX = 0;
	let startY = 0;
	let offsetX = 0;
	let offsetY = 0;
	let pressed = false;
	let dragging = false;
	let justDragged = false;

	const cellAt = (x: number, y: number): Cell => ({
		col: Math.round((x - PAD_X) / CELL_W),
		row: Math.round((y - PAD_Y) / CELL_H),
	});

	btn.addEventListener("pointerdown", (e) => {
		if (MOBILE.matches || e.button !== 0) return;
		pressed = true;
		startX = e.clientX;
		startY = e.clientY;
		offsetX = e.clientX - li.offsetLeft;
		offsetY = e.clientY - li.offsetTop;
		btn.setPointerCapture(e.pointerId);
	});

	btn.addEventListener("pointermove", (e) => {
		if (!pressed) return;
		if (!dragging) {
			if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return;
			dragging = true;
			li.classList.add("is-dragging");
			list.appendChild(ghost);
		}
		// Sigue al puntero sin salirse del escritorio
		const maxX = desktop.clientWidth - li.offsetWidth;
		const maxY = desktop.clientHeight - DOCK_SPACE - li.offsetHeight;
		const x = Math.min(Math.max(e.clientX - offsetX, 0), maxX);
		const y = Math.min(Math.max(e.clientY - offsetY, 0), maxY);
		li.style.left = `${x}px`;
		li.style.top = `${y}px`;
		place(ghost, nearestFree(cellAt(x, y), id));
	});

	const end = (e: PointerEvent) => {
		if (!pressed) return;
		pressed = false;
		if (btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId);
		if (!dragging) return;
		dragging = false;
		justDragged = true;
		const cell = nearestFree(cellAt(li.offsetLeft, li.offsetTop), id);
		cells.set(id, cell);
		li.classList.remove("is-dragging");
		ghost.remove();
		place(li, cell);
		save();
	};
	btn.addEventListener("pointerup", end);
	btn.addEventListener("pointercancel", end);

	// Un arrastre no debe abrir la app (el listener global de [data-open] está en document)
	btn.addEventListener("click", (e) => {
		if (!justDragged) return;
		justDragged = false;
		e.stopImmediatePropagation();
		e.preventDefault();
	});
});
