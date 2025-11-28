import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/Map";

interface PlaceResult {
  placeId: string;
  cityName: string;
  stateProvince?: string;
  countryCode: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a city...",
  className,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleMapReady = (map: google.maps.Map) => {
    if (!inputRef.current || autocomplete) return;

    // Initialize Autocomplete with city-level filtering
    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["place_id", "formatted_address", "address_components", "geometry"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.error("No geometry found for place");
        return;
      }

      // Extract city, state, and country from address components
      let cityName = "";
      let stateProvince = "";
      let countryCode = "";

      place.address_components?.forEach((component) => {
        const types = component.types;
        
        if (types.includes("locality")) {
          cityName = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          stateProvince = component.long_name;
        } else if (types.includes("country")) {
          countryCode = component.short_name;
        }
      });

      // Fallback to formatted_address if city name not found
      if (!cityName && place.formatted_address) {
        cityName = place.formatted_address.split(",")[0];
      }

      const result: PlaceResult = {
        placeId: place.place_id || "",
        cityName,
        stateProvince,
        countryCode,
        formattedAddress: place.formatted_address || "",
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      };

      onPlaceSelect(result);
      onChange(""); // Clear input after selection
    });

    setAutocomplete(ac);
    setIsMapReady(true);
  };

  return (
    <div className="relative">
      {/* Hidden map component to initialize Google Maps */}
      <div className="hidden">
        <MapView onMapReady={handleMapReady} />
      </div>

      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled={!isMapReady}
      />
      
      {!isMapReady && (
        <p className="text-xs text-muted-foreground mt-1">
          Loading Google Maps...
        </p>
      )}
    </div>
  );
}
