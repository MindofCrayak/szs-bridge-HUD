function getAuthorizedMasterControlUser_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const allowedUsers = getConfiguredEmailList_('AUTHORIZED_USER_EMAILS');

  if (!email || !allowedUsers.includes(email)) {
    throw createRouterError_('A configured, authenticated Workspace user is required.', 'UNAUTHORIZED', 401);
  }
  return email;
}

function isPipelineOverrideUser_(email) {
  return getConfiguredEmailList_('PIPELINE_OVERRIDE_EMAILS').includes(
    String(email || '').trim().toLowerCase()
  );
}

function getAuthorizedPoliceAuditUser_() {
  const activeEmail = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || '').trim().toLowerCase();
  const allowedUsers = getConfiguredEmailList_('POLICE_AUDIT_EMAILS');
  const actor = activeEmail || effectiveEmail;

  if (!actor || !allowedUsers.includes(actor)) {
    throw createRouterError_('A configured police-audit Workspace user is required.', 'UNAUTHORIZED', 401);
  }
  return actor;
}

function getConfiguredEmailList_(propertyName) {
  const value = PropertiesService.getScriptProperties().getProperty(propertyName) || '';
  return value.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

function createRouterError_(message, code, statusCode, details) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}
