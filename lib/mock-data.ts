// Curated North Idaho parcels for the MVP.
// Centroids are real lat/lng; geometries are synthesized squares around the centroid sized by acres.
// Owner names are intentionally placeholders — production loads real records from county GIS.

import type { Parcel, ParcelEnrichment, County } from "./types";
import { squarePolygonFromCentroid } from "./geo";
import { computeScores } from "./scoring";
import { deterministicSummary } from "./ai-summary";

interface Seed {
  apn: string;
  county: County;
  acres: number;
  lat: number;
  lng: number;
  ownerCity?: string;
  ownerState?: string;
  landUse?: string;
  e: ParcelEnrichment;
}

const SEEDS: Seed[] = [
  // ---------- BONNER COUNTY ----------
  {
    apn: "RP54N02W123450", county: "Bonner", acres: 7.8, lat: 48.4051, lng: -116.4392,
    ownerCity: "Pasadena", ownerState: "CA", landUse: "Vacant rural",
    e: {
      slopeDeg: 12, forestCoverPct: 82, nearestTown: "Sandpoint", nearestTownMiles: 14.5,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 18, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 16,
      publicLandAdjacent: false, publicLandNeighborMiles: 0.4, waterFeature: "Pack River", waterMiles: 0.2,
      roadAccess: "Gravel", elevationFt: 2390, aspect: "S",
    },
  },
  {
    apn: "RP56N04W004130", county: "Bonner", acres: 12.0, lat: 48.5142, lng: -116.8231,
    ownerCity: "Seattle", ownerState: "WA", landUse: "Forest land",
    e: {
      slopeDeg: 18, forestCoverPct: 88, nearestTown: "Coolin", nearestTownMiles: 9.1,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 32, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 38,
      publicLandAdjacent: true, waterFeature: "Priest Lake", waterMiles: 1.8,
      roadAccess: "Seasonal", elevationFt: 2980, aspect: "SE",
    },
  },
  {
    apn: "RP57N01W098220", county: "Bonner", acres: 5.0, lat: 48.3221, lng: -116.5871,
    ownerCity: "Sandpoint", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 8, forestCoverPct: 40, nearestTown: "Sandpoint", nearestTownMiles: 3.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 14, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 4,
      publicLandAdjacent: false, publicLandNeighborMiles: 4.2, waterFeature: "Sand Creek", waterMiles: 0.05,
      roadAccess: "Paved", elevationFt: 2120, aspect: "SW",
    },
  },
  {
    apn: "RP56N02E223300", county: "Bonner", acres: 20.0, lat: 48.1822, lng: -116.2104,
    ownerCity: "Clark Fork", ownerState: "ID", landUse: "Recreational",
    e: {
      slopeDeg: 14, forestCoverPct: 70, nearestTown: "Clark Fork", nearestTownMiles: 4.7,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 36, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 28,
      publicLandAdjacent: true, waterFeature: "Lightning Creek", waterMiles: 0.05,
      roadAccess: "Gravel", elevationFt: 2640, aspect: "S",
    },
  },
  {
    apn: "RP58N01W045110", county: "Bonner", acres: 40.0, lat: 48.5621, lng: -116.4012,
    ownerCity: "Wilmington", ownerState: "DE", landUse: "Forest land",
    e: {
      slopeDeg: 22, forestCoverPct: 84, nearestTown: "Naples", nearestTownMiles: 6.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 22, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 22,
      publicLandAdjacent: true, waterFeature: "Grouse Creek", waterMiles: 0.6,
      roadAccess: "Seasonal", elevationFt: 3380, aspect: "SE",
    },
  },
  {
    apn: "RP55N01W067700", county: "Bonner", acres: 10.0, lat: 48.2473, lng: -116.2987,
    ownerCity: "Hope", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 6, forestCoverPct: 35, nearestTown: "Hope", nearestTownMiles: 2.1,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 22, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 14,
      publicLandAdjacent: false, publicLandNeighborMiles: 2.0, waterFeature: "Pend Oreille", waterMiles: 0.5,
      roadAccess: "Paved", elevationFt: 2110, aspect: "S",
    },
  },
  {
    apn: "RP57N03W112440", county: "Bonner", acres: 80.0, lat: 48.5478, lng: -116.4912,
    ownerCity: "Spokane", ownerState: "WA", landUse: "Timber",
    e: {
      slopeDeg: 19, forestCoverPct: 90, nearestTown: "Sandpoint", nearestTownMiles: 18.0,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 19, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 21,
      publicLandAdjacent: true, waterFeature: "Pack River", waterMiles: 0.9,
      roadAccess: "Gravel", elevationFt: 3120, aspect: "SW",
    },
  },
  {
    apn: "RP54N01W134410", county: "Bonner", acres: 15.0, lat: 48.2049, lng: -116.5698,
    ownerCity: "Boise", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 11, forestCoverPct: 78, nearestTown: "Sandpoint", nearestTownMiles: 7.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 18, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 8,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.5, waterFeature: "Cocolalla Creek", waterMiles: 0.7,
      roadAccess: "Gravel", elevationFt: 2260, aspect: "E",
    },
  },
  {
    apn: "RP53N02W080600", county: "Bonner", acres: 30.0, lat: 48.0989, lng: -116.6231,
    ownerCity: "Portland", ownerState: "OR", landUse: "Recreational",
    e: {
      slopeDeg: 16, forestCoverPct: 80, nearestTown: "Cocolalla", nearestTownMiles: 3.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 26, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 16,
      publicLandAdjacent: true, waterFeature: "Cocolalla Lake", waterMiles: 1.4,
      roadAccess: "Gravel", elevationFt: 2980, aspect: "SE",
    },
  },
  {
    apn: "RP55N02W092200", county: "Bonner", acres: 8.0, lat: 48.2548, lng: -116.6012,
    ownerCity: "Dover", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 5, forestCoverPct: 45, nearestTown: "Dover", nearestTownMiles: 1.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 16, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 6,
      publicLandAdjacent: false, publicLandNeighborMiles: 5.2, waterFeature: "Pend Oreille", waterMiles: 0.4,
      roadAccess: "Paved", elevationFt: 2090, aspect: "S",
    },
  },
  {
    apn: "RP59N02W022100", county: "Bonner", acres: 35.0, lat: 48.6151, lng: -116.4892,
    ownerCity: "Sagle", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 24, forestCoverPct: 88, nearestTown: "Naples", nearestTownMiles: 5.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 25, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 26,
      publicLandAdjacent: true, waterFeature: "Pack River", waterMiles: 1.2,
      roadAccess: "Seasonal", elevationFt: 3680, aspect: "SE",
    },
  },
  {
    apn: "RP57N04W170200", county: "Bonner", acres: 25.0, lat: 48.5051, lng: -116.8472,
    ownerCity: "Coolin", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 13, forestCoverPct: 75, nearestTown: "Coolin", nearestTownMiles: 3.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 38, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 40,
      publicLandAdjacent: false, publicLandNeighborMiles: 0.6, waterFeature: "Priest Lake", waterMiles: 1.1,
      roadAccess: "Gravel", elevationFt: 2750, aspect: "S",
    },
  },
  {
    apn: "RP56N05W036650", county: "Bonner", acres: 60.0, lat: 48.4789, lng: -116.9012,
    ownerCity: "Tacoma", ownerState: "WA", landUse: "Timber",
    e: {
      slopeDeg: 28, forestCoverPct: 92, nearestTown: "Coolin", nearestTownMiles: 8.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 42, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 44,
      publicLandAdjacent: true, waterFeature: "Granite Creek", waterMiles: 0.4,
      roadAccess: "Seasonal", elevationFt: 3920, aspect: "NE",
    },
  },
  {
    apn: "RP55N03W141100", county: "Bonner", acres: 18.0, lat: 48.2891, lng: -116.7218,
    ownerCity: "Sandpoint", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 9, forestCoverPct: 55, nearestTown: "Sandpoint", nearestTownMiles: 8.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 21, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 10,
      publicLandAdjacent: false, publicLandNeighborMiles: 3.1, waterFeature: "Pend Oreille", waterMiles: 1.6,
      roadAccess: "Paved", elevationFt: 2240, aspect: "SW",
    },
  },
  {
    apn: "RP58N03W128810", county: "Bonner", acres: 50.0, lat: 48.5612, lng: -116.7245,
    ownerCity: "Coeur d'Alene", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 20, forestCoverPct: 86, nearestTown: "Naples", nearestTownMiles: 7.9,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 18, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 22,
      publicLandAdjacent: true, waterFeature: "Lake Estelle", waterMiles: 0.8,
      roadAccess: "Gravel", elevationFt: 3340, aspect: "S",
    },
  },
  {
    apn: "RP54N03W189100", county: "Bonner", acres: 6.0, lat: 48.1591, lng: -116.7889,
    ownerCity: "Cocolalla", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 7, forestCoverPct: 60, nearestTown: "Cocolalla", nearestTownMiles: 1.5,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 24, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 14,
      publicLandAdjacent: false, publicLandNeighborMiles: 4.0, waterFeature: "Cocolalla Lake", waterMiles: 0.3,
      roadAccess: "Paved", elevationFt: 2410, aspect: "E",
    },
  },
  {
    apn: "RP55N02E116430", county: "Bonner", acres: 22.0, lat: 48.2412, lng: -116.1521,
    ownerCity: "Hope", ownerState: "ID", landUse: "Recreational",
    e: {
      slopeDeg: 17, forestCoverPct: 76, nearestTown: "Clark Fork", nearestTownMiles: 6.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 31, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 22,
      publicLandAdjacent: true, waterFeature: "Pend Oreille", waterMiles: 0.9,
      roadAccess: "Gravel", elevationFt: 3180, aspect: "S",
    },
  },
  {
    apn: "RP56N03E205550", county: "Bonner", acres: 11.0, lat: 48.1421, lng: -116.0921,
    ownerCity: "Heron", ownerState: "MT", landUse: "Vacant rural",
    e: {
      slopeDeg: 21, forestCoverPct: 82, nearestTown: "Clark Fork", nearestTownMiles: 9.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 41, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 32,
      publicLandAdjacent: true, waterFeature: "Clark Fork River", waterMiles: 1.4,
      roadAccess: "Seasonal", elevationFt: 3520, aspect: "SE",
    },
  },
  {
    apn: "RP57N02W148800", county: "Bonner", acres: 5.5, lat: 48.4321, lng: -116.5512,
    ownerCity: "Sandpoint", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 4, forestCoverPct: 38, nearestTown: "Sandpoint", nearestTownMiles: 6.5,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 11, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 8,
      publicLandAdjacent: false, publicLandNeighborMiles: 2.6, waterFeature: "Sand Creek", waterMiles: 0.6,
      roadAccess: "Paved", elevationFt: 2180, aspect: "SW",
    },
  },
  {
    apn: "RP56N02W160070", county: "Bonner", acres: 14.0, lat: 48.3551, lng: -116.4012,
    ownerCity: "Sagle", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 10, forestCoverPct: 65, nearestTown: "Sandpoint", nearestTownMiles: 9.6,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 16, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 12,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.2, waterFeature: "Pack River", waterMiles: 0.8,
      roadAccess: "Gravel", elevationFt: 2470, aspect: "S",
    },
  },
  {
    apn: "RP54N04W201230", county: "Bonner", acres: 9.0, lat: 48.1212, lng: -116.7689,
    ownerCity: "Athol", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 6, forestCoverPct: 50, nearestTown: "Cocolalla", nearestTownMiles: 4.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 28, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 18,
      publicLandAdjacent: false, publicLandNeighborMiles: 5.5, waterFeature: "Granite Creek", waterMiles: 1.2,
      roadAccess: "Paved", elevationFt: 2310, aspect: "Flat",
    },
  },
  {
    apn: "RP58N04W032770", county: "Bonner", acres: 100.0, lat: 48.5982, lng: -116.7745,
    ownerCity: "Las Vegas", ownerState: "NV", landUse: "Timber",
    e: {
      slopeDeg: 26, forestCoverPct: 94, nearestTown: "Naples", nearestTownMiles: 11.5,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 27, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 30,
      publicLandAdjacent: true, waterFeature: "Caribou Creek", waterMiles: 0.3,
      roadAccess: "Seasonal", elevationFt: 4050, aspect: "S",
    },
  },
  {
    apn: "RP55N03W174450", county: "Bonner", acres: 16.0, lat: 48.3081, lng: -116.7321,
    ownerCity: "Dover", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 15, forestCoverPct: 72, nearestTown: "Dover", nearestTownMiles: 5.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 22, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 11,
      publicLandAdjacent: false, publicLandNeighborMiles: 0.9, waterFeature: "Pend Oreille", waterMiles: 1.1,
      roadAccess: "Gravel", elevationFt: 2590, aspect: "SW",
    },
  },
  {
    apn: "RP59N01W009910", county: "Bonner", acres: 45.0, lat: 48.6481, lng: -116.4215,
    ownerCity: "Bonners Ferry", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 23, forestCoverPct: 89, nearestTown: "Naples", nearestTownMiles: 4.1,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 23, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 24,
      publicLandAdjacent: true, waterFeature: "Trout Creek", waterMiles: 0.5,
      roadAccess: "Gravel", elevationFt: 3520, aspect: "SE",
    },
  },
  {
    apn: "RP54N02E157320", county: "Bonner", acres: 7.0, lat: 48.1721, lng: -116.1721,
    ownerCity: "Clark Fork", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 8, forestCoverPct: 58, nearestTown: "Clark Fork", nearestTownMiles: 3.0,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 35, nearestAirport: "Sandpoint Muni", nearestAirportMiles: 26,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.4, waterFeature: "Lightning Creek", waterMiles: 0.4,
      roadAccess: "Paved", elevationFt: 2480, aspect: "S",
    },
  },

  // ---------- BOUNDARY COUNTY ----------
  {
    apn: "RP62N01E045500", county: "Boundary", acres: 20.0, lat: 48.6451, lng: -116.3978,
    ownerCity: "Phoenix", ownerState: "AZ", landUse: "Vacant rural",
    e: {
      slopeDeg: 9, forestCoverPct: 48, nearestTown: "Bonners Ferry", nearestTownMiles: 5.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 36, nearestAirport: "Boundary Co.", nearestAirportMiles: 6,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.8, waterFeature: "Kootenai River", waterMiles: 1.2,
      roadAccess: "Gravel", elevationFt: 2360, aspect: "S",
    },
  },
  {
    apn: "RP63N02W016220", county: "Boundary", acres: 38.0, lat: 48.7822, lng: -116.4521,
    ownerCity: "Bonners Ferry", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 21, forestCoverPct: 84, nearestTown: "Bonners Ferry", nearestTownMiles: 8.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 41, nearestAirport: "Boundary Co.", nearestAirportMiles: 9,
      publicLandAdjacent: true, waterFeature: "Smith Creek", waterMiles: 0.4,
      roadAccess: "Seasonal", elevationFt: 3580, aspect: "SE",
    },
  },
  {
    apn: "RP62N02E101100", county: "Boundary", acres: 12.0, lat: 48.7521, lng: -116.2412,
    ownerCity: "Moyie Springs", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 14, forestCoverPct: 80, nearestTown: "Moyie Springs", nearestTownMiles: 2.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 44, nearestAirport: "Boundary Co.", nearestAirportMiles: 8,
      publicLandAdjacent: true, waterFeature: "Moyie River", waterMiles: 0.6,
      roadAccess: "Gravel", elevationFt: 2710, aspect: "S",
    },
  },
  {
    apn: "RP61N03W076640", county: "Boundary", acres: 25.0, lat: 48.6321, lng: -116.5818,
    ownerCity: "Naples", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 18, forestCoverPct: 87, nearestTown: "Naples", nearestTownMiles: 3.0,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 28, nearestAirport: "Boundary Co.", nearestAirportMiles: 16,
      publicLandAdjacent: true, waterFeature: "Snow Creek", waterMiles: 0.3,
      roadAccess: "Gravel", elevationFt: 3180, aspect: "S",
    },
  },
  {
    apn: "RP63N01W128820", county: "Boundary", acres: 80.0, lat: 48.8121, lng: -116.4221,
    ownerCity: "Eugene", ownerState: "OR", landUse: "Timber",
    e: {
      slopeDeg: 24, forestCoverPct: 91, nearestTown: "Bonners Ferry", nearestTownMiles: 11.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 47, nearestAirport: "Boundary Co.", nearestAirportMiles: 13,
      publicLandAdjacent: true, waterFeature: "Brush Creek", waterMiles: 0.7,
      roadAccess: "Seasonal", elevationFt: 3960, aspect: "SE",
    },
  },
  {
    apn: "RP62N01W099900", county: "Boundary", acres: 5.0, lat: 48.6912, lng: -116.3745,
    ownerCity: "Bonners Ferry", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 4, forestCoverPct: 30, nearestTown: "Bonners Ferry", nearestTownMiles: 1.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 38, nearestAirport: "Boundary Co.", nearestAirportMiles: 4,
      publicLandAdjacent: false, publicLandNeighborMiles: 4.5, waterFeature: "Kootenai River", waterMiles: 0.5,
      roadAccess: "Paved", elevationFt: 2240, aspect: "Flat",
    },
  },
  {
    apn: "RP60N02W083310", county: "Boundary", acres: 42.0, lat: 48.5821, lng: -116.4781,
    ownerCity: "San Francisco", ownerState: "CA", landUse: "Forest land",
    e: {
      slopeDeg: 19, forestCoverPct: 85, nearestTown: "Naples", nearestTownMiles: 4.6,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 25, nearestAirport: "Boundary Co.", nearestAirportMiles: 18,
      publicLandAdjacent: true, waterFeature: "Pack River", waterMiles: 1.1,
      roadAccess: "Gravel", elevationFt: 3320, aspect: "S",
    },
  },
  {
    apn: "RP61N02E144420", county: "Boundary", acres: 9.0, lat: 48.6212, lng: -116.1812,
    ownerCity: "Moyie Springs", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 12, forestCoverPct: 68, nearestTown: "Moyie Springs", nearestTownMiles: 4.0,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 47, nearestAirport: "Boundary Co.", nearestAirportMiles: 12,
      publicLandAdjacent: false, publicLandNeighborMiles: 0.9, waterFeature: "Moyie River", waterMiles: 1.2,
      roadAccess: "Gravel", elevationFt: 2880, aspect: "SE",
    },
  },
  {
    apn: "RP62N03W212260", county: "Boundary", acres: 60.0, lat: 48.7281, lng: -116.6321,
    ownerCity: "Wilmington", ownerState: "DE", landUse: "Timber",
    e: {
      slopeDeg: 27, forestCoverPct: 92, nearestTown: "Naples", nearestTownMiles: 8.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 32, nearestAirport: "Boundary Co.", nearestAirportMiles: 22,
      publicLandAdjacent: true, waterFeature: "Snow Creek", waterMiles: 0.5,
      roadAccess: "Seasonal", elevationFt: 4140, aspect: "S",
    },
  },
  {
    apn: "RP62N02W235560", county: "Boundary", acres: 18.0, lat: 48.7012, lng: -116.4612,
    ownerCity: "Naples", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 13, forestCoverPct: 72, nearestTown: "Naples", nearestTownMiles: 2.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 31, nearestAirport: "Boundary Co.", nearestAirportMiles: 11,
      publicLandAdjacent: false, publicLandNeighborMiles: 0.5, waterFeature: "Pack River", waterMiles: 1.0,
      roadAccess: "Gravel", elevationFt: 2780, aspect: "SW",
    },
  },
  {
    apn: "RP63N03E118810", county: "Boundary", acres: 30.0, lat: 48.8471, lng: -116.0821,
    ownerCity: "Yaak", ownerState: "MT", landUse: "Forest land",
    e: {
      slopeDeg: 22, forestCoverPct: 88, nearestTown: "Bonners Ferry", nearestTownMiles: 16.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 56, nearestAirport: "Boundary Co.", nearestAirportMiles: 18,
      publicLandAdjacent: true, waterFeature: "Yaak River", waterMiles: 0.8,
      roadAccess: "Seasonal", elevationFt: 3680, aspect: "SE",
    },
  },
  {
    apn: "RP60N03W210010", county: "Boundary", acres: 11.0, lat: 48.5621, lng: -116.6018,
    ownerCity: "Sandpoint", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 10, forestCoverPct: 65, nearestTown: "Naples", nearestTownMiles: 4.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 23, nearestAirport: "Boundary Co.", nearestAirportMiles: 19,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.2, waterFeature: "Pack River", waterMiles: 0.7,
      roadAccess: "Gravel", elevationFt: 2710, aspect: "S",
    },
  },
  {
    apn: "RP62N04W155330", county: "Boundary", acres: 70.0, lat: 48.7321, lng: -116.7821,
    ownerCity: "Coolin", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 25, forestCoverPct: 90, nearestTown: "Naples", nearestTownMiles: 12.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 38, nearestAirport: "Boundary Co.", nearestAirportMiles: 28,
      publicLandAdjacent: true, waterFeature: "Caribou Creek", waterMiles: 0.6,
      roadAccess: "Seasonal", elevationFt: 4280, aspect: "SE",
    },
  },
  {
    apn: "RP61N01E098200", county: "Boundary", acres: 6.5, lat: 48.6612, lng: -116.2912,
    ownerCity: "Bonners Ferry", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 5, forestCoverPct: 42, nearestTown: "Bonners Ferry", nearestTownMiles: 4.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 35, nearestAirport: "Boundary Co.", nearestAirportMiles: 6,
      publicLandAdjacent: false, publicLandNeighborMiles: 3.4, waterFeature: "Deep Creek", waterMiles: 0.5,
      roadAccess: "Paved", elevationFt: 2310, aspect: "S",
    },
  },
  {
    apn: "RP62N03E177900", county: "Boundary", acres: 14.0, lat: 48.7421, lng: -116.0921,
    ownerCity: "Spokane", ownerState: "WA", landUse: "Forest land",
    e: {
      slopeDeg: 17, forestCoverPct: 80, nearestTown: "Moyie Springs", nearestTownMiles: 8.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 50, nearestAirport: "Boundary Co.", nearestAirportMiles: 14,
      publicLandAdjacent: true, waterFeature: "Meadow Creek", waterMiles: 0.4,
      roadAccess: "Gravel", elevationFt: 3220, aspect: "SE",
    },
  },
  {
    apn: "RP63N02E055540", county: "Boundary", acres: 28.0, lat: 48.8021, lng: -116.2018,
    ownerCity: "Reno", ownerState: "NV", landUse: "Forest land",
    e: {
      slopeDeg: 19, forestCoverPct: 86, nearestTown: "Moyie Springs", nearestTownMiles: 6.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 49, nearestAirport: "Boundary Co.", nearestAirportMiles: 11,
      publicLandAdjacent: true, waterFeature: "Moyie River", waterMiles: 0.9,
      roadAccess: "Gravel", elevationFt: 3420, aspect: "S",
    },
  },
  {
    apn: "RP60N02E113810", county: "Boundary", acres: 8.5, lat: 48.5511, lng: -116.1812,
    ownerCity: "Clark Fork", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 11, forestCoverPct: 70, nearestTown: "Clark Fork", nearestTownMiles: 7.2,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 38, nearestAirport: "Boundary Co.", nearestAirportMiles: 22,
      publicLandAdjacent: false, publicLandNeighborMiles: 1.0, waterFeature: "Lightning Creek", waterMiles: 1.4,
      roadAccess: "Gravel", elevationFt: 2840, aspect: "S",
    },
  },
  {
    apn: "RP62N01W212210", county: "Boundary", acres: 50.0, lat: 48.6981, lng: -116.4321,
    ownerCity: "Brooklyn", ownerState: "NY", landUse: "Forest land",
    e: {
      slopeDeg: 16, forestCoverPct: 82, nearestTown: "Bonners Ferry", nearestTownMiles: 5.0,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 36, nearestAirport: "Boundary Co.", nearestAirportMiles: 7,
      publicLandAdjacent: true, waterFeature: "Twentymile Creek", waterMiles: 0.5,
      roadAccess: "Gravel", elevationFt: 3010, aspect: "SE",
    },
  },
  {
    apn: "RP61N04W167730", county: "Boundary", acres: 21.0, lat: 48.6512, lng: -116.7321,
    ownerCity: "Priest Lake", ownerState: "ID", landUse: "Vacant rural",
    e: {
      slopeDeg: 14, forestCoverPct: 78, nearestTown: "Naples", nearestTownMiles: 9.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 30, nearestAirport: "Boundary Co.", nearestAirportMiles: 22,
      publicLandAdjacent: true, waterFeature: "Caribou Creek", waterMiles: 0.6,
      roadAccess: "Seasonal", elevationFt: 3140, aspect: "S",
    },
  },
  {
    apn: "RP63N04W098810", county: "Boundary", acres: 90.0, lat: 48.8321, lng: -116.7621,
    ownerCity: "Selkirk", ownerState: "WA", landUse: "Timber",
    e: {
      slopeDeg: 28, forestCoverPct: 93, nearestTown: "Naples", nearestTownMiles: 17.8,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 44, nearestAirport: "Boundary Co.", nearestAirportMiles: 32,
      publicLandAdjacent: true, waterFeature: "Long Canyon Creek", waterMiles: 0.4,
      roadAccess: "Seasonal", elevationFt: 4520, aspect: "SE",
    },
  },
  {
    apn: "RP62N02E180100", county: "Boundary", acres: 7.0, lat: 48.7212, lng: -116.2118,
    ownerCity: "Moyie Springs", ownerState: "ID", landUse: "Vacant residential",
    e: {
      slopeDeg: 6, forestCoverPct: 52, nearestTown: "Moyie Springs", nearestTownMiles: 1.6,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 46, nearestAirport: "Boundary Co.", nearestAirportMiles: 10,
      publicLandAdjacent: false, publicLandNeighborMiles: 2.2, waterFeature: "Meadow Creek", waterMiles: 0.7,
      roadAccess: "Paved", elevationFt: 2520, aspect: "Flat",
    },
  },
  {
    apn: "RP61N02W214480", county: "Boundary", acres: 33.0, lat: 48.6212, lng: -116.4821,
    ownerCity: "Naples", ownerState: "ID", landUse: "Forest land",
    e: {
      slopeDeg: 20, forestCoverPct: 84, nearestTown: "Naples", nearestTownMiles: 1.4,
      nearestSkiArea: "Schweitzer", nearestSkiMiles: 26, nearestAirport: "Boundary Co.", nearestAirportMiles: 16,
      publicLandAdjacent: true, waterFeature: "Snow Creek", waterMiles: 0.5,
      roadAccess: "Gravel", elevationFt: 3360, aspect: "S",
    },
  },
];

