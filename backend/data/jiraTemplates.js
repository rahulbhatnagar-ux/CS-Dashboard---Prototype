// ══════════════════════════════════════════════════════════════
// Jira Ticket Templates — CSE & CTI Boards
// Based on analysis of real CSE (66,465 tickets) and CTI (1,356 tickets)
// ══════════════════════════════════════════════════════════════

// CC Lists — actual Jira team tags and @mentions
const CC_LISTS = {
  customerOps: '[Customer operations](https://pgb-jira.atlassian.net/jira/people/team/36ec4978-eae6-4d68-aef9-0392d9f231b6) (@Achmad Andriansyah @Ainani khalishah @Bayu Ardianto @bryda.arifa @siti.nurmuthmahinnah)',
  csrTeam: '[CSR Team](https://pgb-jira.atlassian.net/jira/people/team/59a985b3-a1cb-4cfb-b481-d46f496ee520) (@Muhammad Iqbal @septyan.eka @Kartini Kartini)',
  ceLeader: '[CE Leader](https://pgb-jira.atlassian.net/jira/people/team/a05d4d38-ae8c-4d48-bfd9-287a4ec7f6a2) (@Embut Pangestu @steven.jahja @Tri Anisah @Jonathan Soeparjadi @Aldi Kurniadi @Melisa Grace Sekarmadidjaja)',
  csrPslTeam: '[CSR x PSL Team](https://pgb-jira.atlassian.net/jira/people/team/c86d9c5f-62ce-4c69-bb54-7f99e8dd4892) (@Nurul Aini Ihsani @Dimas Ade @Muhammad Ridwan @angga.dwi @Muhammad Iqbal @septyan.eka @Kartini Kartini)',
  pslTeam: '[PSL Team](https://pgb-jira.atlassian.net/jira/people/team/05699c1a-6f40-4fa0-9f2c-87709e19a257) (@Nurul Aini Ihsani @Dimas Ade @Muhammad Ridwan @angga.dwi)',
  finops: '[Finops](https://pgb-jira.atlassian.net/jira/people/team/b4ffab5f-2289-491b-aaf5-8fa501331176) (@Brian Marshal Wijaya @Dede Sri Hartati @Nurul Meutia Salsabila @isma.khairani)',
};

// Assignee mapping — Jira account IDs
const ASSIGNEES = {
  'siti.nurmuthmahinnah': { id: '62a9b57d979e6e00690575ab', name: 'Siti Nurmuthmahinnah' },
  'indah.mutiara': { id: '712020:8e86208a-5afd-413b-8b84-32b2c7535caa', name: 'Indah Mutiara' },
  'ivic.junior': { id: '712020:29d82cf0-c556-4f4c-949c-242d81772978', name: 'Ivic Junior' },
  'raman.bindal': { id: '5dfb55ed4517db0caf3743bf', name: 'Raman Bindal' },
  'abhishek.kumar': { id: '712020:b98371c6-3428-4c2a-a624-61eed1a1cb12', name: 'Abhishek Kumar' },
  'rajan.srivastava': { id: '6200c214c4e2c9006ae5463a', name: 'Rajan Srivastava' },
  'karan.sudhendran': { id: '634d2bdc01c2ff842c1587f2', name: 'Karan Sudhendran' },
  'muhammad.iqbal': { id: '712020:3f82b4d6-f987-4d6e-a411-9aa049f7ea76', name: 'Muhammad Iqbal' },
};

// ══════════════════════════════════════════════════════════════
// CSE TEMPLATES
// ══════════════════════════════════════════════════════════════

