import { randomUUID } from "node:crypto";
import { cp, lstat, mkdir, readdir, readFile, rmdir, writeFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";
import { channel, digest, namespace } from "@odsuite/protocol";
import { type Context, managerEndpoint, observeProcesses, readDirectory, serve } from "@odsuite/sidecar";
import { expect, it } from "vitest";
import { register, registrations, verifyRegistration } from "@/install/index.js";

async function fixture(fresh = false) {
  const root = resolve("../../.artifacts/codex-registration", randomUUID());
  const profile = join(root, "profile"),
    workspace = join(root, "workspace"),
    skills = join(workspace, ".agents/skills"),
    application = join(root, "application");
  await mkdir(profile, { recursive: true });
  await mkdir(fresh ? workspace : skills, { recursive: true });
  await cp(resolve("dist/runtime"), application, { recursive: true });
  const built = JSON.parse(await readFile(join(application, "runtime.json"), "utf8"));
  const manager = await serve(managerEndpoint(join(root, "authority")), { root: join(root, "authority") });
  const scope = { channel: channel(built.channel), namespace: namespace("registration") },
    factory = manager.factory(scope);
  let context: Context | undefined;
  await factory.expose({
    identity: { service: "installer", generation: digest(randomUUID()) },
    handlers: {},
    lifecycle: {
      initialize: async (value) => {
        context = value;
      },
      stop: async () => {},
    },
  });
  if (!context) throw Error("Registration context was not initialized");
  const options = {
    factory,
    context,
    application,
    profile,
    skills,
    root: fresh ? join(root, "runtime-data", built.channel, "registration") : join(root, "data"),
    scope,
    version: built.version,
    worker: resolve("dist/installworker.mjs"),
  };
  return {
    root,
    workspace,
    manager,
    options,
    close: async () => {
      await manager.close();
      expect((await readDirectory(join(root, "authority"))).manager.phase).toBe("closed");
      expect(await observeProcesses(join(root, "authority"))).toEqual([]);
    },
  };
}

it("reconciles an applied registration with a lost receipt and refuses changed Skill or transport ownership", async () => {
  const own = await fixture(),
    codex = join(own.root, "controlled-codex.mjs");
  await writeFile(
    codex,
    `import {readFile,writeFile,appendFile} from 'node:fs/promises';
const args=process.argv.slice(2), file=process.env.CODEX_HOME+'/transport.json';
let current; try{current=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
if(args[1]==='get'){if(current){process.stdout.write(JSON.stringify({enabled:true,transport:current}))}else{process.stderr.write('No MCP server named \\"open-motion\\" found');process.exitCode=1}}
else if(args[1]==='add'){const split=args.indexOf('--'), env={};for(let i=3;i<split;i+=2){const value=args[i+1], at=value.indexOf('=');env[value.slice(0,at)]=value.slice(at+1)}
await writeFile(file,JSON.stringify({type:'stdio',command:args[split+1],args:args.slice(split+2),env}));await appendFile(process.env.CODEX_HOME+'/adds','add\\n');process.exitCode=1}
`,
  );
  const failures: unknown[] = [];
  try {
    await expect(register({ ...own.options, root: parse(own.root).root, codex })).rejects.toThrow("filesystem root");
    await expect(register({ ...own.options, codex })).rejects.toThrow("unknown");
    await expect(registrations(own.options)).rejects.toThrow("reconcile");
    expect(await registrations({ ...own.options, allowPendingVersion: own.options.version })).toHaveLength(1);
    const confirmed = await register({ ...own.options, codex });
    expect(await verifyRegistration({ ...own.options, codex })).toEqual(confirmed);
    expect(confirmed.state).toBe("registered");
    expect(await readFile(join(own.options.profile, "adds"), "utf8")).toBe("add\n");
    expect(await register({ ...own.options, codex })).toEqual(confirmed);
    const names = (await readdir(own.options.skills)).filter((name) => !name.startsWith("."));
    expect(names).toHaveLength(5);
    const original = join(own.options.skills, "motion-production", "SKILL.md");
    const addedDirectory = join(dirname(original), "user-empty-directory");
    await mkdir(addedDirectory);
    await expect(register({ ...own.options, codex })).rejects.toThrow("directory has changed");
    await rmdir(addedDirectory);
    await writeFile(original, "User changed this owned Skill");
    await expect(register({ ...own.options, codex })).rejects.toThrow("changed");
    const transport = join(own.options.profile, "transport.json");
    await writeFile(transport, JSON.stringify({ type: "stdio", command: "unowned", args: [], env: {} }));
    await expect(register({ ...own.options, codex })).rejects.toThrow("refusing replacement");
  } catch (error) {
    failures.push(error);
  } finally {
    try {
      await own.close();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length) throw new AggregateError(failures, "registration recovery acceptance failed");
}, 30000);

it.skipIf(!process.env.OPEN_MOTION_CODEX)(
  "registers actual isolated Codex MCP and discovers all five canonical Skills without a model turn",
  async () => {
    const codex = process.env.OPEN_MOTION_CODEX;
    if (!codex) throw Error("Actual Codex executable required");
    const own = await fixture(true),
      failures: unknown[] = [];
    try {
      const config = join(own.options.profile, "config.toml");
      await writeFile(
        config,
        'model_reasoning_effort = "low"\n[mcp_servers.unrelated]\ncommand = "node"\nargs = ["unrelated.mjs"]\n',
      );
      const receipt = await register({ ...own.options, codex });
      await expect(lstat(join(own.root, "runtime-data"))).rejects.toMatchObject({ code: "ENOENT" });
      expect(await register({ ...own.options, codex })).toEqual(receipt);
      const actualConfig = await readFile(config, "utf8");
      expect(actualConfig).toContain("[mcp_servers.unrelated]");
      expect(actualConfig).toContain('model_reasoning_effort = "low"');
      const result = join(own.options.context.roots.runtime, "skills.json");
      const script = `import {spawn} from 'node:child_process';import {writeFile,rename} from 'node:fs/promises';import {createInterface} from 'node:readline';
const child=spawn(${JSON.stringify(codex)},['app-server','--stdio'],{cwd:${JSON.stringify(own.workspace)},env:{...process.env,CODEX_HOME:${JSON.stringify(own.options.profile)}},stdio:['pipe','pipe','pipe']});
child.stderr.resume();const keep=setInterval(()=>{},1000);process.once('SIGTERM',()=>clearInterval(keep));
const send=value=>child.stdin.write(JSON.stringify(value)+'\\n');
createInterface({input:child.stdout}).on('line',async line=>{let message;try{message=JSON.parse(line)}catch{return}
if(message.id===1){send({method:'initialized',params:{}});send({id:2,method:'skills/list',params:{cwds:[${JSON.stringify(own.workspace)}],forceReload:true}})}
if(message.id===2){await writeFile(${JSON.stringify(`${result}.next`)},JSON.stringify(message));await rename(${JSON.stringify(`${result}.next`)},${JSON.stringify(result)});child.stdin.end()}});
send({id:1,method:'initialize',params:{clientInfo:{name:'openmotion-registration',version:'1.0.0'},capabilities:{experimentalApi:true}}});process.stdout.write('discovery-ready\\n');`;
      const lease = await own.options.factory.start({
        service: "codexdiscovery",
        generation: digest(randomUUID()),
        command: process.execPath,
        args: ["--input-type=module", "-e", script],
        ready: "discovery-ready",
        env: { ELECTRON_RUN_AS_NODE: null },
      });
      let discovered:
        | { error?: unknown; result?: { data: { errors: unknown[]; skills: { name: string; path: string }[] }[] } }
        | undefined;
      try {
        const until = Date.now() + 15000;
        while (!discovered) {
          try {
            discovered = JSON.parse(await readFile(result, "utf8"));
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          }
          if (Date.now() > until) throw Error("Actual Codex skills/list did not return");
          if (!discovered) await new Promise((done) => setTimeout(done, 25));
        }
      } finally {
        const retired = await own.options.factory.release(lease);
        expect(retired).toEqual({ status: "stopped", survivors: [] });
      }
      expect(discovered.error).toBeUndefined();
      const selected = discovered.result?.data
        .flatMap((entry) => entry.skills)
        .filter((skill) => skill.path.startsWith(`${own.options.skills}/`));
      expect(selected?.map((skill) => skill.name).sort()).toEqual([
        "motion-director",
        "motion-production",
        "motion-recreate",
        "motion-template-to-video",
        "motion-video-to-template",
      ]);
      await writeFile(
        join(own.root, "result.json"),
        JSON.stringify(
          { receipt, actualCodexSkills: selected, unrelatedConfigPreserved: true, modelTurns: 0 },
          null,
          2,
        ),
      );
    } catch (error) {
      failures.push(error);
    } finally {
      try {
        await own.close();
      } catch (error) {
        failures.push(error);
      }
    }
    if (failures.length) throw new AggregateError(failures, "actual Codex registration/discovery failed");
  },
  45000,
);
