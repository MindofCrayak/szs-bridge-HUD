function setupSZSDatabase_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet = SpreadsheetApp.create('SZS CRM Master Database');
    const clientsSheet = spreadsheet.getSheets()[0];
    clientsSheet.setName('Clients');

    const headers = [
      'ClientID',
      'external_id',
      'First_Name',
      'Last_Name',
      'Company_Name',
      'PrimaryContact',
      'Lead_Source',
      'ContactEmail',
      'GoogleGroupEmail',
      'Archetype',
      'PipelineStage',
      'ActiveRoadblock',
      'ContractValue',
      'DepositPaid',
      'CurrentMilestone',
      'CompletedMilestones',
      'TotalMilestones',
      'RootFolderID',
      'MSA_DocID',
      'ProjectFolderID',
      'SOW_DocID',
      'MeetingNotes_DriveFolderID',
      'DriveFolderUrl',
      'ChatSpaceUrl',
      'NotesDocUrl',
    ];

    clientsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    clientsSheet.setFrozenRows(1);
    clientsSheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#086375')
      .setFontColor('#ddfbd0');
    clientsSheet.autoResizeColumns(1, headers.length);

    return spreadsheet.getUrl();
  } finally {
    lock.releaseLock();
  }
}

function getTodayCalendarEvents_() {
  const timeZone = Session.getScriptTimeZone();
  const events = CalendarApp.getEventsForDay(new Date());

  return JSON.stringify(
    events.map(function (event) {
      return {
        title: event.getTitle(),
        startTime: Utilities.formatDate(
          event.getStartTime(),
          timeZone,
          "yyyy-MM-dd'T'HH:mm:ss"
        ),
      };
    }),
    null,
    2
  );
}