const CSE_TEMPLATES = {

  NAME_ADJUSTMENT: {
    label: 'Name Adjustment',
    summaryPattern: 'Request Adjustment Name - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Dear @siti.nurmuthmahinnah

Please kindly consider the name adjustment because the registered name doesn't match with e-KTP. Here are the details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

| Basic Kyc Status | {BASIC_KYC_STATUS} |
| --- | --- |
| MF Kyc Status | {MF_KYC_STATUS} |
| GSS Kyc Status | {GSS_KYC_STATUS} |
| IDSS Kyc Status | {IDSS_KYC_STATUS} |
| Status | {ACCOUNT_STATUS} |

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

**ACCOUNT IS NOT REGISTERED IN PAHAM**

**Pluang Plus users: {PLUANG_PLUS_STATUS}**

| **IDENTITY CARD** | **SELF POTRAIT** |
| --- | --- |
| {KTP_IMAGE_PLACEHOLDER} | {SELFIE_IMAGE_PLACEHOLDER} |

Kindly adjust the name according to e-KTP: **{CORRECTED_NAME_PLACEHOLDER}**

Salesforce ticket number is {SF_TICKET_NUMBER} **({CASE_ORIGIN})**

{SF_SCREENSHOT_PLACEHOLDER}

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'CORRECTED_NAME_PLACEHOLDER', label: 'Corrected Name (from e-KTP)', type: 'text', required: true },
      { key: 'BASIC_KYC_STATUS', label: 'Basic KYC Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED', 'N/A'], default: 'VERIFIED' },
      { key: 'MF_KYC_STATUS', label: 'MF KYC Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED', 'N/A'], default: 'N/A' },
      { key: 'GSS_KYC_STATUS', label: 'GSS KYC Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED', 'N/A'], default: 'VERIFIED' },
      { key: 'IDSS_KYC_STATUS', label: 'IDSS KYC Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED', 'N/A'], default: 'N/A' },
      { key: 'ACCOUNT_STATUS', label: 'Account Status', type: 'select', options: ['Active', 'InActive'], default: 'Active' },
      { key: 'PLUANG_PLUS_STATUS', label: 'Pluang Plus', type: 'select', options: ['YES', 'NO'], default: 'NO' },
    ],
  },

  BCA_TOPUP_VERIFY: {
    label: 'BCA Top Up Verify',
    summaryPattern: 'Double Check BCA Direct Top Up Approve - {USER_NAME} - {USER_ID}',
    assignee: 'indah.mutiara',
    ccList: ['customerOps', 'csrPslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi Mba @Indah Mutiara

Kindly need your help to check :

| User Id | **{USER_ID}** |
| --- | --- |
| Name | **{USER_NAME}** |
| User's details | {GOOGLE_SHEET_LINK_PLACEHOLDER} |

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

The top up is generated by {GENERATED_BY}

For the Top Up to be approved, please provide us **proof of payment from user showing the source account number or transaction time.**

Thank you

cc {CC_LIST}`,
    editableFields: [
      { key: 'GENERATED_BY', label: 'Top up generated by', type: 'select', options: ['user', 'system'], default: 'user' },
      { key: 'GOOGLE_SHEET_LINK_PLACEHOLDER', label: 'Google Sheet Link (row URL)', type: 'text', required: false },
    ],
  },

  TOPUP_ISSUE: {
    label: 'Top Up Issue',
    summaryPattern: '[Pluang Plus] Top Up Direct BCA Issue - {PAIN_POINT_SHORT} - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['ceLeader', 'customerOps', 'pslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Dear Kak @siti.nurmuthmahinnah

Kindly help to check the following user's top up transaction status. Here are the details:

| **User Id** | {USER_ID} |
| --- | --- |
| **Name** | {USER_NAME} |
| **Top up Detail** | Trans ID/ No Ref → {TRANS_ID} Current Account Number → {ACCOUNT_NUMBER} Date time → {TRANSACTION_DATE} Amount → **{AMOUNT}** Exact amount → {EXACT_AMOUNT} Status → {TRANSACTION_STATUS} |

## **Case Summary**

| **Top Up Aging** | **Transaction Date:** {TRANSACTION_DATE} **Jira Created Date:** {JIRA_DATE} |
| --- | --- |
| **Pain Point** | {PAIN_POINT} |
| **Urgency** | {URGENCY} |
| **SF ID** | {SF_TICKET_NUMBER} ({CASE_ORIGIN}) |
| **Case Origin** | {CASE_ORIGIN} |
| **Analyze From CE Side** | {CE_ANALYSIS} |

## **Transaction on Admin Panel:**

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

## **Proof from user:**

| **Detail** | **Proof** |
| --- | --- |
| **Proof of Transfer** | {PROOF_TRANSFER_PLACEHOLDER} |
| **Bank details** | Bank name: {BANK_NAME} Account number: {ACCOUNT_NUMBER} User name: {USER_NAME} |

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'PAIN_POINT_SHORT', label: 'Pain Point (short, for title)', type: 'text', required: true },
      { key: 'PAIN_POINT', label: 'Pain Point (detail)', type: 'textarea', required: true },
      { key: 'URGENCY', label: 'Urgency', type: 'textarea', required: true },
      { key: 'CE_ANALYSIS', label: 'CE Analysis', type: 'textarea', required: true },
      { key: 'TRANS_ID', label: 'Transaction ID / Ref', type: 'text' },
      { key: 'ACCOUNT_NUMBER', label: 'Account Number', type: 'text' },
      { key: 'TRANSACTION_DATE', label: 'Transaction Date', type: 'text' },
      { key: 'AMOUNT', label: 'Amount (IDR)', type: 'text' },
      { key: 'EXACT_AMOUNT', label: 'Exact Amount', type: 'text' },
      { key: 'TRANSACTION_STATUS', label: 'Transaction Status', type: 'select', options: ['Success on Bank', 'Pending', 'Failed'], default: 'Success on Bank' },
      { key: 'BANK_NAME', label: 'Bank Name', type: 'text' },
    ],
  },

  RESET_AUTHENTICATOR: {
    label: 'Reset Authenticator',
    summaryPattern: 'Request Reset Authenticator - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['ceLeader', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi @siti.nurmuthmahinnah ,

Kindly need your help, the user forgets his authenticator code/key and the user want to reset authenticator. Here are the details:

| User ID | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

## Supporting details:

| Device Brand | {DEVICE_BRAND} |
| --- | --- |
| Device Type | {DEVICE_TYPE} |
| Operation System | {OS} |
| Checked in Looker | {LOOKER_CHECK_PLACEHOLDER} |
| User balance in Pluang account | {BALANCE_PLACEHOLDER} |

Proof of user request in SF and ticket number in SF {SF_TICKET_NUMBER}, {CASE_ORIGIN}

{SF_SCREENSHOT_PLACEHOLDER}

## **Supporting data From user :**

| Video verification | {VIDEO_LINK_PLACEHOLDER} |
| --- | --- |

cc {CC_LIST}`,
    editableFields: [
      { key: 'DEVICE_BRAND', label: 'Device Brand', type: 'text' },
      { key: 'DEVICE_TYPE', label: 'Device Type (model)', type: 'text' },
      { key: 'OS', label: 'OS', type: 'select', options: ['Android', 'iOS'], default: 'Android' },
      { key: 'VIDEO_LINK_PLACEHOLDER', label: 'Video Verification Link', type: 'text' },
    ],
  },

  USD_TOPUP_DIRECT: {
    label: 'USD Top Up Direct',
    summaryPattern: '[Pluang Plus] Top up USD Direct Deposit - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'finops', 'pslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi Team Ops @siti.nurmuthmahinnah & Finance @Louis Ferdinand @Brian Marshal Wijaya

There is a user request to Top up USD Direct. Here's for details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

**Summary Case**

| **Request Top up USD Direct** | User request via {CASE_ORIGIN} that he want Top up USD direct **{USD_AMOUNT}** |
| --- | --- |
| **Ticket SF** | {SF_TICKET_NUMBER} |

| **Proof of form Top UP USD Direct** | **Proof of Transfer** |
| --- | --- |
| {TOPUP_FORM_PLACEHOLDER} | {PROOF_TRANSFER_PLACEHOLDER} |

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'USD_AMOUNT', label: 'USD Amount', type: 'text', required: true },
    ],
  },

  USD_CASHOUT_DIRECT: {
    label: 'USD Cashout Direct',
    summaryPattern: '[Pluang Plus] Request Cashout USD Direct - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['ceLeader', 'customerOps', 'pslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi pak @steven.jahja @Jonathan Soeparjadi

Kindly need your help to process USD direct withdrawal request below :

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |
| Basic Kyc Status | {BASIC_KYC_STATUS} |

**Summary Case**

| **Request Cashout USD Direct** | As request on {CASE_ORIGIN} user wants to Cashout **{USD_AMOUNT}** |
| --- | --- |
| **Bank Account Details** | Bank name: {BANK_NAME} Account number: {ACCOUNT_NUMBER} User name: {USER_NAME} Amount: **{USD_AMOUNT}** |
| **Call Confirmation** | {CALL_CONFIRMATION_PLACEHOLDER} |

| **Proof of form Cash out USD Direct** | **Photo proof of the front page of the user's BCA Bank account** | **USD Balance on Admin Panel** |
| --- | --- | --- |
| {CASHOUT_FORM_PLACEHOLDER} | {BANK_FRONT_PAGE_PLACEHOLDER} | {USD_BALANCE_PLACEHOLDER} |

Salesforce ticket number is **{SF_TICKET_NUMBER}** ({CASE_ORIGIN})

Thank you

cc {CC_LIST}`,
    editableFields: [
      { key: 'USD_AMOUNT', label: 'USD Amount', type: 'text', required: true },
      { key: 'BANK_NAME', label: 'Bank Name', type: 'text', default: 'BCA' },
      { key: 'ACCOUNT_NUMBER', label: 'Account Number', type: 'text', required: true },
      { key: 'BASIC_KYC_STATUS', label: 'KYC Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'VERIFIED' },
    ],
  },

  SWITCH_RDN: {
    label: 'Switch RDN',
    summaryPattern: 'Request Switch RDN withdrawal bank account number - {USER_NAME} - {USER_ID}',
    assignee: 'ivic.junior',
    ccList: ['customerOps', 'csrTeam', 'ceLeader'],
    issueType: 'Sub-task',
    bodyTemplate: `dear team @Ivic Junior ,

Kindly need your help to check this case, status verification Aset Indonesia is {ASET_INDO_STATUS}. Then user request to switch RDN (Rekening Dana Nasabah) withdrawal bank account number.

Here are the details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

## **Proof from user :**

| **Screenshot Notification** | **Foto KTP** | **Foto Selfie With KTP** | **Detail bank to switch :** | **Type smartphone** |
| --- | --- | --- | --- | --- |
| {SCREENSHOT_PLACEHOLDER} | {KTP_PLACEHOLDER} | {SELFIE_KTP_PLACEHOLDER} | Account name : {SWITCH_ACCOUNT_NAME} Account number : {SWITCH_ACCOUNT_NUMBER} Bank name : {SWITCH_BANK_NAME} | Merk & type : {DEVICE_TYPE} Apps version : {APP_VERSION} |

Salesforce ticket number is {SF_TICKET_NUMBER} ({CASE_ORIGIN})

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'ASET_INDO_STATUS', label: 'Aset Indonesia Status', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'VERIFIED' },
      { key: 'SWITCH_ACCOUNT_NAME', label: 'New Bank Account Name', type: 'text', required: true },
      { key: 'SWITCH_ACCOUNT_NUMBER', label: 'New Bank Account Number', type: 'text', required: true },
      { key: 'SWITCH_BANK_NAME', label: 'New Bank Name', type: 'text', required: true },
      { key: 'DEVICE_TYPE', label: 'Device Type', type: 'text' },
      { key: 'APP_VERSION', label: 'App Version', type: 'text' },
    ],
  },

  MONTHLY_STATEMENT: {
    label: 'Monthly Statement',
    summaryPattern: '[P1] Request Monthly Statement - {USER_NAME} - {USER_ID}',
    assignee: 'rajan.srivastava',
    ccList: ['csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi team,

Could you please attach the monthly user statement for the {STATEMENT_PERIOD} period. Here is the data :

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |
| Case Number | {SF_TICKET_NUMBER} |

| **User balance on admin panel** | **User assets on Pluang** |
| --- | --- |
| {BALANCE_PLACEHOLDER} | {ASSETS_PLACEHOLDER} |

{SF_SCREENSHOT_PLACEHOLDER}

Thank you.

Cc {CC_LIST}`,
    editableFields: [
      { key: 'STATEMENT_PERIOD', label: 'Statement Period', type: 'text', required: true, default: 'January 2026' },
    ],
  },

  DELETE_BANK: {
    label: 'Delete Bank Account',
    summaryPattern: 'Request Delete Bank Account - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Dear @siti.nurmuthmahinnah

Kindly need your help to delete bank account for this user. Here are the details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

**Bank Account to Delete:**
| Bank Name | {DELETE_BANK_NAME} |
| --- | --- |
| Account Number | {DELETE_ACCOUNT_NUMBER} |
| Account Name | {DELETE_ACCOUNT_NAME} |

**Reason:** {DELETE_REASON}

Salesforce ticket number is {SF_TICKET_NUMBER} ({CASE_ORIGIN})

{SF_SCREENSHOT_PLACEHOLDER}

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'DELETE_BANK_NAME', label: 'Bank Name to Delete', type: 'text', required: true },
      { key: 'DELETE_ACCOUNT_NUMBER', label: 'Account Number', type: 'text', required: true },
      { key: 'DELETE_ACCOUNT_NAME', label: 'Account Name', type: 'text', required: true },
      { key: 'DELETE_REASON', label: 'Reason for Deletion', type: 'textarea', required: true },
    ],
  },

  RESET_PIN: {
    label: 'Reset PIN',
    summaryPattern: 'Request Reset PIN - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi @siti.nurmuthmahinnah ,

Kindly need your help, the user want to reset PIN. Here are the details:

| User ID | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

## Supporting details:

| Device Brand | {DEVICE_BRAND} |
| --- | --- |
| Device Type | {DEVICE_TYPE} |
| OS | {OS} |

Proof of user request in SF and ticket number in SF {SF_TICKET_NUMBER}, {CASE_ORIGIN}

{SF_SCREENSHOT_PLACEHOLDER}

## **Supporting data From user :**

| Video verification | {VIDEO_LINK_PLACEHOLDER} |
| --- | --- |

cc {CC_LIST}`,
    editableFields: [
      { key: 'DEVICE_BRAND', label: 'Device Brand', type: 'text' },
      { key: 'DEVICE_TYPE', label: 'Device Type', type: 'text' },
      { key: 'OS', label: 'OS', type: 'select', options: ['Android', 'iOS'], default: 'Android' },
      { key: 'VIDEO_LINK_PLACEHOLDER', label: 'Video Verification Link', type: 'text' },
    ],
  },

  CASHOUT_ISSUE: {
    label: 'Cashout Issue',
    summaryPattern: 'Cashout Issue - {PAIN_POINT_SHORT} - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['ceLeader', 'customerOps', 'pslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Dear Kak @siti.nurmuthmahinnah

Kindly help to check the following user's cashout transaction status. Here are the details:

| **User Id** | {USER_ID} |
| --- | --- |
| **Name** | {USER_NAME} |

## **Case Summary**

| **Pain Point** | {PAIN_POINT} |
| --- | --- |
| **Urgency** | {URGENCY} |
| **SF ID** | {SF_TICKET_NUMBER} ({CASE_ORIGIN}) |
| **CE Analysis** | {CE_ANALYSIS} |

## **Transaction on Admin Panel:**

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'PAIN_POINT_SHORT', label: 'Pain Point (short, for title)', type: 'text', required: true },
      { key: 'PAIN_POINT', label: 'Pain Point (detail)', type: 'textarea', required: true },
      { key: 'URGENCY', label: 'Urgency', type: 'textarea', required: true },
      { key: 'CE_ANALYSIS', label: 'CE Analysis', type: 'textarea', required: true },
    ],
  },

  GENERAL: {
    label: 'General',
    summaryPattern: '{CUSTOM_SUMMARY} - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi Team,

Here are the details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

**Case Summary:** {CASE_SUMMARY}

Salesforce ticket number is {SF_TICKET_NUMBER} ({CASE_ORIGIN})

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'CUSTOM_SUMMARY', label: 'Ticket Summary', type: 'text', required: true },
      { key: 'CASE_SUMMARY', label: 'Case Summary', type: 'textarea', required: true },
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// CTI TEMPLATES
// ══════════════════════════════════════════════════════════════

