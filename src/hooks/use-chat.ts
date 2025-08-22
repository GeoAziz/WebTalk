
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
      const newMessage = { id: snapshot.key!, ...snapshot.val() };
      setMessages((prevMessages) => {
        // Prevent adding duplicate messages
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
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
