export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  locality?: string;
  adminAreaLevel1?: string; // state
  adminAreaLevel2?: string; // LGA/county
  country?: string;
  postalCode?: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set; geocoding disabled");
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("region", "au");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      console.error("Geocoding failed:", data.status, data.error_message);
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    const component = (type: string) =>
      result.address_components.find((c: any) => c.types.includes(type))?.long_name;

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      locality: component("locality"),
      adminAreaLevel1: component("administrative_area_level_1"),
      adminAreaLevel2: component("administrative_area_level_2"),
      country: component("country"),
      postalCode: component("postal_code"),
    };
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}
