"use client";

import { useRef } from "react";

type SignalType =
  | "view" // Removed auto-tracking
  | "hover"
  | "click"
  | "visit" // 🎯 NEW - when user enters community page
  | "long_view"
  | "save"
  | "join"
  | "engage"
  | "share"
  | "dismiss"
  | "leave";

type EntityType = "community" | "project" | "user" | "post";

// Session-based tracking - prevent duplicates
const trackedSignals = new Map<string, Set<string>>();

function getTrackedKey(entity_type: EntityType, entity_id: string) {
  return `${entity_type}:${entity_id}`;
}

function hasTrackedInSession(
  signal_type: SignalType,
  entity_type: EntityType,
  entity_id: string,
): boolean {
  const key = getTrackedKey(entity_type, entity_id);
  const signals = trackedSignals.get(key);
  return signals?.has(signal_type) || false;
}

function markTracked(
  signal_type: SignalType,
  entity_type: EntityType,
  entity_id: string,
) {
  const key = getTrackedKey(entity_type, entity_id);
  if (!trackedSignals.has(key)) {
    trackedSignals.set(key, new Set());
  }
  trackedSignals.get(key)!.add(signal_type);
}

/**
 * Track a user action (fire and forget)
 */
export async function trackSignal(
  signal_type: SignalType,
  entity_type: EntityType,
  entity_id: string,
  metadata?: Record<string, any>,
) {
  // Prevent duplicate 'visit' in same session
  if (signal_type === "visit") {
    if (hasTrackedInSession(signal_type, entity_type, entity_id)) {
      return;
    }
    markTracked(signal_type, entity_type, entity_id);
  }

  try {
    await fetch("/api/discover/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal_type, entity_type, entity_id, metadata }),
    });
  } catch (e) {
    // Silent fail
  }
}

/**
 * 🎯 Hook: Track community VISIT (when user enters community page)
 * Only counts as view when someone actually visits the community
 */
export function useVisitTracking(
  entity_type: EntityType,
  entity_id: string,
  enabled: boolean = true,
) {
  const trackedRef = useRef(false);

  if (
    typeof window !== "undefined" &&
    enabled &&
    !trackedRef.current &&
    entity_id
  ) {
    trackedRef.current = true;
    // Track visit immediately when component mounts
    setTimeout(() => {
      trackSignal("visit", entity_type, entity_id);
    }, 500);
  }
}

/**
 * ❌ REMOVED: useViewTracking (auto-track on card visibility)
 * ❌ REMOVED: useHoverTracking (auto-track on hover)
 */

// Empty exports for backwards compatibility (won't do anything)
export function useViewTracking(
  _entity_type: EntityType,
  _entity_id: string,
  _enabled: boolean = true,
) {
  return useRef(null);
}

export function useHoverTracking(_entity_type: EntityType, _entity_id: string) {
  return {
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };
}

/**
 * Clear session tracking (call on logout)
 */
export function clearTrackingSession() {
  trackedSignals.clear();
}
