function setupSZSDatabase() {
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
    ['C-101', 'Jake', '', 'Tradesman', '01: Intake', 'Confirm project scope', 6500, false, 'Initial consultation', 0, 4, '', '', ''],
    ['C-102', 'Marco', '', 'Tech-Savvy Game Dev', '03: Active Sprints', 'Review sprint priorities', 12500, true, 'Gameplay prototype', 2, 4, '', '', ''],
    ['C-103', 'Cassie', '', 'Veterinarian', '02: Session Zero', 'Gather practice requirements', 8400, false, 'Discovery session', 1, 5, '', '', ''],
    ['C-104', 'Rachel', '', 'Dance Program Owner', '01: Intake', 'Schedule onboarding call', 7200, false, 'Initial consultation', 0, 4, '', '', ''],
    ['C-105', 'Tobias', '', 'RPG Game Dev / Stage Manager', '03: Active Sprints', 'Approve production timeline', 15800, true, 'Production planning', 2, 5, '', '', ''],
    ['C-106', 'Ax', '', 'Innovative Tech Startup', '02: Session Zero', 'Confirm launch objectives', 18400, false, 'Discovery session', 1, 5, '', '', ''],
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
