import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, TrendingUp } from "lucide-react";
import { MapView } from "@/components/Map";

interface EngineerLocationMapProps {
  jobId: number;
  engineerToken?: string | null;
  jobStatus: string;
  siteLatitude?: string | null;
  siteLongitude?: string | null;
}

interface RouteInfo {
  distance: string;
  duration: string;
  durationValue: number; // in seconds
}

export function EngineerLocationMap({
  jobId,
  engineerToken,
  jobStatus,
  siteLatitude,
  siteLongitude,
}: EngineerLocationMapProps) {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const engineerMarkerRef = useRef<google.maps.Marker | null>(null);
  const siteMarkerRef = useRef<google.maps.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Only fetch location if engineer is en route or on site
  const shouldTrack = jobStatus === "en_route" || jobStatus === "on_site";

  const { data: latestLocation } = trpc.jobs.getLatestLocationByJobId.useQuery(
    { jobId },
    { enabled: shouldTrack, refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Update markers when location changes
  useEffect(() => {
    if (!latestLocation || !siteLatitude || !siteLongitude || !mapRef.current || !mapReady) {
      return;
    }

    const engineerLat = parseFloat(latestLocation.latitude);
    const engineerLng = parseFloat(latestLocation.longitude);
    const siteLat = parseFloat(siteLatitude);
    const siteLng = parseFloat(siteLongitude);

    // Update or create engineer marker
    if (engineerMarkerRef.current) {
      engineerMarkerRef.current.setPosition({ lat: engineerLat, lng: engineerLng });
    } else {
      engineerMarkerRef.current = new google.maps.Marker({
        position: { lat: engineerLat, lng: engineerLng },
        map: mapRef.current,
        title: "Engineer Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
    }

    // Update or create site marker
    if (siteMarkerRef.current) {
      siteMarkerRef.current.setPosition({ lat: siteLat, lng: siteLng });
    } else {
      siteMarkerRef.current = new google.maps.Marker({
        position: { lat: siteLat, lng: siteLng },
        map: mapRef.current,
        title: "Site Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
    }

    // Fit map to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: engineerLat, lng: engineerLng });
    bounds.extend({ lat: siteLat, lng: siteLng });
    mapRef.current?.fitBounds(bounds);
  }, [latestLocation, siteLatitude, siteLongitude, mapReady]);

  // Calculate ETA separately (only when location changes)
  useEffect(() => {
    if (!latestLocation || !siteLatitude || !siteLongitude || !window.google) {
      return;
    }

    const engineerLat = parseFloat(latestLocation.latitude);
    const engineerLng = parseFloat(latestLocation.longitude);
    const siteLat = parseFloat(siteLatitude);
    const siteLng = parseFloat(siteLongitude);

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: { lat: engineerLat, lng: engineerLng },
        destination: { lat: siteLat, lng: siteLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          if (route && route.legs[0]) {
            const leg = route.legs[0];
            setRouteInfo({
              distance: leg.distance?.text || "Unknown",
              duration: leg.duration?.text || "Unknown",
              durationValue: leg.duration?.value || 0,
            });
          }
        }
      }
    );
  }, [latestLocation, siteLatitude, siteLongitude]);

  if (!shouldTrack) {
    return null;
  }

  if (!latestLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Engineer Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Waiting for engineer location...</p>
        </CardContent>
      </Card>
    );
  }

  const timeSinceUpdate = Date.now() - new Date(latestLocation.timestamp).getTime();
  const minutesAgo = Math.floor(timeSinceUpdate / 60000);

  // Calculate ETA
  const now = new Date();
  const etaDate = routeInfo ? new Date(now.getTime() + routeInfo.durationValue * 1000) : null;
  const etaString = etaDate ? etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Engineer Location
          </CardTitle>
          <Badge variant={minutesAgo < 2 ? "default" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {minutesAgo < 1 ? "Just now" : `${minutesAgo}m ago`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Info */}
        {routeInfo && jobStatus === "en_route" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Distance</span>
              </div>
              <p className="text-lg font-bold text-blue-900">{routeInfo.distance}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">ETA</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {etaString || routeInfo.duration}
              </p>
            </div>
          </div>
        )}

        {/* Google Map */}
        <div className="rounded-lg overflow-hidden border">
          <MapView
            onMapReady={(map) => {
              mapRef.current = map;
              setMapReady(true);
            }}
            className="h-[400px] w-full"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Engineer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Site</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Status: {jobStatus === "en_route" ? "En Route" : "On Site"}
          </div>
        </div>

        {/* Location accuracy */}
        <div className="text-xs text-muted-foreground text-center">
          Accuracy: ±{Math.round(parseFloat(latestLocation.accuracy || "0"))}m
        </div>
      </CardContent>
    </Card>
  );
}
