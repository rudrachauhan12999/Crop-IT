import React, { useState, useEffect } from 'react';
import {
  SoilEnvironmentalInput,
  PredictionResponse,
  CropAlternative
} from '../types/ml';
import {
  postCropPrediction,
  checkBackendHealth,
  validatePredictionInput,
  getApiBaseUrl,
  setApiBaseUrl,
  BACKEND_UNAVAILABLE_MESSAGE,
  ApiError
} from '../services/api';
import {
  Sprout,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
  Thermometer,
  CloudRain,
  Droplets,
  FlaskConical,
  Compass,
  ArrowRight,
  Info,
  RefreshCw,
  Server,
  Settings2,
  Terminal,
  Wifi,
  WifiOff
} from 'lucide-react';
import BorderGlow from '../components/BorderGlow';

const PRESET_SCENARIOS: { name: string; icon: string; desc: string; values: SoilEnvironmentalInput }[] = [
  {
    name: 'Monsoon Paddy Wetland (Rice)',
    icon: '🌾',
    desc: 'Heavy rainfall, high humidity, warm temperature',
    values: { N: 80, P: 48, K: 40, temperature: 24, humidity: 82, ph: 6.5, rainfall: 240 }
  },
  {
    name: 'High-K Fruit Vineyard (Grapes)',
    icon: '🍇',
    desc: 'Extremely high Potassium & Phosphorus requirement',
    values: { N: 25, P: 135, K: 200, temperature: 24, humidity: 82, ph: 6.0, rainfall: 70 }
  },
  {
    name: 'Arid Legume Soil (Chickpea)',
    icon: '🌱',
    desc: 'Cool winter temperature, low humidity, dry conditions',
    values: { N: 40, P: 68, K: 80, temperature: 19, humidity: 17, ph: 7.3, rainfall: 80 }
  },
  {
    name: 'Heavy-Feeder Cash Crop (Cotton)',
    icon: '☁️',
    desc: 'High Nitrogen requirement, warm climate',
    values: { N: 120, P: 46, K: 20, temperature: 24, humidity: 80, ph: 6.9, rainfall: 80 }
  },
  {
    name: 'Tropical Humid Plantation (Coffee)',
    icon: '☕',
    desc: 'Substantial rainfall, moderate humidity & elevation',
    values: { N: 100, P: 30, K: 30, temperature: 25, humidity: 60, ph: 6.8, rainfall: 160 }
  }
];

const DEFAULT_INPUTS: SoilEnvironmentalInput = {
  N: 80,
  P: 48,
  K: 40,
  temperature: 24.5,
  humidity: 80.0,
  ph: 6.5,
  rainfall: 180.0
};

