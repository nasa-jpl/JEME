// src/components/GoogleMapComponent.js
// Simple Google Maps component for geographic visualization

import React, { useEffect, useRef } from 'react';


const GoogleMapComponent = ({ data, regionalData, apiKey }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!apiKey) return;

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
  }, [apiKey, data, regionalData]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    console.log('Initializing map with data:', data);
    console.log('Data length:', data ? data.length : 'no data');

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      mapTypeId: 'terrain',
      styles: [
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#1e3a8a"
            },
            {
              "lightness": 17
            }
          ]
        },
        {
          "featureType": "landscape",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f5f5f5"
            },
            {
              "lightness": 20
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [
            {
              "color": "#ffffff"
            },
            {
              "lightness": 17
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#ffffff"
            },
            {
              "lightness": 29
            },
            {
              "weight": 0.2
            }
          ]
        },
        {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#ffffff"
            },
            {
              "lightness": 18
            }
          ]
        },
        {
          "featureType": "road.local",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#ffffff"
            },
            {
              "lightness": 16
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f5f5f5"
            },
            {
              "lightness": 21
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#dedede"
            },
            {
              "lightness": 21
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "visibility": "on"
            },
            {
              "color": "#ffffff"
            },
            {
              "lightness": 16
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "saturation": 36
            },
            {
              "color": "#333333"
            },
            {
              "lightness": 40
            }
          ]
        },
        {
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "transit",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#f2f2f2"
            },
            {
              "lightness": 19
            }
          ]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry.fill",
          "stylers": [
            {
              "color": "#fefefe"
            },
            {
              "lightness": 20
            }
          ]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#fefefe"
            },
            {
              "lightness": 17
            },
            {
              "weight": 1.2
            }
          ]
        }
      ],
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
      },
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

    // Add markers for each country with data
    if (data && data.length > 0) {
      console.log('Adding markers for countries:', data.slice(0, 3)); // Show first 3 items
      
      data.forEach((item, index) => {
        if (item.country && item.papers > 0) {
          console.log(`Processing country: ${item.country}, papers: ${item.papers}, citations: ${item.citations}`);
          
          const countryCoords = getCountryCoordinates(item.country);
          if (countryCoords) {
            console.log(`Adding marker for ${item.country} at:`, countryCoords);
            
            // Create a custom marker with better visibility and styling
            const markerSize = Math.max(15, Math.min(item.papers * 3, 40));
            const intensity = Math.min(item.papers / 10, 1); // Normalize for color intensity
            
            // Create custom marker with SVG icon
            const svgMarker = {
              path: 'M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7Z',
              fillColor: `hsl(${220 - intensity * 60}, 85%, ${60 - intensity * 20}%)`,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: markerSize / 15,
              labelOrigin: new window.google.maps.Point(12, 9)
            };

            console.log(`Creating enhanced marker for ${item.country} with ${item.papers} papers`);
            const marker = new window.google.maps.Marker({
              position: countryCoords,
              map: map,
              title: `${item.country}: ${item.papers} papers, ${item.citations} citations`,
              icon: svgMarker,
              label: {
                text: item.papers.toString(),
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: `${Math.max(10, markerSize / 2)}px`,
                className: 'marker-label'
              },
              animation: window.google.maps.Animation.DROP
            });
            console.log(`Simple marker created for ${item.country}`);

            // Create info window with enhanced styling
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  padding: 16px; 
                  min-width: 260px; 
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  border-radius: 12px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                ">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="
                      width: 8px; 
                      height: 8px; 
                      background: ${svgMarker.fillColor}; 
                      border-radius: 50%; 
                      margin-right: 8px;
                    "></div>
                    <h3 style="
                      margin: 0; 
                      color: #1f2937; 
                      font-size: 18px; 
                      font-weight: 600;
                    ">${item.country}</h3>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <div style="
                      background: #eff6ff; 
                      padding: 8px 12px; 
                      border-radius: 8px; 
                      border-left: 3px solid #3b82f6;
                    ">
                      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Papers</div>
                      <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${item.papers}</div>
                    </div>
                    <div style="
                      background: #f0fdf4; 
                      padding: 8px 12px; 
                      border-radius: 8px; 
                      border-left: 3px solid #10b981;
                    ">
                      <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Citations</div>
                      <div style="font-size: 20px; font-weight: 700; color: #10b981;">${item.citations || 0}</div>
                    </div>
                  </div>
                  
                  <div style="margin-bottom: 8px;">
                    <span style="
                      font-size: 12px; 
                      font-weight: 600; 
                      color: #374151;
                      background: #e5e7eb;
                      padding: 2px 6px;
                      border-radius: 4px;
                    ">Regions: ${item.regions || 1}</span>
                  </div>
                  
                  <div>
                    <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">Research Domains</div>
                    <div style="
                      color: #6b7280; 
                      font-size: 11px; 
                      line-height: 1.4;
                      max-height: 40px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    ">${item.domains || 'N/A'}</div>
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

    // Add regional overlays if regional data is provided
    if (regionalData && regionalData.length > 0) {
      console.log('Adding regional overlays:', regionalData);
      
      regionalData.forEach((region, index) => {
        const regionCoords = getRegionCoordinates(region.name);
        if (regionCoords) {
          // Create color based on region and intensity
          const colors = [
            { stroke: '#3B82F6', fill: '#3B82F6' }, // Blue
            { stroke: '#10B981', fill: '#10B981' }, // Green
            { stroke: '#F59E0B', fill: '#F59E0B' }, // Amber
            { stroke: '#EF4444', fill: '#EF4444' }, // Red
            { stroke: '#8B5CF6', fill: '#8B5CF6' }, // Purple
            { stroke: '#06B6D4', fill: '#06B6D4' }, // Cyan
          ];
          const colorScheme = colors[index % colors.length];
          const intensity = Math.min(region.papers / 20, 1);
          
          // Create regional circle overlay with enhanced styling
          const regionCircle = new window.google.maps.Circle({
            strokeColor: colorScheme.stroke,
            strokeOpacity: 0.8,
            strokeWeight: 3,
            fillColor: colorScheme.fill,
            fillOpacity: 0.2 + (intensity * 0.15), // Dynamic opacity based on papers
            map: map,
            center: regionCoords,
            radius: Math.max(800000, region.papers * 75000), // Scale radius based on papers
            clickable: true
          });

          // Create regional info window with enhanced styling
          const regionInfoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                min-width: 300px; 
                background: linear-gradient(135deg, ${colorScheme.fill}08 0%, ${colorScheme.fill}15 100%);
                border-radius: 16px;
                box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
                border: 2px solid ${colorScheme.stroke}40;
              ">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                  <div style="
                    width: 12px; 
                    height: 12px; 
                    background: ${colorScheme.fill}; 
                    border-radius: 50%; 
                    margin-right: 10px;
                    box-shadow: 0 0 0 3px ${colorScheme.fill}30;
                  "></div>
                  <h3 style="
                    margin: 0; 
                    color: #1f2937; 
                    font-size: 20px; 
                    font-weight: 700;
                  ">${region.name}</h3>
                  <span style="
                    margin-left: auto;
                    font-size: 12px;
                    background: ${colorScheme.fill}20;
                    color: ${colorScheme.stroke};
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                  ">Region</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                  <div style="
                    background: #eff6ff; 
                    padding: 12px; 
                    border-radius: 10px; 
                    border-left: 4px solid #3b82f6;
                    text-align: center;
                  ">
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Papers</div>
                    <div style="font-size: 24px; font-weight: 800; color: #3b82f6;">${region.papers}</div>
                  </div>
                  <div style="
                    background: #f0fdf4; 
                    padding: 12px; 
                    border-radius: 10px; 
                    border-left: 4px solid #10b981;
                    text-align: center;
                  ">
                    <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Citations</div>
                    <div style="font-size: 24px; font-weight: 800; color: #10b981;">${region.citations || 0}</div>
                  </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
                    <span style="color: #7c3aed;">📍</span> Countries (${region.countries.split(',').length})
                  </div>
                  <div style="
                    color: #6b7280; 
                    font-size: 12px; 
                    background: #f9fafb;
                    padding: 8px;
                    border-radius: 6px;
                    border-left: 3px solid #7c3aed;
                  ">${region.countries}</div>
                </div>
                
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
                    <span style="color: #dc2626;">📅</span> Time Period
                  </div>
                  <span style="
                    background: #fef2f2;
                    color: #dc2626;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                  ">${region.yearRange || 'N/A'}</span>
                </div>
                
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px;">
                    <span style="color: #059669;">🔬</span> Research Domains
                  </div>
                  <div style="
                    color: #6b7280; 
                    font-size: 11px; 
                    line-height: 1.5;
                    max-height: 60px;
                    overflow: hidden;
                    background: #f9fafb;
                    padding: 8px;
                    border-radius: 6px;
                    border-left: 3px solid #059669;
                  ">${region.domains || 'N/A'}</div>
                </div>
              </div>
            `
          });

          // Add click listener to the circle
          regionCircle.addListener('click', (e) => {
            // Close any open info windows
            if (window.currentInfoWindow) {
              window.currentInfoWindow.close();
            }
            regionInfoWindow.setPosition(e.latLng);
            regionInfoWindow.open(map);
            window.currentInfoWindow = regionInfoWindow;
          });
        }
      });
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

  const getRegionCoordinates = (regionName) => {
    // Regional center coordinates for major geographic regions
    const regionCoordinates = {
      'North America': { lat: 45.0, lng: -100.0 },
      'South America': { lat: -15.0, lng: -60.0 },
      'Europe': { lat: 54.0, lng: 15.0 },
      'Africa': { lat: 0.0, lng: 20.0 },
      'Asia': { lat: 30.0, lng: 100.0 },
      'Oceania': { lat: -25.0, lng: 140.0 },
      'Antarctica': { lat: -82.0, lng: 0.0 },
      'Other': { lat: 0.0, lng: 0.0 }
    };

    return regionCoordinates[regionName] || null;
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        position: 'relative'
      }} 
    />
  );
};

export default GoogleMapComponent;