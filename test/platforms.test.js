import test from "node:test";import assert from "node:assert/strict";import {detectPlatform,shellSpec,runShell} from "../src/platforms.js";
test("detects host platform",()=>{const x=detectPlatform();assert.equal(typeof x.platform,"string");assert.equal(typeof x.arch,"string");assert.equal(typeof x.shell,"string")});
test("selects a native shell",()=>{const s=shellSpec();assert.ok(s.command);assert.ok(Array.isArray(s.args))});
test("runs a portable output command",async()=>{const cmd=process.platform==="win32"?"Write-Output nexora-test":"printf nexora-test";const r=await runShell(cmd);assert.equal(r.code,0);assert.match(r.stdout,/nexora-test/)});
