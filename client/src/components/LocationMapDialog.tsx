import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapView } from "@/components/Map";
import { useEffect, useState } from "react";

interface LocationMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

export function LocationMapDialog({ open, onOpenChange, location }: LocationMapDialogProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  useEffect(() => {
    if (!map) return;

    const position = { lat: location.latitude, lng: location.longitude };

    // Center map on location
    map.setCenter(position);
    map.setZoom(15);

    // Create or update marker
    if (marker) {
      marker.setPosition(position);
    } else {
      const newMarker = new google.maps.Marker({
        position,
        map,
        title: location.name,
        animation: google.maps.Animation.DROP,
      });
      setMarker(newMarker);
    }

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [map, location, marker]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{location.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </DialogHeader>
        <div className="h-[500px] w-full rounded-lg overflow-hidden">
          <MapView onMapReady={handleMapReady} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
