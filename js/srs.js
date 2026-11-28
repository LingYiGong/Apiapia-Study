/**
 * ============================================================
 * Apiapia 学习中心 · 统一艾宾浩斯遗忘曲线 (SRS) 计算模块
 * ============================================================
 */

(function () {
    'use strict';

    var DAY_MS = 24 * 60 * 60 * 1000;
    var INTERVALS = [0, 1, 3, 7, 14, 30, 60];

    function getDaysForLevel(level) {
        var idx = Math.max(0, Number(level) || 0);
        return idx < INTERVALS.length ? INTERVALS[idx] : 60;
    }

    function calculateNextReview(level, now) {
        var base = typeof now === 'number' ? now : Date.now();
        return base + getDaysForLevel(level) * DAY_MS;
    }

    function getNextReviewLabel(level) {
        var days = getDaysForLevel(level);
        return days === 0 ? '今日' : days + '天后';
    }

    function isDueForReview(nextReviewTs, now) {
        var base = typeof now === 'number' ? now : Date.now();
        return (Number(nextReviewTs) || 0) <= base;
    }

    function formatDateDisplay(ts, now) {
        var base = typeof now === 'number' ? now : Date.now();
        if (!ts || ts <= base) return '今日待复习';
        var d = new Date(Number(ts));
        var diffDays = Math.ceil((ts - base) / DAY_MS);
        return diffDays + '天后 (' + (d.getMonth() + 1) + '/' + d.getDate() + ')';
    }

    window.ApiapiaSRS = {
        DAY_MS: DAY_MS,
        INTERVALS: INTERVALS,
        getDaysForLevel: getDaysForLevel,
        calculateNextReview: calculateNextReview,
        getNextReviewLabel: getNextReviewLabel,
        isDueForReview: isDueForReview,
        formatDateDisplay: formatDateDisplay
    };
})();
