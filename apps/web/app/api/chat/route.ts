/**
 * =============================================================================
 * 📍 BACKEND: AI-POWERED SCHOOL SEARCH API
 * =============================================================================
 * Role: Handles AI chat endpoint for school recommendations
 * Features: 
 *   - Gemini API integration with fallback models
 *   - Database queries for school recommendations
 *   - URL normalization for external links
 *   - 429 quota error handling with database fallback
 * =============================================================================
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { integer, pgTable, text, uuid, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1: DATABASE SCHEMA
// ─────────────────────────────────────────────────────────────────────────

const schools = pgTable("schools", {
	id: uuid("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	logoUrl: uuid("logo_url"),
	coverImageUrl: uuid("cover_image_url"),
	address: text("address"),
	city: text("city"),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
	educationalLevel: text("educational_level"),
	institutionType: text("institution_type"),
	schedule: text("schedule"),
	maxStudentsPerClass: integer("max_students_per_class"),
	languages: text("languages"),
	enrollmentYear: integer("enrollment_year"),
	enrollmentOpen: boolean("enrollment_open"),
	monthlyPrice: integer("monthly_price"),
	averageRating: doublePrecision("average_rating"),
	ratingsCount: integer("ratings_count"),
	favoritesCount: integer("favorites_count"),
	rankingScore: doublePrecision("ranking_score"),
	isFeatured: boolean("is_featured"),
	isVerified: boolean("is_verified"),
	ownerId: uuid("owner_id"),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

// ─────────────────────────────────────────────────────────────────────────
// SECTION 2: TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

type ChatBody = {
	message?: string;
};

type ChatSource = {
	title: string;
	uri: string;
};

type SchoolForCard = {
	id: string;
	name: string | null;
	coverImageUrl: string | null;
	city: string | null;
	monthlyPrice: number | null;
	averageRating: number | null;
};

type WebSchool = {
	source: "web";
	name: string;
	description?: string;
	city?: string;
	url?: string;
	price?: string;
	level?: string;
};

// ─────────────────────────────────────────────────────────────────────────
// SECTION 3: CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

const FALLBACK_MODELS = [
	"gemini-2.5-flash",
	"gemini-flash-latest",
	"gemini-2.0-flash-001",
	"gemini-2.0-flash-lite-001",
];

// ─────────────────────────────────────────────────────────────────────────
// SECTION 4: UTILITY FUNCTIONS - URL NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Fix malformed URLs from Gemini grounding API
// Handles: http/https URLs, relative paths, grounding-api-redirect paths

function normalizeExternalUrl(rawUrl?: string): string | undefined {
	if (!rawUrl) return undefined;
	const trimmed = rawUrl.trim();
	if (!trimmed) return undefined;

	try {
		if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
			return new URL(trimmed).toString();
		}

		if (trimmed.startsWith("/")) {
			return new URL(trimmed, "https://www.google.com").toString();
		}

		if (trimmed.startsWith("grounding-api-redirect/")) {
			return new URL(`/${trimmed}`, "https://www.google.com").toString();
		}

		return new URL(trimmed, "https://").toString();
	} catch {
		return undefined;
	}
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 5: UTILITY FUNCTIONS - STRING SIMILARITY
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Find schools by name similarity using Levenshtein distance

// Similarity match para encontrar escuelas por nombre
function levenshteinDistance(a: string, b: string): number {
	const aLower = a.toLowerCase();
	const bLower = b.toLowerCase();
	const matrix: number[][] = [];

	for (let i = 0; i <= bLower.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= aLower.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= bLower.length; i++) {
		for (let j = 1; j <= aLower.length; j++) {
			if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}

	return matrix[bLower.length][aLower.length];
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 6: UTILITY FUNCTIONS - WEB SCHOOLS EXTRACTION
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Parse [WEB_SCHOOLS_JSON] blocks from Gemini responses

function extractWebSchools(reply: string): WebSchool[] {
	try {
		const match = reply.match(/\[WEB_SCHOOLS_JSON\]([\s\S]*?)\[\/WEB_SCHOOLS_JSON\]/);
		if (!match) return [];

		const jsonStr = match[1];
		const parsed = JSON.parse(jsonStr) as {
			schools?: Array<{
				name: string;
				city?: string;
				description?: string;
				level?: string;
				url?: string;
			}>;
		};

		if (!parsed.schools || !Array.isArray(parsed.schools)) return [];

		return parsed.schools.map((s) => ({
			source: "web" as const,
			name: s.name,
			city: s.city,
			description: s.description,
			level: s.level,
			url: normalizeExternalUrl(s.url),
		}));
	} catch {
		return [];
	}
}

function stripWebSchoolsJson(reply: string): string {
	return reply.replace(/\s*\[WEB_SCHOOLS_JSON\][\s\S]*?\[\/WEB_SCHOOLS_JSON\]\s*/g, "").trim();
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 7: SCHOOL MATCHING FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Find schools mentioned in AI response and pick relevant ones

