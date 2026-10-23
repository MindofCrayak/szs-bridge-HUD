function setupSZSDatabase() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const spreadsheet = SpreadsheetApp.create('SZS CRM Master Database');
    const clientsSheet = spreadsheet.getSheets()[0];
    clientsSheet.setName('Clients');

    const headers = [
      'ClientID',
      'ClientName',
      'ContactEmail',
      'Archetype',
      'PipelineStage',
      'ActiveRoadblock',
      'ContractValue',
      'DepositPaid',
      'CurrentMilestone',
      'CompletedMilestones',
      'TotalMilestones',
      'DriveFolderUrl',
      'ChatSpaceUrl',
      'NotesDocUrl',
    ];

    const clients = [
      ['C-101', 'Jake', '', 'Tradesman', '00: Discovery', 'Confirm project scope', 6500, false, 'Initial consultation', 0, 4, '', '', ''],
      ['C-102', 'Marco', '', 'Tech-Savvy Game Dev', '05: Builds', 'Review sprint priorities', 12500, true, 'Gameplay prototype', 2, 4, '', '', ''],
      ['C-103', 'Cassie', '', 'Veterinarian', '04: Session Zero Kickoff', 'Gather practice requirements', 8400, false, 'Discovery session', 1, 5, '', '', ''],
      ['C-104', 'Rachel', '', 'Dance Program Owner', '00: Discovery', 'Schedule onboarding call', 7200, false, 'Initial consultation', 0, 4, '', '', ''],
      ['C-105', 'Tobias', '', 'RPG Game Dev / Stage Manager', '05: Builds', 'Approve production timeline', 15800, true, 'Production planning', 2, 5, '', '', ''],
      ['C-106', 'Ax', '', 'Innovative Tech Startup', '04: Session Zero Kickoff', 'Confirm launch objectives', 18400, false, 'Discovery session', 1, 5, '', '', ''],
    ];

    clientsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    clientsSheet.getRange(2, 1, clients.length, headers.length).setValues(clients);
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

function getTodayCalendarEvents() {
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
