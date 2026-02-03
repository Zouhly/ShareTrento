<template>
  <div class="home">
    <div class="hero">
      <h1>🚗 Welcome to ShareTrento</h1>
      <p class="tagline">Car-sharing for the city of Trento</p>
      
      <div class="hero-description">
        <p>Connect with drivers and passengers to share rides across Trento and nearby cities.</p>
      </div>

      <div class="cta-buttons" v-if="!isLoggedIn">
        <router-link to="/register" class="btn btn-primary">Get Started</router-link>
        <router-link to="/login" class="btn btn-secondary">Login</router-link>
      </div>

      <div class="cta-buttons" v-else>
        <router-link to="/trips" class="btn btn-primary">Browse Trips</router-link>
        <router-link v-if="isDriver" to="/create-trip" class="btn btn-secondary">Create a Trip</router-link>
        <router-link v-if="isPassenger" to="/my-bookings" class="btn btn-secondary">My Bookings</router-link>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">🚘</div>
        <h3>For Drivers</h3>
        <p>Create trips and share your car with passengers heading the same direction.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎫</div>
        <h3>For Passengers</h3>
        <p>Find and book available trips. Save money and reduce your carbon footprint.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔍</div>
        <h3>Smart Matching</h3>
        <p>Find trips matching your route and time window (±30 minutes).</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  computed: {
    isLoggedIn() {
      return !!localStorage.getItem('token')
    },
    isDriver() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?.role === 'DRIVER'
    },
    isPassenger() {
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      return user?.role === 'PASSENGER'
    }
  }
}
</script>

<style scoped>
.home {
  text-align: center;
}

.hero {
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.tagline {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 1rem;
}

.hero-description {
  max-width: 600px;
  margin: 0 auto 2rem;
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #666;
}
</style>
