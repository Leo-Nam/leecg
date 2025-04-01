<script setup>
import { ref } from "vue";
import { useChatGpt } from "@/composables/useChatGpt";

const inputMessage = ref("");
const { response, error, isLoading, askGpt } = useChatGpt();

const handleSubmit = async () => {
  await askGpt(inputMessage.value);
};


</script>

<template>
  <div>
    <input v-model="inputMessage" placeholder="질문을 입력하세요..." />
    <button @click="handleSubmit" :disabled="isLoading">
      {{ isLoading ? "처리 중..." : "보내기" }}
    </button>

    <div v-if="response">
      <h3>답변:</h3>
      <p>{{ response }}</p>
    </div>

    <div v-if="error" style="color: red;">
      오류: {{ error }}
    </div>
  </div>
</template>