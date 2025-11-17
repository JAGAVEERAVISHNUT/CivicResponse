"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Locate } from 'lucide-react';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const [address, setAddress] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    // Reverse geocode to get address
    if (latitude && longitude) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch(() => {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        });
    }
  }, [latitude, longitude]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationChange(position.coords.latitude, position.coords.longitude);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`}
          title="Location Map"
        />
      </div>
      
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Selected Location:</p>
          <p className="text-muted-foreground">{address || 'Loading address...'}</p>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="w-full"
      >
        <Locate className="h-4 w-4 mr-2" />
        {isLoadingLocation ? 'Getting location...' : 'Use My Current Location'}
      </Button>
    </div>
  );
}
