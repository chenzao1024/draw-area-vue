<template>
  <div>
    <a-form-model
      layout="inline"
      :model="formInline"
      @submit="handleSubmit"
      @submit.native.prevent
      class="flex-row align-center justify-between px-20"
    >
      <a-form-model-item>
        <a-input v-model="formInline.gz" placeholder="GZ"></a-input>
      </a-form-model-item>
      <a-form-model-item>
        <a-input v-model="formInline.wxyj" placeholder="WXYJ"></a-input>
      </a-form-model-item>
      <a-form-model-item style="margin-right: 0">
        <a-button
          type="primary"
          html-type="submit"
          :disabled="formInline.gz === '' || formInline.wxyj === ''"
        >
          计 算
        </a-button>
      </a-form-model-item>
    </a-form-model>
    <div
      v-for="(data, index) in dataList"
      :key="index"
      class="flex-row align-center justify-between px-20 border-bottom"
    >
      <div class="flex-1 flex-row align-center justify-center p-10">
        {{ data.title }}
      </div>
      <div class="flex-4 flex-row align-center justify-center p-10">
        {{ data.content }}
      </div>
      <div class="flex-1 flex-row align-center justify-center p-10">
        {{ data.shui }}
      </div>
      <div class="flex-1 flex-row align-center justify-center p-10">
        {{ data.wxyj }}
      </div>
      <div class="flex-1 flex-row align-center justify-center p-10">
        {{ data.daoshou }}
      </div>
      <div class="flex-1 flex-row align-center justify-center p-10">
        {{ data.total }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      formInline: {
        gz: "",
        wxyj: "",
      },
      defaultCha: 5000,
      dataList: [],
    };
  },
  mounted() {
    console.log(this._toFixed(186.57499999999993, 3));
  },
  methods: {
    handleSubmit() {
      let tempList = [
        "1月",
        "2月",
        "3月",
        "4月",
        "5月",
        "6月",
        "7月",
        "8月",
        "9月",
        "10月",
        "11月",
        "12月",
        "合计",
      ];
      let tempTotal = 0;
      let tempTotalShui = 0;
      let tempTotalDaoshou = 0;
      this.formInline.gz = parseFloat(this.formInline.gz);
      this.formInline.wxyj = parseFloat(this.formInline.wxyj);
      console.log(this.formInline);
      tempList.forEach((item, index) => {
        let content = "";
        let shui = 0;
        let daoshou = 0;
        let wxyj = parseFloat(this.formInline.wxyj);
        let total = parseFloat(this.formInline.gz);
        tempTotal +=
          this.formInline.gz - this.defaultCha - this.formInline.wxyj;
        if (index !== tempList.length - 1) {
          if (tempTotal <= 36000) {
            content = `(${this.formInline.gz} * ${index + 1} - ${
              this.defaultCha
            } * ${index + 1} - ${this.formInline.wxyj} * ${
              index + 1
            }) * 3% - ${this._toFixed(tempTotalShui, 2)}`;
            // 税
            shui = this._toFixed(
              this._toFixed(
                (this.formInline.gz * (index + 1) -
                  this.defaultCha * (index + 1) -
                  this.formInline.wxyj * (index + 1)) *
                  0.03 -
                  tempTotalShui,
                3
              ),
              2
            );
            tempTotalShui += shui;
            // 到手工资
            daoshou = this._toFixed(
              this.formInline.gz - this.formInline.wxyj - shui,
              2
            );
            tempTotalDaoshou += daoshou;
          } else if (tempTotal > 36000 && tempTotal <= 144000) {
            content = `(${this.formInline.gz} * ${index + 1} - ${
              this.defaultCha
            } * ${index + 1} - ${this.formInline.wxyj} * ${
              index + 1
            }) * 10% - 2520 - ${this._toFixed(tempTotalShui, 2)}`;
            shui = this._toFixed(
              this._toFixed(
                (this.formInline.gz * (index + 1) -
                  this.defaultCha * (index + 1) -
                  this.formInline.wxyj * (index + 1)) *
                  0.1 -
                  2520 -
                  tempTotalShui,
                3
              ),
              2
            );
            tempTotalShui += shui;
            // 到手工资
            daoshou = this._toFixed(
              this.formInline.gz - this.formInline.wxyj - shui,
              2
            );
            tempTotalDaoshou += daoshou;
          } else {
            content = `(${this.formInline.gz} * ${index + 1} - ${
              this.defaultCha
            } * ${index + 1} - ${this.formInline.wxyj} * ${
              index + 1
            }) * 20% - 16920 - ${this._toFixed(tempTotalShui, 2)}`;
            shui = this._toFixed(
              this._toFixed(
                (this.formInline.gz * (index + 1) -
                  this.defaultCha * (index + 1) -
                  this.formInline.wxyj * (index + 1)) *
                  0.2 -
                  16920 -
                  tempTotalShui,
                3
              ),
              2
            );
            tempTotalShui += shui;
            // 到手工资
            daoshou = this._toFixed(
              this.formInline.gz - this.formInline.wxyj - shui,
              2
            );
            tempTotalDaoshou += daoshou;
          }
        } else {
          shui = tempTotalShui;
          daoshou = tempTotalDaoshou;
          wxyj = wxyj * 12;
          total = total * 12;
        }
        let info = {
          title: item,
          content: content,
          shui: this._toFixed(shui, 2),
          wxyj: this._toFixed(wxyj, 2),
          daoshou: this._toFixed(daoshou, 2),
          total: this._toFixed(total, 2),
        };
        this.dataList.push(info);
      });
      console.log(this.dataList);
    },
    _toFixed(num, s) {
      var times = Math.pow(10, s);
      var des = num * times + 0.5;
      des = parseInt(des, 10) / times;
      return des;
    },
  },
};
</script>

<style scoped></style>
