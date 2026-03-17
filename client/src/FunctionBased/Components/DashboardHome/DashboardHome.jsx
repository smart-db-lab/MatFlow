import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  FolderOpen, 
  FlaskConical,
  Beaker,
  TrendingUp,
  Atom
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function DashboardHome({ 
  recentProjects, 
  openCreate, 
  openProjectsModal, 
  openSampleModal 
}) {
  const navigate = useNavigate();

  // Mock data for the activity chart
  const activityData = useMemo(() => [
    { name: 'Mon', materials: 4 },
    { name: 'Tue', materials: 7 },
    { name: 'Wed', materials: 5 },
    { name: 'Thu', materials: 12 },
    { name: 'Fri', materials: 8 },
    { name: 'Sat', materials: 15 },
    { name: 'Sun', materials: 10 },
  ], []);

  return (
    <div className="h-full w-full bg-[#f8fafc] overflow-y-auto p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Materials Design Lab
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back. Here is an overview of your recent laboratory activities and generative models.
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Workspaces</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{recentProjects.length || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FolderOpen size={20} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
              <TrendingUp size={14} /> +2 this week
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Materials Generated</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">1,204</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Atom size={20} />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-4 flex items-center gap-1">
              <TrendingUp size={14} /> +150 this week
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Models Trained</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">12</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Beaker size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Across all active workspaces</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Generative Output Activity</h2>
              <select className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1.5 text-slate-600 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMaterials" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="materials" 
                    stroke="#0D9488" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMaterials)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions & Recent Projects Container */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={openCreate}
                  className="w-full group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <PlusCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">New Lab Workspace</h4>
                    <p className="text-xs text-slate-500">Initialize a new dataset or project</p>
                  </div>
                </button>

                <button
                  onClick={openProjectsModal}
                  className="w-full group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <FolderOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Browse Projects</h4>
                    <p className="text-xs text-slate-500">Open an existing workspace</p>
                  </div>
                </button>

                <button
                  onClick={openSampleModal}
                  className="w-full group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Try Interactive Sample</h4>
                    <p className="text-xs text-slate-500">Learn with pre-loaded molecules</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Projects List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 tracking-wide uppercase">Recent Workspaces</h2>
              {recentProjects.length > 0 ? (
                <div className="space-y-1">
                  {recentProjects.slice(0, 4).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/dashboard/${project.id}`)}
                      className="w-full flex flex-col items-start p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-teal-700 truncate w-full">
                        {project.name || 'Untitled project'}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate w-full mt-0.5">
                         Last modified: {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-500">No recent workspaces.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
