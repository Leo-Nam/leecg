<template>
  <div class="ladder-game">
    <h1>사다리 게임</h1>
    <div class="input-section">
      <div>
        <label for="participants">참가자 (쉼표로 구분):</label>
        <input type="text" id="participants" v-model="participantsInput" />
      </div>
      <div>
        <label for="results">결과 (쉼표로 구분):</label>
        <input type="text" id="results" v-model="resultsInput" />
      </div>
      <button @click="generateLadder">사다리 생성</button>
    </div>
    <div class="ladder-section" v-if="ladderGenerated">
      <div class="ladder">
        <div class="participants">
          <div v-for="(participant, index) in participants" :key="index" class="participant">
            {{ participant }}
          </div>
        </div>
        <div class="lines">
          <div v-for="(line, index) in ladder" :key="index" class="line">
            <div v-for="(step, stepIndex) in line" :key="stepIndex" class="step">
              <span v-if="step === 1">───</span>
              <span v-else>   </span>
            </div>
          </div>
        </div>
        <div class="results">
          <div v-for="(result, index) in results" :key="index" class="result">
            {{ result }}
          </div>
        </div>
      </div>
    </div>
    <div class="result-section" v-if="ladderGenerated">
      <h2>결과</h2>
      <ul>
        <li v-for="(result, index) in finalResults" :key="index">
          {{ participants[index] }} → {{ result }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      participantsInput: '',
      resultsInput: '',
      participants: [],
      results: [],
      ladder: [],
      ladderGenerated: false,
      finalResults: []
    };
  },
  methods: {
    generateLadder() {
      this.participants = this.participantsInput.split(',').map(p => p.trim());
      this.results = this.resultsInput.split(',').map(r => r.trim());

      if (this.participants.length !== this.results.length) {
        alert('참가자와 결과의 수가 일치해야 합니다.');
        return;
      }

      this.ladder = this.createLadder(this.participants.length);
      this.finalResults = this.calculateResults();
      this.ladderGenerated = true;
    },
    createLadder(length) {
      const ladder = [];
      for (let i = 0; i < length - 1; i++) {
        const line = [];
        for (let j = 0; j < length; j++) {
          line.push(Math.random() > 0.5 ? 1 : 0);
        }
        ladder.push(line);
      }
      return ladder;
    },
    calculateResults() {
      const results = [...this.participants];
      this.ladder.forEach(line => {
        for (let i = 0; i < line.length - 1; i++) {
          if (line[i] === 1) {
            [results[i], results[i + 1]] = [results[i + 1], results[i]];
          }
        }
      });
      return results.map((result, index) => this.results[index]);
    }
  }
};
</script>

<style scoped>
.ladder-game {
  text-align: center;
  padding: 20px;
}

.input-section {
  margin-bottom: 20px;
}

.input-section div {
  margin-bottom: 10px;
}

.ladder-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.ladder {
  display: flex;
  flex-direction: row;
}

.participants, .results {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.participant, .result {
  margin: 10px 0;
}

.lines {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.line {
  display: flex;
  flex-direction: row;
}

.step {
  margin: 0 5px;
}

.result-section ul {
  list-style-type: none;
  padding: 0;
}

.result-section li {
  margin: 5px 0;
}
</style>