export const Recommendation: React.FC = () => {
  const [inputs, setInputs] = useState<SoilEnvironmentalInput>(DEFAULT_INPUTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [backendConfigOpen, setBackendConfigOpen] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [healthStatus, setHealthStatus] = useState<string>('checking');

  // Input validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await checkBackendHealth();
      setHealthStatus(health.status === 'ok' ? 'connected' : 'degraded');
    } catch {
      setHealthStatus('offline');
    }
  };

  const validateFields = (data: SoilEnvironmentalInput) => {
    const val = validatePredictionInput(data);
    const errMap: Record<string, string> = {};
    if (!val.valid) {
      val.errors.forEach((err) => {
        if (err.includes('Nitrogen')) errMap.N = err;
        if (err.includes('Phosphorus')) errMap.P = err;
        if (err.includes('Potassium')) errMap.K = err;
        if (err.includes('Temperature')) errMap.temperature = err;
        if (err.includes('Humidity')) errMap.humidity = err;
        if (err.includes('pH')) errMap.ph = err;
        if (err.includes('Rainfall')) errMap.rainfall = err;
      });
    }
    setFieldErrors(errMap);
    return val.valid;
  };

  const handleInputChange = (field: keyof SoilEnvironmentalInput, value: number) => {
    const newInputs = {
      ...inputs,
      [field]: isNaN(value) ? 0 : value
    };
    setInputs(newInputs);
    // Clear error for this field
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setInputs(preset.values);
    setError(null);
    setIsBackendUnavailable(false);
    setFieldErrors({});
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setPrediction(null);
    setError(null);
    setIsBackendUnavailable(false);
    setFieldErrors({});
  };

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrlInput.trim());
    setBackendConfigOpen(false);
    checkHealth();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields(inputs)) {
      setError('Please resolve invalid input fields before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsBackendUnavailable(false);

    try {
      const result = await postCropPrediction(inputs);
      setPrediction(result);
    } catch (err: any) {
      console.error('Prediction API Error:', err);
      const isUnavailable =
        err.message === BACKEND_UNAVAILABLE_MESSAGE ||
        err.isNetworkError ||
        err.status === 503 ||
        err.status === 502;
      setIsBackendUnavailable(isUnavailable);
      setError(err.message || BACKEND_UNAVAILABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Description & Presets Header */}
      <BorderGlow
        className="w-full"
        backgroundColor="#ffffff"
        borderRadius={16}
        glowRadius={25}
        glowIntensity={0.7}
        colors={['#10b981', '#34d399', '#06b6d4']}
      >
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Crop Recommendation Decision Support</h2>
              <p className="text-xs text-zinc-500">
                Select a predefined agricultural soil profile or input custom soil chemistry and microclimate metrics.
              </p>
            </div>

            {/* Backend URL and Connectivity Pill */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                id="backend-config-toggle-btn"
                onClick={() => setBackendConfigOpen(!backendConfigOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold border border-zinc-300 transition-colors cursor-pointer"
                title="Configure Python ML API Endpoint URL"
              >
                <Settings2 className="w-3.5 h-3.5 text-zinc-600" />
                <span>API Endpoint</span>
              </button>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  healthStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {healthStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>API Ready</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>ML Service Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Backend URL Config Expandable Box */}
          {backendConfigOpen && (
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-300 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Python FastAPI Base URL Configuration</span>
                </span>
                <span className="text-[11px] text-zinc-500">Default: Same Origin (/api)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. http://localhost:8000 or leave empty"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-300 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Save URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApiUrlInput('');
                    setApiBaseUrl(null);
                    setBackendConfigOpen(false);
                    checkHealth();
                  }}
                  className="px-3 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Quick Presets Carousel */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-2">
              Quick Agricultural Presets
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {PRESET_SCENARIOS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`preset-btn-${idx}`}
                  onClick={() => applyPreset(p)}
                  className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-100/60 hover:border-emerald-300 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-bold text-zinc-800 group-hover:text-emerald-800 leading-tight">
                      {p.name.split(' ')[0]} {p.name.split(' ')[1]}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-tight line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </BorderGlow>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form (7 columns on large screens) */}
        <div className="lg:col-span-7">
          <BorderGlow
            className="w-full"
            backgroundColor="#ffffff"
            borderRadius={20}
            glowRadius={30}
            glowIntensity={0.8}
            colors={['#10b981', '#14b8a6', '#06b6d4']}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-zinc-900">Soil &amp; Environmental Parameters</h3>
                </div>
                <button
                  type="button"
                  id="reset-form-btn"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Values</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Soil Chemistry (N, P, K, pH) */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                    1. Soil Chemical Properties
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nitrogen */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.N ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-n" className="font-bold text-zinc-800">
                          Nitrogen (N)
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-n"
                            type="number"
                            min={0}
                            max={140}
                            value={inputs.N}
                            onChange={(e) => handleInputChange('N', parseFloat(e.target.value) || 0)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">ppm</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={0}
                          max={140}
                          step={1}
                          value={inputs.N}
                          onChange={(e) => handleInputChange('N', parseFloat(e.target.value) || 0)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>0 ppm</span>
                          <span>140 ppm</span>
                        </div>
                      </div>
                      {fieldErrors.N ? (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.N}</p>
                      ) : (
                        <p className="text-[10px] text-zinc-600">Essential for vegetative biomass and chlorophyll</p>
                      )}
                    </div>

                    {/* Phosphorus */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.P ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-p" className="font-bold text-zinc-800">
                          Phosphorus (P)
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-p"
                            type="number"
                            min={5}
                            max={145}
                            value={inputs.P}
                            onChange={(e) => handleInputChange('P', parseFloat(e.target.value) || 5)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">ppm</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={5}
                          max={145}
                          step={1}
                          value={inputs.P}
                          onChange={(e) => handleInputChange('P', parseFloat(e.target.value) || 5)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>5 ppm</span>
                          <span>145 ppm</span>
                        </div>
                      </div>
                      {fieldErrors.P ? (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.P}</p>
                      ) : (
                        <p className="text-[10px] text-zinc-600">Drives root development and early flowering</p>
                      )}
                    </div>

                    {/* Potassium */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.K ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-k" className="font-bold text-zinc-800">
                          Potassium (K)
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-k"
                            type="number"
                            min={5}
                            max={205}
                            value={inputs.K}
                            onChange={(e) => handleInputChange('K', parseFloat(e.target.value) || 5)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">ppm</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={5}
                          max={205}
                          step={1}
                          value={inputs.K}
                          onChange={(e) => handleInputChange('K', parseFloat(e.target.value) || 5)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>5 ppm</span>
                          <span>205 ppm</span>
                        </div>
                      </div>
                      {fieldErrors.K ? (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.K}</p>
                      ) : (
                        <p className="text-[10px] text-zinc-600">Controls stomatal water regulation and disease immunity</p>
                      )}
                    </div>

                    {/* Soil pH */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.ph ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-ph" className="font-bold text-zinc-800">
                          Soil pH
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-ph"
                            type="number"
                            min={3.5}
                            max={10.0}
                            step={0.1}
                            value={inputs.ph}
                            onChange={(e) => handleInputChange('ph', parseFloat(e.target.value) || 3.5)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">pH</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={3.5}
                          max={10.0}
                          step={0.1}
                          value={inputs.ph}
                          onChange={(e) => handleInputChange('ph', parseFloat(e.target.value) || 3.5)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>3.5 (Acidic)</span>
                          <span>10.0 (Alkaline)</span>
                        </div>
                      </div>
                      {fieldErrors.ph ? (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.ph}</p>
                      ) : (
                        <p className="text-[10px] text-zinc-600">Controls nutrient bioavailability to plant root systems</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Environmental Climate Parameters */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                    2. Atmospheric &amp; Climatic Conditions
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Temperature */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.temperature ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-temp" className="font-bold text-zinc-800 flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                          <span>Temperature</span>
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-temp"
                            type="number"
                            min={5}
                            max={50}
                            step={0.1}
                            value={inputs.temperature}
                            onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 5)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">°C</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={5}
                          max={50}
                          step={0.5}
                          value={inputs.temperature}
                          onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 5)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>5 °C</span>
                          <span>50 °C</span>
                        </div>
                      </div>
                      {fieldErrors.temperature && (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.temperature}</p>
                      )}
                    </div>

                    {/* Humidity */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.humidity ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-humidity" className="font-bold text-zinc-800 flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                          <span>Humidity</span>
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-humidity"
                            type="number"
                            min={10}
                            max={100}
                            value={inputs.humidity}
                            onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value) || 10)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">%</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={1}
                          value={inputs.humidity}
                          onChange={(e) => handleInputChange('humidity', parseFloat(e.target.value) || 10)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>10%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      {fieldErrors.humidity && (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.humidity}</p>
                      )}
                    </div>

                    {/* Rainfall */}
                    <div className={`p-4 rounded-xl bg-zinc-50 border ${fieldErrors.rainfall ? 'border-red-400 bg-red-50/20' : 'border-zinc-200/80'} space-y-2.5`}>
                      <div className="flex justify-between items-center text-xs">
                        <label htmlFor="input-rainfall" className="font-bold text-zinc-800 flex items-center gap-1.5">
                          <CloudRain className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Rainfall</span>
                        </label>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-zinc-300 shadow-2xs">
                          <input
                            id="input-rainfall"
                            type="number"
                            min={10}
                            max={350}
                            value={inputs.rainfall}
                            onChange={(e) => handleInputChange('rainfall', parseFloat(e.target.value) || 10)}
                            className="w-12 text-xs font-bold text-zinc-900 bg-transparent text-center focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-500 font-medium">mm</span>
                        </div>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min={10}
                          max={350}
                          step={2}
                          value={inputs.rainfall}
                          onChange={(e) => handleInputChange('rainfall', parseFloat(e.target.value) || 10)}
                          className="w-full accent-emerald-600 cursor-pointer h-2 bg-zinc-200 rounded-lg"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                          <span>10 mm</span>
                          <span>350 mm</span>
                        </div>
                      </div>
                      {fieldErrors.rainfall && (
                        <p className="text-[10px] text-red-600 font-semibold">{fieldErrors.rainfall}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* API Error / Unavailable Banner */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="font-bold text-red-900 block">
                          {isBackendUnavailable ? 'ML Backend Unavailable' : 'Inference Request Error'}
                        </strong>
                        <p>{error}</p>
                      </div>
                    </div>

                    {isBackendUnavailable && (
                      <div className="mt-2 pt-2 border-t border-red-200/80 space-y-2">
                        <p className="text-[11px] text-red-700 font-medium">
                          To run the real-time Python Scikit-Learn service locally:
                        </p>
                        <div className="p-2.5 rounded-lg bg-zinc-900 text-emerald-400 font-mono text-[11px] flex items-center justify-between">
                          <code>uvicorn main:app --reload --port 8000</code>
                          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setIsBackendUnavailable(false);
                            checkHealth();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry Backend Connection</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  id="analyze-conditions-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-300 text-white font-bold text-sm tracking-wide shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Running Python ML Model Inference...</span>
                    </>
                  ) : (
                    <span>Analyze Conditions &amp; Recommend Crop</span>
                  )}
                </button>
              </form>
            </div>
          </BorderGlow>
        </div>

        {/* Right: Results Display (5 columns on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          {loading ? (
            /* Loading State Skeleton */
            <BorderGlow
              className="w-full"
              backgroundColor="#ffffff"
              borderRadius={20}
              glowRadius={28}
              glowIntensity={0.8}
              colors={['#10b981', '#06b6d4', '#8b5cf6']}
            >
              <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                <div className="space-y-2 max-w-xs">
                  <h4 className="text-base font-bold text-zinc-900">Evaluating Soil &amp; Microclimate</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Executing Scikit-Learn Random Forest ensemble inference across 22 Kaggle crop classes...
                  </p>
                </div>
                <div className="w-full space-y-2 pt-4 border-t border-zinc-100">
                  <div className="h-3 bg-zinc-100 rounded-full animate-pulse w-3/4 mx-auto"></div>
                  <div className="h-3 bg-zinc-100 rounded-full animate-pulse w-1/2 mx-auto"></div>
                </div>
              </div>
            </BorderGlow>
          ) : prediction ? (
            /* Successful Recommendation Result */
            <BorderGlow
              className="w-full"
              backgroundColor="#ffffff"
              borderRadius={20}
              glowRadius={32}
              glowIntensity={1.0}
              colors={['#10b981', '#06b6d4', '#8b5cf6']}
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Primary Recommended Crop Header */}
                <div className="text-center pb-6 border-b border-zinc-100">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    Primary Recommendation
                  </span>

                  <h3 className="text-3xl font-black capitalize text-zinc-900 mt-3 tracking-tight">
                    {prediction.recommendedCrop}
                  </h3>
                  {prediction.cropProfile && (
                    <p className="text-xs italic text-zinc-600 mt-0.5">
                      ({prediction.cropProfile.scientificName})
                    </p>
                  )}

                  {/* Probability Badge */}
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
                    <span>Predicted Probability:</span>
                    <span className="text-sm font-black">
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Crop Botanical & Agronomic Profile */}
                {prediction.cropProfile && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-zinc-700">
                      <div>
                        <span className="text-zinc-600 block text-[10px] uppercase font-semibold">Category</span>
                        <strong className="text-zinc-900">{prediction.cropProfile.category}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[10px] uppercase font-semibold">Optimal Season</span>
                        <strong className="text-zinc-900">{prediction.cropProfile.optimalSeason}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[10px] uppercase font-semibold">Duration</span>
                        <strong className="text-zinc-900">{prediction.cropProfile.growingPeriod}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-600 block text-[10px] uppercase font-semibold">Irrigation Need</span>
                        <strong className="text-zinc-900">{prediction.cropProfile.waterRequirement}</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-600 pt-2 border-t border-emerald-200/60 leading-relaxed">
                      {prediction.cropProfile.description}
                    </p>
                  </div>
                )}

                {/* Alternative Crop Suggestions */}
                {prediction.alternatives && prediction.alternatives.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                      Top Alternative Crop Candidates
                    </h4>
                    <div className="space-y-2">
                      {prediction.alternatives.map((alt, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="capitalize text-zinc-900 font-bold block">{alt.crop}</strong>
                            {alt.characteristics && (
                              <span className="text-[10px] text-zinc-500">{alt.characteristics}</span>
                            )}
                          </div>
                          <span className="font-semibold text-zinc-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                            {(alt.probability * 100).toFixed(1)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multi-Model Consensus Breakdown */}
                {prediction.modelComparison && (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800">Supervised Ensemble Consensus</span>
                      <span className="text-[10px] text-zinc-600">3 Algorithms</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-white border border-zinc-200">
                        <span className="text-[10px] text-zinc-600 block font-semibold">Random Forest</span>
                        <strong className="capitalize text-emerald-800 block text-xs">
                          {prediction.modelComparison.randomForest.crop}
                        </strong>
                        <span className="text-[10px] text-zinc-600">
                          {(prediction.modelComparison.randomForest.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-zinc-200">
                        <span className="text-[10px] text-zinc-600 block font-semibold">KNN (k=5)</span>
                        <strong className="capitalize text-blue-800 block text-xs">
                          {prediction.modelComparison.knn.crop}
                        </strong>
                        <span className="text-[10px] text-zinc-600">
                          {(prediction.modelComparison.knn.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-zinc-200">
                        <span className="text-[10px] text-zinc-600 block font-semibold">SVM (RBF)</span>
                        <strong className="capitalize text-purple-800 block text-xs">
                          {prediction.modelComparison.svm.crop}
                        </strong>
                        <span className="text-[10px] text-zinc-600">
                          {(prediction.modelComparison.svm.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Parameter Health Status */}
                {prediction.inputAnalysis && (
                  <div className="space-y-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-zinc-600 block text-[10px]">
                      Input Soil Chemistry Evaluation
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">
                        N: <strong>{prediction.inputAnalysis.nStatus}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">
                        P: <strong>{prediction.inputAnalysis.pStatus}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">
                        K: <strong>{prediction.inputAnalysis.kStatus}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">
                        pH: <strong>{prediction.inputAnalysis.phStatus}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px]">
                        Rain: <strong>{prediction.inputAnalysis.rainfallStatus}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </BorderGlow>
          ) : (
            /* Empty State (Awaiting input) */
            <BorderGlow
              className="w-full"
              backgroundColor="#ffffff"
              borderRadius={20}
              glowRadius={25}
              glowIntensity={0.6}
              colors={['#10b981', '#34d399', '#6ee7b7']}
            >
              <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Sprout className="w-8 h-8" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-base font-bold text-zinc-900">Awaiting Soil Inputs</h4>
                  <p className="text-xs text-zinc-500">
                    Fill in the 7 soil and environmental variables on the left and click "Analyze Conditions" to generate instant recommendations.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                  Random Forest • KNN • SVM Ready
                </div>
              </div>
            </BorderGlow>
          )}
        </div>
      </div>
    </div>
  );
};