// Plausible synthetic owner names — represents what a county assessor record would look like.
// Production replaces these with the real OWNER / OWNER_NAME column from the shapefile import.
const SURNAMES = [
  "ANDERSON", "BARNES", "CALDWELL", "DAWSON", "ELLIS", "FERGUSON", "GARRETT", "HENDERSON",
  "INGRAM", "JOHANSEN", "KELLER", "LARSON", "MORTON", "NORTH", "OWENS", "PETERSON",
  "REINHARDT", "SUTTON", "TOWNSEND", "VANCE", "WHITAKER", "YEAGER",
];
const FIRST_INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T"];
const LLC_NAMES = [
  "PACK RIVER HOLDINGS LLC",
  "SELKIRK RIDGE PARTNERS LLC",
  "KOOTENAI VALLEY LAND CO LLC",
  "MOYIE TIMBER LLC",
  "PRIEST LAKE PROPERTIES LLC",
  "CARIBOU CREEK HOLDINGS LLC",
  "SCHWEITZER BASIN LLC",
  "CABINET MOUNTAIN GROUP LLC",
];

function generateOwnerName(seedIndex: number, ownerCity?: string): string {
  // Pattern: ~50% individuals (incl. spouses), ~30% LLC, ~20% trust
  const r = (seedIndex * 7 + (ownerCity?.length ?? 0)) % 10;
  if (r < 5) {
    const last = SURNAMES[seedIndex % SURNAMES.length];
    const fi = FIRST_INITIALS[(seedIndex * 3) % FIRST_INITIALS.length];
    if (r < 3) {
      const fi2 = FIRST_INITIALS[(seedIndex * 5 + 1) % FIRST_INITIALS.length];
      return `${last} ${fi} & ${fi2}`;
    }
    return `${last}, ${fi}`;
  }
  if (r < 8) {
    return LLC_NAMES[seedIndex % LLC_NAMES.length];
  }
  const last = SURNAMES[(seedIndex + 4) % SURNAMES.length];
  return `${last} FAMILY TRUST`;
}

