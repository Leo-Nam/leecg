<template>	
	<div class="df jcc width-100 button-style" @click="buttonClicked">
		{{ caption }}
	</div>
</template>
<script>
export default {
  name: "divButton",
  props: {
    caption: {
      type: String,
      default: ""
    },
		buttonId: {
			type: Number,
			default: 0
		}
  },
  methods: {
    buttonClicked() {
			console.log('buttonClicked', this.buttonId)
      this.$emit("buttonClicked", {buttonId: this.buttonId});
    },
  }
};
</script>

<style scoped>
.button-style {
  border: 1px solid #004d00; /* 테두리 색상 */
  border-radius: 1px; /* 모서리 둥글게 */
  cursor: pointer; /* 마우스를 올리면 포인터 변경 */
  text-align: center;
  transition: all 0.2s ease-in-out;
}

.button-style:hover {
  background-color: #006400; /* 마우스를 올리면 어두운 녹색으로 변경 */
  color: white; /* 글자색 변경 */
}
</style>