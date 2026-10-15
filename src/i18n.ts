import { extensionIdOf } from "@intentic/extension-manifest";
import { extensionI18n } from "@intentic/extension-ui";
import base from "./locales/en.json";
import { manifest } from "./manifest.js";

// The specifier stays a literal template so the bundler emits one chunk per language; the host loads the reader's one
// before it calls `activate`.
export const { messages, t } = extensionI18n(extensionIdOf(manifest), base, (locale) => import(`./locales/${locale}.json`));
