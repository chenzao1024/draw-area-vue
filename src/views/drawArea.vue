<template>
  <div class="width-100">
    <div id="drawAreaMap" style="width: 100%; height: 100vh"></div>
    <div
      class="view-container flex-column p-20"
      style="width: 50%; max-width: 600px"
    >
      <div class="flex align-center p-10">
        <span class="bg-white text-3">地图中心点：</span>
        <input type="text" v-model="mapName" class="name mr-20" />
        <input type="text" v-model="mapCenter" class="name mr-20" />
        <input
          type="button"
          class="button"
          value="确定变更"
          @click="onDrawParentArea()"
        />
      </div>
      <div class="flex align-center p-10 width-100 upload-parent">
        <a-upload
          :file-list="fileList"
          :remove="handleRemove"
          :before-upload="beforeUpload"
        >
          <a-button>
            <a-icon type="upload" /> 选择GeoJson文件，进行导入父级范围
          </a-button>
        </a-upload>
      </div>
      <div class="flex align-center p-10">
        <input
          type="button"
          class="button"
          value="增加新的片区"
          @click="onAddLine"
        />
        <input
          type="button"
          class="button mx-20"
          value="在当前片区继续增加范围"
          @click="onContinueLine"
        />
      </div>
      <div class="flex align-center p-10">
        <input
          type="text"
          v-model="currentCenterText"
          class="name mr-20"
          placeholder="请输入区域名称"
          id="centerText"
        />
        <input
          type="button"
          class="button"
          value="添加区域中心点文字"
          @click="onAddMarker(currentCenterText)"
        />
        <input
          type="button"
          class="button mx-20"
          value="完成绘制"
          @click="onEndEditor"
        />
        <input
          type="button"
          class="button"
          value="下载文件"
          @click="onDownloadFile"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { LoadMap } from "../utils/asyncLoadMapJs.js";

let AMap;

