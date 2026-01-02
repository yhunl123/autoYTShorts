document.addEventListener('DOMContentLoaded', () => {
    const toggleState = document.getElementById('toggleState');
    const loopCount = document.getElementById('loopCount');
    const statusMsg = document.getElementById('statusMsg');

    // 저장된 설정 불러오기
    chrome.storage.local.get(['isEnabled', 'targetLoops'], (result) => {
        toggleState.checked = result.isEnabled !== false; // 기본값 true
        loopCount.value = result.targetLoops || 1; // 기본값 1회
    });

    // 설정 변경 시 자동 저장
    function saveSettings() {
        const isEnabled = toggleState.checked;
        const targetLoops = parseInt(loopCount.value, 10) || 1;

        chrome.storage.local.set({ isEnabled, targetLoops }, () => {
            // 저장 완료 시각적 피드백 (간단히 깜빡임)
            statusMsg.style.color = '#ff0000';
            setTimeout(() => { statusMsg.style.color = '#666'; }, 300);
        });
    }

    toggleState.addEventListener('change', saveSettings);
    loopCount.addEventListener('input', saveSettings);
});