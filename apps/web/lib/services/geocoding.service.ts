type GeocodeMatchType = "exact" | "city";

type GeocodeSuccess = {
  success: true;
  data: {
    lat: number;
    lng: number;
    type: GeocodeMatchType;
  };
};

type GeocodeFailure = {
  success: false;
  error: string;
};

type GeocodeResult = GeocodeSuccess | GeocodeFailure;

type NominatimResult = {
  lat: string;
  lon: string;
};

async function searchNominatim(query: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "es",
      "User-Agent": "Skoolia/1.0 (contacto@skoolia.mx)",
    },
  });

  if (!response.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as NominatimResult[]) : [];
}

function buildSuccess(
  result: NominatimResult,
  type: GeocodeMatchType,
): GeocodeSuccess {
  return {
    success: true,
    data: {
      lat: Number.parseFloat(result.lat),
      lng: Number.parseFloat(result.lon),
      type,
    },
  };
}

export const geocodingService = {
  async geocodeAddressWithFallback(
    address: string,
    cityOrState: string,
  ): Promise<GeocodeResult> {
    const normalizedAddress = address.trim();
    const normalizedCityOrState = cityOrState.trim();

    if (!normalizedCityOrState) {
      return {
        success: false,
        error: "Selecciona un estado para ubicar la dirección.",
      };
    }

    try {
      if (normalizedAddress) {
        const exactMatches = await searchNominatim(
          `${normalizedAddress}, ${normalizedCityOrState}, México`,
        );

        if (exactMatches.length > 0) {
          return buildSuccess(exactMatches[0], "exact");
        }
      }

      const fallbackMatches = await searchNominatim(
        `${normalizedCityOrState}, México`,
      );

      if (fallbackMatches.length > 0) {
        return buildSuccess(fallbackMatches[0], "city");
      }

      return {
        success: false,
        error: "No pudimos encontrar esa ubicación.",
      };
    } catch {
      return {
        success: false,
        error: "No pudimos consultar el servicio de mapas.",
      };
    }
  },
};