const CTI_TEMPLATES = {

  BUG_REPORT: {
    label: 'Bug Report',
    summaryPattern: '[{PRIORITY}] {BUG_FEATURE} - {USER_NAME} - {USER_ID}',
    assignee: 'raman.bindal',
    ccList: ['ceLeader', 'csrPslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi We have received a report from a user stating that {BUG_DESCRIPTION}

### Here are user detail :

| User Id | {USER_ID} |
| --- | --- |
| User Name | {USER_NAME} |
| Case Number | {SF_TICKET_NUMBER} |

### Detail Case

| Summary | {BUG_DESCRIPTION} |
| --- | --- |
| Detail Device | {DEVICE_TYPE} {OS} App Version {APP_VERSION} |

### Attachment

{SCREENSHOT_PLACEHOLDER}

Thank You

Cc {CC_LIST}`,
    editableFields: [
      { key: 'BUG_FEATURE', label: 'Feature Name (for title)', type: 'text', required: true },
      { key: 'BUG_DESCRIPTION', label: 'Bug Description', type: 'textarea', required: true },
      { key: 'DEVICE_TYPE', label: 'Device Type', type: 'text' },
      { key: 'OS', label: 'OS Version', type: 'text' },
      { key: 'APP_VERSION', label: 'App Version', type: 'text' },
      { key: 'PRIORITY', label: 'Priority', type: 'select', options: ['P0', 'P1', 'P2'], default: 'P0' },
    ],
  },

  CRYPTO_TRANSFER_ISSUE: {
    label: 'Crypto Transfer Issue',
    summaryPattern: '[P0] Crypto {TRANSFER_DIRECTION} Issue Status {TRANSFER_STATUS} [{DETAIL_TYPE}] - {USER_NAME} - {USER_ID}',
    assignee: 'muhammad.iqbal',
    ccList: ['ceLeader', 'csrPslTeam', 'customerOps'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi

User reports that he has {TRANSFER_DIRECTION_DETAIL} the **{ASSET_NAME}** from {FROM_LOCATION} to {TO_LOCATION} with **{NETWORK}** network but it hasn't been received yet. Can you help credit it to the user account?. Below are the details :

## **Mandatory 1**

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

## **Mandatory 2 (Transaction Details)**

| **Asset Name** | **{ASSET_NAME}** |
| --- | --- |
| **Asset Quantity** | {ASSET_QUANTITY} **{ASSET_NAME}** |
| **Network** | **{NETWORK}** |
| **Detail Wallet Transaction** | {TRANSFER_DIRECTION_DETAIL} |
| **[FROM] Wallet Address** | {FROM_WALLET} |
| **[TO] Wallet Address** | {TO_WALLET} |
| **Blockexplorer/Trx Hash** | {TX_HASH} |
| **Transaction Date** | {TRANSACTION_DATE} |

## **Case Summary**

| **Transfer Crypto Aging** | {AGING} |
| --- | --- |
| **Pain Point** | {PAIN_POINT} |
| **Urgency** | {URGENCY} |
| **SF ID** | {SF_TICKET_NUMBER} ({CASE_ORIGIN}) |
| **Error Type** | {ERROR_TYPE} |
| **Analyze From CE Side and Checking Requirement** | {CE_ANALYSIS} |

## **M2 Supporting**

| **Detail Transaction** | **Wallet Address Received** |
| --- | --- |
| {TX_DETAIL_PLACEHOLDER} | {WALLET_RECEIVED_PLACEHOLDER} |

## **Checking on Looker Studio**

{LOOKER_PLACEHOLDER}

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'ASSET_NAME', label: 'Asset Name (e.g. USDT, BNB)', type: 'text', required: true },
      { key: 'ASSET_QUANTITY', label: 'Asset Quantity', type: 'text', required: true },
      { key: 'NETWORK', label: 'Network (e.g. BEP-20, TRC-20)', type: 'text', required: true },
      { key: 'TRANSFER_DIRECTION', label: 'Direction (Sent/Received)', type: 'select', options: ['Sent', 'Received'], default: 'Received' },
      { key: 'TRANSFER_DIRECTION_DETAIL', label: 'Direction Detail', type: 'text', default: 'External to Pluang' },
      { key: 'TRANSFER_STATUS', label: 'Status', type: 'select', options: ['Success', 'Pending', 'Failed'], default: 'Success' },
      { key: 'DETAIL_TYPE', label: 'Detail Type', type: 'select', options: ['Correct Details', 'Wrong Address', 'Wrong Network'], default: 'Correct Details' },
      { key: 'FROM_LOCATION', label: 'From', type: 'text', default: 'External' },
      { key: 'TO_LOCATION', label: 'To', type: 'text', default: 'Pluang' },
      { key: 'FROM_WALLET', label: 'From Wallet Address', type: 'text', required: true },
      { key: 'TO_WALLET', label: 'To Wallet Address', type: 'text', required: true },
      { key: 'TX_HASH', label: 'Transaction Hash', type: 'text', required: true },
      { key: 'TRANSACTION_DATE', label: 'Transaction Date', type: 'text', required: true },
      { key: 'AGING', label: 'Aging', type: 'text', default: '< 1 days' },
      { key: 'PAIN_POINT', label: 'Pain Point', type: 'textarea', required: true },
      { key: 'URGENCY', label: 'Urgency', type: 'textarea', required: true },
      { key: 'ERROR_TYPE', label: 'Error Type', type: 'text', default: 'Crypto transfer transaction on Admin Panel is not found' },
      { key: 'CE_ANALYSIS', label: 'CE Analysis', type: 'textarea' },
    ],
  },

  KYC_EDD_ISSUE: {
    label: 'KYC/EDD Issue',
    summaryPattern: '[P1] {KYC_TYPE} Verification Issue - {USER_NAME} - {USER_ID}',
    assignee: 'abhishek.kumar',
    ccList: ['customerOps', 'csrTeam', 'ceLeader'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi,

We have received a report that the user is unable to proceed with the {KYC_TYPE} verification process. {ERROR_DETAIL}

#### Here are user details :

| User Id | {USER_ID} |
| --- | --- |
| User Name | {USER_NAME} |
| Case Number | {SF_TICKET_NUMBER} |

{ADMIN_PANEL_SCREENSHOTS_PLACEHOLDER}

## Supporting Details

| **Phone brand & type** | {DEVICE_TYPE} |
| --- | --- |
| **Android version** | {OS_VERSION} |
| **App version** | {APP_VERSION} |
| **Screen recording** | {SCREENSHOT_PLACEHOLDER} |

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'KYC_TYPE', label: 'Verification Type', type: 'select', options: ['EDD', 'Aset Indonesia', 'Basic KYC', 'Bank'], default: 'EDD' },
      { key: 'ERROR_DETAIL', label: 'Error Detail', type: 'textarea', required: true },
      { key: 'DEVICE_TYPE', label: 'Phone Brand & Type', type: 'text' },
      { key: 'OS_VERSION', label: 'OS Version', type: 'text' },
      { key: 'APP_VERSION', label: 'App Version', type: 'text' },
    ],
  },

  ACCOUNT_REACTIVATION: {
    label: 'Account Reactivation',
    summaryPattern: '[P0] Request Reactivate Account Suspicious Activity - {USER_NAME} - {USER_ID}',
    assignee: 'siti.nurmuthmahinnah',
    ccList: ['customerOps', 'csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi

Kindly help check the issue of a request to reactivate Pluang account because previously there's suspicious activity. Here are the details :

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

| Basic Kyc Status | {BASIC_KYC_STATUS} |
| --- | --- |
| MF Kyc Status | {MF_KYC_STATUS} |
| GSS Kyc Status | {GSS_KYC_STATUS} |
| IDSS Kyc Status | {IDSS_KYC_STATUS} |
| Status | InActive |

**ACCOUNT IS NOT REGISTERED IN PAHAM**

**Pluang Plus users: {PLUANG_PLUS_STATUS}**

## CE ANALYZE:

{CE_ANALYSIS}

| **ID Card** | **SELF POTRAIT** |
| --- | --- |
| {KTP_PLACEHOLDER} | {SELFIE_PLACEHOLDER} |

Salesforce ticket number is {SF_TICKET_NUMBER} ({CASE_ORIGIN})

{SF_SCREENSHOT_PLACEHOLDER}

## **Supporting details:**

| **Screenshot proof transaction:** |
| --- |
| {PROOF_PLACEHOLDER} |

## **Device Check :**

{DEVICE_CHECK}

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'CE_ANALYSIS', label: 'CE Analysis (suspicious activity detail)', type: 'textarea', required: true },
      { key: 'BASIC_KYC_STATUS', label: 'Basic KYC', type: 'select', options: ['VERIFIED', 'PENDING', 'REJECTED'], default: 'VERIFIED' },
      { key: 'MF_KYC_STATUS', label: 'MF KYC', type: 'select', options: ['VERIFIED', 'N/A'], default: 'N/A' },
      { key: 'GSS_KYC_STATUS', label: 'GSS KYC', type: 'select', options: ['VERIFIED', 'N/A'], default: 'VERIFIED' },
      { key: 'IDSS_KYC_STATUS', label: 'IDSS KYC', type: 'select', options: ['VERIFIED', 'N/A'], default: 'N/A' },
      { key: 'PLUANG_PLUS_STATUS', label: 'Pluang Plus', type: 'select', options: ['YES', 'NO'], default: 'NO' },
      { key: 'DEVICE_CHECK', label: 'Device Check Notes', type: 'text', default: '-' },
    ],
  },

  MONTHLY_STATEMENT: {
    label: 'Monthly Statement',
    summaryPattern: '[P1] Request Monthly Statement - {USER_NAME} - {USER_ID}',
    assignee: 'rajan.srivastava',
    ccList: ['csrTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi team,

Could you please attach the monthly user statement for the {STATEMENT_PERIOD} period. Here is the data :

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |
| Case Number | {SF_TICKET_NUMBER} |

| **User balance on admin panel** | **User assets on Pluang** |
| --- | --- |
| {BALANCE_PLACEHOLDER} | {ASSETS_PLACEHOLDER} |

{SF_SCREENSHOT_PLACEHOLDER}

Thank you.

Cc {CC_LIST}`,
    editableFields: [
      { key: 'STATEMENT_PERIOD', label: 'Statement Period', type: 'text', required: true, default: 'January 2026' },
    ],
  },

  GENERAL: {
    label: 'General',
    summaryPattern: '[{PRIORITY}] {CUSTOM_SUMMARY} - {USER_NAME} - {USER_ID}',
    assignee: 'raman.bindal',
    ccList: ['ceLeader', 'csrPslTeam'],
    issueType: 'Sub-task',
    bodyTemplate: `Hi Team,

Here are the details:

| User Id | {USER_ID} |
| --- | --- |
| Name | {USER_NAME} |

**Case Summary:** {CASE_SUMMARY}

Salesforce ticket number is {SF_TICKET_NUMBER} ({CASE_ORIGIN})

Thank you.

cc {CC_LIST}`,
    editableFields: [
      { key: 'CUSTOM_SUMMARY', label: 'Ticket Summary', type: 'text', required: true },
      { key: 'CASE_SUMMARY', label: 'Case Summary', type: 'textarea', required: true },
      { key: 'PRIORITY', label: 'Priority', type: 'select', options: ['P0', 'P1', 'P2'], default: 'P0' },
    ],
  },
};

module.exports = { CSE_TEMPLATES, CTI_TEMPLATES, CC_LISTS, ASSIGNEES };
