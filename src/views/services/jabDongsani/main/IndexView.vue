<template>
	<div>
		<div class="button" @click="$goRoute('gallery')">universe</div>
		<div class="button" @click="$goRoute('solarSystem')">solarSystem</div>
		<div class="button" @click="$goRoute('solarSystem_v2')">solarSystem ver.2</div>
		<div class="button" @click="$goRoute('wheelSpinnerGame')">wheel spinner game</div>
		<div class="button" @click="$goRoute('aStarTrackingMaze')">A* Tracking Maze</div>
		<div class="button" @click="$goRoute('fortRess')">fortRess</div>
		<div class="button" @click="$goRoute('cloudSimul')">cloud Simuation</div>
		<div class="button" @click="$goRoute('snakeSimul')">snake Simuation</div>
		<div class="button" @click="$goRoute('snakeSimul_v2')">snake Simuation ver.2</div>
		<div class="button" @click="$goRoute('snakeSimul_v3')">snake Simuation ver.3</div>
		<div class="button" @click="$goRoute('guestBook')">guestBook</div>
		<div class="button" @click="$goRoute('tetris')">tetris</div>
		<div class="button" @click="$goRoute('billiards')">billiards</div>
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