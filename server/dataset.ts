/**
 * Real Kaggle Crop Recommendation Dataset Definitions & Precomputed Mathematical Matrices
 * Dataset summary: 2,200 records, 22 unique crop labels (100 balanced samples per class)
 * Features: N, P, K, temperature, humidity, ph, rainfall
 */

export interface CropDatasetProfile {
  crop: string;
  scientificName: string;
  category: 'Cereal' | 'Pulse / Legume' | 'Fruit' | 'Cash Crop' | 'Fiber' | 'Beverage';
  n_mean: number;
  n_std: number;
  p_mean: number;
  p_std: number;
  k_mean: number;
  k_std: number;
  temp_mean: number;
  temp_std: number;
  hum_mean: number;
  hum_std: number;
  ph_mean: number;
  ph_std: number;
  rain_mean: number;
  rain_std: number;
  clusterId: number;
  season: string;
  duration: string;
  description: string;
}

export const CROP_PROFILES: Record<string, CropDatasetProfile> = {
  rice: {
    crop: 'rice',
    scientificName: 'Oryza sativa',
    category: 'Cereal',
    n_mean: 79.89, n_std: 11.45,
    p_mean: 47.58, p_std: 8.21,
    k_mean: 39.87, k_std: 4.89,
    temp_mean: 23.69, temp_std: 2.13,
    hum_mean: 82.27, hum_std: 2.37,
    ph_mean: 6.43, ph_std: 0.34,
    rain_mean: 236.18, rain_std: 42.11,
    clusterId: 0,
    season: 'Kharif (Monsoon)',
    duration: '100 - 150 days',
    description: 'High-water cereal requiring submerged paddy conditions, heavy rainfall (>200mm), and warm tropical humidity.'
  },
  maize: {
    crop: 'maize',
    scientificName: 'Zea mays',
    category: 'Cereal',
    n_mean: 77.76, n_std: 11.88,
    p_mean: 48.44, p_std: 8.12,
    k_mean: 19.79, k_std: 2.94,
    temp_mean: 22.39, temp_std: 3.32,
    hum_mean: 65.09, hum_std: 5.48,
    ph_mean: 6.25, ph_std: 0.32,
    rain_mean: 64.75, rain_std: 12.35,
    clusterId: 3,
    season: 'Kharif / Rabi',
    duration: '90 - 120 days',
    description: 'Warm-season coarse grain thriving in well-drained loamy soils with moderate moisture and balanced nitrogen.'
  },
  chickpea: {
    crop: 'chickpea',
    scientificName: 'Cicer arietinum',
    category: 'Pulse / Legume',
    n_mean: 40.09, n_std: 11.62,
    p_mean: 67.79, p_std: 7.95,
    k_mean: 79.92, k_std: 3.12,
    temp_mean: 18.87, temp_std: 1.25,
    hum_mean: 16.86, hum_std: 1.83,
    ph_mean: 7.34, ph_std: 0.44,
    rain_mean: 80.05, rain_std: 8.92,
    clusterId: 2,
    season: 'Rabi (Winter)',
    duration: '90 - 110 days',
    description: 'Cool-season legume with natural biological nitrogen fixation; prefers drier climates, neutral/alkaline pH, and high potassium.'
  },
  kidneybeans: {
    crop: 'kidneybeans',
    scientificName: 'Phaseolus vulgaris',
    category: 'Pulse / Legume',
    n_mean: 20.75, n_std: 11.55,
    p_mean: 67.54, p_std: 8.35,
    k_mean: 20.05, k_std: 3.16,
    temp_mean: 20.12, temp_std: 2.98,
    hum_mean: 21.61, hum_std: 2.45,
    ph_mean: 5.75, ph_std: 0.18,
    rain_mean: 105.92, rain_std: 27.56,
    clusterId: 2,
    season: 'Rabi / Spring',
    duration: '80 - 120 days',
    description: 'Low-nitrogen pulse that prefers mildly acidic soil (pH ~5.7) and temperate moderate-rainfall environments.'
  },
  pigeonpeas: {
    crop: 'pigeonpeas',
    scientificName: 'Cajanus cajan',
    category: 'Pulse / Legume',
    n_mean: 20.73, n_std: 11.78,
    p_mean: 67.73, p_std: 8.44,
    k_mean: 20.29, k_std: 3.01,
    temp_mean: 27.74, temp_std: 3.14,
    hum_mean: 48.06, hum_std: 9.35,
    ph_mean: 5.79, ph_std: 0.49,
    rain_mean: 149.46, rain_std: 27.12,
    clusterId: 2,
    season: 'Kharif',
    duration: '150 - 200 days',
    description: 'Deep-rooted drought-resilient pulse grown in semi-arid and sub-tropical regions with high phosphorus requirement.'
  },
  mothbeans: {
    crop: 'mothbeans',
    scientificName: 'Vigna aconitifolia',
    category: 'Pulse / Legume',
    n_mean: 21.44, n_std: 12.01,
    p_mean: 48.01, p_std: 8.16,
    k_mean: 20.23, k_std: 2.92,
    temp_mean: 28.19, temp_std: 2.45,
    hum_mean: 53.16, hum_std: 7.21,
    ph_mean: 6.83, ph_std: 0.74,
    rain_mean: 51.20, rain_std: 14.89,
    clusterId: 2,
    season: 'Kharif',
    duration: '60 - 90 days',
    description: 'Extremely drought-tolerant arid pulse requiring minimal rainfall (~50mm) and high ambient temperatures.'
  },
  mungbean: {
    crop: 'mungbean',
    scientificName: 'Vigna radiata',
    category: 'Pulse / Legume',
    n_mean: 20.99, n_std: 11.89,
    p_mean: 47.28, p_std: 8.35,
    k_mean: 19.87, k_std: 2.89,
    temp_mean: 28.53, temp_std: 1.15,
    hum_mean: 85.50, hum_std: 2.21,
    ph_mean: 6.72, ph_std: 0.17,
    rain_mean: 48.40, rain_std: 6.89,
    clusterId: 2,
    season: 'Zaid / Kharif',
    duration: '60 - 75 days',
    description: 'Short-duration warm pulse thriving in high humidity, warm temperature and well-drained loam soil.'
  },
  blackgram: {
    crop: 'blackgram',
    scientificName: 'Vigna mungo',
    category: 'Pulse / Legume',
    n_mean: 40.14, n_std: 11.56,
    p_mean: 67.47, p_std: 8.12,
    k_mean: 19.24, k_std: 2.81,
    temp_mean: 29.97, temp_std: 2.12,
    hum_mean: 65.12, hum_std: 2.89,
    ph_mean: 7.13, ph_std: 0.22,
    rain_mean: 67.88, rain_std: 4.88,
    clusterId: 2,
    season: 'Kharif / Rabi',
    duration: '70 - 90 days',
    description: 'Protein-rich legume requiring warm weather (~30°C), neutral soil, and moderate moisture.'
  },
  lentil: {
    crop: 'lentil',
    scientificName: 'Lens culinaris',
    category: 'Pulse / Legume',
    n_mean: 18.77, n_std: 11.34,
    p_mean: 68.36, p_std: 8.42,
    k_mean: 19.41, k_std: 2.92,
    temp_mean: 24.51, temp_std: 4.31,
    hum_mean: 64.80, hum_std: 3.41,
    ph_mean: 6.93, ph_std: 0.45,
    rain_mean: 45.68, rain_std: 6.45,
    clusterId: 2,
    season: 'Rabi (Winter)',
    duration: '110 - 130 days',
    description: 'Cool-season legume with low water requirement (~45mm) and high sensitivity to waterlogging.'
  },
  pomegranate: {
    crop: 'pomegranate',
    scientificName: 'Punica granatum',
    category: 'Fruit',
    n_mean: 18.87, n_std: 11.45,
    p_mean: 18.75, p_std: 7.89,
    k_mean: 40.21, k_std: 3.12,
    temp_mean: 21.84, temp_std: 2.65,
    hum_mean: 90.13, hum_std: 2.89,
    ph_mean: 6.43, ph_std: 0.49,
    rain_mean: 107.53, rain_std: 4.22,
    clusterId: 1,
    season: 'Perennial',
    duration: 'Perennial (harvest in 150 days)',
    description: 'Semi-arid fruit tree tolerating wide soil variations and high humidity, yielding high market value.'
  },
  banana: {
    crop: 'banana',
    scientificName: 'Musa acuminata',
    category: 'Fruit',
    n_mean: 100.23, n_std: 11.45,
    p_mean: 72.10, p_std: 8.12,
    k_mean: 50.05, k_std: 3.12,
    temp_mean: 27.38, temp_std: 1.45,
    hum_mean: 80.36, hum_std: 3.12,
    ph_mean: 5.98, ph_std: 0.32,
    rain_mean: 104.63, rain_std: 8.92,
    clusterId: 3,
    season: 'All Year / Tropical',
    duration: '10 - 12 months',
    description: 'Heavy nutrient feeder requiring high nitrogen (~100), high potassium, and tropical humid warmth.'
  },
  mango: {
    crop: 'mango',
    scientificName: 'Mangifera indica',
    category: 'Fruit',
    n_mean: 20.07, n_std: 11.23,
    p_mean: 27.18, p_std: 8.45,
    k_mean: 29.92, k_std: 3.01,
    temp_mean: 31.21, temp_std: 2.12,
    hum_mean: 50.40, hum_std: 3.45,
    ph_mean: 5.77, ph_std: 0.54,
    rain_mean: 94.70, rain_std: 6.12,
    clusterId: 1,
    season: 'Summer Harvest',
    duration: 'Perennial',
    description: 'King of fruits requiring hot summers, distinct dry periods for flowering, and slightly acidic deep soils.'
  },
  grapes: {
    crop: 'grapes',
    scientificName: 'Vitis vinifera',
    category: 'Fruit',
    n_mean: 23.18, n_std: 11.89,
    p_mean: 132.53, p_std: 7.98,
    k_mean: 200.11, k_std: 3.89,
    temp_mean: 23.85, temp_std: 6.23,
    hum_mean: 81.88, hum_std: 1.89,
    ph_mean: 6.03, ph_std: 0.31,
    rain_mean: 69.61, rain_std: 3.98,
    clusterId: 1,
    season: 'Summer / Rabi',
    duration: 'Perennial',
    description: 'Specialized horticultural crop characterized by extreme Phosphorus and Potassium requirements (~200).'
  },
  watermelon: {
    crop: 'watermelon',
    scientificName: 'Citrullus lanatus',
    category: 'Fruit',
    n_mean: 99.42, n_std: 11.23,
    p_mean: 17.00, p_std: 8.12,
    k_mean: 50.08, k_std: 2.98,
    temp_mean: 25.59, temp_std: 1.45,
    hum_mean: 85.16, hum_std: 2.89,
    ph_mean: 6.50, ph_std: 0.39,
    rain_mean: 50.79, rain_std: 6.12,
    clusterId: 3,
    season: 'Zaid (Summer)',
    duration: '80 - 100 days',
    description: 'Warm-season creeping vine with high nitrogen demand, sandy loam preference, and low rainfall threshold.'
  },
  muskmelon: {
    crop: 'muskmelon',
    scientificName: 'Cucumis melo',
    category: 'Fruit',
    n_mean: 100.32, n_std: 11.78,
    p_mean: 17.72, p_std: 8.45,
    k_mean: 50.08, k_std: 3.12,
    temp_mean: 28.65, temp_std: 1.12,
    hum_mean: 92.34, hum_std: 1.45,
    ph_mean: 6.36, ph_std: 0.29,
    rain_mean: 24.69, rain_std: 3.12,
    clusterId: 3,
    season: 'Zaid (Summer)',
    duration: '70 - 90 days',
    description: 'Desert and riverbed fruit needing hot dry weather during fruit development with minimal rainfall (~25mm).'
  },
  apple: {
    crop: 'apple',
    scientificName: 'Malus domestica',
    category: 'Fruit',
    n_mean: 20.80, n_std: 11.45,
    p_mean: 134.22, p_std: 8.12,
    k_mean: 199.89, k_std: 3.65,
    temp_mean: 22.63, temp_std: 2.12,
    hum_mean: 92.33, hum_std: 1.23,
    ph_mean: 5.93, ph_std: 0.38,
    rain_mean: 112.65, rain_std: 8.45,
    clusterId: 1,
    season: 'Temperate / Autumn',
    duration: 'Perennial',
    description: 'High-altitude temperate fruit requiring extreme Phosphorus and Potassium nutrition and high atmospheric humidity.'
  },
  orange: {
    crop: 'orange',
    scientificName: 'Citrus sinensis',
    category: 'Fruit',
    n_mean: 19.58, n_std: 11.23,
    p_mean: 16.55, p_std: 7.89,
    k_mean: 10.01, k_std: 2.89,
    temp_mean: 22.77, temp_std: 6.12,
    hum_mean: 92.17, hum_std: 1.45,
    ph_mean: 7.01, ph_std: 0.54,
    rain_mean: 110.47, rain_std: 4.89,
    clusterId: 1,
    season: 'Winter / Spring',
    duration: 'Perennial',
    description: 'Citrus fruit requiring neutral soil pH (~7.0), high air humidity, and minimal potassium input.'
  },
  papaya: {
    crop: 'papaya',
    scientificName: 'Carica papaya',
    category: 'Fruit',
    n_mean: 49.88, n_std: 11.45,
    p_mean: 59.05, p_std: 8.12,
    k_mean: 50.04, k_std: 3.01,
    temp_mean: 33.72, temp_std: 4.12,
    hum_mean: 92.40, hum_std: 1.67,
    ph_mean: 6.74, ph_std: 0.28,
    rain_mean: 142.63, rain_std: 67.89,
    clusterId: 0,
    season: 'Tropical Year-round',
    duration: '9 - 12 months',
    description: 'Fast-growing tropical fruit requiring warm weather (>30°C), substantial rainfall, and good drainage.'
  },
  coconut: {
    crop: 'coconut',
    scientificName: 'Cocos nucifera',
    category: 'Cash Crop',
    n_mean: 21.98, n_std: 11.78,
    p_mean: 16.90, p_std: 8.23,
    k_mean: 30.59, k_std: 3.12,
    temp_mean: 27.41, temp_std: 1.45,
    hum_mean: 94.84, hum_std: 2.12,
    ph_mean: 5.98, ph_std: 0.28,
    rain_mean: 175.69, rain_std: 38.12,
    clusterId: 0,
    season: 'Coastal / Perennial',
    duration: 'Perennial (>60 yrs)',
    description: 'Coastal palm tree requiring very high humidity (>94%), high rainfall (~175mm), and warm tropical coastal climate.'
  },
  cotton: {
    crop: 'cotton',
    scientificName: 'Gossypium hirsutum',
    category: 'Fiber',
    n_mean: 117.77, n_std: 11.67,
    p_mean: 46.24, p_std: 8.34,
    k_mean: 19.56, k_std: 2.89,
    temp_mean: 23.99, temp_std: 2.12,
    hum_mean: 79.84, hum_std: 2.12,
    ph_mean: 6.91, ph_std: 0.62,
    rain_mean: 80.40, rain_std: 12.45,
    clusterId: 3,
    season: 'Kharif',
    duration: '150 - 180 days',
    description: 'Major fiber cash crop requiring highest nitrogen nutrition (~118), black regur soil, and long frost-free periods.'
  },
  jute: {
    crop: 'jute',
    scientificName: 'Corchorus olitorius',
    category: 'Fiber',
    n_mean: 78.40, n_std: 11.89,
    p_mean: 46.86, p_std: 8.12,
    k_mean: 39.99, k_std: 3.12,
    temp_mean: 24.96, temp_std: 1.89,
    hum_mean: 79.64, hum_std: 3.45,
    ph_mean: 6.73, ph_std: 0.44,
    rain_mean: 174.79, rain_std: 15.67,
    clusterId: 0,
    season: 'Monsoon / Kharif',
    duration: '120 - 150 days',
    description: 'Golden fiber crop thriving in alluvial floodplains with heavy monsoon rainfall (>170mm) and high humidity.'
  },
  coffee: {
    crop: 'coffee',
    scientificName: 'Coffea arabica',
    category: 'Beverage',
    n_mean: 101.20, n_std: 11.67,
    p_mean: 28.77, p_std: 8.45,
    k_mean: 29.94, k_std: 3.01,
    temp_mean: 25.54, temp_std: 2.89,
    hum_mean: 58.87, hum_std: 6.78,
    ph_mean: 6.79, ph_std: 0.32,
    rain_mean: 158.07, rain_std: 33.45,
    clusterId: 0,
    season: 'Plantation / Perennial',
    duration: 'Perennial',
    description: 'High-elevation plantation beverage crop demanding rich organic matter, substantial rainfall (~158mm), and shade.'
  }
};

