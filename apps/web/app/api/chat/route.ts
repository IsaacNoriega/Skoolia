import { drizzle } from "drizzle-orm/postgres-js";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";

const schools = pgTable("schools", {
	name: text("name"),
	monthlyPrice: integer("monthly_price"),
	address: text("address"),
	city: text("city"),
	educationalLevel: text("educational_level"),
});

type ChatBody = {
	message?: string;
};

type ChatSource = {
	title: string;
	uri: string;
};

const FALLBACK_MODELS = [
	"gemini-2.5-flash",
	"gemini-flash-latest",
	"gemini-2.0-flash-001",
	"gemini-2.0-flash-lite-001",
];

function buildSystemInstruction(
	schoolsData: Array<{
		name: string | null;
		monthlyPrice: number | null;
		address: string | null;
		city: string | null;
		educationalLevel: string | null;
	}>,
) {
	return [
		"Eres el Asistente de Skoolia.",
		"Primero debes usar Google Search para verificar informacion publica relevante cuando la consulta lo amerite y luego combinarla con la base de datos.",
		"No inventes datos. Si algo no aparece en la base de datos o no se puede verificar en la web, dilo explicitamente.",
		"Si la pregunta es sobre escuelas, usa la base de datos de Skoolia como fuente principal y la web como apoyo para validar o complementar.",
		"Responde en espanol de forma clara y breve.",
		"",
		"Datos de escuelas (Postgres):",
		JSON.stringify(schoolsData),
	].join("\n");
}

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
		if (!citation.uri) continue;
		sources.push({
			title: citation.title ?? citation.uri,
			uri: citation.uri,
		});
	}

	for (const chunk of groundingChunks) {
		const uri = chunk.web?.uri;
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
	const unique = Array.from(new Set(matches));
	return unique.map((uri) => ({ title: uri, uri }));
}

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
	const query = userMessage.toLowerCase();
	const filtered = schoolsData.filter((school) => {
		const city = (school.city ?? "").toLowerCase();
		const level = (school.educationalLevel ?? "").toLowerCase();
		const name = (school.name ?? "").toLowerCase();
		const address = (school.address ?? "").toLowerCase();
		return (
			query.includes(city) ||
			query.includes(level) ||
			name.includes(query) ||
			address.includes(query)
		);
	});

	const result = (filtered.length ? filtered : schoolsData).slice(0, 5);
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
		const schoolsData = await db
			.select({
				name: schools.name,
				monthlyPrice: schools.monthlyPrice,
				address: schools.address,
				city: schools.city,
				educationalLevel: schools.educationalLevel,
			})
			.from(schools)
			.limit(200);

		const systemInstruction = buildSystemInstruction(schoolsData);
		const { reply, modelUsed, sources } = await generateWithModelFallback({
			apiKey,
			systemInstruction,
			message: userMessage,
			preferredModel,
		});

		const normalizedSources = sources.length ? sources : extractUrlsFromText(reply);

		return NextResponse.json({
			reply,
			schoolsCount: schoolsData.length,
			modelUsed,
			sources: normalizedSources,
		});
	} catch (error) {
		if (isQuotaError(error)) {
			const fallbackSchools = await db
				.select({
					name: schools.name,
					monthlyPrice: schools.monthlyPrice,
					address: schools.address,
					city: schools.city,
					educationalLevel: schools.educationalLevel,
				})
				.from(schools)
				.limit(200);

			return NextResponse.json({
				reply: buildDatabaseFallbackReply(userMessage, fallbackSchools),
				schoolsCount: fallbackSchools.length,
				modelUsed: null,
				sources: [],
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
