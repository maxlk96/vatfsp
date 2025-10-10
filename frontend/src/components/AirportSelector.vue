<template>
  <v-card class="mb-4">
    <v-card-title>
      <v-icon icon="mdi-airport" class="mr-2"></v-icon>
      Airport Selection
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event.toUpperCase())"
            label="Airport ICAO Code"
            placeholder="ESGG"
            hint="Enter 4-letter ICAO code"
            persistent-hint
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-map-marker"
            :rules="[rules.required, rules.icao]"
            counter="4"
            maxlength="4"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event)"
            :items="commonAirports"
            label="Quick Select"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-star"
          ></v-select>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'AirportSelector',
  props: {
    modelValue: {
      type: String,
      default: 'ESGG'
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const commonAirports = ref([
      { title: 'ESGG - Göteborg Landvetter', value: 'ESGG' },
      { title: 'ESSA - Stockholm Arlanda', value: 'ESSA' },
      { title: 'ENGM - Oslo Gardermoen', value: 'ENGM' },
      { title: 'EKCH - Copenhagen', value: 'EKCH' },
      { title: 'EFHK - Helsinki Vantaa', value: 'EFHK' },
      { title: 'EGLL - London Heathrow', value: 'EGLL' },
      { title: 'EDDF - Frankfurt', value: 'EDDF' },
      { title: 'LFPG - Paris Charles de Gaulle', value: 'LFPG' },
      { title: 'EHAM - Amsterdam Schiphol', value: 'EHAM' },
      { title: 'LOWW - Vienna', value: 'LOWW' }
    ]);

    const rules = {
      required: value => !!value || 'ICAO code is required',
      icao: value => (value && value.length === 4) || 'Must be 4 characters'
    };

    return {
      commonAirports,
      rules
    };
  }
};
</script>


