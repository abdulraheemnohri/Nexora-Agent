import test from "node:test";
import assert from "node:assert/strict";
import {toolSchema,allToolSchemas} from "../src/tools/schemas.js";
test("core tools expose structured input schemas",()=>{
 const names=["terminal","filesystem","git","system","http","process"];
 assert.deepEqual(allToolSchemas().map(x=>x.name),names);
 assert.deepEqual(toolSchema("terminal").input.required,["command"]);
 assert.equal(toolSchema("missing"),null);
});
