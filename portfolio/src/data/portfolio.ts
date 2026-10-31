import type { ImageMetadata } from "astro";
import voyagerImage from "../assets/voyager.jpg";
import auraChatImage from "../assets/auraChat.jpg";
import boardSyncImage from "../assets/boardSync.png";
import passImage from "../assets/pass.png";
import vinculoImage from "../assets/vinculo.png";

export const perfil = {
	nombre: "Juan Luis Gil Garrote",
	alias: "JL-Garrote",
	usuario: "jl",
	rol: "Desarrollador Full Stack",
	ubicacion: "Sevilla, España",
	estado: "OPEN TO WORK",
	resumen:
		"Desarrollador FULLSTACK más enfocado en el BACKEND. Haciendo soluciones robustas y escalables con el tiempo con la arquitectura pertinente. Transformo tu idea en una app ya sea web, escritorio o móvil en algo elegante y robusto frente a ataques.",
	sobreMi:
		"Desarrollador full stack con experiencia liderando un producto en producción de principio a fin: arquitectura, desarrollo, despliegue cloud y datos. Domino el stack moderno de JavaScript (Next.js, TypeScript, Node, API REST) y trabajo con AWS, Vercel, CI/CD y MySQL en entornos reales con usuarios. Acostumbrado a asumir responsabilidad técnica completa: traduzco requisitos de negocio en software funcionando, sin necesidad de supervisión constante. Perfil autodidacta con experiencia internacional, capacidad de entrega y hambre de proyecto.",
	destacados: [
		"Liderazgo técnico end-to-end: arquitectura, desarrollo y despliegue",
		"Stack moderno JS/TS — Next.js, Node.js, API REST",
		"Cloud & datos — AWS, Vercel, CI/CD, MySQL",
		"Perfil autodidacta con experiencia internacional",
	],
};

export const redes = [
	{ label: "GitHub", href: "https://github.com/JL-garrote?tab=repositories" },
	{ label: "LinkedIn", href: "https://www.linkedin.com/in/juan-luis-gil-garrote-552505310/" },
];

export interface Tecnologia {
	nombre: string;
	devicon?: string;
}

export interface GrupoStack {
	titulo: string;
	proceso: string;
	nivel: number;
	items: Tecnologia[];
}

export const stack: GrupoStack[] = [
	{
		titulo: "Frontend",
		proceso: "frontend.d",
		nivel: 80,
		items: [
			{ nombre: "React", devicon: "devicon-react-plain" },
			{ nombre: "Next.js", devicon: "devicon-nextjs-plain" },
			{ nombre: "Tailwind CSS", devicon: "devicon-tailwindcss-plain" },
			{ nombre: "TypeScript", devicon: "devicon-typescript-plain" },
			{ nombre: "Astro", devicon: "devicon-astro-plain" },
		],
	},
	{
		titulo: "Backend",
		proceso: "backend.d",
		nivel: 95,
		items: [
			{ nombre: "Node.js", devicon: "devicon-nodejs-plain" },
			{ nombre: "Python", devicon: "devicon-python-plain" },
			{ nombre: "C#", devicon: "devicon-csharp-plain" },
			{ nombre: "Java", devicon: "devicon-java-plain" },
			{ nombre: "Spring Boot", devicon: "devicon-spring-plain" },
			{ nombre: "MySQL", devicon: "devicon-mysql-plain" },
			{ nombre: "PostgreSQL", devicon: "devicon-postgresql-plain" },
		],
	},
	{
		titulo: "Arquitectura",
		proceso: "arch.d",
		nivel: 88,
		items: [{ nombre: "Microservices" }, { nombre: "REST API" }, { nombre: "MVC" }],
	},
];

export interface Entrada {
	titulo: string;
	fecha: string;
	lugar: string;
	descripcion: string;
}

