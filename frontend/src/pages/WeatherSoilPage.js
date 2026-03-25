import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  CloudSun, 
  Droplets,
  ThermometerSun,
  Wind,
  Sun,
  CloudRain,
  Cloud,
  FlaskConical,
  Leaf,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { getWeather, getSoilData } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const WeatherSoilPage = () => {
  const [weather, setWeather] = useState(null);
  const [soil, setSoil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherRes, soilRes] = await Promise.all([
          getWeather(),
          getSoilData()
        ]);
        setWeather(weatherRes.data);
        setSoil(soilRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'sunny': return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'partly cloudy': return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'cloudy': return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'light rain': return <CloudRain className="w-8 h-8 text-blue-500" />;
      default: return <CloudSun className="w-8 h-8 text-[#D97736]" />;
    }
  };

  const soilRadarData = soil ? [
    { subject: 'pH Level', A: (soil.ph_level / 14) * 100, fullMark: 100 },
    { subject: 'Nitrogen', A: soil.nitrogen, fullMark: 100 },
    { subject: 'Phosphorus', A: soil.phosphorus, fullMark: 100 },
    { subject: 'Potassium', A: (soil.potassium / 300) * 100, fullMark: 100 },
    { subject: 'Organic Matter', A: (soil.organic_matter / 10) * 100, fullMark: 100 },
    { subject: 'Moisture', A: soil.moisture, fullMark: 100 },
  ] : [];

  const temperatureData = weather?.forecast?.map((day, index) => ({
    day: day.day,
    high: day.high,
    low: day.low
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F5233]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="weather-soil-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1C1917]">Weather & Soil Data</h2>
        <p className="text-[#78716C]">Real-time environmental insights for your farm</p>
      </div>

      {/* Weather Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Weather */}
        <Card className="bg-white border-[#E7E5E4] lg:col-span-1" data-testid="current-weather">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-[#D97736]" />
              Current Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-5xl font-semibold text-[#1C1917]">{weather.temperature}°C</p>
                    <p className="text-lg text-[#78716C] mt-1">{weather.condition}</p>
                  </div>
                  {getWeatherIcon(weather.condition)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAFAFA] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#78716C] mb-1">
                      <Droplets className="w-4 h-4" />
                      <span className="text-sm">Humidity</span>
                    </div>
                    <p className="text-xl font-semibold text-[#1C1917]">{weather.humidity}%</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#78716C] mb-1">
                      <Wind className="w-4 h-4" />
                      <span className="text-sm">Wind</span>
                    </div>
                    <p className="text-xl font-semibold text-[#1C1917]">{weather.wind_speed} km/h</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#78716C] mb-1">
                      <ThermometerSun className="w-4 h-4" />
                      <span className="text-sm">UV Index</span>
                    </div>
                    <p className="text-xl font-semibold text-[#1C1917]">{weather.uv_index}</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#78716C] mb-1">
                      <CloudRain className="w-4 h-4" />
                      <span className="text-sm">Rain Chance</span>
                    </div>
                    <p className="text-xl font-semibold text-[#1C1917]">{weather.precipitation_chance}%</p>
                  </div>
                </div>

                <p className="text-xs text-[#78716C] text-center">
                  Last updated: {new Date(weather.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-[#78716C]">Weather data unavailable</p>
            )}
          </CardContent>
        </Card>

        {/* 5-Day Forecast */}
        <Card className="bg-white border-[#E7E5E4] lg:col-span-2" data-testid="weather-forecast">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917]">5-Day Temperature Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="day" stroke="#78716C" fontSize={12} />
                  <YAxis stroke="#78716C" fontSize={12} unit="°C" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E7E5E4',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="high" stroke="#EF4444" strokeWidth={2} name="High" dot={{ fill: '#EF4444' }} />
                  <Line type="monotone" dataKey="low" stroke="#0EA5E9" strokeWidth={2} name="Low" dot={{ fill: '#0EA5E9' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Cards */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {weather?.forecast?.map((day, index) => (
                <div key={index} className="text-center p-3 bg-[#FAFAFA] rounded-lg">
                  <p className="text-sm font-medium text-[#1C1917]">{day.day}</p>
                  <div className="my-2">{getWeatherIcon(day.condition)}</div>
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <span className="text-red-500 flex items-center">
                      <ArrowUp className="w-3 h-3" />{day.high}°
                    </span>
                    <span className="text-blue-500 flex items-center">
                      <ArrowDown className="w-3 h-3" />{day.low}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Soil Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Overview */}
        <Card className="bg-white border-[#E7E5E4]" data-testid="soil-overview">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#2F5233]" />
              Soil Health Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {soil ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#78716C]">Health Score</p>
                    <p className="text-4xl font-semibold text-[#1C1917]">{soil.health_score}%</p>
                  </div>
                  <Badge className={`text-lg px-4 py-2 ${
                    soil.health_score >= 80 ? 'bg-green-100 text-green-700' :
                    soil.health_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {soil.health_score >= 80 ? 'Excellent' : soil.health_score >= 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-[#44403C]">
                  <Leaf className="w-5 h-5 text-[#2F5233]" />
                  <span className="font-medium">Soil Type:</span>
                  <span>{soil.soil_type}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.ph_level}</p>
                    <p className="text-xs text-[#78716C]">pH Level</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.nitrogen}</p>
                    <p className="text-xs text-[#78716C]">Nitrogen (N)</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.phosphorus}</p>
                    <p className="text-xs text-[#78716C]">Phosphorus (P)</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.potassium}</p>
                    <p className="text-xs text-[#78716C]">Potassium (K)</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.organic_matter}%</p>
                    <p className="text-xs text-[#78716C]">Organic Matter</p>
                  </div>
                  <div className="bg-[#FAFAFA] rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-[#1C1917]">{soil.moisture}%</p>
                    <p className="text-xs text-[#78716C]">Moisture</p>
                  </div>
                </div>

                <p className="text-xs text-[#78716C] text-center">
                  Last updated: {new Date(soil.updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-[#78716C]">Soil data unavailable</p>
            )}
          </CardContent>
        </Card>

        {/* Soil Radar Chart */}
        <Card className="bg-white border-[#E7E5E4]" data-testid="soil-radar">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917]">Soil Composition Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={soilRadarData}>
                  <PolarGrid stroke="#E7E5E4" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716C', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#78716C', fontSize: 10 }} />
                  <Radar name="Soil Metrics" dataKey="A" stroke="#2F5233" fill="#2F5233" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-white border-[#E7E5E4]" data-testid="soil-recommendations">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Soil Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {soil?.recommendations?.map((rec, index) => (
              <div key={index} className="p-4 bg-[#FAFAFA] rounded-lg border-l-4 border-[#2F5233]">
                <p className="text-[#44403C]">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherSoilPage;
