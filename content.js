let isEnabled = false;
let targetLoops = 1;
let currentLoop = 0;
let currentVideoSrc = "";

// 초기 설정 로드
chrome.storage.local.get(['isEnabled', 'targetLoops'], (result) => {
    isEnabled = result.isEnabled !== false;
    targetLoops = result.targetLoops || 1;
});

// 설정 변경 감지 (팝업에서 변경 시 즉시 반영)
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled) isEnabled = changes.isEnabled.newValue;
    if (changes.targetLoops) targetLoops = changes.targetLoops.newValue;
});

// 다음 영상으로 이동하는 함수 (아래 방향키 이벤트 시뮬레이션)
function skipToNextShort() {
    console.log("Skipping to next short...");
    // YouTube Shorts는 키보드 이벤트를 통해 넘기는 것이 가장 안정적입니다.
    const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        bubbles: true,
        cancelable: true
    });
    document.body.dispatchEvent(event);
}

// 비디오 상태 모니터링
function monitorVideo() {
    // 현재 화면에 보이는 활성 비디오 찾기
    // YouTube는 여러 video 태그를 미리 로드하므로, 현재 재생 중인 것을 찾아야 함
    const videos = document.querySelectorAll('video');
    let activeVideo = null;

    for (let video of videos) {
        // paused가 아니고, src가 있으며, 화면에 보이는 비디오
        if (!video.paused && video.src && video.checkVisibility()) {
            activeVideo = video;
            break;
        }
    }

    if (!activeVideo) return;

    // 사용자가 직접 넘겨서 비디오가 바뀐 경우 리셋 로직
    if (currentVideoSrc !== activeVideo.src) {
        currentVideoSrc = activeVideo.src;
        currentLoop = 0; // 새 영상이므로 카운트 리셋
        console.log("New video detected. Counter reset.");

        // 비디오 루프 감지를 위한 이벤트 리스너 부착
        // 주의: 기존 리스너가 중복되지 않도록 'ontimeupdate' 프로퍼티를 사용하거나 플래그 관리
        // 여기서는 간단하게 timeupdate 이벤트 내에서 로직 처리
        activeVideo.ontimeupdate = handleTimeUpdate;
    }
}

function handleTimeUpdate(e) {
    if (!isEnabled) return;

    const video = e.target;
    const currentTime = video.currentTime;
    const duration = video.duration;

    // 비디오가 끝났거나(드물게 발생), 거의 끝에서 처음으로 돌아갔을 때 (루프 감지)
    // 쇼츠는 보통 끝나자마자 0초로 돌아가서 다시 재생됩니다.
    // 1. duration과 매우 가까움 (끝남 감지 보조)
    // 2. 갑자기 시간이 0.5초 미만으로 줄어들었으며, 이전 시간이 비디오 길이의 절반 이상이었을 때 (루프)

    // 마지막 시간을 기록하기 위해 video 객체에 커스텀 속성 사용
    if (!video.lastTime) video.lastTime = 0;

    // 루프 감지 로직: 시간이 뒤로 갔는데(현재 < 이전), 그 차이가 크면 루프로 간주
    if (currentTime < video.lastTime && video.lastTime > duration * 0.8) {
        currentLoop++;
        console.log(`Loop detected: ${currentLoop} / ${targetLoops}`);

        // 설정한 횟수만큼 다 봤으면 넘기기
        if (currentLoop >= targetLoops) {
            skipToNextShort();
            // 넘긴 후 중복 실행 방지를 위해 리스너 제거 또는 플래그 처리
            video.ontimeupdate = null;
        }
    }

    video.lastTime = currentTime;
}

// 페이지 변화를 지속적으로 감지 (SPA 특성 대응)
setInterval(monitorVideo, 1000);