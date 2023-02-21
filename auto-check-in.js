const got = require("got");
const schedule = require("node-schedule");
const moment = require("moment");
// 用户信息-手动配置
const info = {
  cookie:
    "_tea_utm_cache_2608=undefined; __tea_cookie_tokens_2608=%257B%2522user_unique_id%2522%253A%25227056710723640903204%2522%252C%2522web_id%2522%253A%25227056710723640903204%2522%252C%2522timestamp%2522%253A1647481153456%257D; _ga=GA1.2.1980927592.1647496227; MONITOR_WEB_ID=58f89425-03a0-4e60-b2cc-16da81a0e508; passport_csrf_token=407c80f96f621b5d804aabe60c699236; passport_csrf_token_default=407c80f96f621b5d804aabe60c699236; n_mh=09_gHnhuP0_9kpD0snfvOPryCL0096KMMx1uk1z3LbE; sid_guard=118eaf9c7af1eb822588554616794ee0%7C1647913051%7C5184000%7CSat%2C+21-May-2022+01%3A37%3A31+GMT; uid_tt=43084a746f12150fd3962910d12c5e5a; uid_tt_ss=43084a746f12150fd3962910d12c5e5a; sid_tt=118eaf9c7af1eb822588554616794ee0; sessionid=118eaf9c7af1eb822588554616794ee0; sessionid_ss=118eaf9c7af1eb822588554616794ee0; sid_ucp_v1=1.0.0-KGU0NjMxNzZhNjc2OTFlMmI5Y2Q4YmJmMTdlNjc2MDk4NjI3NjBmODAKFwi9kfCy4YyUARDb0OSRBhiwFDgCQPEHGgJsZiIgMTE4ZWFmOWM3YWYxZWI4MjI1ODg1NTQ2MTY3OTRlZTA; ssid_ucp_v1=1.0.0-KGU0NjMxNzZhNjc2OTFlMmI5Y2Q4YmJmMTdlNjc2MDk4NjI3NjBmODAKFwi9kfCy4YyUARDb0OSRBhiwFDgCQPEHGgJsZiIgMTE4ZWFmOWM3YWYxZWI4MjI1ODg1NTQ2MTY3OTRlZTA; _gid=GA1.2.1493659231.1650858463",
  aid: "2608",
  uuid: "7056710723640903204",
  _signature:
    "_02B4Z6wo00901hc87ZAAAIDDb.IGlgjCy9YXOOkAAOe3guvgrSxQ8m4lkXJXVXRJmhZiEqVMc7VvDNpSbBbX61ad5PxvbtSJJa3xefDV5Srf40pONbe-ZSkxcXaUYEZVsODrDphnSKW.qaoB20",
};
const { cookie, aid, uuid, _signature } = info;
const BASEURL = "https://api.juejin.cn/growth_api/v1/";
// 签到
const CHIN = `${BASEURL}check_in?aid=${aid}&uuid=${uuid}&_signature=${_signature}`;
// 抽奖
const DRAW = `${BASEURL}lottery/draw?aid=${aid}&uuid=${uuid}&_signature=${_signature}`;
// 查询矿石
const KUANG = `${BASEURL}get_cur_point?aid=${aid}&uuid=${uuid}`;
// 累计签到天数
const DAYS = `${BASEURL}get_counts?aid=${aid}&uuid=${uuid}`;
// 围观大奖-拿到沾喜气需要的参数
const BIG = `${BASEURL}lottery_history/global_big?aid=${aid}&uuid=${uuid}`;
// 沾喜气
const LUCKY = `${BASEURL}lottery_lucky/dip_lucky?aid=${aid}&uuid=${uuid}`;
const HEADERS = {
  cookie,
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36 Edg/92.0.902.67",
};
let history_id = 0;
// 时间设置为中文
moment.locale("zh-cn");
// 统一封装请求
async function myhttp(api, method, cb) {
  const res = await got[method](api, {
    hooks: {
      beforeRequest: [
        (options) => {
          Object.assign(options.headers, HEADERS);
        },
      ],
    },
  });
  cb(res);
}
// 6个占位符从左到右分别代表：秒、分、时、日、月、周几
// '*'表示通配符，匹配任意，当秒是'*'时，表示任意秒数都触发，其它类推
function appMain() {
  console.log(`
        --------------------
        |   掘金自动签到抽奖  |
        --------------------
    `);
  setTimeout(() => {
    console.log("程序正在执行...");
    // 定时任务 每天凌晨 00:01:00 自动签到
    schedule.scheduleJob("0 1 0 * * *", function () {
      signIn();
    });
  }, 500);
}
// 签到
function signIn() {
  myhttp(CHIN, "post", (res) => {
    if (JSON.parse(res.body).err_msg.indexOf("must login") > -1) {
      console.log("请先手动配置用户信息！");
      return;
    }
    if (JSON.parse(res.body).err_msg !== "success") {
      console.log(
        moment().format("YYYY-MM-DD hh:mm:ss") +
          "：" +
          JSON.parse(res.body).err_msg
      );
    } else {
      console.log(moment().format("YYYY-MM-DD hh:mm:ss") + "：" + "签到成功!");
    }
    // 查询当前签到状态
    days();
    setTimeout(() => {
      big();
    }, 500);
  });
}
// 围观大奖
function big() {
  myhttp(BIG, "post", (res) => {
    history_id = JSON.parse(res.body).data.lotteries[0].history_id;
    setTimeout(() => {
      lucky();
    }, 500);
  });
}
// 沾喜气
async function lucky() {
  const res = await got.post(LUCKY, {
    hooks: {
      beforeRequest: [
        (options) => {
          Object.assign(options.headers, HEADERS);
        },
      ],
    },
    json: {
      lottery_history_id: history_id,
    },
  });
  const { dip_value, has_dip, total_value } = JSON.parse(res.body).data;
  const str = has_dip
    ? `已沾/现有喜气：${total_value}`
    : `沾到/现有喜气：${dip_value}/${total_value}`;
  console.log(str);
  setTimeout(() => {
    // 先沾喜气再抽奖，抽完奖再查询矿石，
    // 沾过了就不抽奖了，但仍要查询矿石。
    if (!has_dip) {
      draw().then(() => {
        kuang();
      });
    } else {
      kuang();
    }
  }, 1000);
}
// 抽奖
function draw() {
  return new Promise((resolve, reject) => {
    console.log("开始抽奖...");
    myhttp(DRAW, "post", (res) => {
      if (JSON.parse(res.body).err_msg !== "success") {
        console.log(JSON.parse(res.body).err_msg);
      } else {
        console.log("抽中：" + JSON.parse(res.body).data.lottery_name);
      }
      resolve(true);
    });
  });
}

// 查询矿石
function kuang() {
  myhttp(KUANG, "get", (res) => {
    console.log("现拥有矿石数：" + JSON.parse(res.body).data);
    console.log("---------------------------------------");
  });
}
// 查询累计签到天数
function days() {
  myhttp(DAYS, "get", (res) => {
    if (JSON.parse(res.body).err_msg !== "success") {
      console.log(JSON.parse(res.body).err_msg);
    } else {
      console.log("连续签到天数：" + JSON.parse(res.body).data.cont_count);
      console.log("累计签到天数：" + JSON.parse(res.body).data.sum_count);
    }
  });
}
// 开始执行
appMain();