export const experiencia: Entrada[] = [
	{
		titulo: "Programador Junior",
		fecha: "Mar. 2026 — Jun. 2026",
		lugar: "Elenco Ahorro - Mairena del Aljarafe, Sevilla",
		descripcion:
			"Gestión y planificación integral de un proyecto CRM-ERP para consultoría energética: análisis de requisitos con negocio, diseño funcional, desarrollo y puesta en producción. Diseño de la arquitectura API REST desacoplada: frontend en Next.js sobre Vercel y backend en TypeScript / TypeORM sobre AWS, con pipelines de despliegue independientes. Desarrollo de módulos de gestión de contratos, campañas y cartera de clientes, con cuadros de mando y control de KPIs comerciales para la toma de decisiones. Modelado de la base de datos y dirección del paso a producción: migración completa de datos entre entornos sin interrupción del servicio ni pérdida de información.",
	},
	{
		titulo: "Técnico de Sistemas y Redes",
		fecha: "Mar. 2023 — Jun. 2023",
		lugar: "AXONA S.R.L. - Pavía (Italia)",
		descripcion:
			"Soporte técnico integral del parque informático (Windows y Mac): diagnóstico, mantenimiento preventivo y resolución de incidencias. Administración de un servidor NAS de almacenamiento en la nube y gestión de proveedores en un entorno internacional.",
	},
];

export const educacion: Entrada[] = [
	{
		titulo: "Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)",
		fecha: "Sept. 2024 — Jun. 2026",
		lugar: "MEDAC Nuevo Torneo",
		descripcion:
			"Formación en desarrollo de aplicaciones multiplataforma. Especialización en tecnologías Java, Kotlin y desarrollo móvil.",
	},
	{
		titulo: "Técnico en Sistemas Microinformáticos y Redes (SMR)",
		fecha: "2021 — 2023",
		lugar: "IES Axati, Lora del Río",
		descripcion: "Formación en mantenimiento de sistemas informáticos y administración de redes locales.",
	},
];

export interface Proyecto {
	slug: string;
	tagTop: string;
	title: string;
	description: string;
	tags: string[];
	linkSource: string;
	linkLive: string;
	image: ImageMetadata | null;
	role: string;
	duration: string;
	challenge: string;
	features: string[];
}

