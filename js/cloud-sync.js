/**
 * ============================================================
 * Apiapia 学习中心 · 统一云端同步客户端 (Cloudflare KV)
 * ============================================================
 */

(function () {
    'use strict';

    function notifyAlert(title, message, type) {
        if (window.kidAlert) {
            window.kidAlert({
                title: title,
                message: message,
                icon: type === 'info' || type === 'warning' ? '💡' : '⚠️',
                type: type || 'warning'
            });
        } else {
            alert(message);
        }
    }

    function notifyToast(message, type) {
        if (window.kidToast) {
            window.kidToast(message, type || 'success');
        }
    }

    function createSyncClient(config) {
        var debounceTimer = null;
        var debounceMs = typeof config.debounceMs === 'number' ? config.debounceMs : 2500;

        function setStatus(status, text) {
            if (typeof config.onStatusChange === 'function') {
                config.onStatusChange(status, text);
            }
        }

        function setLastSyncTime(str) {
            if (typeof config.onLastSyncTime === 'function') {
                config.onLastSyncTime(str);
            }
        }

        function triggerAutoSync() {
            var key = (config.getKey() || '').trim();
            var auto = typeof config.isAutoSync === 'function' ? config.isAutoSync() : false;
            if (!auto || !key) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                pushToCloud(true);
            }, debounceMs);
        }

        async function pushToCloud(silent, useKeepalive) {
            silent = Boolean(silent);
            var key = (config.getKey() || '').trim();
            if (!key) {
                if (!silent) {
                    notifyAlert('同步提示', '请先输入专属同步密钥 (Sync Key)！', 'warning');
                }
                return;
            }

            setStatus('syncing', '正在推送...');
            try {
                var cloudData = null;
                try {
                    var preRes = await fetch(config.endpoint, {
                        headers: { 'X-Sync-Key': key }
                    });
                    if (preRes.ok) {
                        var preJson = await preRes.json();
                        if (preJson && preJson.success && preJson.data) {
                            cloudData = preJson.data;
                        }
                    }
                } catch (preErr) {
                    console.warn('[CloudSync] 推送前读取云端数据失败，将直接推送本地数据：', preErr);
                }

                var payload = Object.assign({}, config.buildPushPayload(cloudData), { syncKey: key });
                var bodyStr = JSON.stringify(payload);
                var canKeepalive = Boolean(useKeepalive) && (typeof Blob === 'undefined' || new Blob([bodyStr]).size < 60000);
                var fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Sync-Key': key
                    },
                    body: bodyStr
                };
                if (canKeepalive) {
                    fetchOptions.keepalive = true;
                }

                var res = await fetch(config.endpoint, fetchOptions);
                var json = await res.json();

                if (res.ok && json && json.success) {
                    var now = new Date();
                    setStatus('success', '同步成功 (' + now.toLocaleTimeString() + ')');
                    setLastSyncTime(now.toLocaleString());
                    if (!silent) {
                        var msg = typeof config.getPushSuccessMessage === 'function'
                            ? config.getPushSuccessMessage(json)
                            : '☁️ 已成功推送到云端备份！';
                        notifyToast(msg, 'success');
                    }
                } else {
                    var errMsg = (json && (json.message || json.error)) || '未知错误';
                    setStatus('error', errMsg);
                    if (!silent) {
                        notifyAlert('推送失败', '推送云端失败：' + errMsg, 'warning');
                    }
                }
            } catch (err) {
                setStatus('error', '网络或接口异常');
                if (!silent) {
                    notifyAlert('网络异常', '推送失败，请检查网络连接或 Cloudflare 部署状态：' + err.message, 'danger');
                }
            }
        }

        async function pullFromCloud(silent) {
            silent = Boolean(silent);
            var key = (config.getKey() || '').trim();
            if (!key) {
                if (!silent) {
                    notifyAlert('同步提示', '请先输入专属同步密钥 (Sync Key)！', 'warning');
                }
                return;
            }

            if (!silent && window.kidConfirm) {
                var ok = await window.kidConfirm({
                    title: '拉取云端数据？',
                    message: '从云端拉取数据将合并并更新本地学习进度，确定要拉取吗？',
                    icon: '⬇️',
                    type: 'warning',
                    confirmText: '确定拉取',
                    cancelText: '取消'
                });
                if (!ok) return;
            }

            setStatus('syncing', '正在拉取...');
            try {
                var res = await fetch(config.endpoint, {
                    headers: { 'X-Sync-Key': key }
                });
                var json = await res.json();

                if (res.ok && json && json.success && json.data) {
                    var summaryMsg = config.applyPullData(json.data);
                    var now = new Date();
                    setStatus('success', '拉取成功 (' + now.toLocaleTimeString() + ')');
                    setLastSyncTime(now.toLocaleString());
                    if (!silent) {
                        notifyToast(summaryMsg || '☁️ 已成功拉取并合并云端学习进度！', 'success');
                    }
                } else if (res.ok && json && json.success && !json.data) {
                    setStatus('idle', '云端暂无数据');
                    if (!silent) {
                        notifyAlert(
                            '云端暂无数据',
                            config.emptyCloudMessage || '该密钥在云端尚未有数据备份，请先在已有数据的设备上点击【推送到云端备份】。',
                            'info'
                        );
                    }
                } else {
                    var errMsg = (json && (json.message || json.error)) || '未知错误';
                    setStatus('error', errMsg);
                    if (!silent) {
                        notifyAlert('拉取失败', '拉取失败：' + errMsg, 'warning');
                    }
                }
            } catch (err) {
                setStatus('error', '网络异常');
                if (!silent) {
                    notifyAlert('网络异常', '拉取失败，请检查网络连接或 Cloudflare 部署状态：' + err.message, 'danger');
                }
            }
        }

        return {
            triggerAutoSync: triggerAutoSync,
            pushToCloud: pushToCloud,
            pullFromCloud: pullFromCloud
        };
    }

    window.ApiapiaSync = {
        createSyncClient: createSyncClient
    };
})();