function findMentionedSchools(
	reply: string,
	schoolsList: Array<{ id: string; name: string | null }>,
): string[] {
	const mentioned = new Set<string>();
	const replyLower = reply.toLowerCase();

	for (const school of schoolsList) {
		if (!school.name) continue;

		// Búsqueda exacta o muy similar
		if (replyLower.includes(school.name.toLowerCase())) {
			mentioned.add(school.id);
			continue;
		}

		// Búsqueda por similitud (Levenshtein)
		const parts = school.name.split(/\s+/);
		for (const part of parts) {
			if (part.length < 3) continue;
			if (replyLower.includes(part.toLowerCase())) {
				mentioned.add(school.id);
				break;
			}
		}
	}

	return Array.from(mentioned);
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 8: AI SYSTEM INSTRUCTION BUILDER
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Build system prompt for Gemini with school database context

function buildSystemInstruction(
	schoolsData: Array<{
		name: string | null;
		monthlyPrice: number | null;
		address: string | null;
		city: string | null;
		educationalLevel: string | null;
	}>,
	coursesData?: Array<{
		name: string | null;
		price: number | null;
		modality: string | null;
		city: string | null;
		schoolName: string | null;
	}>
) {
	return [
		"Eres el Asistente de Skoolia.",
		"Primero debes usar Google Search para verificar información pública relevante cuando la consulta lo amerite y luego combinarla con la base de datos.",
		"No inventes datos. Si algo no aparece en la base de datos o no se puede verificar en la web, dilo explícitamente.",
		"Si la pregunta es sobre escuelas o cursos, usa la base de datos de Skoolia como fuente principal y la web como apoyo para validar o complementar.",
		"Responde en español de forma clara y breve.",
		"Cuando menciones escuelas o cursos de la base de datos, incluye siempre el nombre completo exacto.",
		"",
		"IMPORTANTE: Si devuelves escuelas o cursos encontrados en internet, SOLO incluye URLs oficiales de la plataforma de la escuela o curso (el sitio web institucional de la escuela o la página oficial del curso). NO incluyas enlaces a periódicos, blogs, directorios, Wikipedia, ni páginas informativas externas. Si no encuentras la URL oficial, deja el campo url vacío o no incluyas ese resultado.",
		"",
		"AL FINAL DE TU RESPUESTA, si encontraste escuelas en internet, añade un bloque JSON así:",
		"[WEB_SCHOOLS_JSON]",
		"{",
		'  "schools": [',
		'    { "name": "Nombre Escuela", "city": "Ciudad", "description": "Breve desc", "level": "Primaria/Secundaria/etc", "url": "https://..."  },',
		'    { ... }',
		"  ]",
		"}",
		"[/WEB_SCHOOLS_JSON]",
		"",
		"Si encontraste cursos en internet, añade un bloque JSON así:",
		"[WEB_COURSES_JSON]",
		"{",
		'  "courses": [',
		'    { "name": "Nombre Curso", "school": "Escuela", "city": "Ciudad", "description": "Breve desc", "modality": "presencial/online/híbrido", "price": "Precio", "url": "https://..."  },',
		'    { ... }',
		"  ]",
		"}",
		"[/WEB_COURSES_JSON]",
		"",
		"NO incluyas estos JSON si no hay resultados encontrados en internet.",
		"",
		"Datos de escuelas (Postgres):",
		JSON.stringify(schoolsData),
		coursesData ? ["", "Datos de cursos (Postgres):", JSON.stringify(coursesData)].join("\n") : ""
	].join("\n");
}
// Extraer cursos web de la respuesta IA
function extractWebCourses(reply: string): Array<{
	source: "web";
	name: string;
	school?: string;
	city?: string;
	description?: string;
	modality?: string;
	price?: string;
	url?: string;
}> {
	try {
		const match = reply.match(/\[WEB_COURSES_JSON\]([\s\S]*?)\[\/WEB_COURSES_JSON\]/);
		if (!match) return [];
		const jsonStr = match[1];
		const parsed = JSON.parse(jsonStr) as {
			courses?: Array<{
				name: string;
				school?: string;
				city?: string;
				description?: string;
				modality?: string;
				price?: string;
				url?: string;
			}>;
		};
		if (!parsed.courses || !Array.isArray(parsed.courses)) return [];
		return parsed.courses.map((c) => ({
			source: "web" as const,
			name: c.name,
			school: c.school,
			city: c.city,
			description: c.description,
			modality: c.modality,
			price: c.price,
			url: normalizeExternalUrl(c.url),
		}));
	} catch {
		return [];
	}
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 9: ERROR & SOURCE EXTRACTION UTILITIES
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Detect quota errors and extract citations from Gemini

function isQuotaError(error: unknown): boolean {
	const text = error instanceof Error ? error.message.toLowerCase() : "";
	return (
		text.includes("429") ||
		text.includes("quota exceeded") ||
		text.includes("too many requests")
	);
}

function extractSources(response: unknown): ChatSource[] {
	const candidate = (response as {
		candidates?: Array<{
			citationMetadata?: {
				citations?: Array<{
					uri?: string;
					title?: string;
				}>;
			};
			groundingMetadata?: {
				groundingChunks?: Array<{
					web?: {
						uri?: string;
						title?: string;
					};
				}>;
			};
		}>;
	})?.candidates?.[0];

	const citationSources = candidate?.citationMetadata?.citations ?? [];
	const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];

	const sources: ChatSource[] = [];

	for (const citation of citationSources) {
		const uri = normalizeExternalUrl(citation.uri);
		if (!uri) continue;
		sources.push({
			title: citation.title ?? uri,
			uri,
		});
	}

	for (const chunk of groundingChunks) {
		const uri = normalizeExternalUrl(chunk.web?.uri);
		if (!uri) continue;
		if (sources.some((source) => source.uri === uri)) continue;
		sources.push({
			title: chunk.web?.title ?? uri,
			uri,
		});
	}

	return sources;
}

function extractUrlsFromText(text: string): ChatSource[] {
	const matches = text.match(/https?:\/\/[^\s)\]]+/g) ?? [];
	const unique = Array.from(new Set(matches.map((match) => normalizeExternalUrl(match)).filter(Boolean) as string[]));
	return unique.map((uri) => ({ title: uri, uri }));
}

