<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>ShareTrento</h1>
        <p class="tagline">Car-sharing for the city of Trento</p>
        <div class="hero-line"></div>
        <p class="hero-description">
          Connect with drivers and passengers to share rides across Trento and nearby cities.
        </p>
      </div>

      <div class="cta-buttons" v-if="!isLoggedIn">
        <router-link to="/register" class="btn btn-primary btn-lg">Get Started</router-link>
        <router-link to="/login" class="btn btn-lg">Login</router-link>
      </div>

      <div class="cta-buttons" v-else>
        <router-link to="/trips" class="btn btn-primary btn-lg">Browse Trips</router-link>
        <router-link v-if="isDriver" to="/create-trip" class="btn btn-lg">Create Trip</router-link>
        <router-link v-if="isPassenger" to="/my-bookings" class="btn btn-lg">My Bookings</router-link>
      </div>
    </section>

    <section class="features">
      <div class="feature-card">
        <div class="feature-icon">[D]</div>
        <h3>For Drivers</h3>
        <p>Create trips and share your car with passengers heading the same direction.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">[P]</div>
        <h3>For Passengers</h3>
        <p>Find and book available trips. Save money and reduce your carbon footprint.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">[M]</div>
        <h3>Smart Matching</h3>
        <p>Find trips matching your route and time window of 30 minutes.</p>
      </div>
    </section>
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
  max-width: 800px;
  margin: 0 auto;
}

/* Hero - Skeletal */
.hero {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  border: var(--border);
  margin-bottom: var(--spacing-2xl);
}

.hero h1 {
  font-size: 3rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-sm);
}

.tagline {
  font-size: var(--font-size-lg);
  color: var(--color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-lg);
}

.hero-line {
  width: 60px;
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-lg) auto;
}

.hero-description {
  max-width: 500px;
  margin: 0 auto var(--spacing-xl);
  color: var(--color-secondary);
  line-height: 1.8;
}

.cta-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

/* Features - Skeletal Cards */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: 768px) {
  .features {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  border: var(--border);
  padding: var(--spacing-xl);
  text-align: center;
  transition: all var(--transition-fast);
}

.feature-card:hover {
  background: var(--color-text);
  color: var(--color-bg);
}

.feature-card:hover .feature-icon {
  border-color: var(--color-bg);
}

.feature-card:hover p {
  color: var(--color-bg);
  opacity: 0.8;
}

.feature-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto var(--spacing-md);
  border: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.feature-card h3 {
  font-size: var(--font-size-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-sm);
}

.feature-card p {
  font-size: var(--font-size-sm);
  color: var(--color-secondary);
  margin: 0;
  line-height: 1.6;
}
</style>
