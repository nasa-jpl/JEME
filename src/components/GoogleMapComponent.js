// src/components/GoogleMapComponent.js
// Simple Google Maps component for geographic visualization

import React, { useEffect, useRef } from 'react';


const GoogleMapComponent = ({ data, apiKey }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!apiKey || !data) return;

    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = () => {
        initializeMap();
      };
      
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [apiKey, data]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    console.log('Initializing map with data:', data);
    console.log('Data length:', data ? data.length : 'no data');

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      mapTypeId: 'satellite'
    });

    mapInstanceRef.current = map;

    // Add markers for each country with data
    if (data && data.length > 0) {
      console.log('Adding markers for countries:', data.slice(0, 3)); // Show first 3 items
      
      data.forEach((item, index) => {
        if (item.country && item.papers > 0) {
          console.log(`Processing country: ${item.country}, papers: ${item.papers}, citations: ${item.citations}`);
          
          const countryCoords = getCountryCoordinates(item.country);
          if (countryCoords) {
            console.log(`Adding marker for ${item.country} at:`, countryCoords);
            
            // Create a custom marker with better visibility and label
            const markerSize = Math.max(10, Math.min(item.papers * 2.5, 25));
            
            // First, try a simple marker with just label (no custom icon)
            console.log(`Creating simple marker for ${item.country} with ${item.papers} papers`);
            const marker = new window.google.maps.Marker({
              position: countryCoords,
              map: map,
              title: `${item.country}: ${item.papers} papers, ${item.citations} citations`,
              label: {
                text: item.papers.toString(),
                color: 'red',  // Using red color for high visibility
                fontWeight: 'bold',
                fontSize: '14px'
              }
            });
            console.log(`Simple marker created for ${item.country}`);

            // Create info window with detailed information
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="font-family: Arial, sans-serif; padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">${item.country}</h3>
                  <div style="margin-bottom: 6px;">
                    <strong>Papers:</strong> <span style="color: #3b82f6;">${item.papers}</span>
                  </div>
                  <div style="margin-bottom: 6px;">
                    <strong>Citations:</strong> <span style="color: #059669;">${item.citations || 0}</span>
                  </div>
                  <div style="margin-bottom: 6px;">
                    <strong>Regions:</strong> <span style="color: #7c3aed;">${item.regions || 1}</span>
                  </div>
                  <div>
                    <strong>Research Domains:</strong><br>
                    <span style="color: #6b7280; font-size: 12px;">${item.domains || 'N/A'}</span>
                  </div>
                </div>
              `
            });

            // Add click listener
            marker.addListener('click', () => {
              // Close any open info windows
              if (window.currentInfoWindow) {
                window.currentInfoWindow.close();
              }
              infoWindow.open(map, marker);
              window.currentInfoWindow = infoWindow;
            });

          } else {
            console.warn(`No coordinates found for country: ${item.country}`);
          }
        }
      });
    } else {
      console.warn('No data provided to map component');
    }
  };

  const getCountryCoordinates = (country) => {
    // Expanded mapping of country names to coordinates based on RAPID data
    const coordinates = {
      'United States': { lat: 39.8283, lng: -98.5795 },
      'France': { lat: 46.2276, lng: 2.2137 },
      'China': { lat: 35.8617, lng: 104.1954 },
      'India': { lat: 20.5937, lng: 78.9629 },
      'Brazil': { lat: -14.2350, lng: -51.9253 },
      'Germany': { lat: 51.1657, lng: 10.4515 },
      'Canada': { lat: 56.1304, lng: -106.3468 },
      'Peru': { lat: -9.1900, lng: -75.0152 },
      'Chile': { lat: -35.6751, lng: -71.5430 },
      'South Korea': { lat: 35.9078, lng: 127.7669 },
      'Ethiopia': { lat: 9.145, lng: 40.4897 },
      'Uganda': { lat: 1.3733, lng: 32.2903 },
      'Kenya': { lat: -0.0236, lng: 37.9062 },
      'Tanzania': { lat: -6.369, lng: 34.8888 },
      'Bangladesh': { lat: 23.685, lng: 90.3563 },
      'Bhutan': { lat: 27.5142, lng: 90.4336 },
      'Nepal': { lat: 28.3949, lng: 84.1240 },
      'Egypt': { lat: 26.8206, lng: 30.8025 },
      'Sudan': { lat: 12.8628, lng: 30.2176 },
      'Cambodia': { lat: 12.5657, lng: 104.9910 },
      'Laos': { lat: 19.8563, lng: 102.4955 },
      'Vietnam': { lat: 14.0583, lng: 108.2772 },
      'Thailand': { lat: 15.8700, lng: 100.9925 },
      'Myanmar': { lat: 21.9162, lng: 95.9560 },
      'Indonesia': { lat: -0.7893, lng: 113.9213 },
      'Malaysia': { lat: 4.2105, lng: 101.9758 },
      'Papua New Guinea': { lat: -6.314993, lng: 143.95555 },
      'Ghana': { lat: 7.9465, lng: -1.0232 },
      'Burkina Faso': { lat: 12.2383, lng: -1.5616 },
      'Mali': { lat: 17.5707, lng: -3.9962 }
    };

    // Try exact match first
    if (coordinates[country]) {
      return coordinates[country];
    }

    // Try partial matches for complex country strings
    for (const [countryName, coords] of Object.entries(coordinates)) {
      if (country.includes(countryName)) {
        return coords;
      }
    }

    return null;
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }} 
    />
  );
};

export default GoogleMapComponent;