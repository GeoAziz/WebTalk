
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { useToast } from './use-toast';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;

export const useAgora = () => {
  const clientRef = useRef<IAgoraRTCClient>();
  const [localStream, setLocalStream] = useState<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

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
        console.log('[Agora] Initialized local tracks');
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
    console.log('[Agora] Client created');
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
      console.log(`[Agora] User published: uid=${user.uid}, mediaType=${mediaType}`);
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
        console.log(`[Agora] Playing remote audio for uid=${user.uid}`);
      }
      if (mediaType === 'video' && user.videoTrack) {
        console.log(`[Agora] Remote video track available for uid=${user.uid}`);
      }
      setRemoteUsers(prev => {
        const updated = [...prev.filter(u => u.uid !== user.uid), user];
        console.log('[Agora] Updated remoteUsers:', updated.map(u => u.uid));
        return updated;
      });
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora] User unpublished: uid=${user.uid}`);
        setRemoteUsers(prevUsers => {
            const index = prevUsers.findIndex(u => u.uid === user.uid);
            if (index > -1) {
                const newUsers = [...prevUsers];
                newUsers[index] = user;
                return newUsers;
            }
            return prevUsers;
        });
    };
    
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora] User joined: uid=${user.uid}`);
        setRemoteUsers(prev => {
          const updated = [...prev, user];
          console.log('[Agora] Updated remoteUsers:', updated.map(u => u.uid));
          return updated;
        });
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log(`[Agora] User left: uid=${user.uid}`);
      setRemoteUsers(prev => {
        const updated = prev.filter(u => u.uid !== user.uid);
        console.log('[Agora] Updated remoteUsers:', updated.map(u => u.uid));
        return updated;
      });
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
    // Do not set local stream to null here
  
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
        const screenTrackResult = await AgoraRTC.createScreenVideoTrack({}, "auto");
        const screenTrack = Array.isArray(screenTrackResult) ? screenTrackResult[0] : screenTrackResult;
        
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
