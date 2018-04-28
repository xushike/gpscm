<template>
<div>
<div style="width:100%;height:700px;border:#ccc solid 1px;" id="allmap"></div>
<button type="button" id="mock-button" style="width:100px;height:30px" v-on:click="useMockData">使用模拟数据</button>
<button type="button" id="real-button" style="width:100px;height:30px" @click="connectWebSocket">使用真实数据</button>
<button type="button" id="datum-mark-button" style="width:100px;height:30px" v-on:click="datumMarkStateChange">记录基准点</button>
<span>{{datumMarkState == 1?'基准点已记录':'等待记录基准点'}}</span>
</div>
</template>

<script>
export default {
  data() {
    return {
      lushu: null,
      datumMarkState: null, //基准点状态,初始值为null，未记录为0，已记录为1,
      timer: null, //定时器编号
      webSocket: null
    };
  },
  mounted() {
    this.initMap();
  },
  beforeDestroy() {
    this.timer && clearInterval(this.timer);
    console.log("this.webSocket.getReadyState():", this.webSocket.mosq.readyState);
    if (this.webSocket.mosq.readyState == 0 || this.webSocket.mosq.readyState == 1) {
      this.webSocket.disconnect();
    }
  },

  methods: {
    initMap() {
      this.createMap(); //创建地图
      this.setMapEvent(); //设置地图事件
      this.addMapControl(); //向地图添加控件

      this.createLushu(); //创建路书
      this.createWebSocket(); //创建websocket数据
    },

    //创建websocket相关的东西
    createWebSocket() {
      var self = this;
      let Main = {};
      window.Main = Main;
      Main.Page = (function() {
        var mosq = null;
        function Page() {
          var _this = this;
          mosq = new Mosquitto();
          //button事件
          // $("#real-button").click(function() {
          //   return _this.connect();
          // });
          $("#disconnect-button").click(function() {
            return _this.disconnect();
          });
          $("#subscribe-button").click(function() {
            return _this.subscribe();
          });
          $("#unsubscribe-button").click(function() {
            return _this.unsubscribe();
          });
          $("#publish-button").click(function() {
            return _this.publish();
          });

          mosq.onconnect = function(rc) {
            console.log("CONNACK " + rc);
            //打印装填
            console.log("websocket mosq:", self.webSocket);
            if (rc == 0) {
              _this.subscribe();
            }
          };
          mosq.ondisconnect = function(rc) {
            console.log("Lost connection");
          };
          mosq.onmessage = (topic, payload, qos) => {
            //触发事件
            self.dynamicLine(payload);
          };
        }
        Page.prototype.connect = function() {
          var url = "ws://192.168.6.231:8080/mqtt";
          //
          console.log("websocket:",self.webSocket.mosq)
          mosq.connect(url);
        };
        Page.prototype.disconnect = function() {
          //
          console.log("enter disconnect method");
          mosq.disconnect();
        };
        Page.prototype.subscribe = function() {
          var topic = "pub/um440/gps";
          mosq.subscribe(topic, 0);
        };
        Page.prototype.unsubscribe = function() {
          var topic = "pub/um440/gps";
          mosq.unsubscribe(topic);
        };

        Page.prototype.publish = function() {
          var topic = "";
          var payload = "";
          mosq.publish(topic, payload, 0);
        };
        // Page.prototype.getReadyState = function() {
        //   return mosq.readyState;
        // };
        return Page;
      })();

      this.webSocket = new Main.Page();
    },

    //创建地图
    createMap() {
      var map = new BMap.Map("allmap"); //在百度地图容器中创建一个地图
      var myIcon = new BMap.Icon(
        "http://lbsyun.baidu.com/jsdemo/img/Mario.png",
        new BMap.Size(32, 70),
        { imageOffset: new BMap.Size(0, 0) }
      );

      var points = []; //原始坐标数组
      var bPoints = []; //转换过后的坐标数组

      //定义全局变量
      window.map = map; //将map变量存储在全局
      window.myIcon = myIcon;
      window.points = points;
      window.bPoints = bPoints;

      map.centerAndZoom(new BMap.Point(104.087744, 30.408908), 19); //设定地图的中心点和坐标
      map.setMaxZoom(19); //设置地图最大级别
    },

    setMapEvent() {
      map.enableDragging(); //启用地图拖拽事件，默认启用(可不写)
      map.enableScrollWheelZoom(); //启用地图滚轮放大缩小
      map.enableDoubleClickZoom(); //启用鼠标双击放大，默认启用(可不写)
      map.enableKeyboard(); //启用键盘上下左右键移动地图
    },

    addMapControl() {
      //向地图中添加缩放控件
      var ctrl_nav = new BMap.NavigationControl({
        anchor: BMAP_ANCHOR_TOP_LEFT,
        type: BMAP_NAVIGATION_CONTROL_LARGE
      });
      map.addControl(ctrl_nav);
      //向地图中添加缩略图控件
      var ctrl_ove = new BMap.OverviewMapControl({
        anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
        isOpen: 1
      });
      map.addControl(ctrl_ove);
      //向地图中添加比例尺控件
      var ctrl_sca = new BMap.ScaleControl({ anchor: BMAP_ANCHOR_BOTTOM_LEFT });
      map.addControl(ctrl_sca);
    },

    //创建路书
    createLushu() {
      // var lushu;
      var arrPois = [];
      window.arrPois = arrPois;
      map.setViewport(arrPois);

      this.lushu = new BMapLib.LuShu(map, arrPois, {
        defaultContent: "设备",
        autoView: true, //是否开启自动视野调整，如果开启那么路书在运动过程中会根据视野自动调整
        icon: new BMap.Icon(
          "http://lbsyun.baidu.com/jsdemo/img/car.png",
          new BMap.Size(52, 26),
          {
            anchor: new BMap.Size(27, 13)
          }
        ),
        speed: 400,
        enableRotation: true, //是否设置marker随着道路的走向进行旋转,
        landmarkPois: []
      });

      /**
       * @description 开始运动
       * @param none
       * @return 无返回值.
       *
       * @example <b>参考示例：</b><br />
       * lushu.start();
       */
      BMapLib.LuShu.prototype.start = function() {
        var me = this;
        var len = me._path.length;
        //不是第一次点击开始,并且小车还没到达终点
        console.log(
          `me.i:${me.i}   me.len:${len}   me._fromPause:${
            me._fromPause
          } me._moving:${me._moving}`
        );
        if (me.i < len - 1 && me._marker) {
          me._moving = true;
          me._moveNext(me.i);
        } else {
          //初始化marker
          me._addMarker();
          //等待marker动画完毕再加载infowindow(未实现)
          me._addInfoWin();
          me._moveNext(me.i);
          // }, 400);
        }
        //重置状态
        this._fromPause = false;
        this._fromStop = false;
      };

      //更新基准点
      BMapLib.LuShu.prototype.updateDatumMark = function(point) {
        var me = this;
        me._datumMark = point;
        me._compareMark = null;
      };

      //更新比较点
      BMapLib.LuShu.prototype.updateCompareMark = function(point) {
        var me = this;
        me._compareMark = point;
      };

      /**
       * 移动到下一个点
       * @param {Number} index 当前点的索引.
       * @return 无返回值.
       */
      BMapLib.LuShu.prototype._moveNext = function(index) {
        var me = this;
        if (index < this._path.length - 1) {
          me._moving = true;
          me._move(me._path[index], me._path[index + 1], me._tween.linear);
        } else {
          me.pause();
          me._moving = false;
        }
      };

      $("#lushu-start-button").click(() => {
        this.lushu.start();
      });
    },

    //添加线
    addLine(points) {
      var linePoints = [];
      var pointsLen = points.length;
      var i;
      var polyline;
      if (points.length == 0) {
        return;
      }

      // 创建标注对象并添加到地图
      for (i = 0; i < pointsLen; i++) {
        linePoints.push(new BMap.Point(points[i].lng, points[i].lat));
      }

      //创建折线
      polyline = new BMap.Polyline(linePoints, {
        strokeColor: "red",
        strokeWeight: 2,
        strokeOpacity: 0.5
      });

      map.addOverlay(polyline); //增加折线
    },

    //使用模拟数据创建轨迹
    mockLine() {
      var poi = { longitude: 104.087744, latitude: 30.408908 };
      //如果是第一次，则设置为中心点
      // if (points.length < 2) {
      //   map.centerAndZoom(new BMap.Point(point.longitude, point.latitude), 18);
      // }

      // var lng = parseFloat(point.longitude) + (Math.random()/100);
      // var lat = parseFloat(point.latitude) + (Math.random()/100);
      var lng = poi.longitude + Math.random() / 1000; //使用随机数据
      var lat = poi.latitude + Math.random() / 1000;
      // var lng = point.longitude;
      // var lat = point.latitude;
      var id = Math.floor(Math.random() * 1000 + 1);
      var point = { lng: lng, lat: lat, status: 1, id: id };
      var newLinePoints = [];
      var len;

      //是否记录基准点
      if (this.datumMarkState == 0) {
        this.lushu.updateDatumMark(new BMap.Point(lng, lat));
        this.datumMarkState = 1;
      } else if (this.datumMarkState == 1) {
        this.lushu.updateCompareMark(new BMap.Point(lng, lat));
      }

      points.push(point);
      map.setViewport(points);
      bPoints.push(new BMap.Point(lng, lat));
      arrPois.push(new BMap.Point(lng, lat)); //设备使用的实时数据

      newLinePoints = points.slice(-2); //最后两个点用来画线。
      this.lushu.start(); //路书开始运动
    },

    useMockData() {
      this.timer = setInterval(() => {
        //调用模拟数据
        this.mockLine();
      }, 1000);

      //
      console.log("this.timer:", this.timer);
    },

    //使用真实数据创建轨迹
    dynamicLine(poi) {
      var poi = JSON.parse(poi);

      //如果是第一次，则设置为中心点
      // if (points.length < 2) {
      //   map.centerAndZoom(new BMap.Point(point.longitude, point.latitude), 18);
      // }

      // var lng = parseFloat(point.longitude) + (Math.random()/100);
      // var lat = parseFloat(point.latitude) + (Math.random()/100);
      // var lng = point.longitude + Math.random() / 1000; //使用随机数据
      // var lat = point.latitude + Math.random() / 1000;
      var lng = poi.longitude;
      var lat = poi.latitude;
      var id = Math.floor(Math.random() * 1000 + 1);
      var point = { lng: lng, lat: lat, status: 1, id: id };
      var newLinePoints = [];
      var len;

      //是否记录基准点
      if (poi.best) {
        if (this.datumMarkState == 0) {
          this.lushu.updateDatumMark(new BMap.Point(lng, lat));
          this.datumMarkState = 1;
        } else if (this.datumMarkState == 1) {
          this.lushu.updateCompareMark(new BMap.Point(lng, lat));
        }
      }

      points.push(point);
      map.setViewport(points);
      bPoints.push(new BMap.Point(lng, lat));
      arrPois.push(new BMap.Point(lng, lat)); //设备使用的实时数据
      newLinePoints = points.slice(-2); //最后两个点用来画线。
      this.lushu.start(); //路书开始运动
    },

    //准备记录基准点
    datumMarkStateChange() {
      this.datumMarkState = 0;
    },

    //连接websocket
    connectWebSocket() {
      this.webSocket && this.webSocket.connect();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
