<template>
  <div class="ladder-container">
    <div class="controls">
      <button @click="generateLadder">사다리 생성</button>
      <button @click="startGame" :disabled="!ladder.length">게임 시작</button>
    </div>
    <div class="ladder">
      <div v-for="(line, index) in ladder" :key="index" class="ladder-line">
        <div v-for="(step, stepIndex) in line" :key="stepIndex" class="ladder-step" :class="{ active: step }"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    const players = ref(4); // 기본 참가자 수
    const ladder = ref([]);

    const generateLadder = () => {
      ladder.value = Array.from({ length: 10 }, () => 
        Array(players.value - 1).fill(false).map(() => Math.random() < 0.3)
      );
    };

    const startGame = () => {
      alert('게임을 시작합니다!');
    };

    return {
      players,
      ladder,
      generateLadder,
      startGame
    };
  }
};
</script>

<style>
.ladder-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.controls {
  margin-bottom: 20px;
}
.ladder {
  display: flex;
}
.ladder-line {
  display: flex;
  flex-direction: column;
  margin-right: 10px;
}
.ladder-step {
  width: 50px;
  height: 20px;
  border-bottom: 1px solid black;
}
.active {
  background-color: gold;
}
</style>
