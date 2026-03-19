import test from "node:test";
import assert from "node:assert/strict";
import {
    normalizePath,
    formatFolderDisplayName,
    isReservedSystemFolderPath,
    sanitizeDirectoryStructure,
    filterDirectoryStructure,
    collectFolderPaths,
    getWorkspaceRootFromPath,
    getFolderNodeByPath,
    collectFolderFileEntries,
} from "./fileTreeUtils.js";

test("normalizePath normalizes slashes and trims edges", () => {
    assert.equal(normalizePath("\\workspace\\output\\models\\"), "workspace/output/models");
    assert.equal(normalizePath("/a/b/c/"), "a/b/c");
    assert.equal(normalizePath(""), "");
});

test("formatFolderDisplayName maps known system folder names", () => {
    assert.equal(formatFolderDisplayName("output"), "Outputs");
    assert.equal(formatFolderDisplayName("train_test"), "Train-Test Dataset");
    assert.equal(formatFolderDisplayName("custom"), "custom");
});

test("isReservedSystemFolderPath checks workspace-relative path", () => {
    assert.equal(isReservedSystemFolderPath("workspace/output/models"), true);
    assert.equal(isReservedSystemFolderPath("workspace/custom"), false);
});

test("sanitizeDirectoryStructure removes legacy root output keys", () => {
    const input = {
        output: { files: ["legacy.csv"] },
        Output: { files: ["legacy2.csv"] },
        workspaceA: { files: ["data.csv"] },
    };
    assert.deepEqual(sanitizeDirectoryStructure(input), {
        workspaceA: { files: ["data.csv"] },
    });
});

test("filterDirectoryStructure keeps matching folders and files", () => {
    const structure = {
        ws: {
            files: ["alpha.csv", "beta.csv"],
            charts: {
                files: ["plot.png"],
            },
            models: {
                files: ["rf.pkl"],
            },
        },
    };
    const filtered = filterDirectoryStructure(structure, "plot");
    assert.deepEqual(filtered, {
        ws: {
            charts: {
                files: ["plot.png"],
            },
        },
    });
});

test("collectFolderPaths returns all nested folder paths", () => {
    const structure = {
        ws: {
            files: ["a.csv"],
            output: {
                charts: { files: ["c.png"] },
            },
        },
    };
    assert.deepEqual(collectFolderPaths(structure), [
        "ws",
        "ws/output",
        "ws/output/charts",
    ]);
});

test("getWorkspaceRootFromPath extracts first segment", () => {
    assert.equal(getWorkspaceRootFromPath("ws/output/charts"), "ws");
    assert.equal(getWorkspaceRootFromPath(""), "");
});

test("folder node and zip entries preserve nested relative paths", () => {
    const structure = {
        ws: {
            files: ["root.csv"],
            output: {
                files: ["summary.csv"],
                charts: {
                    files: ["plot.png"],
                },
            },
        },
    };
    const node = getFolderNodeByPath(structure, "ws/output");
    assert.ok(node);
    const entries = collectFolderFileEntries(node, "ws/output");
    assert.deepEqual(entries, [
        { folder: "ws/output", file: "summary.csv", zipPath: "summary.csv" },
        {
            folder: "ws/output/charts",
            file: "plot.png",
            zipPath: "charts/plot.png",
        },
    ]);
});
