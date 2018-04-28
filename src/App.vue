<template>
  <div id="app">
    <div class="div" @mouseenter="showall()" @mouseleave="showaleave()">
      <button class="btn" >主菜单</button>
      <div  class="cascader" v-show="show">
        <div class="cascader-panel" v-show="show">
          <ul>
            <li @click="routerTo('/')">实时定位</li>
            <li @click="routerTo('/history')">路径回放</li>
          </ul>
        </div>
      </div>
    </div>
    <router-view id="content"/>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      show: false
    };
  },
  methods: {
    showall() {
      this.show = true;
    },
    showaleave() {
      this.show = false;
    },
    //路由跳转
    routerTo(path) {
      this.$router.push(path);
    }
  }
};
</script>

<style>
.btn,
.div {
  width: 100px;
}
#content {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.cascader {
  position: absolute;
  height: 100%;
  background-color: #eee;
  top: 33px;
  left: 0;
  z-index: 10;
}

.cascader-panel {
  display: flex;
  height: 100%;
}
.isactive {
  color: blue;
}
li {
  width: 120px;
  cursor: pointer;
}
</style>
