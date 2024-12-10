<template>
  <v-card 
    :color="color" 
    dark 
    class="metric-card"
    @click="$emit('click')"
  >
    <v-card-text class="metric-content">
      <div class="text-subtitle-1">{{ title }}</div>
      <div class="text-h4 white--text">{{ value }}</div>
      <div class="text-caption">{{ subtitle }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: number
  subtitle: string
  color: string
}>()

defineEmits(['click'])
</script>

<style scoped>
.metric-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
}

.metric-content {
  color: white !important;
}

.metric-content .text-h4 {
  color: white !important;
  font-size: 2.5rem !important;
  font-weight: 500;
}

.metric-content .text-subtitle-1,
.metric-content .text-caption {
  color: rgba(255, 255, 255, 0.9) !important;
}
</style>