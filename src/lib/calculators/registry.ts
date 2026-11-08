import type { CalculatorMeta } from "./types";

/** Every country calculator shown on the dashboard. Add new countries here. */
export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "st-kitts-nevis",
    country: "St. Kitts & Nevis",
    shortName: "SKN",
    region: "Caribbean",
    programs: ["SISC", "PBO"],
    status: "live",
    blurb: "Full payment schedule for the SISC and Public Benefit Option routes.",
  },
  {
    slug: "dominica",
    country: "Dominica",
    shortName: "DM",
    region: "Caribbean",
    programs: ["EDF", "Real Estate"],
    status: "soon",
    blurb: "Economic Diversification Fund and approved real estate.",
  },
  {
    slug: "grenada",
    country: "Grenada",
    shortName: "GD",
    region: "Caribbean",
    programs: ["NTF", "Real Estate"],
    status: "soon",
    blurb: "National Transformation Fund and approved real estate.",
  },
  {
    slug: "saint-lucia",
    country: "Saint Lucia",
    shortName: "LC",
    region: "Caribbean",
    programs: ["NEF", "Real Estate", "Bonds"],
    status: "soon",
    blurb: "National Economic Fund, real estate and government bonds.",
  },
  {
    slug: "turkiye",
    country: "Türkiye",
    shortName: "TR",
    region: "Europe & Asia",
    programs: ["Real Estate"],
    status: "soon",
    blurb: "Citizenship through qualifying real estate investment.",
  },
];
