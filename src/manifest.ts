import { ExtensionManifestSchema } from "@intentic/extension-manifest";
import manifestJson from "../intentic-extension.json";

// The package's own intentic-extension.json, validated, the same file a git-installed extension ships and the
// daemon reads. Parsing here, rather than trusting the literal, refuses a manifest the host would refuse too.
export const manifest = ExtensionManifestSchema.parse(manifestJson);
