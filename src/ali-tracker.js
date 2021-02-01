class AliLogTracker {
  constructor(host, project, logstore) {
    this.uri_ = `https://${project}.${host}/logstores/${logstore}/track?APIVersion=0.6.0`
    this.params_ = new Array();
  }

  push(key, value) {
    if (!key) {
      return;
    }
    this.params_.push(key);
    this.params_.push(value);
  }
  logger (isKeepalive = false) {
    let url = this.uri_;
    let k = 0;
    while (this.params_.length > 0) {
      if (k % 2 == 0) {
        url += '&' + encodeURIComponent(this.params_.shift());
      }
      else {
        url += '=' + encodeURIComponent(this.params_.shift());
      }
      ++k;
    }
    fetch(url, {
      method: 'GET',
      credentials: 'include',
      keepalive: isKeepalive, // 目前安卓的兼容性还不错
      mode: 'cors',
      credentials: 'omit'
    }).then(response => {
      if (response.status > 300 || !response.ok) {
        return Promise.reject(new Error(response.status))
      }
    }).catch(ex => {
      if (window && window.console && typeof window.console.error === 'function') {
        console.error("Failed to log to ali log service because of this exception:\n" + ex);
        console.error("Failed log data:", url);
      }
    })
  }
}

exports.AliLogTracker = AliLogTracker
