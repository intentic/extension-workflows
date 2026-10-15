/* The host bridge for the vitest suites, stood up before any module imports the kit: `@intentic/extension-ui` is
 * host-provided and refuses to load without one. Only `extensionI18n` is real here, resolving keys against the English
 * catalog with `{name}` placeholders and `|` plural forms, so a suite reads the words a reader would. */

const lookup = (tree, key) => key.split(`.`).reduce((node, part) => (node === undefined ? undefined : node[part]), tree);

const translate = (base) => (key, values = {}, plural) => {
    const message = lookup(base, key);
    if (typeof message !== `string`) {
        return key;
    }
    const forms = message.split(` | `);
    const form = plural === undefined || forms.length === 1 ? forms[0] : forms[Math.min(plural === 1 ? 0 : 1, forms.length - 1)];
    return form.replaceAll(/\{(\w+)\}/gu, (_, name) => String(values[name] ?? `{${name}}`));
};

globalThis.__intenticHost = {
    modules: {
        "@intentic/extension-ui": {
            extensionI18n: (_extensionId, base, load) => ({ messages: { base, load }, t: translate(base) }),
        },
    },
};
