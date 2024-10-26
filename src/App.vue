<template>
  <div class="app">
    <div class="tip">得分{{ obj.score }}</div>
    <canvas id="canvas" style="width: 100%; height: 100%"></canvas>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';
import { init } from './oasis/index';

@Component({
  components: {},
})
export default class App extends Vue {
  engine;
  created () {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  data () {
    return {
      obj: {
        score: 0
      }
    }
  }
  mounted () {
    init(this.obj);
  }
}
</script>

<style lang="less">
.tip {
  position: absolute;
  top: 0;
  left: 0;
  color: white;
}
.app {
  width: 100vw;
  height: 100vh;
}
body {
  margin: 0;
}
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
