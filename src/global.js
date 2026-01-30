let allDanmaku = {}

const DOM_MENU_MAIN = ".bpx-player-contextmenu.bpx-player-active";
const DOM_MENU_BANGUMI = ".bpx-player-contextmenu.bpx-player-active";
const DOM_MENU_CHEESE = ".bpx-player-contextmenu.bpx-player-active";
const DOM_DANMAKU_BOX = "#bpx-player-dm-wrap"; // 新版弹幕容器


function formatSeconds(value) {
	var secondTime = parseInt(value / 1000); // 秒
	var minuteTime = 0; // 分
	if (secondTime > 60) {
		minuteTime = parseInt(secondTime / 60);
		secondTime = parseInt(secondTime % 60);
	}
	var result = "" + (parseInt(secondTime) < 10 ? "0" + parseInt(secondTime) : parseInt(secondTime));

	// if (minuteTime > 0) {
	result = "" + (parseInt(minuteTime) < 10 ? "0" + parseInt(minuteTime) : parseInt(minuteTime)) + ":" + result;
	// }
	return result;
}

function toSecond(e) {
	var time = e;
	var len = time.split(':')
	let min = "";
	let hour = "";
	let sec = "";
	if (len.length == 3) {
		hour = time.split(':')[0];
		min = time.split(':')[1];
		sec = time.split(':')[2];
		return Number(hour * 3600) + Number(min * 60) + Number(sec);
	}
	if (len.length == 2) {
		min = time.split(':')[0];
		sec = time.split(':')[1];
		return Number(min * 60) + Number(sec);
	}
	if (len.length == 1) {
		sec = time.split(':')[0];
		return Number(sec);
	}

	// var hour = time.split(':')[0];
	// var min = time.split(':')[1];
	// var sec = time.split(':')[2];
	// return  Number(hour*3600) + Number(min*60) + Number(sec);
}


function getStrMiddle(str, before, after) {
	let m = str.match(new RegExp(before + '(.*?)' + after));
	return m ? m[1] : false;
}

function showTip(message, type = "info") {
  let tipDom = document.createElement("div");
  tipDom.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    border-radius: 4px;
    color: white;
    z-index: 9999;
    font-size: 14px;
    background: ${type === "error" ? "#f56c6c" : "#67c23a"};
  `;
  tipDom.innerText = message;
  document.body.appendChild(tipDom);
  setTimeout(() => {
    tipDom.remove();
  }, 3000);
}