export default {
  data() {
    return {
      selectedArea: {
        name: "西安市",
        oldAreaId: "d27b7f863ff24baf834ca8249030f54f",
        areaId: "1287688695362895873",
        lat: 34.343147,
        lng: 108.939621,
      },
      mapName: "",
      mapCenter: "",
      parentAreaStr: "",
      currentPolyline: null,
      currentPolyEditor: null,
      currentPolyText: null,
      currentCenterText: "",
      currentCenterLngLatStr: "",
      outputList: [],
      fileList: [],
      currentBgPolyline: null,
      currentBgPolyEditor: null,
      currentBgPolyText: null,
      outputBgList: [],
      currentBgCenterLngLatStr: "",
      currentBgCenterText: "",
      currentBgGeoJson: null,
      bgPolyLineList: [],
      bgPolyTextList: [],
    };
  },
  mounted() {
    LoadMap().then((aMap) => {
      AMap = aMap;
      this.initMap();
    });
  },
  methods: {
    initMap() {
      this.map = new AMap.Map("drawAreaMap", {
        center: [this.selectedArea.lng, this.selectedArea.lat],
        zIndex: 99,
        resizeEnable: true,
        zoom: 10,
        zooms: [11, 18],
      });
    },
    // 根据输入情况修改地图中心点位置
    onDrawParentArea() {
      this.selectedArea.name = this.mapName;
      this.selectedArea.lng = parseFloat(this.mapCenter.split(",")[0]);
      this.selectedArea.lat = parseFloat(this.mapCenter.split(",")[1]);
      this.map.setCenter([this.selectedArea.lng, this.selectedArea.lat]);
    },
    // 添加默认范围方块
    onAddLine() {
      if (this.currentPolyEditor || this.currentBgPolyEditor) {
        this.$message.error("当前有正在编辑的区域未结束");
        return;
      }
      let path = [
        [this.selectedArea.lng - 0.005, this.selectedArea.lat - 0.005],
        [this.selectedArea.lng + 0.005, this.selectedArea.lat - 0.005],
        [this.selectedArea.lng + 0.005, this.selectedArea.lat + 0.005],
        [this.selectedArea.lng - 0.005, this.selectedArea.lat + 0.005],
      ];

      this.currentPolyline = new AMap.Polygon({
        path: [path],
        isOutline: false,
        outlineColor: "#ffeeff",
        borderWeight: 2,
        strokeColor: "#3366FF",
        strokeOpacity: 1,
        strokeWeight: 4,
        fillOpacity: 0.2,
        fillColor: "#1791fc",
        strokeStyle: "solid",
        strokeDasharray: [10, 5],
        lineJoin: "round",
        lineCap: "round",
        zIndex: 50,
      });
      this.currentPolyline.setMap(this.map);
      this.currentPolyline.on("rightclick", (event) => {
        if (this.currentPolyEditor) {
          this.$message.error("当前有正在编辑的Line，请先完成绘制");
          return;
        }

        // 更新绘制
        this.currentPolyline = event.target;
        let extData = this.currentPolyline.getExtData();
        for (let i = 0; i < this.outputList.length; i++) {
          if (extData.name === this.outputList[i].name) {
            this.currentCenterLngLatStr = this.outputList[i].center;
            this.currentCenterText = this.outputList[i].name;
            break;
          }
        }

        this.currentPolyEditor = new AMap.PolyEditor(
          this.map,
          this.currentPolyline
        );
        this.currentPolyEditor.open();
        this.currentPolyEditor.on("end", (event) => {
          let locationListList = event.target.Ce.path;
          let tempLocationListList = [];
          locationListList.forEach((locationList) => {
            let tempLocationList = [];
            locationList.forEach((location) => {
              tempLocationList.push([location.lng, location.lat]);
            });
            tempLocationListList.push(tempLocationList);
          });

          // 更新到output数组中
          let extData = this.currentPolyline.getExtData();
          for (let i = 0; i < this.outputList.length; i++) {
            if (extData.name === this.outputList[i].name) {
              this.outputList[i].locationList = tempLocationListList;
              this.outputList[i].center = this.currentCenterLngLatStr;
              this.outputList[i].name = this.currentCenterText;
              // 更新 ExtData
              this.currentPolyline.setExtData({ name: this.currentCenterText });
              break;
            }
          }

          // 重置 current 数据
          this._resetCurrent();
        });
      });
      // 缩放地图到合适的视野级别
      this.map.setFitView([this.currentPolyline]);

      // 开始绘制
      this.currentPolyEditor = new AMap.PolyEditor(
        this.map,
        this.currentPolyline
      );
      this.currentPolyEditor.on("end", (event) => {
        // 1. 计算数据
        this.currentPolyline.setExtData({ name: this.currentCenterText });
        let locationListList = event.target.Ce.path;
        let tempLocationListList = [];
        locationListList.forEach((locationList) => {
          let tempLocationList = [];
          locationList.forEach((location) => {
            tempLocationList.push([location.lng, location.lat]);
          });
          tempLocationListList.push(tempLocationList);
        });

        // 2. 添加到output数组中
        let info = {
          name: this.currentCenterText,
          center: this.currentCenterLngLatStr,
          locationList: tempLocationListList,
        };
        this.outputList.push(info);

        // 3. 重置 current 数据
        this._resetCurrent();
      });
      this.currentPolyEditor.open();
    },
    _randomNum(lower, upper) {
      return Math.floor(Math.random() * (upper - lower)) + lower;
    },
    // 在当前片区的基础上增加范围
    onContinueLine() {
      if (!this.currentPolyEditor && !this.currentBgPolyEditor) {
        this.$message.error("当前没有正在编辑的区域");
        return;
      }
      if (this.currentBgPolyEditor) {
        this.$message.error("暂不支持给背景区域增加范围");
        return;
      }

      let path = [
        [this.selectedArea.lng - 0.005, this.selectedArea.lat - 0.005],
        [this.selectedArea.lng + 0.005, this.selectedArea.lat - 0.005],
        [this.selectedArea.lng + 0.005, this.selectedArea.lat + 0.005],
        [this.selectedArea.lng - 0.005, this.selectedArea.lat + 0.005],
      ];
      let tempPathListList = [];
      this.currentPolyline.Ce.path.forEach((pathList) => {
        let tempPathList = [];
        pathList.forEach((path) => {
          tempPathList.push([path.lng, path.lat]);
        });
        tempPathListList.push(tempPathList);
      });
      tempPathListList.push(path);
      this.currentPolyline.setPath(tempPathListList);
      this.currentPolyline.setMap(this.map);
    },
    // 添加大头针
    onAddMarker(name) {
      if (!this.selectedArea) return;
      if (name === "") {
        this.$message.error("请填写区域名称");
        return;
      }
      if (this.currentBgCenterLngLatStr || this.currentCenterLngLatStr) {
        this.$message.error("当前有正在添加的中心点区域未结束");
        return;
      }
      if (!this.currentBgPolyEditor && !this.currentPolyEditor) {
        this.$message.error("只能在编辑区域增加中心点");
        return;
      }

      this.currentPolyText = new AMap.Text({
        text: name,
        anchor: "center", // 设置文本标记锚点
        zIndex: 200,
        draggable: true,
        cursor: "pointer",
        angle: 10,
        style: {
          background: "#312ddc",
          color: "#fff",
          "font-size": "10px",
          "line-height": "1.4",
          border: "0",
        },
        raiseOnDrag: true,
        position: [
          parseFloat(this.selectedArea.lng),
          parseFloat(this.selectedArea.lat),
        ],
      });
      this.currentPolyText.setMap(this.map);
      this.currentCenterLngLatStr =
        this.selectedArea.lng + "," + this.selectedArea.lat;

      this.currentPolyText.on("rightclick", (event) => {
        if (!this.currentPolyEditor) {
          this.$message.error("请先打开编辑范围，才能编辑描述");
          return;
        }
        this.currentPolyText = event.target;
        this.currentPolyText.setText(this.currentCenterText);
        // this.currentPolyText.setText(event.target.Ce.text)
        this.currentPolyText.setDraggable(true);
      });

      AMap.event.addListener(this.currentPolyText, "dragend", () => {
        this.currentCenterLngLatStr =
          this.currentPolyText.getPosition().lng +
          "," +
          this.currentPolyText.getPosition().lat;
        // console.log("结束" + this.currentCenterLngLatStr + e);
      });
    },
    // 监听完成绘制按钮点击
    onEndEditor() {
      if (this.currentPolyEditor) {
        // 1. 判断是否已经填写了区域名称
        if (!this.currentCenterLngLatStr) {
          this.$message.error("请填写区域名称, 并点击添加中心点");
          return;
        }
        this.currentPolyEditor.close();
        // setTimeout(() => {
        //   this._resetCurrent();
        // }, 1000);
      } else if (this.currentBgPolyEditor) {
        this.currentBgPolyEditor.close();
        // setTimeout(() => {
        //   this._resetCurrentBg();
        // }, 1000);
      }
    },
    // 监听下载文件按钮点击
    onDownloadFile() {
      if (this.currentPolyEditor || this.currentBgPolyEditor) {
        this.$message.error("当前有正在编辑的范围未结束，无法下载文件");
        return;
      }

      this.outputList.forEach((areaInfo) => {
        // 处理数据为 geojson
        let geojsonResult = this._changeResultToGeoJson(areaInfo);
        let data = new Blob([JSON.stringify(geojsonResult)], {
          type: "text/plain;charset=UTF-8",
        });
        let downloadUrl = window.URL.createObjectURL(data);
        let anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = areaInfo.name + ".geojson";
        anchor.click();
        window.URL.revokeObjectURL(data);
      });

      this.outputBgList.forEach((areaInfo) => {
        // 背景范围肯定是 geojson 格式 areaInfo.geojson
        let data = new Blob([JSON.stringify(areaInfo.geojson)], {
          type: "text/plain;charset=UTF-8",
        });
        let downloadUrl = window.URL.createObjectURL(data);
        let anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = areaInfo.name + ".geojson";
        anchor.click();
        window.URL.revokeObjectURL(data);
      });
    },
    // 将下载的结果转换成 geojson
    _changeResultToGeoJson(areaInfo) {
      return {
        type: "FeatureCollection",
        name: areaInfo.name,
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
        },
        center: areaInfo.center,
        features: [
          {
            type: "Feature",
            properties: {
              id: this._randomNum(1, 10000),
              name: areaInfo.name,
            },
            geometry: {
              type: "MultiPolygon",
              coordinates: [areaInfo.locationList],
            },
          },
        ],
      };
    },
    handleRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
      this.map.remove(this.bgPolyLineList[index]);
      this.map.remove(this.bgPolyTextList[index]);
      this.bgPolyLineList.splice(index, 1);
      this.bgPolyTextList.splice(index, 1);
      this.outputBgList.splice(index, 1);
      // this.map.clearMap();
    },
    beforeUpload(file) {
      this.fileList = [...this.fileList, file];
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        let areaGeoJson = JSON.parse(e.target.result);

        this.selectedArea.name = areaGeoJson.name;
        // 设置地图中心点位置
        if (areaGeoJson.center) {
          this.selectedArea.lng = parseFloat(areaGeoJson.center.split(",")[0]);
          this.selectedArea.lat = parseFloat(areaGeoJson.center.split(",")[1]);
        } else {
          this.selectedArea.lng =
            parseFloat(
              areaGeoJson.features[0].geometry.coordinates[0][0][0][0]
            ) || this.selectedArea.lng;
          this.selectedArea.lat =
            parseFloat(
              areaGeoJson.features[0].geometry.coordinates[0][0][0][1]
            ) || this.selectedArea.lat;
          areaGeoJson.center = `${this.selectedArea.lng},${this.selectedArea.lat}`;
        }

        // 绘制GeoJson范围
        this._drawGeoJsonFileMapPolygonByLine(areaGeoJson);
      };
      return false;
    },
    _drawGeoJsonFileMapPolygonByLine(geoJson) {
      if (geoJson) {
        this._drawGeoJsonAreaMap(geoJson);
      }
    },
    _drawGeoJsonLinkMapPolygonByLine(geoJsonLink) {
      if (geoJsonLink) {
        this.$http
          .get(geoJsonLink)
          .then(({ data: getJson }) => {
            this._drawGeoJsonAreaMap(getJson);
          })
          .catch(() => {});
      }
    },
    // real 绘制 geoJson 区域
    _drawGeoJsonAreaMap(geoJson) {
      if (geoJson.features[0].geometry.coordinates.length !== 1) {
        this.$message.error("该GeoJson文件暂不支持");
        return;
      }

      let strokeColor = "#312ddc";
      let fillcolor = "#152B36";
      let fillOpacity = 0;
      let geoJsonData = new AMap.GeoJSON({
        geoJSON: geoJson,
        getPolygon: (geojson, lnglats) => {
          // 计算面积
          this.currentBgPolyline = new AMap.Polygon({
            path: lnglats,
            strokeColor: strokeColor,
            strokeOpacity: 0.8, // 线透明度
            strokeWeight: 2, // 线宽
            strokeStyle: "dashed",
            fillColor: fillcolor,
            fillOpacity: fillOpacity,
          });

          this.currentBgPolyline.setExtData({
            geojson: geoJson,
            name: geoJson.name,
            center: geoJson.center,
          });

          this.currentBgPolyline.on("rightclick", (event) => {
            if (this.currentPolyEditor || this.currentBgPolyEditor) {
              this.$message.error("当前有正在编辑的Line，请先完成绘制");
              return;
            }

            // 更新绘制
            this.currentBgPolyline = event.target;
            let extData = this.currentBgPolyline.getExtData();
            for (let i = 0; i < this.outputBgList.length; i++) {
              if (extData.name === this.outputBgList[i].name) {
                this.currentBgCenterLngLatStr = this.outputBgList[i].center;
                this.currentBgCenterText = this.outputBgList[i].name;
                this.currentBgGeoJson = this.outputBgList[i].geojson;
                break;
              }
            }

            this.currentBgPolyEditor = new AMap.PolyEditor(
              this.map,
              this.currentBgPolyline
            );
            this.currentBgPolyEditor.open();
            this.currentBgPolyEditor.on("end", (event) => {
              let locationListList = event.target.Ce.path;
              let tempLocationListList = [];
              locationListList.forEach((locationList) => {
                let tempLocationList = [];
                locationList.forEach((location) => {
                  tempLocationList.push([location.lng, location.lat]);
                });
                tempLocationListList.push(tempLocationList);
              });
              // 更新到output数组中
              let extData = this.currentBgPolyline.getExtData();
              for (let i = 0; i < this.outputBgList.length; i++) {
                if (extData.name === this.outputBgList[i].name) {
                  this.outputBgList[
                    i
                  ].geojson.features[0].geometry.coordinates = [
                    tempLocationListList,
                  ];
                  this.outputBgList[i].geojson.center =
                    this.currentBgCenterLngLatStr;
                  this.outputBgList[i].center = this.currentBgCenterLngLatStr;
                  this.outputBgList[i].name = this.currentBgCenterText;
                  break;
                }
              }

              // 重置 currentBg 数据
              this._resetCurrentBg();
            });
          });

          this._drawTextMap(
            geoJson.name,
            parseFloat(geoJson.center.split(",")[0]),
            parseFloat(geoJson.center.split(",")[1])
          );
          this.outputBgList.push({
            geojson: geoJson,
            name: geoJson.name,
            center: geoJson.center,
          });
          return this.currentBgPolyline;
        },
      });
      geoJsonData.setMap(this.map);
      this.map.setFitView();
      this.bgPolyLineList.push(geoJsonData)
    },
    _drawTextMap(areaName, lng, lat) {
      this.currentBgPolyText = new AMap.Text({
        text: areaName,
        anchor: "center", // 设置文本标记锚点
        zIndex: 200,
        draggable: false,
        cursor: "pointer",
        angle: 10,
        style: {
          background: "#312ddc",
          color: "#fff",
          "font-size": "10px",
          "line-height": "1.4",
          border: "0",
        },
        raiseOnDrag: true,
        position: [parseFloat(lng), parseFloat(lat)],
      });

      this.currentBgPolyText.on("rightclick", (event) => {
        if (!this.currentBgPolyEditor) {
          this.$message.error("请先打开编辑范围，才能编辑描述");
          return;
        }
        this.currentBgPolyText = event.target;
        this.currentBgPolyText.setText(this.currentBgCenterText);
        // console.log(this.currentBgPolyText);
        this.currentBgPolyText.setDraggable(true);
      });

      AMap.event.addListener(this.currentBgPolyText, "dragend", () => {
        this.currentBgCenterLngLatStr =
          this.currentBgPolyText.getPosition().lng +
          "," +
          this.currentBgPolyText.getPosition().lat;
        // console.log("结束" + this.currentBgCenterLngLatStr + e);
      });

      this.currentBgPolyText.setMap(this.map);
      this.bgPolyTextList.push(this.currentBgPolyText);
    },
    _resetCurrent() {
      this.currentPolyEditor = null;
      this.currentPolyline = null;
      this.currentPolyText && this.currentPolyText.setDraggable(false);
      this.currentPolyText = null;
      this.currentCenterText = "";
      this.currentCenterLngLatStr = "";
    },
    _resetCurrentBg() {
      this.currentBgPolyEditor = null;
      this.currentBgPolyline = null;
      this.currentBgPolyText && this.currentBgPolyText.setDraggable(false);
      this.currentBgPolyText = null;
      this.currentBgGeoJson = null;
      this.currentBgCenterText = "";
      this.currentBgCenterLngLatStr = "";
    },
  },
};
</script>

<style scoped>
.map_container {
  width: 100%;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 9;
}

a {
  text-decoration: none;
}

.upload-parent > span {
  width: 100%;
}

.view-container {
  position: absolute;
  margin: auto;
  left: 0;
  /*right: 0;*/
  top: 0;
  overflow-y: auto;
}

.el-dropdown {
  vertical-align: top;
}
.el-dropdown + .el-dropdown {
  margin-left: 15px;
}
.el-icon-arrow-down {
  font-size: 12px;
}
</style>
