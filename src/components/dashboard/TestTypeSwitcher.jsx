import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { TestConfiguration } from '@/entities/TestConfiguration';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function TestTypeSwitcher({ currentUser, onTestChange }) {
  const [testConfigs, setTestConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    loadTestConfigs();
  }, []);

  const loadTestConfigs = async () => {
    try {
      const configs = await TestConfiguration.filter({ is_active: true });
      setTestConfigs(configs || []);
    } catch (error) {
      console.error('Error loading test configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSwitch = async (config) => {
    if (isSwitching) return;
    
    setIsSwitching(true);
    try {
      await User.updateMyUserData({
        target_country: config.country_code,
        target_test: config.test_name,
        test_language: config.language_code === 'fi' ? 'finnish' : config.language_code === 'sv' ? 'swedish' : 'danish'
      });
      
      if (onTestChange) {
        onTestChange(config);
      }
      
      // Reload the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error('Error switching test:', error);
      alert('Failed to switch test. Please try again.');
    } finally {
      setIsSwitching(false);
    }
  };

  const getCurrentConfig = () => {
    return testConfigs.find(
      config => 
        config.country_code === currentUser.target_country &&
        config.test_name === currentUser.target_test
    );
  };

  const currentConfig = getCurrentConfig();

  if (isLoading) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600">Preparing for:</p>
            <p className="font-bold text-lg">{currentConfig?.display_name || 'YKI Test'}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const otherConfigs = testConfigs.filter(c => c.id !== currentConfig?.id);
              if (otherConfigs.length > 0) {
                handleTestSwitch(otherConfigs[0]);
              }
            }}
            disabled={isSwitching || testConfigs.length <= 1}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSwitching ? 'animate-spin' : ''}`} />
            Switch Test
          </Button>
        </div>
        
        {currentConfig && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{currentConfig.country_code}</Badge>
            <Badge variant="secondary">{currentConfig.language_code.toUpperCase()}</Badge>
            <Badge variant="outline">{currentConfig.levels.join(', ')}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}