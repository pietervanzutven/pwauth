"use strict";

window.onload = () => {
    document.getElementById('import').addEventListener('click', openPicker);
    document.getElementById('export').addEventListener('click', exportTokens);
    document.getElementById('picker').addEventListener('change', importTokens);
    document.getElementById('add').addEventListener('click', addToken);

    loadTokens();
    setInterval(updateTokens, 30000);
}

let totps = [];
function loadTokens() {
    totps = [];
    tokens.innerHTML = '';

    const settings = { ...localStorage };
    for (const [label, secret] of Object.entries(settings)) {
        try {
            totps.push(new OTPAuth.TOTP({
                label: label,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: secret
            }));
        } catch (error) {
            totps.push({ label: label });
        }

        const div = document.createElement('div');
        div.id = label;
        div.innerHTML = label;
        tokens.appendChild(div);
    }

    updateTokens();
}

function updateTokens() {
    totps.forEach(totp => {
        let token;
        try {
            token = totp.generate();
        } catch (error) {
            token = 'error';
        }
        const div = document.getElementById(totp.label);
        div.innerHTML = totp.label + '<span style="float:right;">' + token + '</span>';
        div.onclick = function () {
            navigator.clipboard.writeText(token);
        };
    });
}

function openPicker(evt) {
    picker.click();
}

async function importTokens(evt) {
    const files = evt.target.files;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const settings = JSON.parse(event.target.result);
        for (const [key, value] of Object.entries(settings)) {
            localStorage.setItem(key, value);
        }
        loadTokens();
    }
    reader.readAsText(file)
}

async function exportTokens() {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(localStorage)));
    element.setAttribute('download', 'TOTPs.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function addToken() {
    localStorage.setItem(label.value, secret.value);
    loadTokens();
}