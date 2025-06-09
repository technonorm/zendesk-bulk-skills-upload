// --- SCRIPT CONSTANTS ---
const STATUS_COLUMN_HEADER = 'Upload Status';

/**
 * Runs when the spreadsheet is opened. Adds a custom menu to the UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Zendesk Bulk Uploader')
    .addItem('Create Skills', 'runCreationProcess')
    .addSeparator()
    .addItem('Settings', 'showSettingsSidebar')
    .addToUi();
}

/**
 * Shows the settings panel to the user.
 */
function showSettingsSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Settings.html').setTitle('Uploader Settings');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Gets the current settings stored in Document Properties.
 * @returns {object} The settings object.
 */
function getSettings() {
  const properties = PropertiesService.getDocumentProperties();
  const savedSettings = properties.getProperty('settings');
  return savedSettings ? JSON.parse(savedSettings) : {};
}

/**
 * Saves the user's settings to Document Properties.
 * @param {object} settings The settings object from the sidebar form.
 * @returns {string} A success message.
 */
function saveSettings(settings) {
  if (!settings.subdomain || !settings.email || !settings.apiKey) {
    throw new Error("Subdomain, email, and API Token are all required.");
  }
  
  // Create the Base64 token and store it along with other settings.
  const credentials = `${settings.email}/token:${settings.apiKey}`;
  settings.authToken = Utilities.base64Encode(credentials);
  
  // For security, don't store the raw API key, only the settings needed for display.
  const settingsToStore = {
      subdomain: settings.subdomain,
      email: settings.email,
      ignoreHeader: settings.ignoreHeader,
      authToken: settings.authToken
  };
  
  const properties = PropertiesService.getDocumentProperties();
  properties.setProperty('settings', JSON.stringify(settingsToStore));
  
  return "Settings saved successfully!";
}

/**
 * Main function to start the skill creation process.
 */
function runCreationProcess() {
  const settings = getSettings();
  if (!settings.authToken) {
    SpreadsheetApp.getUi().alert('Settings not found. Please configure the script under "Zendesk Bulk Uploader" > "Settings" first.');
    return;
  }
  
  try {
    const skillTypes = getZendeskSkillTypes(settings);
    showSkillTypeSelectorDialog(skillTypes);
  } catch (e) {
    SpreadsheetApp.getUi().alert(`An error occurred: ${e.message}`);
  }
}

/**
 * Fetches skill types and shows the selection dialog.
 * @param {Array} skillTypes The array of skill types from Zendesk.
 */
function showSkillTypeSelectorDialog(skillTypes) {
    let html = `
      <style> body { font-family: 'Roboto', sans-serif; } select { width: 100%;} .button-group { margin-top: 20px; text-align: right; } </style>
      <p>Select the "Skill Type" you want to add skills to.</p>
      <select id="skillTypeSelect">`;
    skillTypes.forEach(skillType => {
      html += `<option value="${skillType.id}">${skillType.name}</option>`;
    });
    html += `
        </select>
      </div>
      <div class="button-group">
        <button class="action" onclick="processSelection()">Create Skills</button>
      </div>
      <script>
        function processSelection() {
          document.querySelector('button').disabled = true;
          document.querySelector('button').textContent = 'Processing...';
          const selectedId = document.getElementById('skillTypeSelect').value;
          google.script.run
            .withSuccessHandler(() => google.script.host.close())
            .withFailureHandler(err => { alert(err.message); google.script.host.close(); })
            .processCreation(selectedId);
        }
      </script>`;
    const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(150);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Select Zendesk Skill Type');
}

/**
 * Fetches all skill types (attributes) from Zendesk using saved settings.
 * @param {object} settings The saved settings.
 * @returns {Array<{id: string, name: string}>} An array of skill type objects.
 */
function getZendeskSkillTypes(settings) {
  const endpoint = `https://${settings.subdomain}.zendesk.com/api/v2/routing/attributes`;
  const options = {
    method: 'get',
    headers: { 'Authorization': 'Basic ' + settings.authToken, 'Accept': 'application/json' },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();

  if (responseCode === 200) {
    const json = JSON.parse(response.getContentText());
    if (!json.attributes || json.attributes.length === 0) {
      throw new Error("No skill types were found in your Zendesk instance.");
    }
    return json.attributes.map(attr => ({ id: attr.id, name: attr.name }));
  } else {
    throw new Error(`Failed to fetch skill types. Zendesk responded with code ${responseCode}. Check your settings (subdomain, permissions) and try again.`);
  }
}

/**
 * Reads the sheet and creates the skills, writing status back to each row.
 * @param {string} selectedSkillTypeId The ID of the skill type chosen by the user.
 */
function processCreation(selectedSkillTypeId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; // Use the very first sheet
  const settings = getSettings();
  
  const startRow = settings.ignoreHeader ? 2 : 1;
  if(sheet.getLastRow() < startRow) {
      SpreadsheetApp.getUi().alert("There is no data to process.");
      return;
  }
  const dataRange = sheet.getRange(startRow, 1, sheet.getLastRow() - startRow + 1, sheet.getLastColumn() || 1);
  const skillValues = dataRange.getValues();
  
  // Find or create the status column
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  const headers = headerRange.getValues()[0];
  let statusCol = headers.indexOf(STATUS_COLUMN_HEADER) + 1;
  if (statusCol === 0) {
    statusCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusCol).setValue(STATUS_COLUMN_HEADER).setFontWeight('bold');
  }

  const zendeskEndpoint = `https://${settings.subdomain}.zendesk.com/api/v2/routing/attributes/${selectedSkillTypeId}/values`;
  const postHeaders = { 'Authorization': 'Basic ' + settings.authToken, 'Content-Type': 'application/json' };

  let successCount = 0;
  let failCount = 0;
  
  skillValues.forEach((row, index) => {
    const currentRowIndex = startRow + index;
    const statusCell = sheet.getRange(currentRowIndex, statusCol);
    const skillName = row[0]; // Skill is always in the first column
    
    if (skillName && skillName.toString().trim() !== '') {
      statusCell.setValue('Processing...').setBackground('#efefef');
      SpreadsheetApp.flush(); // Apply visual changes immediately
      
      const requestBody = { attribute_value: { name: skillName.toString().trim() } };
      const options = {
        method: 'post',
        headers: postHeaders,
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      };

      try {
        const response = UrlFetchApp.fetch(zendeskEndpoint, options);
        if (response.getResponseCode() === 201) { // 201 Created
          statusCell.setValue('Success').setBackground('#d9ead3'); // Green
          successCount++;
        } else {
          const errorText = response.getContentText() || `HTTP Error ${response.getResponseCode()}`;
          statusCell.setValue(`Failed: ${errorText}`).setBackground('#f4cccc'); // Red
          failCount++;
        }
      } catch(e) {
          statusCell.setValue(`Failed: ${e.message}`).setBackground('#f4cccc');
          failCount++;
      }
    } else {
       statusCell.setValue('Skipped (empty)').setBackground('#fff2cc'); // Yellow
    }
  });

  SpreadsheetApp.getUi().alert(`Process finished. Success: ${successCount}. Failed: ${failCount}.`);
}