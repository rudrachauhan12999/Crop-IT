/**
 * Static crop reference metadata (scientific name, season, growing
 * period, water requirement, soil type, description).
 *
 * This is deliberately NOT machine-learning data: it never influences a
 * prediction, a probability, or any metric. It exists only to enrich the
 * UI's display of whichever crop the REAL trained model recommends (see
 * server.ts's /api/predict handler, which looks up this table by the
 * crop name the Python backend actually returned).
 *
 * water Requirement / soilType are static qualitative buckets, not
 * per-request computations -- they were originally derived once from the
 * real dataset's per-class rainfall/pH means (see git history of
 * server/dataset.ts) and are kept here as fixed reference text, the same
 * way `description` and `season` already are.
 */

export interface StaticCropProfile {
  scientificName: string;
  category: 'Cereal' | 'Pulse / Legume' | 'Fruit' | 'Cash Crop' | 'Fiber' | 'Beverage';
  optimalSeason: string;
  growingPeriod: string;
  waterRequirement: string;
  soilType: string;
  description: string;
}

export const STATIC_CROP_PROFILES: Record<string, StaticCropProfile> = {
  rice: {
    scientificName: 'Oryza sativa',
    category: 'Cereal',
    optimalSeason: 'Kharif (Monsoon)',
    growingPeriod: '100 - 150 days',
    waterRequirement: 'High (>150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'High-water cereal requiring submerged paddy conditions, heavy rainfall (>200mm), and warm tropical humidity.'
  },
  maize: {
    scientificName: 'Zea mays',
    category: 'Cereal',
    optimalSeason: 'Kharif / Rabi',
    growingPeriod: '90 - 120 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Warm-season coarse grain thriving in well-drained loamy soils with moderate moisture and balanced nitrogen.'
  },
  chickpea: {
    scientificName: 'Cicer arietinum',
    category: 'Pulse / Legume',
    optimalSeason: 'Rabi (Winter)',
    growingPeriod: '90 - 110 days',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Neutral/Alkaline Soil',
    description: 'Cool-season legume with natural biological nitrogen fixation; prefers drier climates, neutral/alkaline pH, and high potassium.'
  },
  kidneybeans: {
    scientificName: 'Phaseolus vulgaris',
    category: 'Pulse / Legume',
    optimalSeason: 'Rabi / Spring',
    growingPeriod: '80 - 120 days',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'Low-nitrogen pulse that prefers mildly acidic soil (pH ~5.7) and temperate moderate-rainfall environments.'
  },
  pigeonpeas: {
    scientificName: 'Cajanus cajan',
    category: 'Pulse / Legume',
    optimalSeason: 'Kharif',
    growingPeriod: '150 - 200 days',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'Deep-rooted drought-resilient pulse grown in semi-arid and sub-tropical regions with high phosphorus requirement.'
  },
  mothbeans: {
    scientificName: 'Vigna aconitifolia',
    category: 'Pulse / Legume',
    optimalSeason: 'Kharif',
    growingPeriod: '60 - 90 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Extremely drought-tolerant arid pulse requiring minimal rainfall (~50mm) and high ambient temperatures.'
  },
  mungbean: {
    scientificName: 'Vigna radiata',
    category: 'Pulse / Legume',
    optimalSeason: 'Zaid / Kharif',
    growingPeriod: '60 - 75 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Short-duration warm pulse thriving in high humidity, warm temperature and well-drained loam soil.'
  },
  blackgram: {
    scientificName: 'Vigna mungo',
    category: 'Pulse / Legume',
    optimalSeason: 'Kharif / Rabi',
    growingPeriod: '70 - 90 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Neutral/Alkaline Soil',
    description: 'Protein-rich legume requiring warm weather (~30°C), neutral soil, and moderate moisture.'
  },
  lentil: {
    scientificName: 'Lens culinaris',
    category: 'Pulse / Legume',
    optimalSeason: 'Rabi (Winter)',
    growingPeriod: '110 - 130 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Cool-season legume with low water requirement (~45mm) and high sensitivity to waterlogging.'
  },
  pomegranate: {
    scientificName: 'Punica granatum',
    category: 'Fruit',
    optimalSeason: 'Perennial',
    growingPeriod: 'Perennial (harvest in 150 days)',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Semi-arid fruit tree tolerating wide soil variations and high humidity, yielding high market value.'
  },
  banana: {
    scientificName: 'Musa acuminata',
    category: 'Fruit',
    optimalSeason: 'All Year / Tropical',
    growingPeriod: '10 - 12 months',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'Heavy nutrient feeder requiring high nitrogen (~100), high potassium, and tropical humid warmth.'
  },
  mango: {
    scientificName: 'Mangifera indica',
    category: 'Fruit',
    optimalSeason: 'Summer Harvest',
    growingPeriod: 'Perennial',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'King of fruits requiring hot summers, distinct dry periods for flowering, and slightly acidic deep soils.'
  },
  grapes: {
    scientificName: 'Vitis vinifera',
    category: 'Fruit',
    optimalSeason: 'Summer / Rabi',
    growingPeriod: 'Perennial',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Specialized horticultural crop characterized by extreme Phosphorus and Potassium requirements (~200).'
  },
  watermelon: {
    scientificName: 'Citrullus lanatus',
    category: 'Fruit',
    optimalSeason: 'Zaid (Summer)',
    growingPeriod: '80 - 100 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Warm-season creeping vine with high nitrogen demand, sandy loam preference, and low rainfall threshold.'
  },
  muskmelon: {
    scientificName: 'Cucumis melo',
    category: 'Fruit',
    optimalSeason: 'Zaid (Summer)',
    growingPeriod: '70 - 90 days',
    waterRequirement: 'Low (<80mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Desert and riverbed fruit needing hot dry weather during fruit development with minimal rainfall (~25mm).'
  },
  apple: {
    scientificName: 'Malus domestica',
    category: 'Fruit',
    optimalSeason: 'Temperate / Autumn',
    growingPeriod: 'Perennial',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'High-altitude temperate fruit requiring extreme Phosphorus and Potassium nutrition and high atmospheric humidity.'
  },
  orange: {
    scientificName: 'Citrus sinensis',
    category: 'Fruit',
    optimalSeason: 'Winter / Spring',
    growingPeriod: 'Perennial',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Neutral/Alkaline Soil',
    description: 'Citrus fruit requiring neutral soil pH (~7.0), high air humidity, and minimal potassium input.'
  },
  papaya: {
    scientificName: 'Carica papaya',
    category: 'Fruit',
    optimalSeason: 'Tropical Year-round',
    growingPeriod: '9 - 12 months',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Fast-growing tropical fruit requiring warm weather (>30°C), substantial rainfall, and good drainage.'
  },
  coconut: {
    scientificName: 'Cocos nucifera',
    category: 'Cash Crop',
    optimalSeason: 'Coastal / Perennial',
    growingPeriod: 'Perennial (>60 yrs)',
    waterRequirement: 'High (>150mm)',
    soilType: 'Acidic Loam (pH < 6.0)',
    description: 'Coastal palm tree requiring very high humidity (>94%), high rainfall (~175mm), and warm tropical coastal climate.'
  },
  cotton: {
    scientificName: 'Gossypium hirsutum',
    category: 'Fiber',
    optimalSeason: 'Kharif',
    growingPeriod: '150 - 180 days',
    waterRequirement: 'Moderate (80-150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Major fiber cash crop requiring highest nitrogen nutrition (~118), black regur soil, and long frost-free periods.'
  },
  jute: {
    scientificName: 'Corchorus olitorius',
    category: 'Fiber',
    optimalSeason: 'Monsoon / Kharif',
    growingPeriod: '120 - 150 days',
    waterRequirement: 'High (>150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'Golden fiber crop thriving in alluvial floodplains with heavy monsoon rainfall (>170mm) and high humidity.'
  },
  coffee: {
    scientificName: 'Coffea arabica',
    category: 'Beverage',
    optimalSeason: 'Plantation / Perennial',
    growingPeriod: 'Perennial',
    waterRequirement: 'High (>150mm)',
    soilType: 'Well-drained Fertile Loam',
    description: 'High-elevation plantation beverage crop demanding rich organic matter, substantial rainfall (~158mm), and shade.'
  }
};
