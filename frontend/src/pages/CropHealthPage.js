import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  FlaskConical, 
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getCrops, analyzeCropHealth } from '../services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const CropHealthPage = () => {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cropsLoading, setCropsLoading] = useState(true);

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

  const handleAnalyze = async () => {
    if (!selectedCrop) return;
    
    setLoading(true);
    setAnalysis(null);
    
    try {
      const response = await analyzeCropHealth(selectedCrop, symptoms);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze crop health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = (text) => {
    if (!text) return <FlaskConical className="w-5 h-5 text-[#0EA5E9]" />;
    const lowerText = text.toLowerCase();
    if (lowerText.includes('excellent') || lowerText.includes('good')) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (lowerText.includes('fair') || lowerText.includes('moderate')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    if (lowerText.includes('poor') || lowerText.includes('critical')) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <FlaskConical className="w-5 h-5 text-[#0EA5E9]" />;
  };

  return (
    <div className="space-y-6" data-testid="crop-health-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1C1917]">Crop Health Analysis</h2>
        <p className="text-[#78716C]">AI-powered analysis of your crop's health status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-white border-[#E7E5E4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#2F5233]" />
              Analyze Crop Health
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
                <p className="text-[#78716C]">No crops available. Add crops first to analyze their health.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#44403C]">Select Crop</label>
                  <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                    <SelectTrigger data-testid="crop-select">
                      <SelectValue placeholder="Choose a crop to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {crops.map((crop) => (
                        <SelectItem key={crop.id} value={crop.id}>
                          <div className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-[#2F5233]" />
                            {crop.name} {crop.variety && `(${crop.variety})`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#44403C]">
                    Symptoms / Observations (Optional)
                  </label>
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe any visible symptoms, leaf discoloration, pest presence, growth issues, etc..."
                    rows={4}
                    className="resize-none"
                    data-testid="symptoms-input"
                  />
                </div>

                <Button 
                  className="w-full bg-[#2F5233] hover:bg-[#243E26]"
                  onClick={handleAnalyze}
                  disabled={!selectedCrop || loading}
                  data-testid="analyze-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Analyze Health
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="bg-white border-[#E7E5E4]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              {getHealthIcon(analysis?.analysis)}
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-[#2F5233] mb-4" />
                <p className="text-[#78716C]">AI is analyzing your crop...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4" data-testid="analysis-results">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[#1C1917]">{analysis.crop_name}</h3>
                  <Badge className="bg-[#2F5233]/10 text-[#2F5233]">
                    AI Analysis
                  </Badge>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-[#FAFAFA] rounded-lg p-4 whitespace-pre-wrap text-[#44403C] text-sm leading-relaxed">
                    {analysis.analysis}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[#78716C] pt-2 border-t border-[#E7E5E4]">
                  <span>Analyzed at: {new Date(analysis.analyzed_at).toLocaleString()}</span>
                  {analysis.is_mock && (
                    <Badge variant="outline" className="text-[#D97736]">Demo Mode</Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-[#2F5233] text-[#2F5233]"
                  onClick={handleAnalyze}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FlaskConical className="w-16 h-16 text-[#78716C] opacity-50 mb-4" />
                <h3 className="text-lg font-medium text-[#1C1917] mb-2">No Analysis Yet</h3>
                <p className="text-[#78716C] max-w-sm">
                  Select a crop and click "Analyze Health" to get AI-powered insights about your crop's condition.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Health Monitoring Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAFAFA] rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-[#1C1917] mb-1">Regular Inspection</h4>
              <p className="text-sm text-[#78716C]">Check your crops weekly for early signs of disease or pest infestation.</p>
            </div>
            <div className="p-4 bg-[#FAFAFA] rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h4 className="font-medium text-[#1C1917] mb-1">Document Changes</h4>
              <p className="text-sm text-[#78716C]">Note any changes in leaf color, growth patterns, or unusual symptoms.</p>
            </div>
            <div className="p-4 bg-[#FAFAFA] rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <FlaskConical className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-[#1C1917] mb-1">AI Assistance</h4>
              <p className="text-sm text-[#78716C]">Use AI analysis regularly to catch issues before they become severe.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CropHealthPage;
