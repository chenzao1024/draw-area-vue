// 异步加载高德地图API
export function LoadMap(key = "f63bd35d50f015f05480f5b4ece694fc") {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
    } else {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src =
        "http://webapi.amap.com/maps?v=1.4.15&callback=initAMap&key=" +
        key +
        "&plugin=AMap.Scale,AMap.OverView,AMap.ToolBar,Map3D,AMap.MouseTool,AMap.RectangleEditor,AMap.GraspRoad,AMap.PolyEditor";
      script.onerror = reject;
      document.head.appendChild(script);
    }
    window.initAMap = () => {
      resolve(window.AMap);
    };
  });
}
