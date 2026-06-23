<script setup lang="ts">
import type { Medicine } from '@/interfaces/Medicine'

const { medicine } = defineProps<{
  medicine: Medicine
}>()

function transitionWow(event: MouseEvent) {
  const card = event.currentTarget as HTMLElement
  const circles = card.querySelectorAll<HTMLElement>('.circle')

  circles.forEach((circle) => {
    if (circle.style.width == '750px') {
      circle.style.width = '0px'
      circle.style.height = '0px'
      return
    }
    circle.style.width = '750px'
    circle.style.height = '750px'
  })
}
</script>

<template>
  <div class="card" @click="transitionWow">
    <div class="circle c1"></div>
    <div class="circle c2"></div>
    <div class="circle c3"></div>
    <div class="img-container">
      <img
        src="https://static.vecteezy.com/system/resources/thumbnails/053/652/272/small/white-pill-medicine-tablet-scored-round-pharmacy-healthcare-png.png"
        alt="Tablet Image"
      />
    </div>
    <div class="details-container">
      <div class="detail-box detail-brand">
        {{ medicine.brand }}
      </div>
      <div class="detail-box detail-generic">
        {{ medicine.generic }}
      </div>
      <div class="detail-box">
        <div class="pill">
          <div class="pill-icon"><></div>
          <div class="pill-text">{{ medicine.form }} / {{ medicine.strength }}</div>
        </div>
      </div>
      <div class="detail-box-2">
        <div class="detail-more">
          <div class="detail-icon"><=)</div>
          <div class="detail-data">
            <div class="detail-label">Price</div>
            <div class="detail-text">Php {{ medicine.price }}.00</div>
          </div>
        </div>

        <div
          class="detail-more"
          style="border-left: 1px solid rgb(240, 240, 240); padding-left: 20px"
        >
          <div class="detail-icon">('-')</div>
          <div class="detail-data">
            <div class="detail-label">Type</div>
            <div class="detail-text">OTC Medicine</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* .circle {
  width: 750px;
  height: 750px;
} */

.circle {
  position: absolute;
  background-color: #fdd270;
  width: 0px;
  height: 0px;
  border-radius: 100%;
  transition: all 1s cubic-bezier(0.8, 0, 0.2, 1);
  left: 20%;
  transform: translateX(-50%);
}

.c1 {
  margin-top: -140px;
  margin-left: -50px;
}

.c2 {
  margin-top: -100px;
  margin-left: 450px;
}

.c3 {
  margin-top: 280px;
  margin-left: 350px;
}

.detail-label {
  font-size: 14px;
  font-variant-caps: all-petite-caps;
}

.detail-text {
  font-size: 20px;
  font-weight: 500;
}

.detail-icon {
  margin-right: 20px;
  background-color: rgb(230, 239, 247);
  padding: 10px;
  border-radius: 100px;
}
.detail-box-2 {
  display: flex;
  flex-direction: row;
  border-top: 1px solid rgb(240, 240, 240);
  margin-top: 10px;
  padding-top: 10px;
}

.detail-more {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
}

.detail-brand {
  font-size: 50px;
  font-weight: 600;
  transition: all 0.3s;
}

.detail-generic {
  font-size: 25px;
  color: rgb(83, 83, 83);
}

.pill {
  margin: 8px 0px;
  display: flex;
  flex-direction: row;
  width: fit-content;
  padding: 2px 8px;
  background-color: rgb(229, 243, 255);
  color: rgb(37, 102, 199);
  border-radius: 8px;
}

.pill-text {
  font-weight: 500;
}

.details-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 10px;
}

.card {
  position: relative;
  color: black;
  background-color: white;
  padding: 30px;
  border-radius: 20px;
  width: 700px;
  height: 300px;
  box-shadow: 0px 5px 20px rgb(216, 216, 216);

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 50px;
  overflow: hidden;

  cursor: pointer;
  transition: all 0.5s;
}

.card:hover {
  box-shadow: 0px 5px 30px rgb(163, 163, 163);
}

.img-container {
  width: 220px;
  background-color: rgb(229, 243, 255);
  border-radius: 12px;
  height: 100%;
}

.img-container > img {
  width: 100%;
  margin-top: 50px;
}
</style>
