// http://docs-aliyun.cn-hangzhou.oss.aliyun-inc.com/assets/attach/31752/cn_zh/1462870126706/loghub-tracking.js?spm=a2c63.p38356.879954.10.2ad41eeacILDH5&file=loghub-tracking.js
function createHttpRequest() {
  if (window.ActiveXObject) {
    return new ActiveXObject("Microsoft.XMLHTTP");
  }
  else if (window.XMLHttpRequest) {
    return new XMLHttpRequest();
  }
}
function AliLogTracker(host, project, logstore) {
  this.uri_ = 'https://' + project + '.' + host + '/logstores/' + logstore + '/track?APIVersion=0.6.0';
  this.params_ = new Array();
  // this.httpRequest_ = createHttpRequest();
}
AliLogTracker.prototype = {
  push: function (key, value) {
    // if (!key || !value) {
    //   return;
    // }
    if (!key) {
      return;
    }
    this.params_.push(key);
    this.params_.push(value);
  },
  logger: function () {
    var url = this.uri_;
    var k = 0;
    while (this.params_.length > 0) {
      if (k % 2 == 0) {
        url += '&' + encodeURIComponent(this.params_.shift());
      }
      else {
        url += '=' + encodeURIComponent(this.params_.shift());
      }
      ++k;
    }
    try {
      var httpRequest_ = createHttpRequest();
      httpRequest_.open("GET", url, true);
      httpRequest_.send(null);
    }
    catch (ex) {
      if (window && window.console && typeof window.console.log === 'function') {
        console.log("Failed to log to ali log service because of this exception:\n" + ex);
        console.log("Failed log data:", url);
      }
    }
  }
}

exports.AliLogTracker = AliLogTracker
