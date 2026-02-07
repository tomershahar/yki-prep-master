import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Shuffle, Stethoscope, Briefcase, Home, Users, Building } from 'lucide-react';

const categoryIcons = {
  Healthcare: Stethoscope,
  Work: Briefcase,
  "Daily Life": Home,
  Social: Users,
  Services: Building
};

const categoryColors = {
  Healthcare: "bg-red-50 border-red-200 hover:bg-red-100",
  Work: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  "Daily Life": "bg-green-50 border-green-200 hover:bg-green-100",
  Social: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  Services: "bg-amber-50 border-amber-200 hover:bg-amber-100"
};

export default function SituationPickerModal({ isOpen, onClose, onSelectSituation, language, userLevel, practicedSituations = {} }) {
  const [situations, setSituations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadSituations();
    }
  }, [isOpen, language]);

  const loadSituations = async () => {
    try {
      setLoading(true);
      // Fetch all active situations
      const allSituations = await base44.entities.SpeakingSituation.filter({
        is_active: true
      });
      
      // Filter by language on client side (since languages is an array)
      const matchingSituations = allSituations.filter(s => 
        s.languages && s.languages.includes(language)
      );
      
      setSituations(matchingSituations);
    } catch (error) {
      console.error('Failed to load situations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSituation = (situation) => {
    onSelectSituation(situation);
    onClose();
  };

  const handleRandomPractice = () => {
    onSelectSituation(null);
    onClose();
  };

  const handleAIRecommend = () => {
    // Filter situations matching user's level
    const appropriateSituations = situations.filter(s => s.difficulty === userLevel);
    if (appropriateSituations.length > 0) {
      const recommended = appropriateSituations[Math.floor(Math.random() * appropriateSituations.length)];
      handleSelectSituation(recommended);
    } else {
      handleRandomPractice();
    }
  };

  const filteredSituations = selectedCategory === 'all' 
    ? situations 
    : situations.filter(s => s.category === selectedCategory);

  const categories = ['all', ...new Set(situations.map(s => s.category))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Choose a Practice Scenario</DialogTitle>
          <DialogDescription>
            Practice real-life conversations for the YKI exam
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>

            {/* Situations Grid */}
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {filteredSituations.map(situation => {
                const CategoryIcon = categoryIcons[situation.category] || Home;
                const practiced = practicedSituations[situation.id];
                
                return (
                  <Card 
                    key={situation.id}
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${categoryColors[situation.category]}`}
                    onClick={() => handleSelectSituation(situation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
                          <CategoryIcon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 leading-tight">{situation.title}</h3>
                            <Badge variant="outline" className="flex-shrink-0">{situation.difficulty}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{situation.context}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="text-xs">{situation.category}</Badge>
                            {practiced && (
                              <span className="text-xs text-gray-500">
                                ✓ Practiced {practiced.count}x
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Special Options */}
            <div className="grid md:grid-cols-2 gap-3 pt-4 border-t">
              <Card 
                className="cursor-pointer border-2 border-dashed hover:shadow-lg transition-all"
                onClick={handleRandomPractice}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Shuffle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Random Practice</h3>
                    <p className="text-sm text-gray-600">No specific situation</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer border-2 border-blue-300 bg-blue-50 hover:shadow-lg transition-all"
                onClick={handleAIRecommend}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Recommends</h3>
                    <p className="text-sm text-gray-600">Pick for my level</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}