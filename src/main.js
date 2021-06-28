import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { message, Upload, Button, Icon, Form, Input, FormModel , Table} from "ant-design-vue";
import "@/assets/common.css";

Vue.config.productionTip = false;
Vue.prototype.$message = message;


Vue.use(Table);
Vue.use(FormModel);
Vue.use(Input);
Vue.use(Form);
Vue.use(Upload);
Vue.use(Button);
Vue.use(Icon);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
