import test from "node:test";
import assert from "node:assert/strict";
import {risk,decide} from "../src/security/policy.js";

test("policy classifies safe and critical commands",()=>{assert.equal(risk("pwd"),"safe");assert.equal(risk("rm -rf workspace"),"critical");assert.equal(decide({risk:"high"},"ask"),"ask");assert.equal(decide({risk:"safe"},"ask"),"allow");assert.equal(decide({risk:"medium"},"safe"),"deny")});
