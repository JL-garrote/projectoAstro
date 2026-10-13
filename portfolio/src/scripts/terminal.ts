import type { Entrada, Proyecto } from "../data/portfolio";

interface TermData {
	perfil: { nombre: string; alias: string; usuario: string; rol: string; ubicacion: string; estado: string; sobreMi: string; destacados: string[] };
	redes: { label: string; href: string }[];
	stack: { titulo: string; nivel: number; items: string[] }[];
	experiencia: Entrada[];
	educacion: Entrada[];
	proyectos: Omit<Proyecto, "image">[];
	apps: { id: string; nombre: string }[];
}

type Clase = "cmd" | "ok" | "dim" | "err" | "";

const ARCHIVOS = ["sobre_mi.txt", "stack.sys", "trayectoria.log", "contacto.app", "proyectos/"];

export function createTerminal() {
	const out = document.getElementById("term-out")!;
	const form = document.getElementById("term-form") as HTMLFormElement;
	const input = document.getElementById("term-input") as HTMLInputElement;
	const root = document.getElementById("term")!;
	const data: TermData = JSON.parse(document.getElementById("term-data")!.textContent!);

	const historial: string[] = [];
	let cursor = 0;
	const usuario = data.perfil.usuario;

	const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

	function print(text = "", clase: Clase = "") {
		const p = document.createElement("p");
		p.className = `line ${clase}`.trim();
		p.textContent = text;
		out.appendChild(p);
	}

	function printHTML(html: string) {
		const p = document.createElement("p");
		p.className = "line";
		p.innerHTML = html;
		out.appendChild(p);
	}

	const abrir = (id: string) => window.dispatchEvent(new CustomEvent("os:open", { detail: id }));
	const buscarProyecto = (q: string) => {
		const n = q.toLowerCase().replace(/\/$/, "").replace(/^proyectos\//, "");
		return data.proyectos.find((p) => p.slug === n || p.title.toLowerCase() === n);
	};
	const entradas = (lista: Entrada[]) =>
		lista.forEach((e) => {
			print(`[${e.fecha}] ${e.titulo}`, "ok");
			print(`  @ ${e.lugar}`, "dim");
		});

	const comandos: Record<string, { ayuda: string; run: (args: string[]) => void }> = {
		help: {
			ayuda: "muestra esta ayuda",
			run: () => {
				print("Comandos disponibles:", "dim");
				Object.entries(comandos).forEach(([nombre, c]) => print(`  ${nombre.padEnd(10)} ${c.ayuda}`));
				print("Tip: ↑/↓ recorren el historial y Tab autocompleta.", "dim");
			},
		},
		whoami: {
			ayuda: "quién soy",
			run: () => {
				print(`${data.perfil.nombre} — ${data.perfil.rol}`, "ok");
				print(`${data.perfil.ubicacion} · ${data.perfil.estado}`, "dim");
			},
		},
		ls: {
			ayuda: "lista archivos (ls proyectos)",
			run: ([dir]) => {
				if (dir && dir.replace(/\/$/, "") === "proyectos") print(data.proyectos.map((p) => p.slug + "/").join("   "), "ok");
				else if (dir) print(`ls: no existe '${dir}'`, "err");
				else print(ARCHIVOS.join("   "), "ok");
			},
		},
		cat: {
			ayuda: "lee un archivo (cat sobre_mi.txt)",
			run: ([archivo]) => {
				if (!archivo) return print("uso: cat <archivo>", "err");
				const proyecto = buscarProyecto(archivo);
				if (archivo === "sobre_mi.txt") {
					print(data.perfil.sobreMi);
					data.perfil.destacados.forEach((d) => print(`  > ${d}`, "ok"));
				} else if (archivo === "stack.sys") comandos.stack.run([]);
				else if (archivo === "trayectoria.log") {
					print("## Experiencia", "dim");
					entradas(data.experiencia);
					print("## Educación", "dim");
					entradas(data.educacion);
				} else if (archivo === "contacto.app") comandos.contact.run([]);
				else if (proyecto) {
					print(`${proyecto.title}  [${proyecto.tagTop}]`, "ok");
					print(proyecto.description);
					print(`stack: ${proyecto.tags.join(" ")}`, "dim");
					if (proyecto.linkLive !== "#") printHTML(`live: <a href="${escape(proyecto.linkLive)}" target="_blank" rel="noopener noreferrer">${escape(proyecto.linkLive)}</a>`);
					if (proyecto.linkSource !== "#") printHTML(`src:  <a href="${escape(proyecto.linkSource)}" target="_blank" rel="noopener noreferrer">${escape(proyecto.linkSource)}</a>`);
				} else print(`cat: ${archivo}: no existe el archivo`, "err");
			},
		},
		projects: {
			ayuda: "lista mis proyectos",
			run: () => {
				data.proyectos.forEach((p) => print(`  ${p.slug.padEnd(16)} ${p.tagTop.padEnd(11)} ${p.tags.join(" ")}`));
				print("Usa 'cat <proyecto>' o 'open <proyecto>'.", "dim");
			},
		},
		stack: {
			ayuda: "tecnologías que uso",
			run: () =>
				data.stack.forEach((g) => {
					const barra = "█".repeat(Math.round(g.nivel / 5)).padEnd(20, "░");
					print(`${g.titulo.padEnd(13)} ${barra} ${g.nivel}%`, "ok");
					print(`  ${g.items.join(", ")}`, "dim");
				}),
		},
		open: {
			ayuda: "abre una app o proyecto (open proyectos)",
			run: ([q]) => {
				if (!q) return print(`uso: open <${data.apps.map((a) => a.id).join("|")}>`, "err");
				const proyecto = buscarProyecto(q);
				const app = data.apps.find((a) => a.id === q.toLowerCase() || a.nombre.toLowerCase() === q.toLowerCase());
				if (proyecto) {
					abrir("proyectos");
					window.dispatchEvent(new CustomEvent("os:project", { detail: proyecto.slug }));
					print(`abriendo ${proyecto.title}...`, "ok");
				} else if (app) {
					abrir(app.id);
					print(`abriendo ${app.nombre}...`, "ok");
				} else print(`open: '${q}' no encontrado`, "err");
			},
		},
		contact: {
			ayuda: "cómo contactarme",
			run: () => {
				data.redes.forEach((r) => printHTML(`${r.label.padEnd(9)} <a href="${escape(r.href)}" target="_blank" rel="noopener noreferrer">${escape(r.href)}</a>`));
				print("O escribe 'open contacto' para mandarme un correo.", "dim");
			},
		},
		neofetch: {
			ayuda: "info del sistema",
			run: () => {
				const logo = ["+-------+", "|  JL   |", "|   OS  |", "+-------+"];
				const info = [
					`${usuario}@portfolio`,
					`OS: JL-OS v2.4.0`,
					`Rol: ${data.perfil.rol}`,
					`Shell: jlsh`,
					`Proyectos: ${data.proyectos.length}`,
					`Estado: ${data.perfil.estado}`,
				];
				info.forEach((l, i) => print(`${(logo[i] ?? "").padEnd(11)}${l}`, i === 0 ? "ok" : ""));
			},
		},
		date: { ayuda: "fecha y hora", run: () => print(new Date().toLocaleString("es-ES")) },
		echo: { ayuda: "repite el texto", run: (args) => print(args.join(" ")) },
		history: { ayuda: "historial de comandos", run: () => historial.forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${h}`)) },
		sudo: { ayuda: "superpoderes", run: () => print(`${usuario} no está en el archivo sudoers. Este incidente será reportado. 😉`, "err") },
		clear: { ayuda: "limpia la pantalla", run: () => (out.innerHTML = "") },
		exit: { ayuda: "cierra la terminal", run: () => window.dispatchEvent(new CustomEvent("os:close", { detail: "terminal" })) },
	};

	function ejecutar(linea: string) {
		printHTML(`<span class="prompt"><span class="p-user">${usuario}@portfolio</span>:<span class="p-path">~</span>$</span> <span class="cmd">${escape(linea)}</span>`);
		const [nombre, ...args] = linea.trim().split(/\s+/);
		if (!nombre) return;
		const cmd = comandos[nombre.toLowerCase()];
		if (cmd) cmd.run(args);
		else print(`${nombre}: comando no encontrado. Escribe 'help'.`, "err");
	}

	function completar() {
		const partes = input.value.split(" ");
		const actual = partes[partes.length - 1];
		const slugs = data.proyectos.map((p) => p.slug);
		const porComando: Record<string, string[]> = {
			open: [...data.apps.map((a) => a.id), ...slugs],
			cat: [...ARCHIVOS.filter((a) => !a.endsWith("/")), ...slugs],
			ls: ["proyectos"],
		};
		const opciones = partes.length === 1 ? Object.keys(comandos) : (porComando[partes[0]] ?? []);
		const matches = [...new Set(opciones.filter((o) => o.startsWith(actual)))];
		if (!matches.length) return;

		// Completa hasta el prefijo común; si hay varias opciones, las muestra
		let comun = matches[0];
		for (const m of matches) while (!m.startsWith(comun)) comun = comun.slice(0, -1);
		partes[partes.length - 1] = comun;
		input.value = partes.join(" ") + (matches.length === 1 ? " " : "");
		if (matches.length > 1) print(matches.join("   "), "dim");
	}

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const linea = input.value;
		if (linea.trim()) historial.push(linea);
		cursor = historial.length;
		input.value = "";
		ejecutar(linea);
		root.parentElement?.scrollTo({ top: root.scrollHeight });
	});

	input.addEventListener("keydown", (e) => {
		if (e.key === "Tab") {
			e.preventDefault();
			completar();
		} else if (e.key === "ArrowUp" && cursor > 0) {
			e.preventDefault();
			input.value = historial[--cursor];
		} else if (e.key === "ArrowDown") {
			e.preventDefault();
			cursor = Math.min(cursor + 1, historial.length);
			input.value = historial[cursor] ?? "";
		} else if (e.key === "l" && e.ctrlKey) {
			e.preventDefault();
			out.innerHTML = "";
		}
	});

	// Clic en cualquier parte de la terminal → foco al input (sin romper la selección de texto)
	root.addEventListener("mouseup", () => {
		if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
	});

	print("JL-OS v2.4.0 (jlsh)", "ok");
	print("Escribe 'help' para ver los comandos disponibles.", "dim");
	print();
}
