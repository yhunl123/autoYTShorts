document.addEventListener('DOMContentLoaded', () => {
    const toggleState = document.getElementById('toggleState');
    const loopCount = document.getElementById('loopCount');
    const statusMsg = document.getElementById('statusMsg');

    // 저장된 설정 불러오기
    chrome.storage.local.get(['isEnabled', 'targetLoops'], (result) => {
        // 1. 수정 포인트: 값이 명확하게 true일 때만 켜짐 (초기 설치 시 undefined이므로 OFF 상태)
        toggleState.checked = result.isEnabled === true;

        // 반복 횟수는 기존과 동일 (기본 1회)
        loopCount.value = result.targetLoops || 1;
    });

    // 설정 변경 시 자동 저장
    function saveSettings() {
        const isEnabled = toggleState.checked;
        const targetLoops = parseInt(loopCount.value, 10) || 1;

        chrome.storage.local.set({ isEnabled, targetLoops }, () => {
            statusMsg.style.color = '#ff0000';
            setTimeout(() => { statusMsg.style.color = '#666'; }, 300);
        });
    }

    toggleState.addEventListener('change', saveSettings);
    loopCount.addEventListener('input', saveSettings);
});