FEATURES = [
 {"id":"terminal","name":"Terminal tools","status":"implemented","safety":"workspace + approval policy"},
 {"id":"filesystem","name":"Filesystem tools","status":"implemented","safety":"workspace-scoped"},
 {"id":"memory","name":"Persistent memory","status":"implemented","safety":"local SQLite"},
 {"id":"skills","name":"Self-growing skills","status":"implemented","safety":"test + human approval + rollback"},
 {"id":"scheduled_tasks","name":"Scheduled tasks","status":"planned","safety":"explicit schedules"},
 {"id":"browser","name":"Browser automation","status":"planned","safety":"allowlisted domains"},
 {"id":"mcp","name":"MCP tool servers","status":"planned","safety":"allowlist"},
 {"id":"delegation","name":"Sub-agent delegation","status":"planned","safety":"isolated task budgets"},
 {"id":"voice","name":"Voice / wake word","status":"planned","safety":"local device permissions"},
 {"id":"mobile","name":"Android + Termux","status":"foundation","safety":"user-approved device actions"},
]
def catalog(): return FEATURES
