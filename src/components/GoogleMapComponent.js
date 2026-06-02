// src/components/GoogleMapComponent.js
// Google Maps component for geographic visualization with region-colored bubbles

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Region color mapping
const REGION_COLORS = {
  'North America': { fill: '#3B82F6', stroke: '#2563EB', name: 'North America' },
  'South America': { fill: '#10B981', stroke: '#059669', name: 'South America' },
  'Europe': { fill: '#8B5CF6', stroke: '#7C3AED', name: 'Europe' },
  'Africa': { fill: '#F59E0B', stroke: '#D97706', name: 'Africa' },
  'Asia': { fill: '#EF4444', stroke: '#DC2626', name: 'Asia' },
  'Oceania': { fill: '#06B6D4', stroke: '#0891B2', name: 'Oceania' },
  'Other': { fill: '#6B7280', stroke: '#4B5563', name: 'Other' }
};

// Country to region mapping
const COUNTRY_TO_REGION = {
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Peru': 'South America',
  'Colombia': 'South America',
  'France': 'Europe',
  'Germany': 'Europe',
  'United Kingdom': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'Netherlands': 'Europe',
  'Switzerland': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Belgium': 'Europe',
  'Austria': 'Europe',
  'Finland': 'Europe',
  'Poland': 'Europe',
  'Portugal': 'Europe',
  'China': 'Asia',
  'Japan': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Bangladesh': 'Asia',
  'Bhutan': 'Asia',
  'Nepal': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Indonesia': 'Asia',
  'Malaysia': 'Asia',
  'Cambodia': 'Asia',
  'Laos': 'Asia',
  'Myanmar': 'Asia',
  'Pakistan': 'Asia',
  'Ethiopia': 'Africa',
  'Kenya': 'Africa',
  'Tanzania': 'Africa',
  'Uganda': 'Africa',
  'Egypt': 'Africa',
  'Sudan': 'Africa',
  'Ghana': 'Africa',
  'Nigeria': 'Africa',
  'South Africa': 'Africa',
  'Burkina Faso': 'Africa',
  'Mali': 'Africa',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Papua New Guinea': 'Oceania'
};

