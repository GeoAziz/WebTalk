
"use client";

import React from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff, MessageSquare, PhoneOff, Waves, Loader2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeaveCall: () => void;
  onToggleNoiseCancellation: () => void;
  onCopyLink: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isNoiseCancellationEnabled: boolean;
  isProcessingNoise: boolean;
}

const ControlButton = ({ tooltip, onClick, children, className, 'data-active': dataActive, disabled }: { tooltip: string, onClick: () => void, children: React.ReactNode, className?: string, 'data-active'?: boolean, disabled?: boolean }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="lg"
        onClick={onClick}
        className={cn(
          "bg-card/80 backdrop-blur-sm border-gray-600/20 hover:bg-accent/80 hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
          className
        )}
        data-active={dataActive}
        disabled={disabled}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tooltip}</p>
    </TooltipContent>
  </Tooltip>
);

export function Controls({
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeaveCall,
  onToggleNoiseCancellation,
  onCopyLink,
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  isNoiseCancellationEnabled,
  isProcessingNoise,
}: ControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex justify-center items-center gap-2 md:gap-4 p-4 bg-background/50 border-t">
        <ControlButton tooltip={isMuted ? 'Unmute' : 'Mute'} onClick={onToggleAudio} data-active={isMuted}>
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </ControlButton>
        <ControlButton tooltip={isVideoOff ? 'Start Video' : 'Stop Video'} onClick={onToggleVideo} data-active={isVideoOff}>
          {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
        </ControlButton>
        <ControlButton tooltip={isScreenSharing ? 'Stop Sharing' : 'Share Screen'} onClick={onToggleScreenShare} data-active={isScreenSharing}>
          {isScreenSharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
        </ControlButton>
        <ControlButton 
            tooltip="AI Noise Cancellation" 
            onClick={onToggleNoiseCancellation} 
            data-active={isNoiseCancellationEnabled}
            disabled={isProcessingNoise}
        >
          {isProcessingNoise ? <Loader2 className="h-6 w-6 animate-spin" /> : <Waves className="h-6 w-6" />}
        </ControlButton>
         <ControlButton tooltip="Copy Invite Link" onClick={onCopyLink}>
          <Link className="h-6 w-6" />
        </ControlButton>
        <ControlButton tooltip={isChatOpen ? 'Close Chat' : 'Open Chat'} onClick={onToggleChat} data-active={isChatOpen}>
          <MessageSquare className="h-6 w-6" />
        </ControlButton>
        <ControlButton tooltip="Leave Call" onClick={onLeaveCall} className="bg-destructive/90 hover:bg-destructive text-destructive-foreground">
          <PhoneOff className="h-6 w-6" />
        </ControlButton>
      </div>
    </TooltipProvider>
  );
}
