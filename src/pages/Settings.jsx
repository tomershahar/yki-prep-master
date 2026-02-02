import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { TestConfiguration } from "@/entities/TestConfiguration";
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Save, User as UserIcon, BookOpen, Headphones, Mic, PenTool, LogOut, Loader2, Moon, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const sectionOptions = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'listening', label: 'Listening', icon: Headphones },
    { id: 'speaking', label: 'Speaking', icon: Mic },
    { id: 'writing', label: 'Writing', icon: PenTool },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [testConfig, setTestConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    target_country: 'FI',
    target_test: 'YKI',
    test_language: 'finnish',
    interface_language: 'en',
    target_level: '1',
    reading_level: '1',
    listening_level: '1',
    speaking_level: '1',
    writing_level: '1',
    daily_goal_minutes: 30,
    test_date: '',
    profile_picture_url: '',
    show_grammar_tips: true,
    dark_mode: false
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Load test configuration
      const configs = await TestConfiguration.filter({
        country_code: currentUser.target_country || 'FI',
        test_name: currentUser.target_test || 'YKI',
        is_active: true
      });
      
      const config = configs && configs.length > 0 ? configs[0] : null;
      setTestConfig(config);
      
      // Get default level from config
      const defaultLevel = config?.levels?.[0] || '3';
      
      setFormData({
        target_country: currentUser.target_country || 'FI',
        target_test: currentUser.target_test || 'YKI',
        test_language: currentUser.test_language || 'finnish',
        interface_language: currentUser.interface_language || 'en',
        target_level: currentUser.target_level || defaultLevel,
        reading_level: currentUser.reading_level || defaultLevel,
        listening_level: currentUser.listening_level || defaultLevel,
        speaking_level: currentUser.speaking_level || defaultLevel,
        writing_level: currentUser.writing_level || defaultLevel,
        daily_goal_minutes: currentUser.daily_goal_minutes || 30,
        test_date: currentUser.test_date || '',
        profile_picture_url: currentUser.profile_picture_url || '',
        show_grammar_tips: currentUser.show_grammar_tips !== false,
        dark_mode: currentUser.dark_mode || false
      });
      
      // Apply dark mode immediately based on user preference
      if (currentUser.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { ...formData };
      await User.updateMyUserData(dataToSave);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({...prev, profile_picture_url: file_url}));
      // Immediately save the new picture URL
      await User.updateMyUserData({ profile_picture_url: file_url });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // NEW: Special handler for dark mode that applies changes immediately
  const handleDarkModeChange = async (checked) => {
    // Update form data
    setFormData(prev => ({ ...prev, dark_mode: checked }));
    
    // Apply dark mode immediately to the DOM
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save to database immediately
    try {
      await User.updateMyUserData({ dark_mode: checked });
    } catch (error) {
      console.error("Error saving dark mode preference:", error);
      // Revert the DOM change if save failed
      if (checked) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
      setFormData(prev => ({ ...prev, dark_mode: !checked })); // Revert state
      alert('Error saving dark mode preference. Please try again.');
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      try {
        await User.logout();
        window.location.reload();
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Please try again.");
      }
    }
  };

  const formatTime = (hours) => {
    if (hours === null || hours === undefined) return "0m";
    
    const numericHours = parseFloat(hours);

    if (isNaN(numericHours)) return "0m";

    const wholeHours = Math.floor(numericHours);
    const minutes = Math.round((numericHours - wholeHours) * 60);
    
    if (wholeHours === 0 && minutes === 0) {
      return "0m";
    } else if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  };

  if (isLoading) {
    return <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-8 max-w-4xl mx-auto"><div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-48"></div><div className="h-96 bg-gray-200 rounded-lg"></div></div></div>;
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl"><SettingsIcon className="w-6 h-6 text-white" /></div>
        <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1><p className="text-gray-600 dark:text-gray-400">Customize your learning experience</p></div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5" />Profile Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                      <AvatarImage src={formData.profile_picture_url || user?.profile_picture_url} alt={user?.full_name} />
                      <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 flex-grow">
                      <Label htmlFor="profile-picture">Profile Picture</Label>
                      <Input id="profile-picture" type="file" accept="image/*" onChange={handleProfilePictureUpload} disabled={isUploading} />
                      {isUploading && <div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 mr-1 animate-spin" />Uploading...</div>}
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_test">Target Test</Label>
                <Select value={formData.target_test} onValueChange={async (value) => {
                  handleChange('target_test', value);
                  
                  // Auto-update country and language based on test selection
                  let country = 'FI';
                  let language = 'finnish';
                  
                  if (value === 'YKI') {
                    country = 'FI';
                  } else if (value === 'Swedex' || value === 'TISUS' || value === 'SFI') {
                    country = 'SE';
                    language = 'swedish';
                  } else if (value === 'PD3' || value === 'PD2') {
                    country = 'DK';
                    language = 'danish';
                  }
                  
                  handleChange('target_country', country);
                  handleChange('test_language', language);
                  
                  // Load new test config and reset levels
                  try {
                    const configs = await TestConfiguration.filter({
                      country_code: country,
                      test_name: value,
                      is_active: true
                    });
                    
                    const newConfig = configs && configs.length > 0 ? configs[0] : null;
                    setTestConfig(newConfig);
                    
                    // Reset all levels to the first available level in the new config
                    const defaultLevel = newConfig?.levels?.[0] || '3';
                    handleChange('target_level', defaultLevel);
                    handleChange('reading_level', defaultLevel);
                    handleChange('listening_level', defaultLevel);
                    handleChange('speaking_level', defaultLevel);
                    handleChange('writing_level', defaultLevel);
                  } catch (error) {
                    console.error('Error loading test config:', error);
                  }
                }}>
                  <SelectTrigger id="target_test"><SelectValue placeholder="Select test" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YKI">🇫🇮 YKI (Finnish/Swedish)</SelectItem>
                    <SelectItem value="Swedex">🇸🇪 Swedex</SelectItem>
                    <SelectItem value="PD3">🇩🇰 Prøve i Dansk PD3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_test === 'YKI' && (
                <div className="space-y-2">
                  <Label htmlFor="test_language">Test Language</Label>
                  <Select value={formData.test_language} onValueChange={(value) => handleChange('test_language', value)}>
                    <SelectTrigger id="test_language"><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finnish">Finnish</SelectItem>
                      <SelectItem value="swedish">Swedish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="test_date">Test Date (optional)</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={formData.test_date}
                  onChange={(e) => handleChange('test_date', e.target.value)}
                />
              </div>

              <div>
                <Label>Skill Levels</Label>
                {testConfig && (
                  <p className="text-xs text-gray-500 mt-1">
                    {testConfig.scoring_rules?.scale_type === 'numeric_1_6' && 'YKI Scale: 1 (A1) → 2 (A2) → 3 (B1) → 4 (B2) → 5 (C1) → 6 (C2)'}
                    {testConfig.scoring_rules?.scale_type === 'cefr' && 'CEFR Scale: ' + testConfig.levels.join(', ')}
                    {testConfig.scoring_rules?.scale_type === 'danish_7_point' && 'Danish 7-point Scale (B2 Level)'}
                  </p>
                )}
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  {sectionOptions.map(section => (
                    <div key={section.id} className="space-y-1">
                      <Label htmlFor={`${section.id}_level`} className="flex items-center gap-1.5 text-sm font-medium"><section.icon className="w-4 h-4" />{section.label}</Label>
                      <Select value={formData[`${section.id}_level`]} onValueChange={(value) => handleChange(`${section.id}_level`, value)}>
                        <SelectTrigger id={`${section.id}_level`}><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                          {testConfig?.levels?.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Daily Goal (minutes)</Label>
                <Input id="goal" type="number" min="5" max="300" value={formData.daily_goal_minutes} onChange={(e) => handleChange('daily_goal_minutes', parseInt(e.target.value))}/>
              </div>

              <div className="space-y-4">
                <Label>Practice Preferences</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <Label htmlFor="show-grammar-tips" className="text-sm">Show grammar tips during practice loading</Label>
                  </div>
                  <Switch 
                    id="show-grammar-tips"
                    checked={formData.show_grammar_tips}
                    onCheckedChange={(checked) => handleChange('show_grammar_tips', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-gray-500" />
                    <Label htmlFor="dark-mode" className="text-sm">Dark mode</Label>
                  </div>
                  <Switch 
                    id="dark-mode"
                    checked={formData.dark_mode}
                    onCheckedChange={handleDarkModeChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-sm text-gray-600">Name</Label><p className="font-medium">{user?.full_name || 'Not set'}</p></div>
              <div><Label className="text-sm text-gray-600">Email</Label><p className="font-medium">{user?.email}</p></div>
              <div><Label className="text-sm text-gray-600">Role</Label><Badge variant="secondary">{user?.role || 'User'}</Badge></div>
              <div><Label className="text-sm text-gray-600">Total Hours</Label><p className="font-medium">{formatTime(user?.total_hours_trained)}</p></div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button onClick={handleLogout} variant="outline" className="w-full" aria-label="Log out of your account">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}