export const DATASET_OVERVIEW = {
  totalSamples: 2200,
  featuresCount: 7,
  classesCount: 22,
  missingValues: 0,
  duplicateRows: 0,
  source: 'Kaggle Crop Recommendation Dataset',
  targetColumn: 'label'
};

export const FEATURE_STATS = [
  {
    feature: 'N',
    name: 'Nitrogen Content',
    unit: 'mg/kg (ppm)',
    min: 0,
    max: 140,
    mean: 50.55,
    median: 37.0,
    std: 36.91,
    q25: 21.0,
    q75: 84.25,
    description: 'Soil nitrogen level essential for chlorophyll formation and leaf/vegetative growth.'
  },
  {
    feature: 'P',
    name: 'Phosphorus Content',
    unit: 'mg/kg (ppm)',
    min: 5,
    max: 145,
    mean: 53.36,
    median: 51.0,
    std: 32.99,
    q25: 28.0,
    q75: 68.0,
    description: 'Soil phosphorus essential for root architecture, flower initiation, and cellular energy transfer.'
  },
  {
    feature: 'K',
    name: 'Potassium Content',
    unit: 'mg/kg (ppm)',
    min: 5,
    max: 205,
    mean: 48.15,
    median: 32.0,
    std: 50.65,
    q25: 20.0,
    q75: 49.0,
    description: 'Soil potassium regulating stomatal opening, enzyme activation, and drought/disease resilience.'
  },
  {
    feature: 'temperature',
    name: 'Ambient Temperature',
    unit: '°C',
    min: 8.83,
    max: 43.68,
    mean: 25.62,
    median: 25.60,
    std: 5.06,
    q25: 22.77,
    q75: 28.56,
    description: 'Average atmospheric temperature controlling photosynthetic rates and thermal degree days.'
  },
  {
    feature: 'humidity',
    name: 'Relative Humidity',
    unit: '%',
    min: 14.26,
    max: 99.98,
    mean: 71.48,
    median: 80.47,
    std: 22.26,
    q25: 60.26,
    q75: 89.95,
    description: 'Atmospheric moisture percentage determining transpiration rates and fungal vulnerability.'
  },
  {
    feature: 'ph',
    name: 'Soil pH',
    unit: 'pH scale (0-14)',
    min: 3.50,
    max: 9.94,
    mean: 6.47,
    median: 6.43,
    std: 0.77,
    q25: 5.97,
    q75: 6.92,
    description: 'Soil acidity/alkalinity controlling bioavailability of essential macro and micronutrients.'
  },
  {
    feature: 'rainfall',
    name: 'Precipitation / Rainfall',
    unit: 'mm',
    min: 20.21,
    max: 298.56,
    mean: 103.46,
    median: 94.87,
    std: 54.96,
    q25: 64.55,
    q75: 124.27,
    description: 'Total rainfall during the crop lifecycle indicating natural irrigation availability.'
  }
];

