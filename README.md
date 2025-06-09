# Zendesk Bulk Uploader for Google Sheets

Testing clasp integration to ensure that all pushes to Master are also pushed to the sheet via clasp

This Google Apps Script provides a user-friendly tool within a Google Sheet to bulk create skill attributes (e.g., countries, languages, products) in your Zendesk instance. It's designed for Zendesk administrators who need to add many attribute values without tedious manual entry.

---

## Features

* **Bulk Creation:** Add hundreds of skills from a simple list in a Google Sheet.
* **Dynamic Skill Type Selection:** A user-friendly dialog fetches your Zendesk "Skill Types" (Attributes) in real-time, so you can choose where to add your new skills.
* **Secure Credential Storage:** Uses a settings panel to securely store your Zendesk subdomain and credentials within the Google Sheet itself, not in the code.
* **Row-by-Row Status Feedback:** The script provides "Success" or "Failed" feedback in a new column for each row, so you know exactly what worked.
* **User-Friendly Interface:** All actions are performed through a custom "Zendesk Bulk Uploader" menu in the sheet.

---

## Important: About Zendesk Skill Limits

Before you begin, it's important to be aware of the default limitations on skills within Zendesk. This tool can help you add skills quickly, but it cannot bypass Zendesk's platform limits.

* **Standard Limit:** By default, Zendesk accounts are typically limited to **10 skill types**, with a maximum of **30 skills per type** (for a total of 300 skills).

* **Requesting an Increase:** If you require more skills, you can contact Zendesk Support to request an increase. They can often raise the allowance significantly, up to **1,000 skills per skill type**, for a potential total of 10,000 skills across your account.

I recommend checking your current usage and future needs before performing a very large upload.

---

## Setup Instructions

Follow these steps to get the tool working in your own Google Account. This should take less than 5 minutes.

### 1. Make a Copy of the Google Sheet
First, open the master Google Sheet and make your own copy. The sheet is read-only, so making a copy is required.

* **[Click here to get your copy of the Google Sheet]([https://docs.google.com/spreadsheets/d/1ejAFJaHDIOkXEvMPU3IlIs6iBUHwLJxD5e_bdQsW5I4/edit?usp=sharing])**
* Click the **"Make a copy"** button. The new sheet will be saved in your own Google Drive.

### 2. Configure Your Settings
In your new sheet, you need to tell the script how to connect to your Zendesk instance.
* Click the custom menu **Zendesk Bulk Uploader > Settings**.
* A sidebar will appear on the right.
* Enter your **Zendesk Subdomain**, your **Zendesk Admin Email**, and an active **Zendesk API Token**.
* Check the "First row is a header" box if your list has a title in the first row.
* Click **"Save Settings"**.

> **Note on API Tokens:** A Zendesk API Token can be created under **Admin Center > Apps and integrations > APIs > Zendesk API**.

### 3. Authorize the Script
The first time you run the script, Google will ask for your permission. This is a standard security step.
1.  Click **Zendesk Bulk Uploader > Create Skills**.
2.  A dialog titled "Authorization Required" will appear. Click **"Continue"**.
3.  Choose your Google account.
4.  You will see a screen that says **"Google hasn’t verified this app"**. This is expected. Click the small **"Advanced"** link.
5.  Click on the link at the bottom that says **"Go to [Project Name] (unsafe)"**.
6.  Review the permissions the script needs and click **"Allow"**.

---

## How to Use

1.  **Add Your Data:** In the first column of the first sheet (e.g., "Sheet1"), paste the list of skills you want to create (e.g., a list of countries).
2.  **Run the Uploader:** Click **Zendesk Bulk Uploader > Create Skills**.
3.  **Select the Skill Type:** A dialog will appear, populated with the actual Skill Types from your Zendesk instance. Select the one you want to update (e.g., "Country Specialization").
4.  **Click "Create Skills"**.
5.  **Check the Results:** The script will process each row. A new column named **"Upload Status"** will appear and update in real-time with "Success" or a specific failure reason.

---

## A Note on Security and Trust

Your security is paramount. It's important to understand how this tool works and how your data is handled.

### Your Code is Under Your Control

When you make a copy of this Google Sheet, you also create your own private copy of the Apps Script code. **This code runs entirely within your Google Account.** The original author **cannot** change or access the code in your copy of the sheet after you have made it. You have full control.

### How to Safely Update in the Future

If this tool is updated in the future, you may want to incorporate the improvements. To do so safely, you should **never blindly copy and paste new code**. The recommended, secure process is as follows:

1.  **Fork this Repository:** Create your own "fork" (a personal copy) of this GitHub repository.
2.  **Review Changes:** When an update is made to the main repository, GitHub will show you that your fork is "behind". You can easily view a "diff" or "comparison" that shows you exactly which lines of code were added, changed, or removed.
3.  **Apply Updates Manually:** Only after you have reviewed the changes and confirmed they are safe and legitimate should you manually copy the new code into your own script editor.

This process ensures that you are always in control and no malicious code can be introduced into your account without your explicit knowledge and review.

---

## Disclaimer

This tool is not an official product of Zendesk. It is an open-source project created by me to help the Zendesk administrator community. Use at your own risk.