#!/usr/bin/env node
import { main } from "../src/cli.js";
main(process.argv.slice(2)).catch(e=>{console.error("Nexora error:",e.message);process.exitCode=1});