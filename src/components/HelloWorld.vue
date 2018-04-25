<template>
<div>
<div style="width:100%;height:700px;border:#ccc solid 1px;" id="allmap"></div>
<button type="button" id="connect-button" style="width:100px;height:30px">connect</button>
<button type="button" id="subscribe-button" style="width:100px;height:30px">subscribe</button>
<button type="button" id="unsubscribe-button" style="width:100px;height:30px">unsubscribe</button>
<button type="button" id="disconnect-button" style="width:100px;height:30px">disconnect</button>
<!-- <button type="button" id="lushu-start-button" style="width:100px;height:30px">lushu-start</button> -->


</div>
</template>

<script>
export default {
  data() {
    return {
      lushu: null
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.createMap(); //创建地图
      this.setMapEvent(); //设置地图事件
      this.addMapControl(); //向地图添加控件
      this.createLushu(); //创建路书

      // this.createWebSocket(); //使用真实数据

      setInterval(() => {
        //调用模拟数据
        this.dynamicLine(null);
      }, 1000);
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
            // self.lushu.start();
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
      map.setMaxZoom(17); //设置地图最大级别
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
      // var lushu;
      var arrPois = [
        new BMap.Point(104.08807303102084, 30.41191202970669),
        new BMap.Point(104.0954077657928, 30.415821021062357)
      ];
      window.arrPois = arrPois;
      map.setViewport(arrPois);

      this.lushu = new BMapLib.LuShu(map, arrPois, {
        defaultContent: "设备",
        autoView: true, //是否开启自动视野调整，如果开启那么路书在运动过程中会根据视野自动调整
        icon: new BMap.Icon(
          "http://lbsyun.baidu.com/jsdemo/img/car.png",
          new BMap.Size(52, 26),
          { anchor: new BMap.Size(27, 13) }
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
          `me.i:${me.i}   me.len:${len}   me._fromPause:${me._fromPause}`
        );
        if (me._moving) {
          return;
        }
        if (me.i && me.i < len - 1) {
          me._moving = true;
          me._moveNext(me.i);
        } else {
          //第一次点击开始，或者点了stop之后点开始
          me._addMarker();
          //等待marker动画完毕再加载infowindow
          me._moving = true;
          me._timeoutFlag = setTimeout(function() {
            me._addInfoWin();
            me._moveNext(me.i);
          }, 400);
        }
        //重置状态
        this._fromPause = false;
        this._fromStop = false;
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

      // /**
      //  * 移动设备
      //  * @param {Number} poi 当前的步长.
      //  * @param {Point} initPos 经纬度坐标初始点.
      //  * @param {Point} targetPos 经纬度坐标目标点.
      //  * @param {Function} effect 缓动效果.
      //  * @return 无返回值.
      //  */
      // BMapLib.LuShu.prototype._move = function(initPos, targetPos, effect) {
      //   // var pointsArr = [initPos, targetPos]; //点数组
      //   var me = this,
      //     //当前的帧数
      //     currentCount = 0,
      //     //步长，米/秒
      //     timer = 10,
      //     step = this._opts.speed / (1000 / timer),
      //     //初始坐标
      //     initPos = this._projection.lngLatToPoint(initPos),
      //     //获取结束点的(x,y)坐标
      //     targetPos = this._projection.lngLatToPoint(targetPos),
      //     //总的步长
      //     count = Math.round(me._getDistance(initPos, targetPos) / step);
      //   // 自定义画线
      //   // this._map.addOverlay(
      //   //   new BMap.Polyline(pointsArr, {
      //   //     strokeColor: "#111",
      //   //     strokeWeight: 5,
      //   //     strokeOpacity: 0.5
      //   //   })
      //   // );

      //   //如果小于1直接移动到下一点
      //   if (count < 1) {
      //     me._moveNext(++me.i);
      //     return;
      //   }
      //   //两点之间匀速移动
      //   me._intervalFlag = setInterval(function() {
      //     //两点之间当前帧数大于总帧数的时候，则说明已经完成移动
      //     if (currentCount >= count) {
      //       clearInterval(me._intervalFlag);
      //       //移动的点已经超过总的长度
      //       if (me.i > me._path.length) {
      //         return;
      //       }
      //       //运行下一个点
      //       me._moveNext(++me.i);
      //     } else {
      //       //正在移动
      //       currentCount++;
      //       var x = effect(initPos.x, targetPos.x, currentCount, count),
      //         y = effect(initPos.y, targetPos.y, currentCount, count),
      //         pos = me._projection.pointToLngLat(new BMap.Pixel(x, y));
      //       //设置marker
      //       me._marker.setPosition(pos);
      //       //设置自定义overlay的位置
      //       me._setInfoWin(pos);
      //     }
      //   }, timer);
      // };

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

    //把传入的点加入到轨迹中
    dynamicLine(poi) {
      var point = poi
        ? JSON.parse(poi)
        : { longitude: 104.087744, latitude: 30.408908 };
      //如果是第一次，则设置为中心点
      // if (points.length < 2) {
      //   map.centerAndZoom(new BMap.Point(point.longitude, point.latitude), 18);
      // }

      // var lng = parseFloat(point.longitude) + (Math.random()/100);
      // var lat = parseFloat(point.latitude) + (Math.random()/100);
      var lng = point.longitude + Math.random() / 100; //使用随机数据
      var lat = point.latitude + Math.random() / 100;
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
      map.setViewport(points);
      bPoints.push(new BMap.Point(lng, lat));
      arrPois.push(new BMap.Point(lng, lat)); //设备使用的实时数据

      newLinePoints = points.slice(-2); //最后两个点用来画线。

      // this.addLine(newLinePoints); //增加轨迹线
      this.lushu.start(); //路书开始运动(如果处于移动状态就不用管)
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
