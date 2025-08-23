
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
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  const { toast } = useToast();

  const initializeClient = useCallback(async () => {
    console.log('[Agora] Initializing client...');
    setIsInitializing(true);
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      console.log('[Agora] Client created');
    }

    try {
        if (!localAudioTrackRef.current) {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            localAudioTrackRef.current = audioTrack;
            console.log('[Agora] Microphone track created.');
        }
    } catch(error: any) {
        console.error('Failed to get microphone stream', error);
        toast({
            variant: 'destructive',
            title: 'Device Error',
            description: 'Could not access microphone. Please check permissions.',
        });
    }

    setIsInitializing(false);
  }, [toast]);
  
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
      if (mediaType === 'video') {
        console.log(`[Agora] Remote video track ready for uid=${user.uid}`);
      }
      // Update remoteUsers state to trigger UI re-render with latest track
      setRemoteUsers(Array.from(client.remoteUsers));
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora] User unpublished: uid=${user.uid}`);
        setRemoteUsers(prevUsers => prevUsers.map(u => u.uid === user.uid ? user : u));
    };
    
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
        console.log(`[Agora] User joined: uid=${user.uid}`);
        setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
    };

    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      console.log(`[Agora] User left: uid=${user.uid}`);
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
      const joinedUid = await client.join(appId, channel, null, displayName);
      setUid(String(joinedUid));

      if (localAudioTrackRef.current) {
        await client.publish([localAudioTrackRef.current]);
        console.log('[Agora] Published local audio track');
      } else {
        console.warn('[Agora] Local audio track not available for publishing');
      }
    } catch (err: any) {
      console.error('Join failed', err);
      toast({ variant: 'destructive', title: 'Join Failed', description: err.message });
    }
  }, [toast]);

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!screenTrackRef.current || !client) return;
  
    await client.unpublish(screenTrackRef.current);
    screenTrackRef.current.stop();
    screenTrackRef.current.close();
    screenTrackRef.current = null;
    
    if (localVideoTrackRef.current) {
        await client.publish(localVideoTrackRef.current);
        setLocalStream(localVideoTrackRef.current);
    }
    setIsScreenSharing(false);
  
  }, []);

  const leave = useCallback(async () => {
    const client = clientRef.current;
  
    if (isScreenSharing) {
      await stopScreenShare();
    }
    
    if (client && client.localTracks.length > 0) {
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
    setIsVideoMuted(true);
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
  
  }, [isScreenSharing, stopScreenShare]);


  const toggleAudio = useCallback(async () => {
    if (localAudioTrackRef.current) {
      const nextMutedState = !isAudioMuted;
      await localAudioTrackRef.current.setMuted(nextMutedState);
      setIsAudioMuted(nextMutedState);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(async () => {
    const client = clientRef.current;
    if (isScreenSharing || !client) return;

    if (localVideoTrackRef.current) {
        const nextMutedState = !isVideoMuted;
        await localVideoTrackRef.current.setMuted(nextMutedState);
        setIsVideoMuted(nextMutedState);

        if (client.connectionState === 'CONNECTED') {
            if (nextMutedState) {
                await client.unpublish(localVideoTrackRef.current);
            } else {
                await client.publish(localVideoTrackRef.current);
            }
        }
    } else {
        try {
            const videoTrack = await AgoraRTC.createCameraVideoTrack();
            localVideoTrackRef.current = videoTrack;
            setLocalStream(videoTrack);
            setHasCameraPermission(true);

            if (client.connectionState === 'CONNECTED') {
                await client.publish(videoTrack);
            }
            
            setIsVideoMuted(false);
        } catch (error: any) {
            console.error("Failed to create video track on demand", error);
            setHasCameraPermission(false);
            if (error.code === 'NOT_READABLE' || error.name === 'NotReadableError') {
                 toast({
                    variant: 'destructive',
                    title: 'Camera Error',
                    description: 'Your camera is already in use by another application or is unavailable.',
                });
            } else if (error.code === 'PERMISSION_DENIED' || error.name === 'NotAllowedError') {
                 toast({
                    variant: 'destructive',
                    title: 'Camera Permission Denied',
                    description: 'Please grant camera permission in your browser settings.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Device Error',
                    description: 'Could not access camera. Please check permissions.',
                });
            }
        }
    }
}, [isVideoMuted, isScreenSharing, toast]);


  const startScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    try {
        const screenTrackResult = await AgoraRTC.createScreenVideoTrack({}, "auto");
        const screenTrack = Array.isArray(screenTrackResult) ? screenTrackResult[0] : screenTrackResult;
        
        if (localVideoTrackRef.current) {
            await client.unpublish(localVideoTrackRef.current);
            localVideoTrackRef.current.stop();
            setLocalStream(null);
        }
        
        screenTrackRef.current = screenTrack;
        await client.publish(screenTrack);
        setLocalStream(screenTrack as any); // show screen share locally

        // Listen for the user stopping screen share from the browser UI
        screenTrack.on("track-ended", () => {
            stopScreenShare();
        });

        setIsScreenSharing(true);
        setIsVideoMuted(false);

    } catch (err: any) {
      console.error("Screen share failed", err);
       if (err.code === 'PERMISSION_DENIED') {
        toast({
          variant: 'destructive',
          title: 'Screen Share Failed',
          description: 'Permission was denied. Please check your browser settings.',
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
  
  useEffect(() => {
    initializeClient();

    return () => {
        if(clientRef.current) {
            clientRef.current.leave();
        }
        localAudioTrackRef.current?.close();
        localVideoTrackRef.current?.close();
        screenTrackRef.current?.close();
    };
  }, [initializeClient]);


  return { 
    join, 
    leave, 
    localStream, 
    remoteUsers,
    isAudioMuted,
    isVideoMuted: isVideoMuted || !hasCameraPermission,
    isScreenSharing,
    hasCameraPermission,
    isInitializing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    initializeClient,
    uid
  };
};
