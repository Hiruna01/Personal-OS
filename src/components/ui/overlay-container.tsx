"use client";

import { createContext, useContext } from "react";

// Keep Base UI popups inside the modal's focus scope and accessible DOM tree.
export const OverlayContainerContext = createContext<HTMLElement | null>(null);
export const useOverlayContainer = () => useContext(OverlayContainerContext);
