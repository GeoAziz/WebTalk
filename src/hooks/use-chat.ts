
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onChildAdded, push, serverTimestamp, off } from 'firebase/database';
import type { Message } from '@/components/webtalk/Chat';

export function useChat(channelName: string, author: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([]); // Clear messages when channel changes
    const chatRef = ref(db, `chats/${channelName}`);
    
    const listener = onChildAdded(chatRef, (snapshot) => {
      setMessages((prevMessages) => [
          ...prevMessages,
          { id: snapshot.key!, ...snapshot.val() }
      ]);
    });

    return () => {
      off(chatRef, 'child_added', listener);
    };
  }, [channelName]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const chatRef = ref(db, `chats/${channelName}`);
    push(chatRef, {
      author,
      text,
      timestamp: serverTimestamp(),
    });
  }, [channelName, author]);

  return { messages, sendMessage };
}
