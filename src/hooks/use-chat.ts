
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
    console.log('[Chat] Listening to channel:', channelName);
    const listener = onChildAdded(chatRef, (snapshot) => {
      const newMessage = { id: snapshot.key!, ...snapshot.val() };
      console.log('[Chat] Received message:', newMessage);
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
      console.log('[Chat] Stopped listening to channel:', channelName);
    };
  }, [channelName]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const chatRef = ref(db, `chats/${channelName}`);
    console.log('[Chat] Sending message:', { author, text });
    push(chatRef, {
      author,
      text,
      timestamp: serverTimestamp(),
    })
    .then(() => {
      console.log('[Chat] Message sent successfully');
    })
    .catch((err) => {
      console.error('[Chat] Failed to send message:', err);
    });
  }, [channelName, author]);

  return { messages, sendMessage };
}