function normalizeText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function normalizeCityToken(value: string): string {
	const normalized = normalizeText(value);

	if (
		normalized === "cdmx" ||
		normalized === "ciudad de mexico" ||
		normalized === "mexico df" ||
		normalized === "df"
	) {
		return "ciudad de mexico";
	}

	return normalized;
}

function extractRequestedCity<T extends { city: string | null }>(
	userMessage: string,
	schoolsData: T[],
): string | null {
	const query = normalizeText(userMessage);

	if (/\b(cdmx|ciudad de mexico|mexico df|df)\b/.test(query)) {
		return "ciudad de mexico";
	}

	const knownCities = Array.from(
		new Set(
			schoolsData
				.map((school) => school.city)
				.filter((city): city is string => Boolean(city?.trim()))
				.map((city) => normalizeCityToken(city)),
		),
	).sort((a, b) => b.length - a.length);

	for (const city of knownCities) {
		if (query.includes(city)) {
			return city;
		}
	}

	return null;
}

function cityMatches(city: string | null, requestedCity: string): boolean {
	if (!city) return false;
	return normalizeCityToken(city) === requestedCity;
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 10: DATABASE FALLBACK - QUOTA ERROR HANDLING (429)
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Provide school recommendations from database when Gemini API quota exceeded
// This is critical for user experience during API quota scenarios

function pickSchoolsByQuery<T extends {
	name: string | null;
	monthlyPrice: number | null;
	address: string | null;
	city: string | null;
	educationalLevel: string | null;
}>(userMessage: string, schoolsData: T[]): T[] {
	const query = normalizeText(userMessage);
	const requestedCity = extractRequestedCity(userMessage, schoolsData);

	const cityScopedData = requestedCity
		? schoolsData.filter((school) => cityMatches(school.city, requestedCity))
		: schoolsData;

	const filtered = cityScopedData.filter((school) => {
		const city = normalizeCityToken(school.city ?? "");
		const level = normalizeText(school.educationalLevel ?? "");
		const name = normalizeText(school.name ?? "");
		const address = normalizeText(school.address ?? "");
		return (
			query.includes(city) ||
			query.includes(level) ||
			name.includes(query) ||
			query.includes(name) ||
			address.includes(query)
		);
	});

	return (filtered.length ? filtered : cityScopedData).slice(0, 10);
}

// Builds fallback reply using database when Gemini API quota exceeded
function buildDatabaseFallbackReply(
	userMessage: string,
	schoolsData: Array<{
		name: string | null;
		monthlyPrice: number | null;
		address: string | null;
		city: string | null;
		educationalLevel: string | null;
	}>,
) {
	const result = pickSchoolsByQuery(userMessage, schoolsData).slice(0, 5);
	if (!result.length) {
		return "Por el momento no hay escuelas disponibles en la base de datos para responder tu consulta.";
	}

	const lines = result.map((school, index) => {
		const parts = [
			`${index + 1}. ${school.name ?? "Escuela sin nombre"}`,
			school.educationalLevel ? `nivel: ${school.educationalLevel}` : null,
			school.city ? `ciudad: ${school.city}` : null,
			school.address ? `direccion: ${school.address}` : null,
			typeof school.monthlyPrice === "number" ? `costo mensual: $${school.monthlyPrice}` : null,
		].filter(Boolean);
		return parts.join(" | ");
	});

	return [
		"No pude usar Gemini en este momento por limite de cuota, pero te comparto resultados directos de la base de datos:",
		...lines,
	].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 11: GEMINI API - MODEL FALLBACK STRATEGY
// ─────────────────────────────────────────────────────────────────────────
// Purpose: Try multiple Gemini models with automatic fallback on errors
// Strategy: Preferred model → gemini-2.5-flash → gemini-flash-latest → lite models

async function generateWithModelFallback({
	apiKey,
	systemInstruction,
	message,
	preferredModel,
}: {
	apiKey: string;
	systemInstruction: string;
	message: string;
	preferredModel?: string;
}) {
	const candidates = [
		preferredModel?.trim(),
		...FALLBACK_MODELS,
	].filter((value, index, array): value is string => {
		if (!value) return false;
		return array.indexOf(value) === index;
	});

	let lastError: unknown;

	for (const modelName of candidates) {
		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						contents: [{ role: "user", parts: [{ text: message }] }],
						systemInstruction: { parts: [{ text: systemInstruction }] },
						tools: [{ googleSearch: { searchTypes: { webSearch: {} } } }],
					}),
				},
			);

			const result = (await response.json()) as {
				candidates?: Array<{
					content?: {
						parts?: Array<{ text?: string }>;
					};
				}>;
			};

			if (!response.ok) {
				throw new Error(JSON.stringify(result));
			}

			const reply =
				result.candidates?.[0]?.content?.parts
					?.map((part) => part.text ?? "")
					.join("") ?? "";

			return {
				reply,
				modelUsed: modelName,
				sources: extractSources(result),
			};
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 12: MAIN API ROUTE HANDLER - POST /api/chat
// ─────────────────────────────────────────────────────────────────────────
// Flow:
//   1. Validate API key and database connection
//   2. Fetch schools from database
//   3. Build AI system prompt with school context
//   4. Call Gemini API with fallback strategy
//   5. Extract recommendations, web schools, and sources
//   6. Handle 429 errors with database fallback
//   7. Return structured response to frontend


