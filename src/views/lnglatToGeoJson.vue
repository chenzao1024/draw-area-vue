<template>
  <div class="width-100">
    <div
      class="view-container flex-column p-20"
      style="width: 50%; max-width: 600px"
    >
      <div class="flex align-center p-10">
        <input
          type="text"
          v-model="title"
          class="name mr-20"
          placeholder="请输入区域名称"
        />
        <input
          type="text"
          v-model="center"
          class="name mr-20"
          placeholder="请输入区域中心点经纬度"
        />
      </div>
      <div class="flex align-center p-10">
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
    };
  },
  methods: {
    onCreateGeoJson() {
      if (!this._checkParams()) return;
      let locationList = [];
      let tempLocationList = this.lnglats.split(";");
      tempLocationList.forEach((lnglatStr) => {
        let tempLocation = lnglatStr.split(",");
        locationList.push(tempLocation);
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
              coordinates: [[locationList]],
            },
          },
        ],
      };
      this._downLoadFile(geoJson);
    },
    _downLoadFile(geojsonResult) {
      // 处理数据为 geojson
      let data = new Blob([JSON.stringify(geojsonResult)], {
        type: "text/plain;charset=UTF-8",
      });
      let downloadUrl = window.URL.createObjectURL(data);
      let anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = this.title + ".geojson";
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
