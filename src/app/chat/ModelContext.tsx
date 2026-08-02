"use client";

import { createContext, useContext } from "react";

interface ModelContextType {
  model: string;
  setModel: (m: string) => void;
}

export const ModelContext = createContext<ModelContextType>({
  model: "openai",
  setModel: () => {},
});

export function useModel() {
  return useContext(ModelContext);
}