export async function POST(request: Request) {
	const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	const databaseUrl = process.env.DATABASE_URL;
	const preferredModel = process.env.GEMINI_MODEL;

	if (!apiKey) {
		return NextResponse.json(
			{ error: "Falta GOOGLE_GENERATIVE_AI_API_KEY en variables de entorno." },
			{ status: 500 },
		);
	}

	if (!databaseUrl) {
		return NextResponse.json(
			{ error: "Falta DATABASE_URL en variables de entorno." },
			{ status: 500 },
		);
	}

	let body: ChatBody;
	try {
		body = (await request.json()) as ChatBody;
	} catch {
		return NextResponse.json(
			{ error: "Body invalido. Se esperaba JSON." },
			{ status: 400 },
		);
	}

	const userMessage = body.message?.trim();
	if (!userMessage) {
		return NextResponse.json(
			{ error: "El campo 'message' es obligatorio." },
			{ status: 400 },
		);
	}

	const client = postgres(databaseUrl, { max: 1 });
	const db = drizzle(client);

	try {
		// Obtener escuelas y cursos
		const allSchools = await db
			.select({
				id: schools.id,
				name: schools.name,
				monthlyPrice: schools.monthlyPrice,
				address: schools.address,
				city: schools.city,
				educationalLevel: schools.educationalLevel,
				coverImageUrl: schools.coverImageUrl,
				description: schools.description,
				averageRating: schools.averageRating,
				ratingsCount: schools.ratingsCount,
				favoritesCount: schools.favoritesCount,
			})
			.from(schools)
			.limit(200);

		// Cargar cursos si existe tabla courses
		let allCourses: Array<any> = [];
		try {
			let coursesSchema;
			try {
				// @ts-ignore
				coursesSchema = await import("../../../drizzle-schemas/courses");
			} catch {
				// @ts-ignore
				coursesSchema = await import("../../../../api/drizzle/schemas/courses");
			}
			const { courses } = coursesSchema;
			allCourses = await db
				.select({
					id: courses.id,
					name: courses.name,
					price: courses.price,
					modality: courses.modality,
					city: courses.city,
					schoolId: courses.schoolId,
				})
				.from(courses)
				.limit(200);
			// Mapear nombre de escuela
			allCourses = allCourses.map((c) => ({
				...c,
				schoolName: allSchools.find((s) => s.id === c.schoolId)?.name ?? null,
			}));
		} catch { }

		// Para el sistema prompt, mandar escuelas y cursos
		const schoolsForPrompt = allSchools.map((s) => ({
			name: s.name,
			monthlyPrice: s.monthlyPrice,
			address: s.address,
			city: s.city,
			educationalLevel: s.educationalLevel,
		}));
		const coursesForPrompt = allCourses.map((c) => ({
			name: c.name,
			price: c.price,
			modality: c.modality,
			city: c.city,
			schoolName: c.schoolName,
		}));

		const systemInstruction = buildSystemInstruction(schoolsForPrompt, coursesForPrompt);
		const { reply, modelUsed, sources } = await generateWithModelFallback({
			apiKey,
			systemInstruction,
			message: userMessage,
			preferredModel,
		});

		// Extraer escuelas y cursos web y limpiar el texto de respuesta
		const webSchools = extractWebSchools(reply);
		const webCourses = extractWebCourses(reply);
		let cleanReply = stripWebSchoolsJson(reply);
		cleanReply = cleanReply.replace(/\s*\[WEB_COURSES_JSON\][\s\S]*?\[\/WEB_COURSES_JSON\]\s*/g, "").trim();

		// Identificar qué escuelas menciona la IA
		const mentionedSchoolIds = findMentionedSchools(
			cleanReply,
			allSchools.map((s) => ({ id: s.id, name: s.name })),
		);

		// Obtener datos completos de escuelas mencionadas (máximo 10 para no sobrecargar)
		const recommendedSchools: SchoolForCard[] = mentionedSchoolIds
			.slice(0, 10)
			.map((id) => {
				const school = allSchools.find((s) => s.id === id);
				if (!school) return null;
				return {
					id: school.id,
					name: school.name,
					coverImageUrl: school.coverImageUrl?.toString() ?? null,
					city: school.city,
					monthlyPrice: school.monthlyPrice,
					averageRating: school.averageRating,
				};
			})
			.filter((s) => s !== null);

		// Identificar cursos mencionados por IA (por nombre)
		const mentionedCourseNames = allCourses.length
			? allCourses
				.filter((c) => cleanReply.toLowerCase().includes((c.name ?? "").toLowerCase()))
				.map((c) => c.id)
			: [];
		const recommendedCourses = mentionedCourseNames
			.slice(0, 10)
			.map((id) => {
				const course = allCourses.find((c) => c.id === id);
				if (!course) return null;
				return {
					id: course.id,
					name: course.name,
					price: course.price,
					modality: course.modality,
					city: course.city,
					schoolName: course.schoolName,
				};
			})
			.filter((c) => c !== null);

		const requestedCity = extractRequestedCity(userMessage, allSchools);
		const cityFilteredRecommended = requestedCity
			? recommendedSchools.filter((school) => cityMatches(school.city, requestedCity))
			: recommendedSchools;
		const finalRecommendedSchools = cityFilteredRecommended.length
			? cityFilteredRecommended
			: (recommendedSchools.length
				? recommendedSchools
				: pickSchoolsByQuery(userMessage, allSchools).map((school) => ({
					id: school.id,
					name: school.name,
					coverImageUrl: school.coverImageUrl?.toString() ?? null,
					city: school.city,
					monthlyPrice: school.monthlyPrice,
					averageRating: school.averageRating,
				}))
			);

		const normalizedSources = sources.length ? sources : extractUrlsFromText(cleanReply);

		return NextResponse.json({
			reply: cleanReply,
			schoolsCount: allSchools.length,
			modelUsed,
			sources: normalizedSources,
			recommendedSchools: finalRecommendedSchools,
			webSchools,
			recommendedCourses,
			webCourses,
		});
	} catch (error) {
		if (isQuotaError(error)) {
			const fallbackSchools = await db
				.select({
					id: schools.id,
					name: schools.name,
					coverImageUrl: schools.coverImageUrl,
					monthlyPrice: schools.monthlyPrice,
					address: schools.address,
					city: schools.city,
					educationalLevel: schools.educationalLevel,
					averageRating: schools.averageRating,
				})
				.from(schools)
				.limit(200);

			const fallbackRecommendedSchools: SchoolForCard[] = pickSchoolsByQuery(
				userMessage,
				fallbackSchools,
			).map((school) => ({
				id: school.id,
				name: school.name,
				coverImageUrl: school.coverImageUrl?.toString() ?? null,
				city: school.city,
				monthlyPrice: school.monthlyPrice,
				averageRating: school.averageRating,
			}));

			return NextResponse.json({
				reply: buildDatabaseFallbackReply(userMessage, fallbackSchools),
				schoolsCount: fallbackSchools.length,
				modelUsed: null,
				sources: [],
				recommendedSchools: fallbackRecommendedSchools,
				webSchools: [],
				recommendedCourses: [],
				webCourses: [],
				fallback: "database-only",
				warning:
					"Gemini esta temporalmente sin cuota (429). Se respondio solo con datos de Postgres.",
			});
		}

		const message = error instanceof Error ? error.message : "Error desconocido";
		return NextResponse.json(
			{ error: `No se pudo procesar el chat: ${message}` },
			{ status: 500 },
		);
	} finally {
		await client.end({ timeout: 5 });
	}
}
