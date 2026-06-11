"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ModelContext } from "./ModelContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState("openai");

  return (
    <ModelContext.Provider value={{ model, setModel }}>
      <AppShell model={model} onModelChange={setModel}>
        {children}
      </AppShell>
    </ModelContext.Provider>
  );
}
