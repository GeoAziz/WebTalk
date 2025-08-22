
"use client";

import React, { useRef, useEffect } from 'react';
import { MicOff, User, Waves } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { IAgoraRTCRemoteUser, ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

interface ParticipantProps {
  user?: IAgoraRTCRemoteUser;
  localStream?: ICameraVideoTrack;
  name: string;
  isMuted?: boolean;
  isLocal?: boolean;
  isVideoOff?: boolean;
  isNoiseCancellationEnabled?: boolean;
  uid: string | number;
}

export function Participant({ name, isMuted, isLocal, isVideoOff, isNoiseCancellationEnabled, uid, user, localStream }: ParticipantProps) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
        if (isLocal && localStream) {
            console.log(`[Participant] Playing local video for uid=${uid}`);
            localStream.play(videoRef.current);
        } else if (user?.videoTrack) {
            console.log(`[Participant] Playing remote video for uid=${uid}`);
            user.videoTrack.play(videoRef.current);
        }
    }
    
    return () => {
        if(isLocal && localStream) {
            console.log(`[Participant] Stopping local video for uid=${uid}`);
            localStream.stop();
        }
        // Remote track is stopped by Agora automatically on user leave
    }
  }, [user, isLocal, localStream]);

  useEffect(() => {
    console.log(`[Participant] Render: name=${name}, uid=${uid}, isLocal=${isLocal}, isMuted=${isMuted}, isVideoOff=${isVideoOff}`);
  }, [name, uid, isLocal, isMuted, isVideoOff]);

  return (
    <Card className="relative aspect-video flex items-center justify-center overflow-hidden bg-card/50 shadow-lg">
      <div className={cn("w-full h-full transition-opacity duration-300", isVideoOff ? "opacity-0" : "opacity-100")}>
        <div ref={videoRef} className="w-full h-full object-cover" />
      </div>
      
      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
           <Avatar className="w-24 h-24">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${name.charAt(0)}`} data-ai-hint="person portrait" />
            <AvatarFallback className="text-4xl">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="absolute bottom-2 left-2 p-2 bg-black/50 text-white text-sm font-medium rounded-lg flex items-center gap-2">
        <span>{name}</span>
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-2">
        {isMuted && (
          <div className="p-2 bg-black/50 rounded-full">
            <MicOff className="h-4 w-4 text-white" />
          </div>
        )}
        {isNoiseCancellationEnabled && isLocal && (
          <div className="p-2 bg-primary/80 rounded-full">
            <Waves className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}
