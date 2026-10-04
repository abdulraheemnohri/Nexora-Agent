import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getUiSettings, updateUiSettings, resetUiSettingsSection } from "../src/ui-settings.js";

const temp=fs.mkdtempSync(path.join(os.tmpdir(),"nexora-settings-"));
process.env.NEXORA_DATA=temp;

test("UI settings expose defaults without credentials",()=>{
  const settings=getUiSettings();
  assert.equal(settings.general.theme,"dark");
  assert.equal(settings.permissions.approvalMode,"ask");
  assert.equal(settings.security.bindHost,"127.0.0.1");
  assert.equal(Object.hasOwn(settings.providers,"apiKey"),false);
});

test("UI settings persist validated values",()=>{
  const updated=updateUiSettings({general:{language:"ur",compactMode:true},scheduler:{maxRetries:5}});
  assert.equal(updated.general.language,"ur");
  assert.equal(updated.general.compactMode,true);
  assert.equal(updated.scheduler.maxRetries,5);
  assert.equal(getUiSettings().scheduler.maxRetries,5);
});

test("UI settings reject unknown sections and invalid value types",()=>{
  assert.throws(()=>updateUiSettings({unknown:{enabled:true}}),/Unknown settings section/);
  assert.throws(()=>updateUiSettings({general:{compactMode:"yes"}}),/Invalid type/);
  assert.throws(()=>updateUiSettings({permissions:{approvalMode:"unrestricted"}}),/Invalid value/);
});

test("UI settings can reset a section to defaults",()=>{
  updateUiSettings({general:{language:"ur",theme:"light"}});
  const reset=resetUiSettingsSection("general");
  assert.equal(reset.general.language,"en");
  assert.equal(reset.general.theme,"dark");
  assert.throws(()=>resetUiSettingsSection("missing"),/Unknown settings section/);
});

test("UI settings enforce safe numeric ranges",()=>{
  assert.throws(()=>updateUiSettings({models:{maxSteps:100000}}),/outside the allowed range/);
  assert.throws(()=>updateUiSettings({models:{temperature:3}}),/outside the allowed range/);
  assert.throws(()=>updateUiSettings({scheduler:{maxConcurrentTasks:0}}),/outside the allowed range/);
});

test("UI settings merge partial persisted sections with defaults",()=>{
  fs.writeFileSync(path.join(temp,"ui-settings.json"),JSON.stringify({general:{language:"ur"}}));
  const settings=getUiSettings();
  assert.equal(settings.general.language,"ur");
  assert.equal(settings.general.theme,"dark");
  assert.equal(settings.permissions.approvalMode,"ask");
  assert.equal(settings.scheduler.maxConcurrentTasks,2);
});