const GoogleMapComponent = ({ data, regionalData, apiKey, citationsData }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);

  // Get region for a country
  const getRegionForCountry = useCallback((country) => {
    if (COUNTRY_TO_REGION[country]) {
      return COUNTRY_TO_REGION[country];
    }
    // Try partial match
    for (const [countryName, region] of Object.entries(COUNTRY_TO_REGION)) {
      if (country.includes(countryName) || countryName.includes(country)) {
        return region;
      }
    }
    return 'Other';
  }, []);

  // Get color scheme for a country based on its region
  const getColorForCountry = useCallback((country) => {
    const region = getRegionForCountry(country);
    return REGION_COLORS[region] || REGION_COLORS['Other'];
  }, [getRegionForCountry]);

  useEffect(() => {
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        if (mounted) {
          initializeMap();
        }
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (mounted) {
            setTimeout(() => {
              if (mounted && window.google && window.google.maps && window.google.maps.Map) {
                initializeMap();
              }
            }, 100);
          }
        });
        existingScript.addEventListener('error', () => {
          if (mounted) {
            setLoadError('Failed to load Google Maps');
            setIsLoading(false);
          }
        });
        return;
      }

      const script = document.createElement('script');
      const callbackName = `initMap_${Date.now()}`;

      window[callbackName] = () => {
        delete window[callbackName];
        setTimeout(() => {
          if (mounted && window.google && window.google.maps && window.google.maps.Map) {
            try {
              initializeMap();
            } catch (error) {
              console.error('Error initializing map:', error);
              if (mounted) {
                setLoadError('Failed to initialize map');
                setIsLoading(false);
              }
            }
          }
        }, 150);
      };

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete window[callbackName];
        if (mounted) {
          setLoadError('Failed to load Google Maps script');
          setIsLoading(false);
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const getCountryCoordinates = useCallback((country) => {
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
      'Mali': { lat: 17.5707, lng: -3.9962 },
      'United Kingdom': { lat: 55.3781, lng: -3.4360 },
      'Japan': { lat: 36.2048, lng: 138.2529 },
      'Australia': { lat: -25.2744, lng: 133.7751 },
      'Italy': { lat: 41.8719, lng: 12.5674 },
      'Spain': { lat: 40.4637, lng: -3.7492 },
      'Mexico': { lat: 23.6345, lng: -102.5528 },
      'Argentina': { lat: -38.4161, lng: -63.6167 },
      'South Africa': { lat: -30.5595, lng: 22.9375 },
      'Nigeria': { lat: 9.0820, lng: 8.6753 },
      'Netherlands': { lat: 52.1326, lng: 5.2913 },
      'Switzerland': { lat: 46.8182, lng: 8.2275 },
      'Sweden': { lat: 60.1282, lng: 18.6435 },
      'Norway': { lat: 60.4720, lng: 8.4689 },
      'Poland': { lat: 51.9194, lng: 19.1451 },
      'Belgium': { lat: 50.5039, lng: 4.4699 },
      'Austria': { lat: 47.5162, lng: 14.5501 },
      'Denmark': { lat: 56.2639, lng: 9.5018 },
      'Finland': { lat: 61.9241, lng: 25.7482 },
      'Portugal': { lat: 39.3999, lng: -8.2245 },
      'New Zealand': { lat: -40.9006, lng: 174.8860 },
      'Colombia': { lat: 4.5709, lng: -74.2973 },
      'Pakistan': { lat: 30.3753, lng: 69.3451 },
      'Africa': { lat: 0.0, lng: 20.0 },
      'Europe': { lat: 54.0, lng: 15.0 },
      'Asia': { lat: 30.0, lng: 100.0 }
    };

    if (coordinates[country]) {
      return coordinates[country];
    }

    for (const [countryName, coords] of Object.entries(coordinates)) {
      if (country.includes(countryName)) {
        return coords;
      }
    }

    return null;
  }, []);

  const addCountryMarkers = useCallback((map) => {
    if (!data || data.length === 0 || !window.google || !window.google.maps) return;

    // Find max papers for scaling
    const maxPapers = Math.max(...data.map(d => d.papers || 0), 1);

    try {
      data.forEach((item) => {
        if (item.country && item.papers > 0) {
          try {
            const countryCoords = getCountryCoordinates(item.country);
            if (countryCoords) {
              const colorScheme = getColorForCountry(item.country);
              const region = getRegionForCountry(item.country);

              // Scale bubble size: min 20, max 50, based on paper count
              const normalizedSize = item.papers / maxPapers;
              const bubbleSize = 20 + (normalizedSize * 30);

              // Create circle marker (bubble)
              const marker = new window.google.maps.Marker({
                position: countryCoords,
                map: map,
                title: `${item.country}: ${item.papers} papers`,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: colorScheme.fill,
                  fillOpacity: 0.8,
                  strokeColor: colorScheme.stroke,
                  strokeWeight: 2,
                  scale: bubbleSize / 4
                },
                label: {
                  text: item.papers.toString(),
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px'
                },
                zIndex: item.papers // Larger bubbles on top
              });

              // Create info window
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 16px;
                    min-width: 240px;
                  ">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <div style="
                        width: 12px;
                        height: 12px;
                        background: ${colorScheme.fill};
                        border-radius: 50%;
                        margin-right: 10px;
                      "></div>
                      <div>
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                          ${item.country}
                        </h3>
                        <span style="font-size: 12px; color: ${colorScheme.fill}; font-weight: 500;">
                          ${region}
                        </span>
                      </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                      <div style="
                        background: #f0f9ff;
                        padding: 10px;
                        border-radius: 8px;
                        text-align: center;
                      ">
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">Papers</div>
                        <div style="font-size: 20px; font-weight: 700; color: #0369a1;">${item.papers}</div>
                      </div>
                      <div style="
                        background: #f0fdf4;
                        padding: 10px;
                        border-radius: 8px;
                        text-align: center;
                      ">
                        <div style="font-size: 11px; color: #64748b; margin-bottom: 2px;">Citations</div>
                        <div style="font-size: 20px; font-weight: 700; color: #15803d;">${item.citations || 0}</div>
                      </div>
                    </div>

                    ${item.domains ? `
                    <div>
                      <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Research Domains</div>
                      <div style="font-size: 12px; color: #374151; line-height: 1.4;">
                        ${item.domains.length > 80 ? item.domains.substring(0, 80) + '...' : item.domains}
                      </div>
                    </div>
                    ` : ''}
                  </div>
                `
              });

              marker.addListener('click', () => {
                if (window.currentInfoWindow) {
                  window.currentInfoWindow.close();
                }
                infoWindow.open(map, marker);
                window.currentInfoWindow = infoWindow;
              });

              markersRef.current.push(marker);
            }
          } catch (markerError) {
            console.error(`Error creating marker for ${item.country}:`, markerError);
          }
        }
      });
    } catch (error) {
      console.error('Error adding country markers:', error);
    }
  }, [data, getCountryCoordinates, getColorForCountry, getRegionForCountry]);

  const addCollaborationLines = useCallback((map) => {
    if (!citationsData || !window.google || !window.google.maps) return;

    // Build country-pair collaboration counts from all_countries field
    const linkCounts = {};
    citationsData.forEach(paper => {
      const countries = paper.all_countries;
      if (!countries || countries.length < 2) return;
      for (let i = 0; i < countries.length; i++) {
        for (let j = i + 1; j < countries.length; j++) {
          const key = [countries[i], countries[j]].sort().join('||');
          linkCounts[key] = (linkCounts[key] || 0) + 1;
        }
      }
    });

    const maxCount = Math.max(...Object.values(linkCounts), 1);

    Object.entries(linkCounts).forEach(([key, count]) => {
      const [countryA, countryB] = key.split('||');
      const coordsA = getCountryCoordinates(countryA);
      const coordsB = getCountryCoordinates(countryB);
      if (!coordsA || !coordsB) return;

      // Scale line weight 1–5 based on number of shared papers
      const weight = 1 + Math.round((count / maxCount) * 4);
      const opacity = 0.25 + (count / maxCount) * 0.45;

      const line = new window.google.maps.Polyline({
        path: [coordsA, coordsB],
        geodesic: true,
        strokeColor: '#6366f1',
        strokeOpacity: opacity,
        strokeWeight: weight,
        map: map,
        zIndex: 0
      });

      // Info window on click
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: -apple-system, sans-serif; padding: 10px; min-width: 180px;">
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
              ${countryA} ↔ ${countryB}
            </div>
            <div style="font-size: 13px; color: #6366f1; font-weight: 500;">
              ${count} shared paper${count > 1 ? 's' : ''}
            </div>
          </div>
        `
      });

      line.addListener('click', (e) => {
        if (window.currentInfoWindow) window.currentInfoWindow.close();
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
        window.currentInfoWindow = infoWindow;
      });

      linesRef.current.push(line);
    });
  }, [citationsData, getCountryCoordinates]);

  const updateMapMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    // Clear existing markers and lines
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    linesRef.current.forEach(line => line.setMap(null));
    linesRef.current = [];

    addCollaborationLines(mapInstanceRef.current);
    addCountryMarkers(mapInstanceRef.current);
  }, [addCountryMarkers, addCollaborationLines]);

  useEffect(() => {
    if (mapInstanceRef.current && !isLoading && !loadError) {
      updateMapMarkers();
    }
  }, [data, isLoading, loadError, updateMapMarkers]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      setIsLoading(false);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.error('Google Maps API not fully loaded');
      setLoadError('Google Maps API not ready');
      setIsLoading(false);
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        mapTypeId: 'terrain',
        styles: [
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }]
          },
          {
            "featureType": "road",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "transit",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#c9c9c9" }, { "weight": 0.5 }]
          },
          {
            "featureType": "administrative.country",
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#6b7280" }]
          }
        ],
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        }
      });

      mapInstanceRef.current = map;
      setIsLoading(false);
      setLoadError(null);

      addCollaborationLines(map);
      addCountryMarkers(map);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setLoadError(`Map initialization failed: ${error.message}`);
      setIsLoading(false);
    }
  }, [addCountryMarkers, addCollaborationLines]);

  // Get active regions from data for legend
  const activeRegions = React.useMemo(() => {
    if (!data) return [];
    const regions = new Set();
    data.forEach(item => {
      if (item.country) {
        const region = getRegionForCountry(item.country);
        regions.add(region);
      }
    });
    return Array.from(regions).sort();
  }, [data, getRegionForCountry]);

  // Calculate size scale based on data
  const sizeScale = React.useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 0 };
    const papers = data.map(d => d.papers || 0);
    return {
      min: Math.min(...papers),
      max: Math.max(...papers)
    };
  }, [data]);

  if (loadError) {
    return (
      <div style={{
        width: '100%',
        height: '400px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ color: '#DC2626', fontWeight: '600', marginBottom: '8px' }}>
            Map Loading Error
          </div>
          <div style={{ color: '#991B1B', fontSize: '14px' }}>
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #3B82F6',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }} />
            <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading map...</div>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />

      {/* Legend */}
      {!isLoading && !loadError && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'white',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '11px',
          maxWidth: '200px',
          zIndex: 100
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Regions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {activeRegions.map(region => (
              <div key={region} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: REGION_COLORS[region]?.fill || '#6B7280'
                }} />
                <span style={{ color: '#4B5563' }}>{region}</span>
              </div>
            ))}
          </div>

          {linesRef.current.length > 0 && (
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px', paddingTop: '8px' }}>
              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Collaboration</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '3px', background: '#6366f1', opacity: 0.6, borderRadius: '2px' }} />
                <span style={{ color: '#4B5563' }}>Multi-country paper</span>
              </div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px' }}>Thicker = more papers</div>
            </div>
          )}

          {sizeScale.max > 0 && (
            <>
              <div style={{
                borderTop: '1px solid #e5e7eb',
                marginTop: '8px',
                paddingTop: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Bubble Size
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#9CA3AF',
                    border: '1px solid #6B7280'
                  }} />
                  <span style={{ color: '#6B7280' }}>{sizeScale.min}</span>
                </div>
                <span style={{ color: '#9CA3AF' }}>-</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#9CA3AF',
                    border: '1px solid #6B7280'
                  }} />
                  <span style={{ color: '#6B7280' }}>{sizeScale.max}</span>
                </div>
                <span style={{ color: '#9CA3AF', marginLeft: '2px' }}>papers</span>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleMapComponent;
