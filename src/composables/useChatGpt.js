import { ref } from 'vue';
import axios from 'axios';

export function useChatGpt() {
  const response = ref(null);
  const error = ref(null);
  const isLoading = ref(false);

  const askGpt = async (prompt) => {
    isLoading.value = true;
    try {
      const response = await axios.post(process.env.VUE_APP_API + '/api/gpt', { prompt });
      console.log('GPT Response:', response.data.response);
    } catch (err) {
      console.error('Error calling GPT API:', error);
    } finally {
      isLoading.value = false;
    }
  };

  return { response, error, isLoading, askGpt };
}