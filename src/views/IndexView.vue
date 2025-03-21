<template>
	<div>
		<!-- views/IndexView.vue -->
		<div 
			class="width-100"
		>
			<!-- 하위 라우팅되는 뷰페이지 메인에 각각 아래의 형태로 작업을 하되
			로그인과 회원가입만 v-flex에서 xs12 sm10 md8을 사용하고 
			나머지는 v-flex 자체를 사용을 하지 않고 바디 폭 전체를 사용하도록 한다. -->
			<router-view />
		</div>
	</div>
</template>
<script>
</script>