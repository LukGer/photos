/**
 * Best-effort location from embedded metadata, then GPS → reverse geocode
 * (OpenStreetMap Nominatim). See https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

let lastNominatimRequestAt = 0;

async function nominatimThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimRequestAt;
  const wait = 1100 - elapsed;
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastNominatimRequestAt = Date.now();
}

function pickString(tags: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = tags[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return "";
}

/** IPTC / XMP / vendor tags sometimes present without GPS. */
function embeddedLocationLine(tags: Record<string, unknown>): string {
  const city = pickString(tags, [
    "City",
    "city",
    "LocationCreatedCity",
    "LocationShownCity",
    "Sublocation",
    "SubLocation",
    "Location",
  ]);
  const country = pickString(tags, [
    "Country",
    "CountryName",
    "country",
    "LocationCreatedCountryName",
    "LocationShownCountryName",
  ]);
  const region = pickString(tags, [
    "ProvinceState",
    "State",
    "Region",
    "locationName",
  ]);

  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city && region && city !== region) {
    return `${city}, ${region}`;
  }
  if (city) {
    return city;
  }
  if (region && country) {
    return `${region}, ${country}`;
  }
  if (country) {
    return country;
  }
  if (region) {
    return region;
  }
  return "";
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  municipality?: string;
  county?: string;
  country?: string;
};

function formatGeocodeAddress(addr: NominatimAddress): string {
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.suburb ||
    addr.municipality ||
    addr.county;
  const country = addr.country;
  if (city && country) {
    return `${city}, ${country}`;
  }
  if (city) {
    return city;
  }
  if (country) {
    return country;
  }
  return "";
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  await nominatimThrottle();

  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    "photos-metadata/1.0 (https://nominatim.org/release-docs/develop/api/Reverse/)";

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Accept-Language": "en",
    },
  });

  if (!res.ok) {
    console.warn(`⚠️  Nominatim HTTP ${res.status} for (${lat}, ${lon})`);
    return "";
  }

  const data = (await res.json()) as {
    address?: NominatimAddress;
    display_name?: string;
  };
  const line = data.address ? formatGeocodeAddress(data.address) : "";
  if (line) {
    return line;
  }
  if (typeof data.display_name === "string" && data.display_name) {
    return data.display_name.split(",").slice(0, 2).join(",").trim();
  }
  return "";
}

/**
 * Infer a human-readable location string from merged exifr tags (`parse(file, true)`).
 */
export async function inferLocation(
  tags: Record<string, unknown> | null | undefined,
): Promise<string> {
  if (!tags || typeof tags !== "object") {
    return "";
  }

  const embedded = embeddedLocationLine(tags);
  if (embedded) {
    return embedded;
  }

  const lat = tags.latitude;
  const lon = tags.longitude;
  if (typeof lat === "number" && typeof lon === "number") {
    try {
      return await reverseGeocode(lat, lon);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`⚠️  Reverse geocode failed: ${message}`);
      return "";
    }
  }

  return "";
}
