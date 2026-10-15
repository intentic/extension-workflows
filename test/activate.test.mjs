import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

/* The BUILT UI bundle against a host stub that refuses what the manifest never declared. */

const manifest = JSON.parse(await readFile(new URL(`../intentic-extension.json`, import.meta.url), `utf8`));

/* THE HOST BRIDGE, STOOD UP BEFORE THE BUNDLE LOADS: the kit resolves to stubs, but for its translator, which runs at
 * module load (`extensionI18n` in src/i18n.ts) and so has to be a real function. */
await import(`./host-stub.mjs`);
const { extensionI18n } = globalThis.__intenticHost.modules[`@intentic/extension-ui`];
globalThis.__intenticHost = {
    modules: { "@intentic/extension-ui": new Proxy({ extensionI18n }, { get: (target, key) => target[key] ?? { __stub: key } }) },
};

const { activate } = await import(`../dist/extension.js`);

const declared = (kind, key) => new Set((manifest.contributes?.[kind] ?? []).map((item) => item[key]));
const declaredViews = declared(`views`, `id`);
const declaredDocuments = declared(`documents`, `id`);
const declaredCommands = declared(`commands`, `command`);
const disposable = () => ({ dispose: () => {} });

// Anything the stub does not spell out answers as an inert function; a lazy route call must never throw at activation.
const inert = () =>
    new Proxy(() => Promise.resolve({}), {
        get: (target, key) => (key === `then` ? undefined : inert()),
        apply: () => Promise.resolve({}),
    });

const hostStub = () => {
    const views = [];
    const documents = [];
    const commands = [];
    const refuse = (kind) => () => assert.fail(`${kind} registered, which this manifest never declares`);
    const api = {
        apiVersion: `2.14.0`,
        views: {
            register: (view) => {
                assert.ok(declaredViews.has(view.id), `view "${view.id}" is not declared in contributes.views`);
                views.push(view);
                return disposable();
            },
        },
        viewers: { register: refuse(`a viewer`) },
        documents: {
            register: (provider) => {
                assert.ok(declaredDocuments.has(provider.id), `document "${provider.id}" is not declared in contributes.documents`);
                documents.push(provider);
                return disposable();
            },
        },
        commands: {
            register: (command) => {
                assert.ok(declaredCommands.has(command), `command "${command}" is not declared in contributes.commands`);
                commands.push(command);
                return disposable();
            },
        },
        workspace: { repos: () => [], onDidChangeFiles: () => disposable() },
        sandbox: inert(),
        settings: inert(),
        capabilities: { list: () => [], onDidChange: () => disposable() },
        navigate: () => {},
    };
    return { api, views, documents, commands };
};

test(`activate registers exactly what the manifest declares`, async () => {
    const { api, views, documents, commands } = hostStub();
    const context = { extensionId: `intentic.workflows`, subscriptions: [] };

    await activate(api, context);

    assert.deepEqual(new Set(views.map((view) => view.id)), declaredViews);
    assert.deepEqual(new Set(documents.map((provider) => provider.id)), declaredDocuments);
    assert.deepEqual(new Set(commands), declaredCommands);
    // Every view resolves its component from INSIDE the single file: a chunk split here 404s from the blob URL the host
    // imports the bundle through, where the failure is far less obvious than in this test.
    for (const view of views) {
        const component = await view.view();
        assert.ok(component !== undefined && component !== null, `view "${view.id}" resolved no component`);
    }
    for (const subscription of context.subscriptions) {
        subscription.dispose();
    }
});
