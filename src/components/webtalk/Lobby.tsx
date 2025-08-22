
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { ICameraVideoTrack } from 'agora-rtc-sdk-ng';

interface LobbyProps {
  onJoinCall: (channelName: string) => void;
  localStream: ICameraVideoTrack | null;
  hasCameraPermission: boolean;
  onRetryCamera: () => void;
  isInitializing: boolean;
  isVideoMuted: boolean;
}

export function Lobby({ onJoinCall, localStream, hasCameraPermission, onRetryCamera, isInitializing, isVideoMuted }: LobbyProps) {
  const [channelName, setChannelName] = useState('main');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      if (!isVideoMuted) {
        localStream.play(videoRef.current);
      } else {
        localStream.stop();
      }
    }
     
     return () => {
        if(localStream) {
            localStream.stop();
        }
     }
  }, [localStream, isVideoMuted]);


  const handleJoin = () => {
    if (channelName.trim()) {
      onJoinCall(channelName.trim());
    }
  };
  
  const showVideo = localStream && !isVideoMuted;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-headline">Join a Call</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {showVideo ? (
                <div
                    ref={videoRef}
                    className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <VideoOff className="w-16 h-16" />
                    <p>{isInitializing ? 'Initializing devices...' : 'Camera is off or unavailable'}</p>
                </div>
              )}
            </div>
            { !hasCameraPermission && !isInitializing && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                  <span>Please allow camera access to use this feature.</span>
                   <Button variant="secondary" size="sm" onClick={onRetryCamera}>
                    Retry
                    </Button>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="channel-name" className="text-sm font-medium">Room Name</label>
              <Input
                id="channel-name"
                placeholder="Enter room name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
            </div>
            <Button onClick={handleJoin} className="w-full" disabled={!channelName.trim() || isInitializing}>
              {isInitializing ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
