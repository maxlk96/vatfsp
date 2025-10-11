<template>
  <v-row>
    <!-- Departures -->
    <v-col cols="12" lg="6">
      <v-card>
        <v-card-title class="bg-blue-lighten-4">
          <v-icon icon="mdi-airplane-takeoff" class="mr-2"></v-icon>
          Departures
          <v-chip class="ml-2" size="small" color="primary">
            {{ departures.length }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            :loading="loading"
            @click="$emit('refresh')"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div v-if="loading && departures.length === 0" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          
          <div v-else-if="departures.length === 0" class="text-center pa-4 text-grey">
            No departures found
          </div>
          
          <v-list v-else density="compact">
            <v-list-item
              v-for="flight in departures"
              :key="flight.callsign"
              class="mb-2"
              border
            >
              <template v-slot:prepend>
                <v-avatar color="blue" size="40">
                  <span class="text-white font-weight-bold">{{ flight.aircraft }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-bold">
                {{ flight.callsign }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <v-icon icon="mdi-arrow-right" size="small"></v-icon>
                {{ flight.arrival }} | {{ flight.altitude }} | {{ flight.filedTime }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-icon
                    v-if="isPrinted(flight.callsign)"
                    color="success"
                    size="small"
                    class="mr-2"
                  >
                    mdi-check-circle
                  </v-icon>
                  <v-btn
                    icon="mdi-printer"
                    color="primary"
                    variant="tonal"
                    size="small"
                    @click="$emit('print', flight)"
                  >
                    <v-icon>mdi-printer</v-icon>
                    <v-tooltip activator="parent" location="top">
                      {{ isPrinted(flight.callsign) ? 'Print Again' : 'Print Strip' }}
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Arrivals -->
    <v-col cols="12" lg="6">
      <v-card>
        <v-card-title class="bg-green-lighten-4">
          <v-icon icon="mdi-airplane-landing" class="mr-2"></v-icon>
          Arrivals
          <v-chip class="ml-2" size="small" color="success">
            {{ arrivals.length }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            icon
            size="small"
            :loading="loading"
            @click="$emit('refresh')"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div v-if="loading && arrivals.length === 0" class="text-center pa-4">
            <v-progress-circular indeterminate color="success"></v-progress-circular>
          </div>
          
          <div v-else-if="arrivals.length === 0" class="text-center pa-4 text-grey">
            No arrivals found
          </div>
          
          <v-list v-else density="compact">
            <v-list-item
              v-for="flight in arrivals"
              :key="flight.callsign"
              class="mb-2"
              border
            >
              <template v-slot:prepend>
                <v-avatar color="green" size="40">
                  <span class="text-white font-weight-bold">{{ flight.aircraft }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-bold">
                {{ flight.callsign }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <v-icon icon="mdi-arrow-left" size="small"></v-icon>
                {{ flight.departure }} | {{ flight.altitude }} | {{ flight.filedTime }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-icon
                    v-if="isPrinted(flight.callsign)"
                    color="success"
                    size="small"
                    class="mr-2"
                  >
                    mdi-check-circle
                  </v-icon>
                  <v-btn
                    icon="mdi-printer"
                    color="success"
                    variant="tonal"
                    size="small"
                    @click="$emit('print', flight)"
                  >
                    <v-icon>mdi-printer</v-icon>
                    <v-tooltip activator="parent" location="top">
                      {{ isPrinted(flight.callsign) ? 'Print Again' : 'Print Strip' }}
                    </v-tooltip>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <!-- Last Update Info -->
  <v-card class="mt-4" variant="outlined">
    <v-card-text class="text-center text-grey">
      <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
      Last updated: {{ formatTime(lastUpdate) }}
      <span class="ml-4">
        <v-icon icon="mdi-refresh-auto" size="small" class="mr-1"></v-icon>
        Auto-refresh every 15 seconds
      </span>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'FlightStripList',
  props: {
    arrivals: {
      type: Array,
      default: () => []
    },
    departures: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    lastUpdate: {
      type: Date,
      default: null
    },
    printedStrips: {
      type: Set,
      default: () => new Set()
    }
  },
  emits: ['print', 'refresh'],
  methods: {
    formatTime(date) {
      if (!date) return 'Never';
      return date.toLocaleTimeString();
    },
    isPrinted(callsign) {
      return this.printedStrips.has(callsign);
    }
  }
};
</script>


