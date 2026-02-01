import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Zap } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ChaosControl = ({ isActive, onToggle }) => {
    const [volume, setVolume] = useState(0.4); // Default volume 40%
    const [enabled, setEnabled] = useState(false);
    const audioRef = useRef(null);

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio('/sounds/crowd.mp3');
        audioRef.current.loop = true;

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle Play/Stop
    useEffect(() => {
        if (!audioRef.current) return;

        if (enabled) {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        } else {
            audioRef.current.pause();
        }
    }, [enabled]);

    // Handle Volume Change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    return (
        <Card className="border-orange-200 bg-orange-50 mb-4">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                        <Zap className="text-orange-600 w-5 h-5" />
                    </div>
                    <div>
                        <Label htmlFor="chaos-mode" className="font-bold text-gray-800 flex items-center gap-2">
                            Chaos Mode
                            <Badge variant="outline" className="text-[10px] h-5 border-orange-300 text-orange-700">BETA</Badge>
                        </Label>
                        <p className="text-xs text-gray-500">Simulate exam background noise</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                        <VolumeX className="w-4 h-4 text-gray-400" />
                        <Slider
                            value={[volume * 100]}
                            max={100}
                            step={1}
                            onValueChange={(vals) => setVolume(vals[0] / 100)}
                            disabled={!enabled}
                            className="flex-1"
                        />
                        <Volume2 className="w-4 h-4 text-gray-600" />
                    </div>

                    <Switch
                        id="chaos-mode"
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        className="data-[state=checked]:bg-orange-500"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default ChaosControl;