export const proyectos: Proyecto[] = [
	{
		slug: "voyager",
		tagTop: "Production",
		title: "Voyager",
		description:
			"Planificador de viajes que estima el gasto real de combustible de tu ruta a partir de las especificaciones exactas de tu vehículo (cilindrada, cv, peso, transmisión, ocupantes...), combinando el trazado de la ruta con la API de Gemini para una predicción contextual.",
		tags: ["#Astro.js", "#SpringBoot", "#Java", "#GeminiAPI"],
		linkSource: "#",
		linkLive: "https://voyager-bice.vercel.app",
		image: voyagerImage,
		role: "Full Stack · En solitario",
		duration: "1 mes",
		challenge:
			"Conectar la IA (Gemini) y la API de Google Maps sin fricciones, para que el trazado de la ruta y la predicción de consumo funcionaran de forma coherente.",
		features: [
			"Estimación del gasto real de combustible según las especificaciones exactas del vehículo (cilindrada, CV, peso, transmisión, ocupantes)",
			"Trazado de ruta con la API de Google Maps",
			"Predicción contextual del consumo con la API de Gemini",
		],
	},
	{
		slug: "aura-chat",
		tagTop: "Production",
		title: "Aura Chat",
		description:
			"Chat con IA (Google Gemini) con autenticación propia por JWT, historial de conversaciones persistente y una interfaz Material Design 3 con modo claro/oscuro. Incluye dictado por voz, exportación de conversaciones y notificaciones en cliente.",
		tags: ["#Astro.js", "#SpringBoot", "#TypeScript", "#GeminiAPI"],
		linkSource: "#",
		linkLive: "https://retrograde-resonance-dun.vercel.app",
		image: auraChatImage,
		role: "Full Stack · En solitario",
		duration: "2 semanas",
		challenge:
			"Implementar la autenticación propia con JSON Web Tokens (JWT) y gestionar correctamente el flujo de preguntas y respuestas con la IA.",
		features: [
			"Autenticación propia por JWT",
			"Historial de conversaciones persistente",
			"Interfaz Material Design 3 con modo claro/oscuro",
			"Dictado por voz y exportación de conversaciones",
			"Notificaciones en cliente",
		],
	},
	{
		slug: "boardsync",
		tagTop: "v1.0.0",
		title: "BoardSync",
		description:
			"Tableros Kanban colaborativos: creá tableros, organizalos en columnas, sumá tarjetas y agregá miembros con roles (Editor/Viewer) para trabajar en equipo. Incluye reordenamiento de columnas y tarjetas, y control de concurrencia optimista para evitar que dos ediciones simultáneas se pisen entre sí.",
		tags: ["#React", "#SpringBoot", "#Zustand", "#TailwindCSS"],
		linkSource: "#",
		linkLive: "https://boardsync-frontend.vercel.app/",
		image: boardSyncImage,
		role: "Full Stack · En solitario",
		duration: "1 mes",
		challenge:
			"Sincronizar la conectividad entre usuarios en tiempo real, refrescando los tableros compartidos sin interrumpir a los usuarios que están trabajando en ese momento.",
		features: [
			"Tableros Kanban organizados en columnas",
			"Miembros con roles (Editor/Viewer)",
			"Reordenamiento de columnas y tarjetas",
			"Control de concurrencia optimista",
		],
	},
	{
		slug: "password-guard",
		tagTop: "v1.0.0",
		title: "Password Guard",
		description:
			"Generador y analizador de contraseñas. Calcula la entropía y el tiempo estimado para descifrarlas, detecta si están entre las 10.000 más usadas, comprueba si aparecen en filtraciones reales con Have I Been Pwned y ofrece consejos personalizados con IA (Gemini) sin enviarle nunca la contraseña.",
		tags: ["#ASP.NETCore", "#.NET", "#Vue.js", "#GeminiAPI"],
		linkSource: "https://github.com/JL-garrote/passwordGuard",
		linkLive: "#",
		image: passImage,
		role: "Full Stack · En solitario",
		duration: "2 semanas",
		challenge:
			"Analizar contraseñas con servicios externos sin exponerlas: k-anonymity con el hash SHA-1 para Have I Been Pwned y una estructura anónima (tipos y longitudes) como única información que recibe la IA.",
		features: [
			"Generador con longitud de 8 a 128 caracteres y filtros por tipo de carácter",
			"Cálculo de entropía y tiempo estimado para descifrar la contraseña",
			"Detección de las 10.000 contraseñas más usadas",
			"Comprobación de filtraciones con Have I Been Pwned (k-anonymity)",
			"Consejos personalizados con IA a partir de una estructura anónima",
		],
	},
	{
		slug: "vinculo",
		tagTop: "v1.1.0",
		title: "Vínculo",
		description:
			"PRM (Personal Relationship Manager): un CRM para las personas que te importan. Te recuerda con quién hace tiempo que no hablas, cuál es el próximo paso con cada contacto y qué hablasteis la última vez, con un pipeline relacional tipo kanban para cultivar tu red con intención.",
		tags: ["#Java", "#SpringBoot", "#Vue.js", "#MySQL", "#Docker"],
		linkSource: "https://github.com/JL-garrote/vinculo",
		linkLive: "#",
		image: vinculoImage,
		role: "Full Stack · En solitario",
		duration: "2 semanas · en desarrollo",
		challenge:
			"Empaquetar base de datos, backend y frontend con Docker Compose para que toda la aplicación arranque con un solo comando, usando nginx como proxy de /api para no tener que configurar CORS.",
		features: [
			"Dashboard con indicadores y las relaciones que requieren atención, ordenadas por urgencia",
			"Directorio de contactos con búsqueda, filtros y círculos con cadencia propia",
			"Ficha 360° con interacciones, notas y recordatorios con recurrencia",
			"Pipeline relacional kanban con arrastrar y soltar y aviso de acciones vencidas",
			"Modo oscuro, diseño adaptable e instalable como app de escritorio (PWA)",
		],
	},
];

export type AppId = "sobre-mi" | "proyectos" | "stack" | "trayectoria" | "contacto" | "terminal";

export interface App {
	id: AppId;
	nombre: string;
	archivo: string;
	icono: string;
	ancho: number;
	alto: number;
}

/** Aplicaciones del escritorio: el orden es el de los iconos y el dock. */
export const apps: App[] = [
	{ id: "sobre-mi", nombre: "Sobre mí", archivo: "sobre_mi.txt", icono: "user", ancho: 820, alto: 560 },
	{ id: "proyectos", nombre: "Proyectos", archivo: "~/proyectos", icono: "folder", ancho: 960, alto: 620 },
	{ id: "stack", nombre: "Stack", archivo: "monitor_sistema", icono: "cpu", ancho: 760, alto: 540 },
	{ id: "trayectoria", nombre: "Trayectoria", archivo: "trayectoria.log", icono: "timeline", ancho: 900, alto: 600 },
	{ id: "contacto", nombre: "Contacto", archivo: "correo.app", icono: "mail", ancho: 620, alto: 620 },
	{ id: "terminal", nombre: "Terminal", archivo: "jl@portfolio: ~", icono: "terminal", ancho: 720, alto: 460 },
];
