<template>
  <div class="trip-map">
    <l-map
      ref="map"
      :zoom="zoom"
      :center="center"
      :use-global-leaflet="false"
      style="height: 100%; width: 100%;"
      @ready="onMapReady"
    >
      <l-tile-layer
        url="https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a>'
        class="grayscale-tiles"
      />
      
      <!-- Trip markers -->
      <template v-for="trip in trips" :key="trip._id">
        <!-- Origin marker (green) -->
        <l-marker 
          :lat-lng="[trip.origin.lat, trip.origin.lng]"
          @click="$emit('trip-click', trip)"
        >
          <l-icon
            :icon-url="originIcon"
            :icon-size="[25, 41]"
            :icon-anchor="[12, 41]"
            :popup-anchor="[1, -34]"
          />
          <l-popup>
            <div class="popup-content">
              <strong>{{ trip.origin.address }}</strong>
              <br />
              <small>to {{ trip.destination.address }}</small>
              <br />
              <small>{{ formatPrice(trip.price) }} · {{ trip.availableSeats }} seats</small>
            </div>
          </l-popup>
        </l-marker>
        
        <!-- Destination marker (red) -->
        <l-marker 
          :lat-lng="[trip.destination.lat, trip.destination.lng]"
          @click="$emit('trip-click', trip)"
        >
          <l-icon
            :icon-url="destinationIcon"
            :icon-size="[25, 41]"
            :icon-anchor="[12, 41]"
            :popup-anchor="[1, -34]"
          />
          <l-popup>
            <div class="popup-content">
              <strong>{{ trip.destination.address }}</strong>
              <br />
              <small>from {{ trip.origin.address }}</small>
            </div>
          </l-popup>
        </l-marker>
        
        <!-- Route line -->
        <l-polyline
          :lat-lngs="[[trip.origin.lat, trip.origin.lng], [trip.destination.lat, trip.destination.lng]]"
          :color="'#333'"
          :weight="2"
          :opacity="0.6"
          :dash-array="'5, 10'"
        />
      </template>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker, LIcon, LPopup, LPolyline } from "@vue-leaflet/vue-leaflet";

export default {
  name: 'TripMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    LPopup,
    LPolyline
  },
  props: {
    trips: {
      type: Array,
      default: () => []
    },
    initialCenter: {
      type: Array,
      default: () => [46.0679, 11.1211] // Trento
    },
    initialZoom: {
      type: Number,
      default: 11
    }
  },
  emits: ['trip-click'],
  data() {
    return {
      center: this.initialCenter,
      zoom: this.initialZoom,
      // Using CDN icons since local leaflet icons can have path issues
      originIcon: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      destinationIcon: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
    }
  },
  watch: {
    trips: {
      handler() {
        this.fitBounds();
      },
      deep: true
    }
  },
  methods: {
    onMapReady() {
      this.fitBounds();
    },
    fitBounds() {
      if (!this.$refs.map || this.trips.length === 0) return;
      
      // Collect all coordinates
      const coords = [];
      this.trips.forEach(trip => {
        if (trip.origin?.lat && trip.origin?.lng) {
          coords.push([trip.origin.lat, trip.origin.lng]);
        }
        if (trip.destination?.lat && trip.destination?.lng) {
          coords.push([trip.destination.lat, trip.destination.lng]);
        }
      });
      
      if (coords.length > 0) {
        // Small delay to ensure map is ready
        setTimeout(() => {
          const map = this.$refs.map?.leafletObject;
          if (map) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        }, 100);
      }
    },
    formatPrice(price) {
      return price === 0 ? 'Free' : `€${price.toFixed(2)}`;
    }
  }
}
</script>

<style scoped>
.trip-map {
  height: 100%;
  width: 100%;
}

/* Grayscale filter for map tiles to match skeletal design */
:deep(.leaflet-tile-pane) {
  filter: grayscale(20%) contrast(1.05);
}

/* Style popups to match skeletal design */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0;
  border: 1.5px solid #1a1a1a;
  box-shadow: none;
  padding: 0;
}

:deep(.leaflet-popup-content) {
  margin: 8px 12px;
}

:deep(.leaflet-popup-tip) {
  background: #1a1a1a;
  box-shadow: none;
}

:deep(.leaflet-popup-close-button) {
  color: #1a1a1a !important;
}

.popup-content {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  line-height: 1.5;
  color: #1a1a1a;
}

.popup-content strong {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Style map controls */
:deep(.leaflet-control-zoom) {
  border: 1.5px solid #1a1a1a !important;
  border-radius: 0 !important;
}

:deep(.leaflet-control-zoom a) {
  border-radius: 0 !important;
  border-bottom: 1px solid #d0d0d0 !important;
  color: #1a1a1a !important;
  background: #ffffff !important;
}

:deep(.leaflet-control-zoom a:last-child) {
  border-bottom: none !important;
}

:deep(.leaflet-control-zoom a:hover) {
  background: #1a1a1a !important;
  color: #ffffff !important;
}

:deep(.leaflet-control-attribution) {
  font-size: 9px;
  background: rgba(255,255,255,0.9) !important;
  padding: 2px 6px;
}
</style>
