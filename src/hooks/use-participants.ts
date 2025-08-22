
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, set, onDisconnect, serverTimestamp } from 'firebase/database';

export interface Participant {
  uid: string;
  displayName: string;
  joinedAt: any;
}

export function useParticipants(channelName: string, userId: string, displayName: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  useEffect(() => {
    if (!channelName || !userId) return;

    const channelRef = ref(db, `channels/${channelName}/participants`);
    const userRef = ref(db, `channels/${channelName}/participants/${userId}`);

    const listener = onValue(channelRef, (snapshot) => {
      const data = snapshot.val();
      const loadedParticipants: Participant[] = [];
      for (const key in data) {
        if(key !== userId) {
            loadedParticipants.push({ uid: key, ...data[key] });
        }
      }
      setParticipants(loadedParticipants);
    });

    set(userRef, {
        displayName,
        joinedAt: serverTimestamp()
    });

    onDisconnect(userRef).remove();

    return () => {
      off(channelRef, 'value', listener);
      set(userRef, null); // Clean up user on voluntary leave
    };
  }, [channelName, userId, displayName]);


  return { participants };
}
