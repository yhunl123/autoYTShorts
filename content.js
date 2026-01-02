let isEnabled = false;
let targetLoops = 1;
let currentLoop = 0;
let currentVideoSrc = "";

// 설정 로드
chrome.storage.local.get(['isEnabled', 'targetLoops'], (result) => {
    isEnabled = result.isEnabled === true;
    targetLoops = result.targetLoops || 1;
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled) isEnabled = changes.isEnabled.newValue;
    if (changes.targetLoops) targetLoops = changes.targetLoops.newValue;
});

function skipToNextShort() {
    console.log("Skipping to next short...");
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        bubbles: true,
        cancelable: true
    });
    document.body.dispatchEvent(event);
}

function monitorVideo() {
    // [수정 포인트 1] 현재 페이지가 Shorts가 아니면 아무것도 하지 않음
    if (!location.pathname.startsWith('/shorts/')) {
        currentVideoSrc = ""; // 일반 영상보다가 다시 쇼츠오면 초기화 위해 비움
        return;
    }

    const videos = document.querySelectorAll('video');
    let activeVideo = null;

    for (let video of videos) {
        if (!video.paused && video.src && video.checkVisibility()) {
            activeVideo = video;
            break;
        }
    }

    if (!activeVideo) return;

    if (currentVideoSrc !== activeVideo.src) {
        currentVideoSrc = activeVideo.src;
        currentLoop = 0;

        // 비디오 속성 초기화
        activeVideo.lastTime = activeVideo.currentTime;

        // 이벤트 리스너 연결
        activeVideo.ontimeupdate = handleTimeUpdate;
        console.log("Shorts detected & Monitor started.");
    }
}

function handleTimeUpdate(e) {
    if (!isEnabled) return;

    // [수정 포인트 2] 이벤트 발생 시점에도 한번 더 쇼츠 페이지인지 체크 (안전장치)
    if (!location.pathname.startsWith('/shorts/')) return;

    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    if (!duration) return;

    // 루프 감지 로직 (이전 버전과 동일)
    if (currentTime < video.lastTime) {
        const isNearEnd = video.lastTime > duration * 0.9;
        const isBackToStart = currentTime < 1.5;

        if (isNearEnd && isBackToStart) {
            currentLoop++;
            console.log(`Loop detected: ${currentLoop} / ${targetLoops}`);

            if (currentLoop >= targetLoops) {
                skipToNextShort();
                video.ontimeupdate = null;
            }
        }
    }

    video.lastTime = currentTime;
}

// 1초마다 감지 (SPA 페이지 이동 대응을 위해 지속 호출)
setInterval(monitorVideo, 1000);