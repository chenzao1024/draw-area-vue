<template>
  <div class="width-100">
    <div class="view-container flex-column p-20">
      <div class="flex align-center p-10">
        <div>经纬度转 GeoJson：</div>
        <input
          type="text"
          v-model="title"
          class="name mx-20"
          placeholder="请输入区域名称"
        />
        <input
          type="text"
          v-model="center"
          class="name mr-20"
          placeholder="请输入区域中心点经纬度"
        />
        <input
          type="text"
          v-model="lnglats"
          class="name mr-20"
          placeholder="请输入区域经纬度范围"
        />
        <input
          type="button"
          class="button"
          value="确定生成"
          @click="onCreateGeoJson"
        />
      </div>
      <div class="flex align-center p-10">
        <div>GeoJson 转经纬度：</div>
        <div class="flex align-center p-10 upload-parent">
          <a-upload
            :file-list="fileList"
            :remove="handleRemove"
            :before-upload="beforeUpload"
            :multiple="true"
          >
            <a-button> <a-icon type="upload" /> 选择GeoJson文件 </a-button>
          </a-upload>
        </div>
        <input
          type="button"
          class="button"
          value="确定生成"
          @click="onCreateLngLatJson"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: "",
      center: "",
      lnglats: "",
      fileList: [],
      lngLatResultList: [],
    };
  },
  methods: {
    handleRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
    },
    beforeUpload(file) {
      this.fileList = [...this.fileList, file];
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        let areaGeoJson = JSON.parse(e.target.result);
        // console.log(areaGeoJson)
        // this._test(areaGeoJson)
        this.lngLatResultList.push(
          this._getLocationParamByGeoJson(areaGeoJson)
        );
      };
      return false;
    },
    onCreateLngLatJson() {
      // console.log(this.lngLatResultList);
      this.lngLatResultList.forEach((result, index) => {
        setTimeout(
          () => {
            this._downLoadFile(result, result.name, "json");
          },
          index * 1000,
          index
        );
      });
    },
    _test(dataList) {
      let fileList = [];
      dataList.forEach((item) => {
        let geoJson = {
          type: "FeatureCollection",
          name: item.name,
          crs: {
            type: "name",
            properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
          },
          center: item.center,
          features: [
            {
              type: "Feature",
              properties: {
                id: this._randomNum(1, 10000),
                name: item.name,
              },
              geometry: {
                type: "MultiPolygon",
                coordinates: [item.locationList],
              },
            },
          ],
        };
        fileList.push(geoJson);
      });
      fileList.forEach((item, index) => {
        setTimeout(
          () => {
            this._downLoadFile(item, item.name, "geojson");
          },
          index * 1000,
          index
        );
      });
    },
    _getLocationParamByGeoJson(areaGeoJson) {
      let name = areaGeoJson.name;
      let center = areaGeoJson.center;
      let tempLngLatListList = [];
      console.log(areaGeoJson.features[0]);
      if (areaGeoJson.features[0].geometry.coordinates.length > 0) {
        areaGeoJson.features[0].geometry.coordinates[0].forEach(
          (locationList) => {
            let tempLngLatList = [];
            locationList.forEach((location) => {
              let lnglat = location.join(",");
              tempLngLatList.push(lnglat);
            });
            let lnglatStr = tempLngLatList.join(";");
            tempLngLatListList.push(lnglatStr);
          }
        );
        let lnglatStrStr = tempLngLatListList.join("#");
        return {
          name,
          center,
          lnglatStrStr,
        };
      } else {
        return {
          name: "geoJson格式错误",
          center: "geoJson格式错误",
          lnglatStrStr: "geoJson格式错误",
        };
      }
    },
    onCreateGeoJson() {
      if (!this._checkParams()) return;
      let tempLocationListList = this.lnglats.split("#");
      let locationListList = [];
      tempLocationListList.forEach((lnglatStr) => {
        let locationList = [];
        let tempLocationList = lnglatStr.split(";");
        tempLocationList.forEach((lnglat) => {
          let tempLocation = lnglat.split(",");
          locationList.push([
            parseFloat(tempLocation[0]),
            parseFloat(tempLocation[1]),
          ]);
        });
        locationListList.push(locationList);
      });

      let geoJson = {
        type: "FeatureCollection",
        name: this.title,
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" },
        },
        center: this.center,
        features: [
          {
            type: "Feature",
            properties: {
              id: this._randomNum(1, 10000),
              name: this.title,
            },
            geometry: {
              type: "MultiPolygon",
              coordinates: [locationListList],
            },
          },
        ],
      };
      this._downLoadFile(geoJson, this.title, "geojson");
    },
    _downLoadFile(geojsonResult, name, type) {
      // 处理数据为 geojson
      let data = new Blob([JSON.stringify(geojsonResult)], {
        type: "text/plain;charset=UTF-8",
      });
      let downloadUrl = window.URL.createObjectURL(data);
      let anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${name}.${type}`;
      anchor.click();
      window.URL.revokeObjectURL(data);
    },
    _checkParams() {
      if (!this.title) {
        this.$message.error("请输入区域名称");
        return false;
      }
      if (!this.center) {
        this.$message.error("请输入区域中心点经纬度，用英文逗号拼接");
        return false;
      }
      if (this.center.indexOf(",") === -1) {
        this.$message.error("中心点经纬度，用英文逗号拼接");
        return false;
      }
      if (!this.lnglats) {
        this.$message.error("请输入区域坐标范围");
        return false;
      }
      return true;
    },
    _randomNum(lower, upper) {
      return Math.floor(Math.random() * (upper - lower)) + lower;
    },
  },
};
</script>

<style scoped></style>
