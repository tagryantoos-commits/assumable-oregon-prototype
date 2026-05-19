'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Marker } from 'react-leaflet';
import { Listing, formatPrice } from '../lib/listings';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (webpack workaround)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ListingsMapProps {
  listings: Listing[];
  onGetDetails: (listing: Listing) => void;
}

function createPriceIcon(monthlyPayment: number) {
  const label = `$${monthlyPayment.toLocaleString()}/mo`;
  return L.divIcon({
    className: '',
    html: `<div style="background:#1f2937;color:white;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;white-space:nowrap;display:inline-block;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [90, 26],
    iconAnchor: [45, 13],
    popupAnchor: [0, -14],
  });
}

export default function ListingsMap({ listings, onGetDetails }: ListingsMapProps) {
  const validListings = useMemo(
    () => listings.filter(l => l.latitude && l.longitude),
    [listings]
  );

  return (
    <>
    <div style={{
      background: "#1D5C96",
      color: "white",
      padding: "8px 16px",
      fontSize: 13,
      fontWeight: 500,
    }}>
      📍 {validListings.length.toLocaleString()} assumable properties on map · Click a cluster to zoom in · Click a pin to see details
    </div>
    <MapContainer
      bounds={[[37.5, -107.4], [40.9, -102.0]]}
      boundsOptions={{ padding: [20, 20] }}
      style={{ height: 'calc(100vh - 130px)', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup
        chunkedLoading
        disableClusteringAtZoom={14}
        maxClusterRadius={40}
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          let size = 44;
          let bg = "#1D5C96";
          if (count >= 100) { size = 56; bg = "#0f3d6b"; }
          else if (count >= 50) { size = 50; bg = "#1a4f80"; }

          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;
              background:${bg};
              color:white;
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:${count >= 100 ? 13 : 14}px;
              font-weight:700;
              border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);
              font-family:system-ui,sans-serif;
            ">${count}</div>`,
            className: "",
            iconSize: [size, size] as [number, number],
            iconAnchor: [size/2, size/2] as [number, number],
          });
        }}
      >
        {validListings.map(listing => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            icon={createPriceIcon(listing.assumableMonthlyPayment)}
          >
            <Popup>
              <div style={{ minWidth: 200, fontSize: 13 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {listing.city}, {listing.state}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{formatPrice(listing.price)}</span>
                  <span style={{
                    display: 'inline-block',
                    marginLeft: 6,
                    background: listing.loanType === 'VA' ? '#1d5c96' : '#059669',
                    color: 'white',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                    {listing.loanType}
                  </span>
                </div>
                <div style={{ color: '#4b5563', marginBottom: 2 }}>
                  {listing.assumableRate}% rate · ${listing.assumableMonthlyPayment.toLocaleString()}/mo
                </div>
                <div style={{ color: '#4b5563', marginBottom: 6 }}>
                  {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sqft
                </div>
                <button
                  onClick={() => onGetDetails(listing)}
                  style={{
                    color: '#1d5c96',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
    </>
  );
}
