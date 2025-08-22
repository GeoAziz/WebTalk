
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import WebTalk from '@/components/webtalk/WebTalk';
import { Loader2 } from 'lucide-react';


export default function WebTalkPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  return <WebTalk />;
}
