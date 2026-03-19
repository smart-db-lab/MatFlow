import { useEffect, useMemo, useState } from "react";
import { setFile } from "../../../../Slices/FeatureEngineeringSlice";
import {
    fetchDataFromIndexedDB,
    storeDataInIndexedDB,
} from "../../../../util/indexDB";
import { apiService } from "../../../../services/api/apiService";
import { sessionGetString } from "../../../../util/sessionProjectStorage";
import {
    CHART_PREVIEW_FUNCTION,
    shouldSkipFullDataFetch,
} from "../config/dashboardFunctionConfig";

const DATASET_CACHE_TTL_MS = 60 * 1000;
const PAGINATE_PAGE_SIZE = 100;

export function useDashboardDataset({
    activeFile,
    activeFunction,
    projectId,
    activeWorkspaceId,
    render,
    dispatch,
}) {
    const [csvData, setCsvData] = useState();
    const [fileMeta, setFileMeta] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!activeFile?.name) {
            setCsvData(undefined);
            setIsLoading(false);
            return;
        }

        const expectedActiveFileId = sessionGetString("activeFileId", projectId);
        if (
            typeof expectedActiveFileId === "string" &&
            expectedActiveFileId !== activeFile.name
        ) {
            setCsvData(undefined);
            setIsLoading(false);
            return;
        }

        if (!activeFunction) {
            setIsLoading(false);
            return;
        }

        if (shouldSkipFullDataFetch(activeFunction, activeWorkspaceId)) {
            setCsvData(undefined);
            setIsLoading(false);
            return;
        }

        let isCancelled = false;

        const getData = async () => {
            const cacheMetaKey = `dataset_cache_meta:${projectId}:${activeFile.name}`;

            const readCacheMeta = () => {
                try {
                    const raw = sessionStorage.getItem(cacheMetaKey);
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    return typeof parsed?.ts === "number" ? parsed : null;
                } catch {
                    return null;
                }
            };

            const writeCacheMeta = () => {
                try {
                    sessionStorage.setItem(
                        cacheMetaKey,
                        JSON.stringify({ ts: Date.now() }),
                    );
                } catch {
                    // No-op: cache metadata is best-effort only.
                }
            };

            const now = Date.now();
            const cachedRows = await fetchDataFromIndexedDB(activeFile.name).catch(
                () => [],
            );
            const hasCachedRows =
                Array.isArray(cachedRows) && cachedRows.length > 0;
            const cacheMeta = readCacheMeta();
            const isCacheFresh =
                hasCachedRows &&
                Boolean(cacheMeta?.ts) &&
                now - cacheMeta.ts < DATASET_CACHE_TTL_MS;

            if (hasCachedRows && !isCancelled) {
                setCsvData(cachedRows);
                dispatch(setFile(cachedRows));
            }

            if (isCacheFresh) {
                if (!isCancelled) setIsLoading(false);
                return;
            }

            if (!hasCachedRows && !isCancelled) {
                setIsLoading(true);
            }

            const parts = activeFile.name.split("/");
            const filename = parts[parts.length - 1];
            const folder = parts.slice(0, -1).join("/");

            try {
                const res = await apiService.matflow.dataset.readFilePaginated(
                    projectId,
                    folder,
                    filename,
                    1,
                    PAGINATE_PAGE_SIZE,
                );
                const rows = res?.data
                    ? Array.isArray(res.data)
                        ? res.data
                        : []
                    : Array.isArray(res)
                      ? res
                      : [];

                if (rows.length > 0) {
                    await storeDataInIndexedDB(rows, activeFile.name);
                    writeCacheMeta();
                }

                if (!isCancelled) {
                    setCsvData(rows.length > 0 ? rows : undefined);
                    dispatch(setFile(rows));
                }
            } catch (serverError) {
                console.error(
                    "Server fetch failed, trying IndexedDB cache:",
                    serverError,
                );
                if (!hasCachedRows && !isCancelled) {
                    setCsvData(undefined);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        getData();
        return () => {
            isCancelled = true;
        };
    }, [
        activeFile,
        activeFunction,
        dispatch,
        render,
        projectId,
        activeWorkspaceId,
    ]);

    useEffect(() => {
        if (!activeFile?.name) {
            setFileMeta(null);
            return;
        }

        const expectedActiveFileId = sessionGetString("activeFileId", projectId);
        if (
            typeof expectedActiveFileId === "string" &&
            expectedActiveFileId !== activeFile.name
        ) {
            setFileMeta(null);
            return;
        }
        if (activeFunction === CHART_PREVIEW_FUNCTION) {
            setFileMeta(null);
            return;
        }

        setFileMeta(null);
        const parts = activeFile.name.split("/");
        const filename = parts[parts.length - 1];
        const folder = parts.slice(0, -1).join("/");

        apiService.matflow.dataset
            .readFilePaginated(projectId, folder, filename, 1, 1, true)
            .then((res) => {
                if (res?.columns) {
                    setFileMeta({
                        columns: res.columns,
                        dtypes: res.dtypes || {},
                        totalRows: res.total_rows ?? 0,
                    });
                }
            })
            .catch(() => {
                // No-op: split tab will wait for full data path if needed.
            });
    }, [activeFile, activeFunction, projectId, render]);

    const hasCsvRows = Array.isArray(csvData) && csvData.length > 0;
    const hasFileMeta =
        fileMeta &&
        Array.isArray(fileMeta.columns) &&
        fileMeta.columns.length > 0;
    const metaCsvData = useMemo(() => {
        if (!hasFileMeta) return undefined;
        const row = {};
        fileMeta.columns.forEach((col) => {
            const t = fileMeta?.dtypes?.[col];
            row[col] = t === "number" ? 0 : t === "boolean" ? false : "";
        });
        return [row];
    }, [fileMeta, hasFileMeta]);

    const effectiveCsvData = hasCsvRows ? csvData : metaCsvData;

    return {
        csvData,
        fileMeta,
        isLoading,
        hasCsvRows,
        hasFileMeta,
        metaCsvData,
        effectiveCsvData,
    };
}
