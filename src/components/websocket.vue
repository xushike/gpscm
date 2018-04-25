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
      this.initLine();

      // setTimeout(() => {
      //   this.dynamicLine();
      // }, 1000);

      this.createWebSocket();
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
      var bounds = null;
      var linesPoints = null;
      var spoi1 = new BMap.Point(104.07735687816667, 30.405355551333333); // 起点1
      var spoi2 = new BMap.Point(104.07735687816667, 30.405355551333333); // 起点2
      var epoi = new BMap.Point(104.07735687816669, 30.405355551333334); // 终点
      var myIcon = new BMap.Icon(
        "http://lbsyun.baidu.com/jsdemo/img/Mario.png",
        new BMap.Size(32, 70),
        { imageOffset: new BMap.Size(0, 0) }
      );

      var points = []; //原始坐标数组
      var bPoints = []; //转换过后的坐标数组

      //定义全局变量
      window.map = map; //将map变量存储在全局
      window.bounds = bounds;
      window.linesPoints = linesPoints;
      window.spoi1 = spoi1;
      window.spoi2 = spoi2;
      window.epoi = epoi;
      window.myIcon = myIcon;
      window.points = points;
      window.bPoints = bPoints;

      map.centerAndZoom(new BMap.Point(104.087744, 30.408908)); //设定地图的中心点和坐标
      map.setMaxZoom(19)//设置地图最大级别
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
    //初始化线路
    initLine() {
      bounds = new Array();
      linesPoints = new Array();
      map.clearOverlays(); // 清空覆盖物
      var driving3 = new BMap.DrivingRoute(map, {
        onSearchComplete: this.drawLine
      }); // 驾车实例,并设置回调
      driving3.search(spoi1, epoi); // 搜索一条线路
      var driving4 = new BMap.DrivingRoute(map, {
        onSearchComplete: this.drawLine
      }); // 驾车实例,并设置回调
      driving4.search(spoi2, epoi); // 搜索一条线路
    },

    //运行
    run() {
      for (var m = 0; m < linesPoints.length; m++) {
        var pts = linesPoints[m];
        var len = pts.length;
        var carMk = new BMap.Marker(pts[0], { icon: myIcon });
        // var polyline = new BMap.Polyline(linesPoints, {
        //   strokeColor: "blue",
        //   strokeWeight: 6,
        //   strokeOpacity: 0.5
        // }); //定义折线
        // map.addOverlay(polyline); //添加折线到地图上
        map.addOverlay(carMk);
        resetMkPoint(1, len, pts, carMk);
      }

      function resetMkPoint(i, len, pts, carMk) {
        carMk.setPosition(pts[i]);
        if (i < len) {
          setTimeout(function() {
            i++;
            resetMkPoint(i, len, pts, carMk);
          }, 100);
        }
      }
    },

    //画线
    drawLine(results) {
      var opacity = 0.45;
      var planObj = results.getPlan(0);
      var b = new Array();
      var addMarkerFun = function(point, imgType, index, title) {
        var url;
        var width;
        var height;
        var myIcon;
        // imgType:1的场合，为起点和终点的图；2的场合为车的图形
        if (imgType == 1) {
          url = "http://lbsyun.baidu.com/jsdemo/img/dest_markers.png";
          width = 42;
          height = 34;
          myIcon = new BMap.Icon(url, new BMap.Size(width, height), {
            offset: new BMap.Size(14, 32),
            imageOffset: new BMap.Size(0, 0 - index * height)
          });
        } else {
          url = "http://lbsyun.baidu.com/jsdemo/img/trans_icons.png";
          width = 22;
          height = 25;
          var d = 25;
          var cha = 0;
          var jia = 0;
          if (index == 2) {
            d = 21;
            cha = 5;
            jia = 1;
          }
          myIcon = new BMap.Icon(url, new BMap.Size(width, d), {
            offset: new BMap.Size(10, 11 + jia),
            imageOffset: new BMap.Size(0, 0 - index * height - cha)
          });
        }

        var marker = new BMap.Marker(point, { icon: myIcon });
        if (title != null && title != "") {
          marker.setTitle(title);
        }
        // 起点和终点放在最上面
        if (imgType == 1) {
          marker.setTop(true);
        }
        map.addOverlay(marker);
      };
      var addPoints = function(points) {
        for (var i = 0; i < points.length; i++) {
          bounds.push(points[i]);
          b.push(points[i]);
        }
      };
      // 绘制驾车步行线路
      for (var i = 0; i < planObj.getNumRoutes(); i++) {
        var route = planObj.getRoute(i);
        if (route.getDistance(false) <= 0) {
          continue;
        }
        addPoints(route.getPath());
        // 驾车线路
        if (route.getRouteType() == BMAP_ROUTE_TYPE_DRIVING) {
          map
            .addOverlay
            // new BMap.Polyline(route.getPath(), {
            //   strokeColor: "#0030ff",
            //   strokeOpacity: opacity,
            //   strokeWeight: 6,
            //   enableMassClear: true
            // })
            ();
        } else {
          // 步行线路有可能为0
          map.addOverlay(
            new BMap.Polyline(route.getPath(), {
              strokeColor: "#30a208",
              strokeOpacity: 0.75,
              strokeWeight: 4,
              enableMassClear: true
            })
          );
        }
      }
      map.setViewport(bounds);
      // 终点
      addMarkerFun(results.getEnd().point, 1, 1);
      // 开始点
      addMarkerFun(results.getStart().point, 1, 0);
      linesPoints[linesPoints.length] = b;
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
      //   points.forEach((point)=>{
      //     linePoints.push(new BMap.Point(point.lng, point.lat));
      //   });

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
      //
      console.log("linePoints:", linePoints);
      map.addOverlay(polyline); //增加折线
    },

    //把传入的点加入到轨迹中
    dynamicLine(poi) {
      var point = JSON.parse(poi);
      //
      console.log("point:",point)
      // var lng = parseFloat(point.longitude) + (Math.random()/100);
      // var lat = parseFloat(point.latitude) + (Math.random()/100);
      var lng = point.longitude; // + Math.random() / 1000;
      var lat = point.latitude;// + Math.random() / 1000;
      // var lng = point.longitude;
      // var lat = point.latitude;
      var id = Math.floor(Math.random() * 1000 + 1);
      var point = { lng: lng, lat: lat, status: 1, id: id };
      var makerPoints = [];
      var newLinePoints = [];
      var len;

      makerPoints.push(point);
      //   addMarker(makerPoints); //增加对应该的轨迹点
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
