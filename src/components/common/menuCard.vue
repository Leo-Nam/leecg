<template>
  <div 
    class="df jcc"
    :style="`
      width: ${cardWidth}%;
      border-width: ${borderWidth}px;
      border-style: ${borderStyle};
      border-color: ${borderColor};
      border-radius: ${borderRadius}px;
      padding-top: ${paddingTop}px;
      padding-right: ${paddingRight}px;
      padding-bottom: ${paddingBottom}px;
      padding-left: ${paddingLeft}px;
      outline: ${outline};
      font-size: ${fontSize}px;
      min-width: ${minWidth}px;
      background-color: ${disabled ? disabledBackgroundColor : hover ? hoverBackgroundColor : backgroundColor};
      color: ${disabled ? disabledTextColor : hover ? hoverTextColor : textColor};
      cursor: ${disabled ? 'not-allowed' : hover ? 'pointer' : 'default'};
      opacity: ${disabled ? 0.6 : 1};
    `"
    @mouseover="!disabled && (hover = true)" 
    @mouseleave="hover = false"
    @click="handleClick"
  >
    {{ caption }}
  </div>
</template>

<script>
export default {
  name: 'RoundedButton',
  props: {
    route: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: 'OK'
    },
    cardWidth: {
      type: Number,
      default: 100
    },
    borderWidth: {
      type: Number,
      default: 1
    },
    borderStyle: {
      type: String,
      default: 'solid'
    },
    borderColor: {
      type: String,
      default: '#777'
    },
    borderRadius: {
      type: Number,
      default: 5
    },
    paddingTop: {
      type: Number,
      default: 8
    },
    paddingRight: {
      type: Number,
      default: 12
    },
    paddingBottom: {
      type: Number,
      default: 8
    },
    paddingLeft: {
      type: Number,
      default: 12
    },
    outline: {
      type: String,
      default: 'none'
    },
    fontSize: {
      type: Number,
      default: 14
    },
    minWidth: {
      type: Number,
      default: 60
    },
    backgroundColor: {
      type: String,
      default: 'transparent'
    },
    textColor: {
      type: String,
      default: 'black'
    },
    hoverBackgroundColor: {
      type: String,
      default: 'rgb(117, 20, 133)'
    },
    hoverTextColor: {
      type: String,
      default: 'white'
    },
    disabledBackgroundColor: {
      type: String,
      default: '#d3d3d3' // 옅은 그레이 색상
    },
    disabledTextColor: {
      type: String,
      default: '#888' // 회색 텍스트 색상
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hover: false // Hover 상태 여부
    };
  },
  methods: {
    handleClick() {
      if (!this.disabled) {
				console.log(this.route, 'hello')
        this.$emit('clickCard', this.route); // 부모 컴포넌트에 클릭 이벤트 전달 (disabled가 false일 때만)
      }
    }
  }
};
</script>


<!-- 부모컴포넌트에서의 사용예
<template>
  <div>
    <RoundedInput
      v-model="inputValue"
      :width="'80%'"
      :border-color="'#555'"
      :border-radius="10"
      :font-size="16"
    />
    <p>입력한 값: {{ inputValue }}</p>
  </div>
</template>

<script>
import RoundedInput from "@/components/RoundedInput.vue";

export default {
  components: {
    RoundedInput
  },
  data() {
    return {
      inputValue: ''
    };
  }
};
</script> -->