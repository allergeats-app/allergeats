"use client";

import { useCallback, useEffect, useState } from "react";
import {
  locationProvider,
  MockLocationProvider,
  checkLocationPermission,
  loadLastLocation,
} from "@/lib/providers/locationProvider";
import type { Coordinates } from "@/lib/providers/locationProvider";
import { getMockRestaurants, loadMockRestaurants } from "@/lib/mockRestaurantsLazy";
import type { Restaurant } from "@/lib/types";

const SESSION_KEY = "allegeats_live_restaurants";

function withAllChains(list: Restaurant[]): Restaurant[] {
  const liveOnly = list.filter((r) => !r.menuIsGenericChainTemplate || r.address);
  const names = new Set(liveOnly.filter((r) => r.menuItems.length > 0).map((r) => r.name.toLowerCase()));
  const missing = getMockRestaurants()
    .filter((m) => !names.has(m.name.toLowerCase()))
    .map((m) => ({
      ...m,
      distance:                   undefined as number | undefined,
      address:                    undefined as string | undefined,
      menuIsGenericChainTemplate: true,
    }));
  return missing.length ? [...liveOnly, ...missing] : liveOnly;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en", "User-Agent": "AllergEats/1.0" } }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    const a = data.address ?? {};
    return a.neighbourhood ?? a.suburb ?? a.city_district ?? a.city ?? a.town ?? a.village ?? "Nearby";
  } catch {
    return "Nearby";
  }
}

export function useHomeData(radiusMiles: number) {
  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]               = useState(true);
  const [locationLabel, setLocationLabel]   = useState("Locating…");
  const [locationMode, setLocationMode]     = useState<"precise" | "approximate" | "cached" | "unavailable">("unavailable");
  const [resultsSource, setResultsSource]   = useState<"live" | "mock">("live");
  const [userLocation, setUserLocation]     = useState<Coordinates | null>(null);
  const [searchCenter, setSearchCenter]     = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [locationRefresh, setLocationRefresh] = useState(0);
  const [locationDenied, setLocationDenied]   = useState(false);

  // Kick off lazy load of 258KB chain menu data — withAllChains returns []
  // templates until this resolves, which is fine since live results also load async.
  useEffect(() => { loadMockRestaurants(); }, []);

  // Hydrate sessionStorage cache after mount to avoid a blank screen on first render.
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) setRawRestaurants(withAllChains(parsed as Restaurant[]));
        setLoading(false);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Prevents the cached-position search result from overwriting fresh GPS results
    // if GPS resolves first (the two searches run concurrently).
    let freshResultsCommitted = false;

    async function load() {
      // Do NOT unconditionally setLoading(true) here — the closure captures rawRestaurants
      // from the initial render (always []), so this would override the sessionStorage
      // hydration's setLoading(false) and cause a skeleton flash even when cache exists.
      // Callers that need loading=true set it before triggering this effect.
      setResultsSource("live");

      try {
        let lat: number, lng: number;
        let accuracy: number | undefined;

        if (searchCenter) {
          lat = searchCenter.lat;
          lng = searchCenter.lng;
          setLocationMode("precise");
          if (searchCenter.label) {
            if (!cancelled) setLocationLabel(searchCenter.label);
          } else {
            setLocationLabel("Searching this area");
            reverseGeocode(lat, lng).then((name) => { if (!cancelled) setLocationLabel(name); });
          }
        } else {
          // Preflight: if the user has already denied location, skip the GPS wait entirely.
          const permission = await checkLocationPermission();
          if (permission === "denied") {
            if (!cancelled) {
              setLocationDenied(true);
              setLocationMode("unavailable");
              setLocationLabel("Location blocked");
              setLoading(false);
            }
            return;
          }

          // Fast-path: show cached location + results immediately while GPS resolves.
          // Skip if accuracy is too coarse (> 5 km) — IP-geolocation can resolve to
          // a completely wrong city and we'd rather wait for real GPS than show garbage.
          const cachedPos = loadLastLocation();
          const cachedIsUsable = cachedPos != null &&
            (cachedPos.accuracy == null || cachedPos.accuracy <= 5_000);
          if (cachedIsUsable && !cancelled) {
            setUserLocation({ ...cachedPos, source: "cached" });
            setLocationMode("cached");
            reverseGeocode(cachedPos.lat, cachedPos.lng)
              .then((name) => { if (!cancelled) setLocationLabel(name); });
            locationProvider
              .searchRestaurants(cachedPos.lat, cachedPos.lng, radiusMiles, cachedPos.accuracy)
              .then((cachedRaw) => {
                if (!cancelled && !freshResultsCommitted) {
                  setRawRestaurants(withAllChains(cachedRaw));
                  setLoading(false);
                }
              })
              .catch(() => {});
          }

          // Fetch fresh GPS in parallel with the cached search above.
          const position = await locationProvider.getUserLocation();

          if (!position) {
            if (!cancelled && !cachedIsUsable) {
              setLocationMode("unavailable");
              setLocationLabel("Location unavailable");
              setLoading(false);
            }
            return;
          }

          lat      = position.lat;
          lng      = position.lng;
          accuracy = position.accuracy;

          if (!cancelled) {
            setUserLocation(position);
            const mode: "precise" | "approximate" | "cached" =
              position.source === "cached"              ? "cached"      :
              (accuracy != null && accuracy <= 100)     ? "precise"     :
                                                          "approximate";
            setLocationMode(mode);
          }

          reverseGeocode(lat, lng).then((name) => { if (!cancelled) setLocationLabel(name); });
        }

        let raw: Restaurant[];
        try {
          raw = await locationProvider.searchRestaurants(lat, lng, radiusMiles, accuracy);
        } catch {
          const fallback = new MockLocationProvider();
          raw = await fallback.searchRestaurants(lat, lng, 9999);
          if (!cancelled) setResultsSource("mock");
        }

        if (!cancelled) {
          freshResultsCommitted = true;
          raw = withAllChains(raw);
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(raw)); } catch { /* ignore */ }
          setRawRestaurants(raw);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [radiusMiles, searchCenter, locationRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectLocation = useCallback((lat: number, lng: number, label: string) => {
    setRawRestaurants([]);
    setLoading(true);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSearchCenter({ lat, lng, label });
    setLocationLabel(label);
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    setLocationDenied(false);
    setRawRestaurants([]);
    setLoading(true);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSearchCenter(null);
    setLocationLabel("Locating…");
    setLocationRefresh((n) => n + 1);
  }, []);

  const clearSearchCenter = useCallback(() => setSearchCenter(null), []);

  const onMapSearchArea = useCallback((lat: number, lng: number) => {
    setSearchCenter({ lat, lng });
  }, []);

  return {
    rawRestaurants,
    loading,
    locationLabel,
    locationMode,
    resultsSource,
    userLocation,
    searchCenter,
    locationDenied,
    handleSelectLocation,
    handleUseCurrentLocation,
    clearSearchCenter,
    onMapSearchArea,
  };
}