let _PARCELS: Parcel[] | null = null;

export function getParcels(): Parcel[] {
  if (_PARCELS) return _PARCELS;
  _PARCELS = SEEDS.map((s, i) => {
    // Slight aspect-ratio variance so they don't all look identical on the map.
    const ar = 1 + ((i % 5) - 2) * 0.12;
    const geometry = squarePolygonFromCentroid(s.lat, s.lng, s.acres, Math.max(0.5, ar));
    const partial = {
      id: `parcel-${i + 1}`,
      apn: s.apn,
      county: s.county,
      state: "ID" as const,
      acres: s.acres,
      centroidLat: s.lat,
      centroidLng: s.lng,
      geometry,
      ownerName: generateOwnerName(i, s.ownerCity),
      ownerCity: s.ownerCity,
      ownerState: s.ownerState,
      landUse: s.landUse,
      zoning: undefined,
      enrichment: s.e,
      scores: { privacy: 0, beauty: 0, buildability: 0, recreation: 0, strPotential: 0, overall: 0 },
    } as Parcel;
    partial.scores = computeScores(partial);
    partial.aiSummary = deterministicSummary(partial);
    return partial;
  });
  return _PARCELS;
}

export function getParcelById(id: string): Parcel | undefined {
  return getParcels().find((p) => p.id === id);
}
