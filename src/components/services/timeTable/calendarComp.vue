<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <div v-for="day in daysOfWeek" :key="day" class="calendar-day-header">
        {{ day }}
      </div>
    </div>
    <div class="calendar-body">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index" 
        class="calendar-day"
        :class="getDayClass(day)"
      >
        <span class="day-number">{{ day.date }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      daysOfWeek: ["일", "월", "화", "수", "목", "금", "토"], // 요일
      currentMonth: new Date().getMonth() + 1, // 현재 월
      currentYear: new Date().getFullYear(), // 현재 연도
      holidays: ["2025-03-01", "2025-05-05", "2025-08-15"], // 공휴일 리스트
    };
  },
  computed: {
    calendarDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
      const totalDays = new Date(this.currentYear, this.currentMonth, 0).getDate();
      
      // 빈칸 추가 (첫 번째 날이 요일에 맞게 정렬되도록)
      for (let i = 0; i < firstDay; i++) {
        days.push({ date: "", isHoliday: false });
      }

      // 날짜 추가
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const weekday = new Date(this.currentYear, this.currentMonth - 1, day).getDay();
        const isHoliday = this.holidays.includes(dateStr) || weekday === 0 || weekday === 6;
        
        days.push({ date: day, isHoliday, weekday });
      }

      return days;
    },
  },
  methods: {
    getDayClass(day) {
      if (!day.date) return "empty"; // 빈칸 스타일
      if (day.weekday === 0 || this.holidays.includes(`${this.currentYear}-${String(this.currentMonth).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`)) return "holiday"; // 일요일 또는 공휴일
      if (day.weekday === 6) return "saturday"; // 토요일
      return "normal"; // 평일
    },
  },
};
</script>

<style scoped>
.calendar-container {
  width: 100%;
  text-align: center;
}
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-weight: bold;
  padding-bottom: 10px;
}
.calendar-day-header {
  padding: 10px 0;
}
.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.calendar-day {
  position: relative;
  padding: 10px;
  border: 1px solid #ddd;
  min-height: 150px;
}
.day-number {
  position: absolute;
  top: 5px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
}
.empty {
  background: #f5f5f5;
}
.holiday {
  color: red;
}
.saturday {
  color: blue;
}
.normal {
  color: black;
}
</style>
