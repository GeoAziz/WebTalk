
"use client";

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export interface Message {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export function Chat({ isOpen, onClose, messages, onSendMessage }: ChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const localUserAuthor = user?.displayName || "You";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-l transition-all duration-300 ease-in-out",
        isOpen ? "w-full md:w-80" : "w-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold font-headline">Chat</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-4">
              {messages.sort((a, b) => a.timestamp - b.timestamp).map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3",
                    msg.author === localUserAuthor ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.author !== localUserAuthor && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${msg.author.charAt(0)}`} />
                      <AvatarFallback>{msg.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-lg px-3 py-2 text-sm",
                      msg.author === localUserAuthor
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="font-semibold">{msg.author}</p>
                    <p>{msg.text}</p>
                  </div>
                   {msg.author === localUserAuthor && (
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={`https://placehold.co/100x100.png?text=${localUserAuthor.charAt(0)}`} />
                      <AvatarFallback>{localUserAuthor.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <footer className="p-4 border-t">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </footer>
        </div>
      )}
    </aside>
  );
}
