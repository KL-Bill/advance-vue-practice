<script setup lang="ts">
import { ref } from 'vue'

import MedicineCard from '@/components/MedicineCard.vue'

import type { Medicine } from '@/interfaces/Medicine'

const medicines = ref<Medicine[]>([
  {
    id: 1,
    brand: 'Biogesic',
    generic: 'Paracetamol',
    form: 'Tablet',
    strength: '300mg',
    price: 7,
    quantity: 5,
  },
  {
    id: 2,
    brand: 'Bioflu',
    generic: 'Paracetamol',
    form: 'Tablet',
    strength: '300mg',
    price: 10,
    quantity: 8,
  },
  {
    id: 3,
    brand: 'Calpol',
    generic: 'Paracetamol',
    form: 'Tablet',
    strength: '300mg',
    price: 12,
    quantity: 6,
  },
])
</script>
<template>
  <h1>Hello World</h1>
  <div class="med-section">
    <MedicineCard v-for="medicine in medicines" :medicine="medicine" />
  </div>
</template>
<style scoped>
.med-section {
  display: flex;
  flex-direction: row;
  flex-flow: wrap;
  gap: 30px;
}
</style>
