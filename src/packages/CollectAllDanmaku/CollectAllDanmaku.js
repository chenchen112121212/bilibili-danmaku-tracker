let protoStr = `
syntax = "proto3";
package dm;

message DanmakuElem {
  int64 id = 1;
  int32 progress = 2;
  int32 mode = 3;
  int32 fontsize = 4;
  uint32 color = 5;
  string midHash = 6;
  string content = 7;
  int64 ctime = 8;
  int32 weight = 9;
  string action = 10;
  int32 pool = 11;
  string idStr = 12;
  int32 attr = 13; // 新增：B站协议更新字段
}

message dmList {
  repeated DanmakuElem list = 1;
  int64 total = 2; // 新增：返回弹幕总数字段
}
`;
let videoCid = "";

// 确保 allDanmaku 全局变量存在（避免 handleDanmakuList 报错）
if (typeof allDanmaku === "undefined") {
  window.allDanmaku = {};
}

function initPkg_CollectAllDanmaku() {
    initPkg_CollectAllDanmaku_Dom();
    initPkg_CollectAllDanmaku_Func();
}

function initPkg_CollectAllDanmaku_Dom() {
}  

function initPkg_CollectAllDanmaku_Func() {
    collectAllDanmaku(1);
}

// 修复后的 collectAllDanmaku 函数（解决异步错乱、防风控、加重试、扩分页）
function collectAllDanmaku(page = 1, retry = 3) {
    // 1. 扩大分页上限（从30改为50，获取更多弹幕）
    if (page > 50) {
        // 熔断
        return;
    }
    // 2. 增加 videoCid 空值校验（避免无效请求）
    if (!videoCid) {
        console.warn("videoCid为空，无法发起弹幕请求");
        return;
    }

    fetch(
        `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${videoCid}&segment_index=${page}`,
        {
          // 3. 补全防风控请求头（关键：避免被B站拦截，提高请求成功率）
          headers: {
            "User-Agent": navigator.userAgent,
            "Referer": window.location.href,
            "Accept": "*/*"
          },
          credentials: "include", // 携带Cookie，进一步提高成功率
          method: "GET",
          mode: "cors"
        }
    ).then(response => {
        // 4. 新增 HTTP 状态码校验（捕获403/404等错误）
        if (!response.ok) {
            throw new Error(`弹幕请求失败，状态码：${response.status}`);
        }
        return response.arrayBuffer();
    }).then(ret => {
        // 5. 过滤空响应（避免解析空数据报错）
        if (ret.byteLength === 0) {
            return;
        }
        let data = new Uint8Array(ret);
        protobuf.loadFromString("dm", protoStr).then(root => {
            let dmList = root.lookupType("dm.dmList").decode(data);
            handleDanmakuList(dmList.list);

            // 6. 修复异步逻辑：将下一页请求移到 protobuf 解析成功后（关键）
            // 新增延迟递归（100ms），降低请求频率，防风控
            setTimeout(() => {
                collectAllDanmaku(page + 1);
            }, 100);
        }).catch(parseErr => {
            // 7. 新增 protobuf 解析错误捕获
            console.error(`第${page}页弹幕解析失败：`, parseErr);
        });
    }).catch(err => {
        console.error(`第${page}页弹幕请求失败：`, err);
        // 8. 新增失败重试逻辑（最多重试3次，间隔1秒）
        if (retry > 0) {
            setTimeout(() => {
                collectAllDanmaku(page, retry - 1);
            }, 1000);
        }
    });
}

function handleDanmakuList(list) {
  if (!Array.isArray(list)) return; // 新增：空数组保护
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    if (!item.content || !item.midHash) continue; // 新增：过滤无内容/无发布者哈希的无效弹幕
    let progress = item.progress || 0;
    let keyName = `${item.content.trim()}|${Math.floor(progress / 1000)}`; // 新增：去除弹幕内容空格，避免重复键值
    if (!allDanmaku[keyName]) {
      allDanmaku[keyName] = [];
    }
    if (!allDanmaku[keyName].includes(item.midHash)) {
      allDanmaku[keyName].push(item.midHash);
    }
  }
}

async function refreshAllDanmaku() {
    let route = getRoute();
    switch (route) {
        case 0:
            // 在普通页面
            videoCid = getVideoCid_Main();
            initPkg_CollectAllDanmaku();
            break;
        case 1:
            // 在番剧页面
            videoCid = getVideoCid_Bangumi();
            initPkg_CollectAllDanmaku();
            break;
        case 2:
            // 在课程页面
            videoCid = await getVideoCid_Cheese();
            initPkg_CollectAllDanmaku();
            break;
        default:
            videoCid = getVideoCid_Main();
            initPkg_CollectAllDanmaku();
            break;
    }
}
