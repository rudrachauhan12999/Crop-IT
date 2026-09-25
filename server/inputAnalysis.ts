/**
 * Qualitative soil/climate input categorization.
 *
 * This is NOT machine learning: it is a fixed set of threshold buckets
 * applied directly to the user's real submitted N/P/K/temperature/
 * humidity/ph/rainfall values (e.g. N < 30 -> "Low"). It never touches a
 * trained model, a prediction, or a probability -- see
 * server.ts's /api/predict handler, which merges this in alongside the
 * real model's response purely as descriptive UI context for the exact
 * numbers the user entered.
 */

import { SoilEnvironmentalInput } from '../src/types/ml';

export function analyzeInputStatus(input: SoilEnvironmentalInput) {
  return {
    nStatus: input.N < 30 ? 'Low' as const : input.N <= 80 ? 'Optimal' as const : input.N <= 110 ? 'High' as const : 'Very High' as const,
    pStatus: input.P < 25 ? 'Low' as const : input.P <= 70 ? 'Optimal' as const : input.P <= 110 ? 'High' as const : 'Very High' as const,
    kStatus: input.K < 25 ? 'Low' as const : input.K <= 60 ? 'Optimal' as const : input.K <= 140 ? 'High' as const : 'Very High' as const,
    phStatus: input.ph < 5.5 ? 'Acidic' as const : input.ph <= 6.5 ? 'Slightly Acidic' as const : input.ph <= 7.5 ? 'Neutral' as const : 'Alkaline' as const,
    tempStatus: input.temperature < 18 ? 'Cool' as const : input.temperature <= 26 ? 'Moderate' as const : input.temperature <= 32 ? 'Warm' as const : 'Hot' as const,
    humidityStatus: input.humidity < 35 ? 'Low' as const : input.humidity <= 65 ? 'Moderate' as const : input.humidity <= 85 ? 'High' as const : 'Very High' as const,
    rainfallStatus: input.rainfall < 50 ? 'Arid / Low' as const : input.rainfall <= 120 ? 'Moderate' as const : input.rainfall <= 190 ? 'Heavy' as const : 'Extreme' as const
  };
}
