
"use client";

import { Participant } from './Participant';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { IAgoraRTCRemoteUser, ICameraVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoGridProps {
  localStream: ICameraVideoTrack | null;
  isLocalVideoOff: boolean;
  isMuted: boolean;
  isNoiseCancellationEnabled: boolean;
  remoteUsers: IAgoraRTCRemoteUser[];
}

export function VideoGrid({ localStream, isLocalVideoOff, isMuted, isNoiseCancellationEnabled, remoteUsers }: VideoGridProps) {
  const { user } = useAuth();
  const participantCount = useMemo(() => remoteUsers.length + 1, [remoteUsers]);

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className={cn(
        "grid gap-4 mx-auto",
        "grid-cols-1",
        participantCount > 1 && "sm:grid-cols-2",
        participantCount > 4 && "lg:grid-cols-3",
        participantCount > 9 && "lg:grid-cols-4",
        "max-w-7xl"
      )}>
        <Participant 
          name={user?.displayName || 'You'} 
          isLocal 
          localStream={localStream ?? undefined}
          isVideoOff={isLocalVideoOff}
          isMuted={isMuted}
          isNoiseCancellationEnabled={isNoiseCancellationEnabled}
          uid={user?.uid || 'local'}
        />
        {remoteUsers.map((p) => (
          <Participant
            key={p.uid}
            user={p}
            uid={p.uid}
            name={`User ${p.uid}`}
            isVideoOff={!p.videoTrack}
            isMuted={!p.audioTrack}
          />
        ))}
      </div>
    </div>
  );
}
