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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
  height: 400px;
  width: 100%;
  border: var(--border);
}

.popup-content {
  font-size: 12px;
  line-height: 1.4;
}

.popup-content strong {
  font-weight: 600;
}
</style>
