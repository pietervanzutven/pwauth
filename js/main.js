"use strict";

let tokensList;
let labelInput;
let secretInput;
window.onload = () => {
    document.getElementById('import').addEventListener('click', importTokens);
    document.getElementById('export').addEventListener('click', exportTokens);
    document.getElementById('add').addEventListener('click', addToken);

    tokensList = document.getElementById('tokens');
    labelInput = document.getElementById('label');
    secretInput = document.getElementById('secret');

    loadTokens();
    setInterval(updateTokens, 30000);
}

let totps = [];
function loadTokens() {
    totps = [];
    tokensList.innerHTML = '';

    const setting = Windows.Storage.ApplicationData.current.localSettings.values.first();
    while (setting.hasCurrent) {
        const label = setting.current.key;
        const secret = setting.current.value;

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
        tokensList.appendChild(div);

        setting.moveNext();
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
            const data = new Windows.ApplicationModel.DataTransfer.DataPackage;
            data.requestedOperation = Windows.ApplicationModel.DataTransfer.DataPackageOperation.copy;
            data.setText(token);
            Windows.ApplicationModel.DataTransfer.Clipboard.setContent(data);
        };
    });
}

async function importTokens() {
    const picker = new Windows.Storage.Pickers.FileOpenPicker();
    picker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
    picker.fileTypeFilter.append('.json');

    const file = await picker.pickSingleFileAsync();
    if (file !== null)
    {
        const text = await Windows.Storage.FileIO.readTextAsync(file);
        const settings = JSON.parse(text);

        for (const [key, value] of Object.entries(settings)) {
            Windows.Storage.ApplicationData.current.localSettings.values[key] = value;
        };

        loadTokens();
    }
}

async function exportTokens() {
    const picker = new Windows.Storage.Pickers.FileSavePicker();
    picker.SuggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.desktop;
    picker.fileTypeChoices.insert('JSON', ['.json']);
    picker.suggestedFileName = "TOTPs";
    
    const file = await picker.pickSaveFileAsync();
    if (file !== null) {
        Windows.Storage.CachedFileManager.deferUpdates(file);
        await Windows.Storage.FileIO.writeTextAsync(file, JSON.stringify(Windows.Storage.ApplicationData.current.localSettings.values));
        const status = await Windows.Storage.CachedFileManager.completeUpdatesAsync(file);
    }
}

function addToken() {
    Windows.Storage.ApplicationData.current.localSettings.values[labelInput.value] = secretInput.value;
    loadTokens();
}