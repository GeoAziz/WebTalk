
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack, IScreenVideoTrack } from 'agora-rtc-sdk-ng';
import { useToast } from './use-toast';

const appId = 'f5b2cc3091c04b67bc92482ad0b0c5ea';

export const useAgora = () => {
  const clientRef = useRef<IAgoraRTCClient>();
  const [localStream, setLocalStream] = useState<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<IScreenVideoTrack | null>(null);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);

  const { toast } = useToast();

  const initializeTracks = useCallback(async () => {
    try {
        if (!localAudioTrackRef.current) {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            localAudioTrackRef.current = audioTrack;
        }
        if (!localVideoTrackRef.current) {
            const videoTrack = await AgoraRTC.createCameraVideoTrack();
            localVideoTrackRef.current = videoTrack;
            setLocalStream(videoTrack);
        }
        setHasCameraPermission(true);
    } catch (error) {
        console.error('Failed to get local stream', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Device Error',
            description: 'Could not access camera or microphone. Please check permissions.',
        });
    }
  }, [toast]);

  useEffect(() => {
    const initializeClient = async () => {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        await initializeTracks();
    };
    initializeClient();

    return () => {
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      clientRef.current?.leave();
    };
  }, [initializeTracks]);
  
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
        // This is handled by user-left
    };
    
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
        setRemoteUsers(prev => [...prev, user]);
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    };

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, []);

  const join = useCallback(async (channel: string, displayName: string) => {
    const client = clientRef.current;
    if (!client) return;
    try {
      const joinedUid = await client.join(appId, channel, null);
      setUid(String(joinedUid));
      if (localAudioTrackRef.current && localVideoTrackRef.current) {
        if (client.connectionState !== 'CONNECTED') {
          await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
        }
      }
    } catch (err: any) {
      console.error('Join failed', err);
      toast({ variant: 'destructive', title: 'Join Failed', description: err.message });
    }
  }, [toast]);

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!screenTrackRef.current || !localVideoTrackRef.current || !client) return;
  
    await client.unpublish(screenTrackRef.current);
    screenTrackRef.current.stop();
    screenTrackRef.current.close();
    screenTrackRef.current = null;
    
    await client.publish(localVideoTrackRef.current);
    setLocalStream(localVideoTrackRef.current);
    setIsScreenSharing(false);
  
  }, []);

  const leave = useCallback(async () => {
    const client = clientRef.current;
  
    if (isScreenSharing) {
      await stopScreenShare();
    }
    
    if (client && client.localTracks.length > 0) {
        // Ensure all tracks are stopped and closed before unpublishing
        client.localTracks.forEach(track => {
            track.stop();
            track.close();
        });
        await client.unpublish(client.localTracks);
    }
  
    if(client) {
      await client.leave();
    }
  
    setRemoteUsers([]);
    setUid(null);
    setIsScreenSharing(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);

    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    setLocalStream(null);
  
  }, [isScreenSharing, stopScreenShare]);


  const toggleAudio = useCallback(async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(!isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setMuted(!isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  }, [isVideoMuted]);


  const startScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!localVideoTrackRef.current || !client) return;

    try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "auto");
        
        await client.unpublish(localVideoTrackRef.current);
        
        screenTrackRef.current = screenTrack;
        await client.publish(screenTrack);

        // Listen for the user stopping screen share from the browser UI
        screenTrack.on("track-ended", () => {
            stopScreenShare();
        });

        setLocalStream(null); // Stop rendering local camera in the grid
        setIsScreenSharing(true);

    } catch (err: any) {
      console.error("Screen share failed", err);
       if (err.code === 'PERMISSION_DENIED') {
        toast({
          variant: 'destructive',
          title: 'Screen Share Failed',
          description: 'Permission was denied. This can happen if the app is in an iframe.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Screen Share Failed',
          description: err.message,
        });
      }
    }
  }, [stopScreenShare, toast]);

  return { 
    join, 
    leave, 
    localStream, 
    remoteUsers,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    hasCameraPermission,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    initializeTracks,
    uid
  };
};
