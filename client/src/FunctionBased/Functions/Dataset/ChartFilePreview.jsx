import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { apiService } from "../../../services/api/apiService";

function ChartFilePreview({ projectId, activeFile }) {
    const [loading, setLoading] = useState(false);
    const [blobUrl, setBlobUrl] = useState("");
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState("");

    const path = String(activeFile?.name || "").replace(/\\/g, "/");
    const fileName = path.split("/").pop() || "";
    const folder = path.split("/").slice(0, -1).join("/");
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const isImage = ["png", "jpg", "jpeg", "svg", "webp"].includes(extension);
    const isJson = extension === "json";

    const decodeSvgText = (rawText) => {
        const text = String(rawText || "").trim();
        if (!text) return "";

        // Handle data URL payloads: data:image/svg+xml[;base64],...
        if (text.startsWith("data:image/svg+xml")) {
            const commaIdx = text.indexOf(",");
            if (commaIdx >= 0) {
                const header = text.slice(0, commaIdx).toLowerCase();
                const payload = text.slice(commaIdx + 1);
                if (header.includes(";base64")) {
                    try {
                        return atob(payload);
                    } catch {
                        return payload;
                    }
                }
                try {
                    return decodeURIComponent(payload);
                } catch {
                    return payload;
                }
            }
        }

        // Handle URL-encoded XML body (%3Csvg...)
        if (text.startsWith("%3c") || text.startsWith("%3C")) {
            try {
                return decodeURIComponent(text);
            } catch {
                return text;
            }
        }

        return text;
    };

    useEffect(() => {
        let revokedUrl = "";
        const fetchFile = async () => {
            if (!projectId || !folder || !fileName) return;
            setLoading(true);
            setError("");
            setBlobUrl("");
            setJsonText("");
            try {
                const response = await apiService.matflow.dataset.fetchProjectFile(
                    projectId,
                    folder,
                    fileName,
                );
                if (!response.ok) {
                    throw new Error("Failed to load chart file.");
                }
                const blob = await response.blob();
                if (isJson) {
                    const text = await blob.text();
                    setJsonText(text);
                } else {
                    const normalizedBlob =
                        extension === "svg"
                            ? (() => {
                                  const rawText = "";
                                  return blob.text().then((svgRaw) => {
                                      const decoded = decodeSvgText(svgRaw);
                                      if (!decoded.includes("<svg")) {
                                          throw new Error(
                                              "Invalid SVG format. Please re-export this chart as SVG.",
                                          );
                                      }
                                      return new Blob([decoded], {
                                          type: "image/svg+xml",
                                      });
                                  });
                              })()
                            : Promise.resolve(blob);
                    const finalBlob = await normalizedBlob;
                    revokedUrl = URL.createObjectURL(finalBlob);
                    setBlobUrl(revokedUrl);
                }
            } catch (err) {
                setError(err?.message || "Unable to load chart file.");
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
        return () => {
            if (revokedUrl) URL.revokeObjectURL(revokedUrl);
        };
    }, [projectId, folder, fileName, isJson, extension]);

    const prettyJson = useMemo(() => {
        if (!jsonText) return "";
        try {
            return JSON.stringify(JSON.parse(jsonText), null, 2);
        } catch {
            return jsonText;
        }
    }, [jsonText]);

    const handleDownload = async () => {
        try {
            const response = await apiService.matflow.dataset.fetchProjectFile(
                projectId,
                folder,
                fileName,
            );
            if (!response.ok) throw new Error("Download failed.");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Download started.");
        } catch (err) {
            toast.error("Failed to download chart.");
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800 truncate">
                    {fileName}
                </h3>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-md border border-[#0D9488]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
                >
                    Download
                </button>
            </div>
            <div className="p-4">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading chart...</p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : isImage && blobUrl ? (
                    extension === "svg" ? (
                        <object
                            data={blobUrl}
                            type="image/svg+xml"
                            className="h-[70vh] w-full rounded-md border border-gray-100 bg-gray-50"
                            aria-label={fileName}
                        />
                    ) : (
                        <img
                            src={blobUrl}
                            alt={fileName}
                            className="max-h-[70vh] w-full object-contain rounded-md border border-gray-100 bg-gray-50"
                        />
                    )
                ) : isJson ? (
                    <pre className="max-h-[70vh] overflow-auto rounded-md border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700">
                        {prettyJson || "{}"}
                    </pre>
                ) : (
                    <p className="text-sm text-gray-500">
                        Preview is not available for this chart type.
                    </p>
                )}
            </div>
        </div>
    );
}

export default ChartFilePreview;
