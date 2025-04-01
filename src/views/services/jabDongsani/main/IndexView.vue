<template>
	<div>
		<div class="button" @click="$goRoute('gallery')">universe</div>
		<div class="button" @click="$goRoute('solarSystem')">solarSystem</div>
	</div>
</template>
<script>
</script>
<style scoped>

.button {
  margin: 5px;
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>