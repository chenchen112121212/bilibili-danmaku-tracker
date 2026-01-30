function getVideoCid_Bangumi() {
    return String(unsafeWindow.__INITIAL_STATE__.epInfo.cid);
}

function getVideoCid_Cheese() {
    // let episodes = unsafeWindow.PlayerAgent.getEpisodes();
    // let _id = unsafeWindow.$('li.on.list-box-li').index();
    // return String(episodes[_id].cid);
    // let cid = "";
    // while (cid === "") {
    //     if (window.bpNC_1) {
    //         console.log(window.bpNC_1)
    //         cid = window.bpNC_1.config.cid;
    //     }
    // }
    return new Promise(resolve => {
       let timer = setInterval(() => {
        if (unsafeWindow.bpNC_1) {
            clearInterval(timer);
            resolve(unsafeWindow.bpNC_1.config.cid);
        }
       }, 1000); 
    });
    // return cid;
}

function getVideoCid_Main() {
  // 方案1：优先从新版B站全局变量获取（最稳定）
  if (unsafeWindow.__INITIAL_STATE__?.videoData?.cid) {
    return String(unsafeWindow.__INITIAL_STATE__.videoData.cid);
  }
  // 方案2：从URL参数直接获取
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cid")) {
    return urlParams.get("cid");
  }
  // 方案3：API兜底（如果前两种失败，调用B站接口获取）
  const bvid = window.location.pathname.match(/video\/(BV\w+)/)?.[1];
  if (bvid) {
    fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`)
      .then(res => res.json())
      .then(data => {
        if (data.data?.cid) {
          videoCid = String(data.data.cid);
          // 获取到CID后，重新触发弹幕获取（避免遗漏）
          collectAllDanmaku(1);
        }
      });
  }
  return "";
}
