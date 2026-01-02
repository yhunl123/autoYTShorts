let isEnabled = false; // 1. 수정 포인트: 기본값 OFF
let targetLoops = 1;
let currentLoop = 0;
let currentVideoSrc = "";

// 초기 설정 로드
chrome.storage.local.get(['isEnabled', 'targetLoops'], (result) => {
    // 저장된 값이 없으면 false(OFF), 있으면 그 값 사용
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

        // 새 영상 로드 시 lastTime 초기화 (undefined 방지)
        activeVideo.lastTime = activeVideo.currentTime;

        // 이벤트 리스너 중복 방지를 위해 기존 핸들러 제거 후 재등록 방식 대신
        // video 태그 자체가 재활용되는 경우가 많으므로 속성으로 핸들러가 붙어있는지 체크하거나
        // 간단히 덮어쓰기 (activeVideo.ontimeupdate) 방식을 유지
        activeVideo.ontimeupdate = handleTimeUpdate;
    }
}

function handleTimeUpdate(e) {
    if (!isEnabled) return;

    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    if (!duration) return; // duration이 NaN일 경우 방지

    // 2. 수정 포인트: 루프 감지 로직 강화
    // 조건 A: 현재 시간이 과거 시간보다 작아짐 (재생 위치가 뒤로 이동)
    // 조건 B: 직전 시간(lastTime)이 영상의 90% 지점 이상이었어야 함 (끝보고 돌아감)
    // 조건 C: 현재 시간(currentTime)이 1.5초 미만이어야 함 (처음으로 돌아감)
    // -> 이 조건을 만족해야 사용자가 중간에서 조금 뒤로 감기한 것을 루프로 착각하지 않음

    if (currentTime < video.lastTime) {
        const isNearEnd = video.lastTime > duration * 0.95; // 끝부분이었는가?
        const isBackToStart = currentTime < 0.5;           // 시작점으로 갔는가?

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

setInterval(monitorVideo, 1000);