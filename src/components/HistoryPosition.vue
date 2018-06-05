<template>
<div>
<div id="history-position"></div>
<button type="button" id="history-button" style="width:100px;height:30px" v-on:click="queryHistoryData">使用历史数据</button>
<span>{{datumMarkState == 1?'基准点已记录':'等待记录基准点'}}</span>
</div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      lushu: null,
      datumMarkState: null //基准点状态,初始值为null，未记录为0，已记录为1,
      // axiosIns: axios.create({
      //   baseURL: "192.168.7.189:9090",
      //   timeout: 1000
      // })
      //http://192.168.7.189:9090/device/gps/record/query?device_id=1&page_index=1&page_size=10
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
      this.createWebSocket(); //创建websocket数据
      // this.createAxios(); //创建axios
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
          mosq.onconnect = function(rc) {
            console.log("CONNACK " + rc);
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
          var url = "ws://222.209.84.37:8080/mqtt";
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
      var map = new BMap.Map("history-position"); //在百度地图容器中创建一个地图
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
        anchor: BMAP_ANCHOR_BOTTOM_LEFT,
                offset:{
          width:15,
          height:70
        },
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
      var lng = poi.longitude + Math.random() / 1000; //使用随机数据
      var lat = poi.latitude + Math.random() / 1000;
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
      setInterval(() => {
        //调用模拟数据
        this.mockLine();
      }, 1000);
    },

    //使用真实数据创建轨迹
    dynamicLine(poi) {
      var poi = JSON.parse(poi);

      console.log("point:", poi);
      //如果是第一次，则设置为中心点
      // if (points.length < 2) {
      //   map.centerAndZoom(new BMap.Point(point.longitude, point.latitude), 18);
      // }

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

    //使用历史数据回放路径
    queryHistoryData() {
      var me = this;
      axios
        .post("api/device/gps/record/query", {
          device_id: 1,
          page_index: 1,
          page_size: 10
        })
        .then(function(res) {
          // console.log(res);
          me.useHistoryData(res.data);
        })
        .catch(function(error) {
          console.log("请求历史数据失败：", error);
        });
    },

    //使用历史数据创建轨迹
    useHistoryData(pois) {
      console.log("point:", pois);
      var lng;
      var lat;

      pois.data.forEach(poi => {
        lng = poi.longitude;
        lat = poi.latitude;
        arrPois.push(new BMap.Point(lng, lat)); //设备使用的实时数据
      });
      console.log("arrPois:", arrPois);
      this.lushu.start(); //路书开始运动
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#history-position {
  width:100%;height:100%;border:#ccc solid 1px;
}
</style>
