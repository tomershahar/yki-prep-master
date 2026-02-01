import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Zap } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ChaosControl = ({ isActive, onToggle }) => {
    const [volume, setVolume] = useState(0.2); // Default volume 20%
    const [enabled, setEnabled] = useState(false);
    const audioContextRef = useRef(null);
    const noiseNodeRef = useRef(null);
    const gainNodeRef = useRef(null);

    // Initialize Web Audio API
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();

        // Create Pink Noise buffer
        const bufferSize = 2 * audioContextRef.current.sampleRate;
        const noiseBuffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Generate Pink Noise (1/f) - approximation
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }

        // Store buffer
        noiseNodeRef.current = { buffer: noiseBuffer };

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Handle Play/Stop
    useEffect(() => {
        if (enabled) {
            playNoise();
        } else {
            stopNoise();
        }
    }, [enabled]);

    // Handle Volume Change
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        }
    }, [volume]);

    const playNoise = () => {
        if (!audioContextRef.current) return;

        // If context is suspended (autoplay policy), resume it
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // Create Source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = noiseNodeRef.current.buffer;
        source.loop = true;

        // Create Gain
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);

        // Connect
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        // Start
        source.start();
        
        // Save references to stop later
        noiseNodeRef.current.source = source;
        gainNodeRef.current = gainNode;
    };

    const stopNoise = () => {
        if (noiseNodeRef.current && noiseNodeRef.current.source) {
            try {
                noiseNodeRef.current.source.stop();
                noiseNodeRef.current.source.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
        }
    };

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
