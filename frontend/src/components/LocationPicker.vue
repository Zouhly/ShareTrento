<template>
  <div class="location-picker">
    <div class="input-wrapper">
      <input
        type="text"
        :id="inputId"
        v-model="searchQuery"
        :placeholder="placeholder"
        @input="onInputChange"
        @focus="showSuggestions = true"
        autocomplete="off"
      />
      <span v-if="loading" class="loading-indicator">...</span>
    </div>
    
    <!-- Suggestions dropdown -->
    <ul v-if="showSuggestions && suggestions.length > 0" class="suggestions-list">
      <li 
        v-for="(suggestion, index) in suggestions" 
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="suggestion-item"
      >
        {{ suggestion.display_name }}
      </li>
    </ul>

    <!-- Mini map preview -->
    <div v-if="modelValue?.lat && showMap" class="map-preview">
      <l-map
        ref="map"
        :zoom="14"
        :center="[modelValue.lat, modelValue.lng]"
        :use-global-leaflet="false"
        style="height: 150px; width: 100%;"
      >
        <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <l-marker :lat-lng="[modelValue.lat, modelValue.lng]" />
      </l-map>
    </div>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

export default {
  name: 'LocationPicker',
  components: {
    LMap,
    LTileLayer,
    LMarker
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({ address: '', lat: null, lng: null })
    },
    placeholder: {
      type: String,
      default: 'Enter address...'
    },
    inputId: {
      type: String,
      default: 'location'
    },
    showMap: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      searchQuery: this.modelValue?.address || '',
      suggestions: [],
      showSuggestions: false,
      loading: false,
      debounceTimer: null
    }
  },
  watch: {
    modelValue: {
      handler(newVal) {
        if (newVal?.address && newVal.address !== this.searchQuery) {
          this.searchQuery = newVal.address;
        }
      },
      deep: true
    }
  },
  mounted() {
    // Close suggestions when clicking outside
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.showSuggestions = false;
      }
    },
    onInputChange() {
      // Clear previous timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Debounce API calls (300ms)
      this.debounceTimer = setTimeout(() => {
        this.searchAddress();
      }, 300);
    },
    async searchAddress() {
      if (this.searchQuery.length < 3) {
        this.suggestions = [];
        return;
      }

      this.loading = true;

      try {
        // Use Nominatim (OpenStreetMap's free geocoding API)
        // Bias results towards Trentino-Alto Adige region
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(this.searchQuery)}` +
          `&countrycodes=it&viewbox=10.4,47.1,12.5,45.6&bounded=1` +
          `&limit=5`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        
        this.suggestions = await response.json();
      } catch (error) {
        console.error('Geocoding error:', error);
        this.suggestions = [];
      } finally {
        this.loading = false;
      }
    },
    selectSuggestion(suggestion) {
      const location = {
        address: suggestion.display_name.split(',').slice(0, 3).join(','),
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      };
      
      this.searchQuery = location.address;
      this.showSuggestions = false;
      this.$emit('update:modelValue', location);
    }
  }
}
</script>

<style scoped>
.location-picker {
  position: relative;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: var(--spacing-md);
  border: var(--border);
  background: var(--color-bg);
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-text);
}

.loading-indicator {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-bg-card);
  border: var(--border);
  border-top: none;
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  border-bottom: var(--border-light);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: var(--color-bg);
}

.map-preview {
  margin-top: var(--spacing-sm);
  border: var(--border);
}
</style>
