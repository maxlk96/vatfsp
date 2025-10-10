<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>
        <v-icon icon="mdi-airplane" size="large" class="mr-2"></v-icon>
        VATSIM Flight Strip Printer
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-chip
        :color="printerConnected ? 'success' : 'error'"
        variant="flat"
        class="mr-4"
      >
        <v-icon :icon="printerConnected ? 'mdi-printer' : 'mdi-printer-off'" start></v-icon>
        {{ printerConnected ? 'Connected' : 'Disconnected' }}
      </v-chip>
      
      <v-btn icon @click="testPrinter" :disabled="!printerConnected">
        <v-icon>mdi-printer-check</v-icon>
        <v-tooltip activator="parent" location="bottom">Test Printer</v-tooltip>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <airport-selector 
          v-model="selectedAirport"
          @update:modelValue="onAirportChange"
        />
        
        <!-- Runway Selection -->
        <v-card class="mb-4" v-if="runways.length > 0">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedRunway"
                  :items="runwayOptions"
                  label="Select Runway (for SID detection)"
                  density="comfortable"
                  @update:modelValue="onRunwayChange"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="8" class="text-right">
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="printBlankStrip"
                  :disabled="!printerConnected"
                >
                  <v-icon start>mdi-printer-outline</v-icon>
                  Print Blank Strip
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <flight-strip-list
          :arrivals="arrivals"
          :departures="departures"
          :loading="loading"
          :last-update="lastUpdate"
          @print="handlePrint"
        />
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AirportSelector from './components/AirportSelector.vue';
import FlightStripList from './components/FlightStripList.vue';
import api from './services/api';

export default {
  name: 'App',
  components: {
    AirportSelector,
    FlightStripList
  },
  setup() {
    const selectedAirport = ref('ESGG');
    const selectedRunway = ref(null);
    const runways = ref([]);
    const arrivals = ref([]);
    const departures = ref([]);
    const loading = ref(false);
    const lastUpdate = ref(null);
    const printerConnected = ref(false);
    const refreshInterval = ref(null);
    
    const snackbar = ref({
      show: false,
      message: '',
      color: 'info'
    });

    const runwayOptions = computed(() => {
      return runways.value.map(rwy => ({
        title: `Runway ${rwy}`,
        value: rwy
      }));
    });

    const showSnackbar = (message, color = 'info') => {
      snackbar.value = {
        show: true,
        message,
        color
      };
    };

    const fetchFlights = async () => {
      try {
        loading.value = true;
        const data = await api.getFlights(selectedAirport.value, selectedRunway.value);
        arrivals.value = data.arrivals || [];
        departures.value = data.departures || [];
        runways.value = data.runways || [];
        lastUpdate.value = new Date();
      } catch (error) {
        console.error('Error fetching flights:', error);
        showSnackbar('Failed to fetch flight data', 'error');
      } finally {
        loading.value = false;
      }
    };

    const checkPrinterStatus = async () => {
      try {
        const status = await api.getPrinterStatus();
        printerConnected.value = status.connected;
      } catch (error) {
        console.error('Error checking printer status:', error);
        printerConnected.value = false;
      }
    };

    const testPrinter = async () => {
      try {
        await api.testPrinter();
        showSnackbar('Test print sent successfully', 'success');
      } catch (error) {
        showSnackbar('Test print failed', 'error');
      }
    };

    const handlePrint = async (flight) => {
      try {
        const result = await api.printStrip(flight);
        showSnackbar(result.message || 'Flight strip printed successfully', 'success');
        if (result.warning) {
          setTimeout(() => showSnackbar(result.warning, 'warning'), 3500);
        }
      } catch (error) {
        showSnackbar('Failed to print flight strip', 'error');
      }
    };

    const onAirportChange = () => {
      selectedRunway.value = null; // Reset runway when airport changes
      fetchFlights();
    };

    const onRunwayChange = () => {
      fetchFlights();
    };

    const printBlankStrip = async () => {
      try {
        const result = await api.printBlank('departure');
        showSnackbar(result.message || 'Blank strip printed', 'success');
      } catch (error) {
        showSnackbar('Failed to print blank strip', 'error');
      }
    };

    const startAutoRefresh = () => {
      // Refresh every 15 seconds
      refreshInterval.value = setInterval(() => {
        fetchFlights();
        checkPrinterStatus();
      }, 15000);
    };

    const stopAutoRefresh = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
    };

    onMounted(() => {
      fetchFlights();
      checkPrinterStatus();
      startAutoRefresh();
    });

    onUnmounted(() => {
      stopAutoRefresh();
    });

    return {
      selectedAirport,
      selectedRunway,
      runways,
      runwayOptions,
      arrivals,
      departures,
      loading,
      lastUpdate,
      printerConnected,
      snackbar,
      onAirportChange,
      onRunwayChange,
      handlePrint,
      testPrinter,
      printBlankStrip
    };
  }
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
</style>


