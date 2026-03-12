/**
 * Hardcoded country population data used as "population" markers on the map.
 * Each entry represents a country with its approximate centroid and 2024 population estimate.
 */

import type { MapMarker } from "../types";

export type CountryPopulation = {
  id: string;
  country: string;
  population: number;
  coordinates: { lat: number; lng: number };
};

export const COUNTRY_POPULATIONS: CountryPopulation[] = [
  { id: "pop-cn", country: "China", population: 1_425_000_000, coordinates: { lat: 35.86, lng: 104.20 } },
  { id: "pop-in", country: "India", population: 1_428_000_000, coordinates: { lat: 20.59, lng: 78.96 } },
  { id: "pop-us", country: "United States", population: 339_000_000, coordinates: { lat: 37.09, lng: -95.71 } },
  { id: "pop-id", country: "Indonesia", population: 277_000_000, coordinates: { lat: -0.79, lng: 113.92 } },
  { id: "pop-pk", country: "Pakistan", population: 240_000_000, coordinates: { lat: 30.37, lng: 69.34 } },
  { id: "pop-ng", country: "Nigeria", population: 224_000_000, coordinates: { lat: 9.08, lng: 7.49 } },
  { id: "pop-br", country: "Brazil", population: 216_000_000, coordinates: { lat: -14.24, lng: -51.93 } },
  { id: "pop-bd", country: "Bangladesh", population: 173_000_000, coordinates: { lat: 23.68, lng: 90.36 } },
  { id: "pop-ru", country: "Russia", population: 144_000_000, coordinates: { lat: 61.52, lng: 105.32 } },
  { id: "pop-mx", country: "Mexico", population: 129_000_000, coordinates: { lat: 23.63, lng: -102.55 } },
  { id: "pop-jp", country: "Japan", population: 124_000_000, coordinates: { lat: 36.20, lng: 138.25 } },
  { id: "pop-et", country: "Ethiopia", population: 127_000_000, coordinates: { lat: 9.14, lng: 40.49 } },
  { id: "pop-ph", country: "Philippines", population: 117_000_000, coordinates: { lat: 12.88, lng: 121.77 } },
  { id: "pop-eg", country: "Egypt", population: 112_000_000, coordinates: { lat: 26.82, lng: 30.80 } },
  { id: "pop-cd", country: "DR Congo", population: 102_000_000, coordinates: { lat: -4.04, lng: 21.76 } },
  { id: "pop-de", country: "Germany", population: 84_000_000, coordinates: { lat: 51.17, lng: 10.45 } },
  { id: "pop-tr", country: "Turkey", population: 85_000_000, coordinates: { lat: 38.96, lng: 35.24 } },
  { id: "pop-ir", country: "Iran", population: 89_000_000, coordinates: { lat: 32.43, lng: 53.69 } },
  { id: "pop-th", country: "Thailand", population: 72_000_000, coordinates: { lat: 15.87, lng: 100.99 } },
  { id: "pop-gb", country: "United Kingdom", population: 68_000_000, coordinates: { lat: 55.38, lng: -3.44 } },
  { id: "pop-fr", country: "France", population: 68_000_000, coordinates: { lat: 46.23, lng: 2.21 } },
  { id: "pop-it", country: "Italy", population: 59_000_000, coordinates: { lat: 41.87, lng: 12.57 } },
  { id: "pop-za", country: "South Africa", population: 60_000_000, coordinates: { lat: -30.56, lng: 22.94 } },
  { id: "pop-tz", country: "Tanzania", population: 66_000_000, coordinates: { lat: -6.37, lng: 34.89 } },
  { id: "pop-mm", country: "Myanmar", population: 54_000_000, coordinates: { lat: 21.91, lng: 95.96 } },
  { id: "pop-ke", country: "Kenya", population: 55_000_000, coordinates: { lat: -0.02, lng: 37.91 } },
  { id: "pop-kr", country: "South Korea", population: 52_000_000, coordinates: { lat: 35.91, lng: 127.77 } },
  { id: "pop-co", country: "Colombia", population: 52_000_000, coordinates: { lat: 4.57, lng: -74.30 } },
  { id: "pop-es", country: "Spain", population: 47_000_000, coordinates: { lat: 40.46, lng: -3.75 } },
  { id: "pop-ar", country: "Argentina", population: 46_000_000, coordinates: { lat: -38.42, lng: -63.62 } },
  { id: "pop-ug", country: "Uganda", population: 48_000_000, coordinates: { lat: 1.37, lng: 32.29 } },
  { id: "pop-ua", country: "Ukraine", population: 37_000_000, coordinates: { lat: 48.38, lng: 31.17 } },
  { id: "pop-dz", country: "Algeria", population: 45_000_000, coordinates: { lat: 28.03, lng: 1.66 } },
  { id: "pop-sd", country: "Sudan", population: 47_000_000, coordinates: { lat: 12.86, lng: 30.22 } },
  { id: "pop-iq", country: "Iraq", population: 44_000_000, coordinates: { lat: 33.22, lng: 43.68 } },
  { id: "pop-pl", country: "Poland", population: 38_000_000, coordinates: { lat: 51.92, lng: 19.15 } },
  { id: "pop-ca", country: "Canada", population: 40_000_000, coordinates: { lat: 56.13, lng: -106.35 } },
  { id: "pop-ma", country: "Morocco", population: 37_000_000, coordinates: { lat: 31.79, lng: -7.09 } },
  { id: "pop-sa", country: "Saudi Arabia", population: 36_000_000, coordinates: { lat: 23.89, lng: 45.08 } },
  { id: "pop-au", country: "Australia", population: 26_000_000, coordinates: { lat: -25.27, lng: 133.78 } },
  { id: "pop-pe", country: "Peru", population: 34_000_000, coordinates: { lat: -9.19, lng: -75.02 } },
  { id: "pop-vn", country: "Vietnam", population: 99_000_000, coordinates: { lat: 14.06, lng: 108.28 } },
  { id: "pop-ve", country: "Venezuela", population: 29_000_000, coordinates: { lat: 6.42, lng: -66.59 } },
  { id: "pop-gh", country: "Ghana", population: 34_000_000, coordinates: { lat: 7.95, lng: -1.02 } },
  { id: "pop-mz", country: "Mozambique", population: 33_000_000, coordinates: { lat: -18.67, lng: 35.53 } },
  { id: "pop-np", country: "Nepal", population: 31_000_000, coordinates: { lat: 28.39, lng: 84.12 } },
  { id: "pop-my", country: "Malaysia", population: 34_000_000, coordinates: { lat: 4.21, lng: 101.98 } },
  { id: "pop-ci", country: "Ivory Coast", population: 29_000_000, coordinates: { lat: 7.54, lng: -5.55 } },
  { id: "pop-cm", country: "Cameroon", population: 28_000_000, coordinates: { lat: 7.37, lng: 12.35 } },
  { id: "pop-ao", country: "Angola", population: 36_000_000, coordinates: { lat: -11.20, lng: 17.87 } },
  { id: "pop-cl", country: "Chile", population: 20_000_000, coordinates: { lat: -35.68, lng: -71.54 } },
  { id: "pop-nl", country: "Netherlands", population: 18_000_000, coordinates: { lat: 52.13, lng: 5.29 } },
  { id: "pop-se", country: "Sweden", population: 10_500_000, coordinates: { lat: 60.13, lng: 18.64 } },
  { id: "pop-no", country: "Norway", population: 5_500_000, coordinates: { lat: 60.47, lng: 8.47 } },
  { id: "pop-nz", country: "New Zealand", population: 5_200_000, coordinates: { lat: -40.90, lng: 174.89 } },
  { id: "pop-sg", country: "Singapore", population: 6_000_000, coordinates: { lat: 1.35, lng: 103.82 } },
  { id: "pop-ae", country: "UAE", population: 10_000_000, coordinates: { lat: 23.42, lng: 53.85 } },
  { id: "pop-ch", country: "Switzerland", population: 8_800_000, coordinates: { lat: 46.82, lng: 8.23 } },
  { id: "pop-il", country: "Israel", population: 9_800_000, coordinates: { lat: 31.05, lng: 34.85 } },
  { id: "pop-pt", country: "Portugal", population: 10_300_000, coordinates: { lat: 39.40, lng: -8.22 } },
];

/** Convert COUNTRY_POPULATIONS to MapMarker[] for the map */
export function populationToMarkers(): MapMarker[] {
  return COUNTRY_POPULATIONS.map((cp) => ({
    id: cp.id,
    kind: "population" as const,
    label: `${cp.country}: ${formatPopulation(cp.population)}`,
    coordinates: cp.coordinates,
    meta: {
      country: cp.country,
      population: cp.population,
      populationFormatted: formatPopulation(cp.population),
    },
  }));
}

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
