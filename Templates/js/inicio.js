function switchTab(tabName) {
    const contents = document.getElementsByClassName('content');
    for (let content of contents) {
        content.style.display = 'none';
    }
    document.getElementById(tabName).style.display = 'flex';

    const tabs = document.getElementsByClassName('tab');
    for (let tab of tabs) {
        tab.classList.remove('active');
    }
    event.target.classList.add('active');
}