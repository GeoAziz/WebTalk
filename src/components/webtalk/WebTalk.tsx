
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/webtalk/Header';
import { VideoGrid } from '@/components/webtalk/VideoGrid';
import { Controls } from '@/components/webtalk/Controls';
import { Chat } from '@/components/webtalk/Chat';
import { useToast } from "@/hooks/use-toast";
import { Lobby } from '@/components/webtalk/Lobby';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/hooks/use-chat';
import { useAgora } from '@/hooks/use-agora';


export default function WebTalk() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = useState(false);
  const [isProcessingNoise, setIsProcessingNoise] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [channelName, setChannelName] = useState("main");
  
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(channelName, user?.displayName || 'Anonymous');
  const { toast } = useToast();

  const {
    join,
    leave,
    localStream,
    remoteUsers,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    hasCameraPermission,
    initializeTracks
  } = useAgora();

  useEffect(() => {
    if (isInCall && user) {
        join(channelName, user.displayName || 'Anonymous');
    }

    return () => {
        if(isInCall) {
            leave();
        }
    }
  }, [isInCall, channelName, user, join, leave]);


  const handleJoinCall = (channel: string) => {
    setChannelName(channel);
    setIsInCall(true);
  }

  const handleLeaveCall = () => {
    leave();
    setIsInCall(false);
  };

  const handleToggleChat = () => setIsChatOpen(prev => !prev);
  
  const handleToggleNoiseCancellation = useCallback(async () => {
    const shouldEnable = !isNoiseCancellationEnabled;
    setIsNoiseCancellationEnabled(shouldEnable);
    // This is a placeholder for real-time noise cancellation
    toggleAudio(); 
    toast({
        title: `AI Noise Cancellation ${shouldEnable ? 'Enabled' : 'Disabled'}`,
        description: `Your microphone is now ${shouldEnable ? 'muted' : 'unmuted'}.`,
    });
  }, [isNoiseCancellationEnabled, toggleAudio, toast]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Invite Link Copied!",
      description: "The link has been copied to your clipboard.",
    });
  };

  if (!user) {
     return null; // AuthProvider will handle redirect
  }

  if (!isInCall) {
    return <Lobby 
        onJoinCall={handleJoinCall} 
        localStream={localStream} 
        hasCameraPermission={hasCameraPermission}
        onRetryCamera={initializeTracks}
    />;
  }
  
  return (
    <div className="flex h-screen flex-col bg-background text-foreground font-body">
      <Header participantCount={remoteUsers.length + 1} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <VideoGrid 
            localStream={localStream}
            isLocalVideoOff={isVideoMuted}
            isMuted={isAudioMuted}
            isNoiseCancellationEnabled={isNoiseCancellationEnabled}
            remoteUsers={remoteUsers}
          />
          <Controls 
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleChat={handleToggleChat}
            onLeaveCall={handleLeaveCall}
            onToggleNoiseCancellation={handleToggleNoiseCancellation}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            onCopyLink={handleCopyLink}
            isMuted={isAudioMuted}
            isVideoOff={isVideoMuted}
            isChatOpen={isChatOpen}
            isNoiseCancellationEnabled={isNoiseCancellationEnabled}
            isScreenSharing={isScreenSharing}
            isProcessingNoise={isProcessingNoise}
          />
        </div>
        <Chat
          isOpen={isChatOpen}
          onClose={handleToggleChat}
          messages={messages}
          onSendMessage={sendMessage}
        />
      </main>
    </div>
  );
}
