const fs = require('fs');
let text = fs.readFileSync('client/src/FunctionBased/Functions/Dataset/DatasetCorrelation.jsx', 'utf8');

text = text.replace('import Plot from "react-plotly.js";', 'import LayoutSelector from "../../Components/LayoutSelector/LayoutSelector";');
text = text.replace('import Plotly from "plotly.js-dist-min";\n', '');
text = text.replace('import { applyPlotlyTheme } from "../../../shared/plotlyTheme";\n', '');

text = text.replace('const [plotlyData, setPlotlyData] = useState();\n', 'const [echartsData, setEchartsData] = useState([]);\n');
text = text.replace('const heatmapPlotRef = useRef(null);\n', '');

text = text.replace('setPlotlyData(typeof data === "string" ? JSON.parse(data) : data);', `const parsed = typeof data === "string" ? JSON.parse(data) : data;
          setEchartsData(parsed.echarts ? parsed.echarts : []);`);
text = text.replace('setPlotlyData(null);', 'setEchartsData([]);');

text = text.replace(/const buildHeatmapFilename = \(\) => \{[\s\S]+?toast\.error\("Failed to download\/save heatmap\. Please try again\.", \{\n\s+autoClose: 3200,\n\s+\}\);\n\s+\};\n/, '');

const old_render = `) : plotlyData ? (
                <div className="flex justify-center mt-8">
                  <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-end gap-2 border-b border-gray-100 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          downloadAndPersistHeatmap(heatmapPlotRef.current?.el)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#0D9488]/30 bg-white px-3 py-1.5 text-sm font-medium text-[#0D9488] hover:bg-[#0D9488]/10 transition-colors"
                      >
                        <Download size={14} />
                        Download Chart
                      </button>
                    </div>
                    <Plot
                      ref={heatmapPlotRef}
                      data={plotlyData?.data}
                      layout={applyPlotlyTheme(plotlyData.layout, "Correlation Heatmap")}
                      config={{
                        responsive: true,
                        displaylogo: false,
                        displayModeBar: false,
                        toImageButtonOptions: {
                          format: "png",
                          filename: "correlation-heatmap",
                          scale: 2,
                        },
                      }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
              ) :`;

const new_render = `) : echartsData.length > 0 ? (
                <div className="flex justify-center mt-8 w-full">
                  <LayoutSelector echartsData={echartsData} />
                </div>
              ) :`;

text = text.replace(old_render, new_render);

fs.writeFileSync('client/src/FunctionBased/Functions/Dataset/DatasetCorrelation.jsx', text);
console.log('patched');
