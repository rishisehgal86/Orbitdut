import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock } from "lucide-react";

interface EngineerLocationMapProps {
  jobId: number;
  engineerToken?: string | null;
  jobStatus: string;
  siteLatitude?: string | null;
  siteLongitude?: string | null;
}

export function EngineerLocationMap({
  jobId,
  engineerToken,
  jobStatus,
  siteLatitude,
  siteLongitude,
}: EngineerLocationMapProps) {
  const [mapUrl, setMapUrl] = useState<string>("");

  // Only fetch location if engineer is en route or on site
  const shouldTrack = jobStatus === "en_route" || jobStatus === "on_site";

  const { data: latestLocation } = trpc.jobs.getLatestLocationByJobId.useQuery(
    { jobId },
    { enabled: shouldTrack, refetchInterval: 10000 } // Refresh every 10 seconds
  );

  useEffect(() => {
    if (latestLocation && siteLatitude && siteLongitude) {
      // Create a static map URL with both engineer location and site location
      const engineerLat = parseFloat(latestLocation.latitude);
      const engineerLng = parseFloat(latestLocation.longitude);
      const siteLat = parseFloat(siteLatitude);
      const siteLng = parseFloat(siteLongitude);

      // Center map between engineer and site
      const centerLat = (engineerLat + siteLat) / 2;
      const centerLng = (engineerLng + siteLng) / 2;

      // Calculate zoom level based on distance
      const latDiff = Math.abs(engineerLat - siteLat);
      const lngDiff = Math.abs(engineerLng - siteLng);
      const maxDiff = Math.max(latDiff, lngDiff);
      const zoom = maxDiff > 0.1 ? 11 : maxDiff > 0.05 ? 12 : maxDiff > 0.01 ? 13 : 14;

      // Google Static Maps API URL
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=600x400&markers=color:blue%7Clabel:E%7C${engineerLat},${engineerLng}&markers=color:red%7Clabel:S%7C${siteLat},${siteLng}&path=color:0x0000ff%7Cweight:2%7C${engineerLat},${engineerLng}%7C${siteLat},${siteLng}&key=YOUR_GOOGLE_MAPS_API_KEY`;

      setMapUrl(url);
    }
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
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            📍 Lat: {parseFloat(latestLocation.latitude).toFixed(6)}, Lng: {parseFloat(latestLocation.longitude).toFixed(6)}
          </p>
          <p className="text-xs text-muted-foreground">
            Accuracy: ±{Math.round(parseFloat(latestLocation.accuracy || "0"))}m
          </p>
        </div>

        {/* Placeholder for map - in production, integrate with Google Maps */}
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Map view coming soon</p>
            <p className="text-xs text-gray-500 mt-1">
              Engineer is {latestLocation.trackingType === "en_route" ? "en route" : "on site"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Engineer</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Site</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
