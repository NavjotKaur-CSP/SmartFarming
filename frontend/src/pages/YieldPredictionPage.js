import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  BarChart3, 
  Leaf,
  TrendingUp,
  Loader2,
  RefreshCw,
  Target
} from 'lucide-react';
import { getCrops, predictYield } from '../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const YieldPredictionPage = () => {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await getCrops();
        setCrops(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch crops:', error);
      } finally {
        setCropsLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const handlePredict = async () => {
    if (!selectedCrop) return;
    
    setLoading(true);
    setPrediction(null);
    
    try {
      const response = await predictYield(selectedCrop);
      setPrediction(response.data);
      
      // Add to history
      setHistory(prev => [
        {
          crop: response.data.crop_name,
          area: response.data.field_area,
          date: new Date().toLocaleDateString()
        },
        ...prev.slice(0, 4)
      ]);
    } catch (error) {
      console.error('Failed to predict yield:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample chart data
  const chartData = [
    { name: 'Wheat', expected: 22, actual: 20 },
    { name: 'Rice', expected: 28, actual: 26 },
    { name: 'Maize', expected: 18, actual: 19 },
    { name: 'Cotton', expected: 15, actual: 14 },
    { name: 'Soybean', expected: 12, actual: 11 },
  ];

  return (
    <div className="space-y-6" data-testid="yield-prediction-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1C1917]">Yield Prediction</h2>
        <p className="text-[#78716C]">AI-powered predictions for your crop yields</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Input */}
        <Card className="bg-white border-[#E7E5E4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2F5233]" />
              Generate Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cropsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2F5233]" />
              </div>
            ) : crops.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="w-12 h-12 mx-auto text-[#78716C] opacity-50 mb-4" />
                <p className="text-[#78716C]">No crops available. Add crops first to predict yields.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#44403C]">Select Crop</label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger data-testid="yield-crop-select">
                      <SelectValue placeholder="Choose a crop for prediction" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-[#2F5233]" />
                            {crop.name} - {crop.field_area} acres
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-[#FAFAFA] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#1C1917] mb-2">Prediction considers:</h4>
                  <ul className="text-sm text-[#78716C] space-y-1">
                    <li>• Historical yield data</li>
                    <li>• Current weather patterns</li>
                    <li>• Soil conditions</li>
                    <li>• Crop variety & planting date</li>
                  </ul>
                </div>

                <Button 
                  className="w-full bg-[#2F5233] hover:bg-[#243E26]"
                  onClick={handlePredict}
                  disabled={!selectedCrop || loading}
                  data-testid="predict-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Predict Yield
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <Card className="bg-white border-[#E7E5E4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D97736]" />
              Prediction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-[#2F5233] mb-4" />
                <p className="text-[#78716C]">AI is calculating your yield...</p>
              </div>
            ) : prediction ? (
              <div className="space-y-4" data-testid="prediction-results">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[#1C1917]">{prediction.crop_name}</h3>
                    <p className="text-sm text-[#78716C]">{prediction.field_area} acres</p>
                  </div>
                  <Badge className="bg-[#D97736]/10 text-[#D97736]">
                    AI Prediction
                  </Badge>
                </div>
                <div className="bg-[#FAFAFA] rounded-lg p-4 whitespace-pre-wrap text-[#44403C] text-sm leading-relaxed max-h-64 overflow-y-auto">
                  {prediction.prediction}
                </div>
                <div className="flex items-center justify-between text-xs text-[#78716C] pt-2 border-t border-[#E7E5E4]">
                  <span>Generated: {new Date(prediction.generated_at).toLocaleString()}</span>
                  {prediction.is_mock && (
                    <Badge variant="outline" className="text-[#D97736]">Demo Mode</Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-[#2F5233] text-[#2F5233]"
                  onClick={handlePredict}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Prediction
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="w-16 h-16 text-[#78716C] opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-[#1C1917] mb-2">No Prediction Yet</h3>
                <p className="text-[#78716C] max-w-sm">
                  Select a crop and click "Predict Yield" to get AI-powered yield estimates.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Yield Comparison Chart */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2F5233]" />
            Yield Comparison (Quintals/Acre)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80" data-testid="yield-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="name" stroke="#78716C" fontSize={12} />
                <YAxis stroke="#78716C" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="expected" name="Expected Yield" fill="#2F5233" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Yield" fill="#D97736" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Predictions */}
      {history.length > 0 && (
        <Card className="bg-white border-[#E7E5E4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917]">Recent Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Leaf className="w-5 h-5 text-[#2F5233]" />
                    <div>
                      <p className="font-medium text-[#1C1917]">{item.crop}</p>
                      <p className="text-sm text-[#78716C]">{item.area} acres</p>
                    </div>
                  </div>
                  <span className="text-sm text-[#78716C]">{item.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YieldPredictionPage;
