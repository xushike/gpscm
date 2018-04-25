<template>
<div>
<div style="width:100%;height:700px;border:#ccc solid 1px;" id="allmap"></div>
<button type="button" id="connect-button" style="width:100px;height:30px">connect</button>
<button type="button" id="subscribe-button" style="width:100px;height:30px">subscribe</button>
<button type="button" id="unsubscribe-button" style="width:100px;height:30px">unsubscribe</button>
<button type="button" id="disconnect-button" style="width:100px;height:30px">disconnect</button>
<!-- <button type="button" id="disconnect-button" style="width:100px;height:30px">disconnect</button> -->


</div>
</template>

<script>
export default {
  data() {
    return {};
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.createMap(); //创建地图
      this.setMapEvent(); //设置地图事件
      this.addMapControl(); //向地图添加控件
      // this.createLushu(); //创建路书
      // this.createWebSocket(); //创建websocket
      console.log("enter method 1");
      setTimeout(() => {
        console.log("enter method 2");

        this.dynamicLine(null);
      }, 100);
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
          $("#connect-button").click(function() {
            console.log("enter click method");
            return _this.connect();
          });
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
          };
          mosq.ondisconnect = function(rc) {
            console.log("Lost connection");
          };
          mosq.onmessage = (topic, payload, qos) => {
            //触发事件
            // console.log("PUBLISH " + topic + payload);
            self.dynamicLine(payload);
          };
        }
        Page.prototype.connect = function() {
          var url = "ws://192.168.6.231:8080/mqtt";
          mosq.connect(url);
        };
        Page.prototype.disconnect = function() {
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
        return Page;
      })();

      Main.controller = new Main.Page();
    },

    //创建地图
    createMap() {
      var map = new BMap.Map("allmap"); //在百度地图容器中创建一个地图
      var myIcon = new BMap.Icon(
        "http://lbsyun.baidu.com/jsdemo/img/Mario.png",
        new BMap.Size(32, 70),
        { imageOffset: new BMap.Size(0, 0) }
      );

      var marker = new BMap.Marker(new BMap.Point(104.087744, 30.408908)); // 创建点

      var points = []; //原始坐标数组
      var bPoints = []; //转换过后的坐标数组

      //定义全局变量
      window.map = map; //将map变量存储在全局
      window.myIcon = myIcon;
      window.points = points;
      window.bPoints = bPoints;

      map.centerAndZoom(new BMap.Point(104.087744, 30.408908), 19); //设定地图的中心点和坐标
      map.setMaxZoom(19); //设置地图最大级别
      map.addOverlay(marker); //增加点
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
      var lushu;
      window.lushu = lushu;
      lushu = new BMapLib.LuShu(map, bPoints, {
        defaultContent: "设备内容",
        autoView: true, //是否开启自动视野调整，如果开启那么路书在运动过程中会根据视野自动调整
        icon: new BMap.Icon(
          "http://lbsyun.baidu.com/jsdemo/img/car.png",
          new BMap.Size(52, 26),
          { anchor: new BMap.Size(27, 13) }
        ),
        speed: 4500,
        enableRotation: true //是否设置marker随着道路的走向进行旋转
      });

      // /**
      //  * 小车继续行驶到下一个坐标点
      //  * @return 无返回值.
      //  */

      // LuShu.prototype.goPath = function(path) {
      //   if (!path || path.length < 1) {
      //     return;
      //   }
      //   this._path = path;
      //   this.i = 0;
      //   this._moveNext(this.i);
      // };

      /**
       * 获取小车是否正在运行
       */

      // LuShu.prototype.getMoving = function() {
      //   return this._moving;
      // };

      /**
       * 移动到下一个点
       * @param {Number} index 当前点的索引.
       * @return 无返回值.
       */

      // _moveNext: function(index) {
      //     var me = this;
      //     if (index < this._path.length - 1) {
      //         this._moving=true;
      //         me._move(me._path[index], me._path[index + 1], me._tween.linear);
      //     }else{
      //         this._moving=false;
      //     }
      // } ;
      // lushu.start();
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

    //把传入的点加入到轨迹中
    dynamicLine(poi) {
      //
      console.log("enter method");
      var point = JSON.parse(
        poi || { longitude: 104.087744, latitude: 30.408908 }
      );
      //如果是第一次，则设置为中心点
      if (points.length < 2) {
        map.centerAndZoom(new BMap.Point(point.longitude, point.latitude), 18);
      }

      // var lng = parseFloat(point.longitude) + (Math.random()/100);
      // var lat = parseFloat(point.latitude) + (Math.random()/100);
      var lng = point.longitude + Math.random() / 1000;
      var lat = point.latitude + Math.random() / 1000;
      // var lng = point.longitude;
      // var lat = point.latitude;
      var id = Math.floor(Math.random() * 1000 + 1);
      var point = { lng: lng, lat: lat, status: 1, id: id };
      var makerPoints = [];
      var newLinePoints = [];
      var len;

      makerPoints.push(point);
      //addMarker(makerPoints); //增加对应该的轨迹点
      points.push(point);
      bPoints.push(new BMap.Point(lng, lat));
      newLinePoints = points.slice(-2); //最后两个点用来画线。

      this.addLine(newLinePoints); //增加轨迹线
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