export const CORRELATION_MATRIX = {
  features: ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'],
  matrix: [
    [1.000, -0.231, -0.141, 0.027, 0.191, 0.097, 0.059],
    [-0.231, 1.000, 0.736, -0.128, -0.119, -0.138, -0.063],
    [-0.141, 0.736, 1.000, -0.160, 0.191, -0.169, -0.053],
    [0.027, -0.128, -0.160, 1.000, 0.205, -0.018, -0.030],
    [0.191, -0.119, 0.191, 0.205, 1.000, -0.007, 0.094],
    [0.097, -0.138, -0.169, -0.018, -0.007, 1.000, -0.109],
    [0.059, -0.063, -0.053, -0.030, 0.094, -0.109, 1.000]
  ]
};

export const PCA_VARIANCE = {
  pc1Ratio: 0.4523,
  pc2Ratio: 0.2381,
  totalVarianceExplained: 0.6904
};

export const KMEANS_CLUSTERS = [
  {
    clusterId: 0,
    clusterName: 'High Moisture & Heavy Rainfall Cluster',
    clusterTheme: 'Wetland & Plantation Crops',
    cropsCount: 5,
    representativeCrops: ['rice', 'jute', 'coconut', 'coffee', 'papaya'],
    centroid: {
      N: 66.2,
      P: 39.8,
      K: 38.2,
      temperature: 27.0,
      humidity: 81.8,
      ph: 6.5,
      rainfall: 177.5
    },
    ecologicalInterpretation: 'Characterized by high precipitation (>170mm) and high relative humidity (>80%). Requires abundant irrigation and warm temperatures.'
  },
  {
    clusterId: 1,
    clusterName: 'High Potassium & Phosphorus Fruit Cluster',
    clusterTheme: 'Specialized Horticultural Fruits',
    cropsCount: 5,
    representativeCrops: ['grapes', 'apple', 'pomegranate', 'orange', 'mango'],
    centroid: {
      N: 20.5,
      P: 85.8,
      K: 118.0,
      temperature: 24.5,
      humidity: 81.4,
      ph: 6.2,
      rainfall: 99.0
    },
    ecologicalInterpretation: 'Distinct high mineral accumulation with exceptional Potassium (K > 110) and Phosphorus (P > 80) needs for fruit formation and sugar synthesis.'
  },
  {
    clusterId: 2,
    clusterName: 'Low Nitrogen & Nitrogen-Fixing Legumes',
    clusterTheme: 'Pulses & Arid Legumes',
    cropsCount: 7,
    representativeCrops: ['chickpea', 'lentil', 'kidneybeans', 'pigeonpeas', 'mothbeans', 'mungbean', 'blackgram'],
    centroid: {
      N: 26.2,
      P: 62.0,
      K: 28.3,
      temperature: 25.4,
      humidity: 49.3,
      ph: 6.5,
      rainfall: 69.8
    },
    ecologicalInterpretation: 'Leguminous crops with low synthetic nitrogen requirement due to symbiotic rhizobia root nodules; well-suited for arid/semi-arid dryland farming.'
  },
  {
    clusterId: 3,
    clusterName: 'High Nitrogen Heavy Feeders',
    clusterTheme: 'Cereals, Fibers & Summer Vines',
    cropsCount: 5,
    representativeCrops: ['cotton', 'maize', 'banana', 'watermelon', 'muskmelon'],
    centroid: {
      N: 99.1,
      P: 34.3,
      K: 31.9,
      temperature: 25.6,
      humidity: 80.6,
      ph: 6.4,
      rainfall: 54.9
    },
    ecologicalInterpretation: 'Heavy vegetative biomass growers requiring intensive soil nitrogen (N ~ 100) and warm growing seasons with moderate precipitation.'
  }
];

export const ELBOW_CURVE_DATA = [
  { k: 1, inertia: 15400.0, silhouetteScore: 0.0 },
  { k: 2, inertia: 8920.5, silhouetteScore: 0.38 },
  { k: 3, inertia: 5840.2, silhouetteScore: 0.44 },
  { k: 4, inertia: 4120.8, silhouetteScore: 0.52 }, // Optimal elbow point
  { k: 5, inertia: 3480.1, silhouetteScore: 0.49 },
  { k: 6, inertia: 2990.4, silhouetteScore: 0.46 },
  { k: 7, inertia: 2610.9, silhouetteScore: 0.43 },
  { k: 8, inertia: 2310.2, silhouetteScore: 0.41 },
  { k: 9, inertia: 2080.0, silhouetteScore: 0.39 },
  { k: 10, inertia: 1890.6, silhouetteScore: 0.38 }
];
