"use client";
import { useState, useCallback } from "react";
import axios from "axios";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/config";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Sparkles,
  Loader2,
  Youtube,
  X,
  ExternalLink,
  Clock,
  PlayCircle,
  Save,
  History,
  Trash2,
  Star,
  Calendar
} from "lucide-react";

interface Resource {
  title: string;
  url: string;
  platform: string;
  thumbnail: string | null;
  duration: string | null;
  is_free: boolean;
  rating: number | null;
  instructor: string | null;
}

interface LearningNode {
  topic: string;
  resources: Resource[];
  fetched_at: string | null;
}

// Clean modern color palette
const NODE_COLORS = [
  { bg: '#3B82F6', text: '#FFFFFF' }, // blue
  { bg: '#8B5CF6', text: '#FFFFFF' }, // purple
  { bg: '#06B6D4', text: '#FFFFFF' }, // cyan
  { bg: '#10B981', text: '#FFFFFF' }, // green
  { bg: '#F59E0B', text: '#FFFFFF' }, // amber
  { bg: '#EF4444', text: '#FFFFFF' }, // red
  { bg: '#EC4899', text: '#FFFFFF' }, // pink
  { bg: '#6366F1', text: '#FFFFFF' }, // indigo
];

interface RoadmapMetadata {
  id: string;
  user_id: string;
  topic: string;
  created_at: string;
  node_count: number;
  is_favorite: boolean;
  notes: string | null;
}

export default function RoadmapPage() {
  const [step, setStep] = useState<"input" | "roadmap">("input");
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null);
  const [showResourcesPanel, setShowResourcesPanel] = useState(false);
  const [showPastRoadmaps, setShowPastRoadmaps] = useState(false);
  const [pastRoadmaps, setPastRoadmaps] = useState<RoadmapMetadata[]>([]);
  const [loadingPastRoadmaps, setLoadingPastRoadmaps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentMermaidCode, setCurrentMermaidCode] = useState("");
  const [currentNodeData, setCurrentNodeData] = useState<LearningNode[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const parseMermaidToFlow = (mermaidCode: string, nodeData: LearningNode[]) => {
    const lines = mermaidCode.split('\n').filter(line => line.trim() && !line.trim().startsWith('flowchart'));
    const nodeMap = new Map<string, { label: string; isDiamond: boolean }>();
    const nodeOrder: string[] = [];
    const edgeList: { source: string; target: string; label?: string }[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      const diamondMatches = [...trimmedLine.matchAll(/([A-Z]+)\{\{([^}]+)\}\}/g)];
      diamondMatches.forEach(match => {
        const id = match[1];
        const label = match[2].trim();
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label, isDiamond: true });
          nodeOrder.push(id);
        }
      });
      
      const squareMatches = [...trimmedLine.matchAll(/([A-Z]+)\[([^\]]+)\]/g)];
      squareMatches.forEach(match => {
        const id = match[1];
        const label = match[2].trim();
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { label, isDiamond: false });
          nodeOrder.push(id);
        }
      });

      let connectionMatch = trimmedLine.match(/([A-Z]+)[\[{]+[^\]{}]+[\]}]+\s*-->\s*\|([^\|]+)\|\s*([A-Z]+)[\[{]+/);
      if (connectionMatch) {
        edgeList.push({
          source: connectionMatch[1].trim(),
          target: connectionMatch[3].trim(),
          label: connectionMatch[2].trim()
        });
        return;
      }
      
      connectionMatch = trimmedLine.match(/([A-Z]+)[\[{]+[^\]{}]+[\]}]+\s*-->\s*([A-Z]+)[\[{]+/);
      if (connectionMatch) {
        edgeList.push({
          source: connectionMatch[1].trim(),
          target: connectionMatch[2].trim()
        });
        return;
      }
      
      connectionMatch = trimmedLine.match(/([A-Z]+)\s+-->\s+([A-Z]+)[\[{]/);
      if (connectionMatch) {
        edgeList.push({
          source: connectionMatch[1].trim(),
          target: connectionMatch[2].trim()
        });
        return;
      }
      
      connectionMatch = trimmedLine.match(/([A-Z]+)\s*-->\s*([A-Z]+)/);
      if (connectionMatch) {
        edgeList.push({
          source: connectionMatch[1].trim(),
          target: connectionMatch[2].trim()
        });
      }
    });

    const flowNodes: Node[] = [];
    let colorIndex = 0;
    nodeMap.forEach((data, id) => {
      const color = NODE_COLORS[colorIndex % NODE_COLORS.length];
      colorIndex++;
      
      const learningNode = nodeData.find(n => n.topic === data.label);
      
      flowNodes.push({
        id,
        type: 'default',
        data: { 
          label: (
            <div style={{ 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: data.isDiamond ? '24px' : '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={() => handleNodeClick(learningNode)}
            >
              {data.label}
            </div>
          ) 
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          background: color.bg,
          border: `2px solid ${color.bg}`,
          borderRadius: data.isDiamond ? '0' : '12px',
          padding: '0',
          color: color.text,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          clipPath: data.isDiamond ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
          width: data.isDiamond ? 140 : 180,
          height: data.isDiamond ? 140 : undefined,
          minHeight: data.isDiamond ? undefined : 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }
      });
    });

    const flowEdges: Edge[] = edgeList.map((edge, idx) => ({
      id: `e${idx}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#94a3b8', 
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
        width: 20,
        height: 20,
      },
      labelStyle: {
        fill: '#475569',
        fontWeight: 600,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.9
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4
    }));

    const layoutNodes = applyHierarchicalLayout(flowNodes, flowEdges);
    
    return { nodes: layoutNodes, edges: flowEdges };
  };

  const applyHierarchicalLayout = (nodes: Node[], edges: Edge[]) => {
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    const incomingCount = new Map<string, number>();
    nodes.forEach(n => incomingCount.set(n.id, 0));
    edges.forEach(e => {
      incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
    });
    
    let roots = nodes.filter(n => incomingCount.get(n.id) === 0);
    roots.sort((a, b) => a.id.localeCompare(b.id));
    
    if (roots.length === 0 && nodes.length > 0) {
      const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
      roots = [sortedNodes[0]];
    }
    
    const queue = [{ id: roots[0].id, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);
      
      edges.forEach(e => {
        if (e.source === id && !visited.has(e.target)) {
          queue.push({ id: e.target, level: level + 1 });
        }
      });
    }
    
    nodes.forEach(node => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });
    
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, id) => {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(id);
    });
    
    levelGroups.forEach(nodeIds => nodeIds.sort());
    
    const horizontalSpacing = 300;
    const verticalSpacing = 200;
    const centerX = 600;
    
    return nodes.map(node => {
      const level = levels.get(node.id) || 0;
      const nodesInLevel = levelGroups.get(level) || [];
      const indexInLevel = nodesInLevel.indexOf(node.id);
      
      const totalWidth = (nodesInLevel.length - 1) * horizontalSpacing;
      const startX = centerX - (totalWidth / 2);
      
      return {
        ...node,
        position: {
          x: startX + (indexInLevel * horizontalSpacing),
          y: 80 + (level * verticalSpacing)
        }
      };
    });
  };

  const handleNodeClick = (learningNode: LearningNode | undefined) => {
    if (learningNode) {
      setSelectedNode(learningNode);
      setShowResourcesPanel(true);
    }
  };

  const generateRoadmap = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        API_ENDPOINTS.LEARNING.GENERATE_ROADMAP,
        { topic: topic.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Store the mermaid code and node data for saving later
      setCurrentMermaidCode(res.data.mermaid_code);
      setCurrentNodeData(res.data.nodes);

      const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(
        res.data.mermaid_code,
        res.data.nodes
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);

      setStep("roadmap");
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || "Failed to generate roadmap");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRoadmap = async () => {
    if (!currentMermaidCode || !currentNodeData.length) {
      alert("No roadmap to save");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        API_ENDPOINTS.LEARNING.SAVE_ROADMAP,
        {
          topic: topic.trim(),
          mermaid_code: currentMermaidCode,
          nodes: currentNodeData,
          notes: null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Roadmap saved successfully!");
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || "Failed to save roadmap");
    } finally {
      setIsSaving(false);
    }
  };

  const loadPastRoadmaps = async () => {
    setLoadingPastRoadmaps(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        API_ENDPOINTS.LEARNING.GET_ROADMAPS,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPastRoadmaps(res.data.roadmaps);
      setShowPastRoadmaps(true);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || "Failed to load past roadmaps");
    } finally {
      setLoadingPastRoadmaps(false);
    }
  };

  const loadRoadmap = async (roadmapId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        API_ENDPOINTS.LEARNING.GET_ROADMAP(roadmapId),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const roadmap = res.data.roadmap;
      setTopic(roadmap.topic);
      setCurrentMermaidCode(roadmap.mermaid_code);
      setCurrentNodeData(roadmap.nodes);

      const { nodes: parsedNodes, edges: parsedEdges } = parseMermaidToFlow(
        roadmap.mermaid_code,
        roadmap.nodes
      );
      setNodes(parsedNodes);
      setEdges(parsedEdges);

      setShowPastRoadmaps(false);
      setStep("roadmap");
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || "Failed to load roadmap");
    }
  };

  const deleteRoadmap = async (roadmapId: string) => {
    if (!confirm("Are you sure you want to delete this roadmap?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        API_ENDPOINTS.LEARNING.DELETE_ROADMAP(roadmapId),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPastRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { detail?: string } } };
      alert(error.response?.data?.detail || "Failed to delete roadmap");
    }
  };

  const resetAll = () => {
    setStep("input");
    setTopic("");
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setShowResourcesPanel(false);
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'YouTube') return <Youtube className="text-red-600" size={20} />;
    return <BookOpen className="text-blue-600" size={20} />;
  };

  return (
    <div className="h-full flex flex-col p-8">
      {step === "input" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/10 mb-4">
                <Sparkles className="text-foreground" size={32} />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                AI Learning Roadmap
              </h1>
              <p className="text-lg text-foreground/60">
                Generate a personalized learning path with curated resources
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
              <label className="block text-sm font-semibold text-foreground mb-3">
                What do you want to learn?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., React, Machine Learning, Python..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-foreground/40 focus:border-foreground focus:ring-2 focus:ring-foreground/20 outline-none transition-all"
                onKeyPress={(e) => e.key === 'Enter' && generateRoadmap()}
              />
              
              <button
                onClick={generateRoadmap}
                disabled={isGenerating || !topic.trim()}
                className="w-full mt-6 bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating Roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Learning Path
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "roadmap" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-card border border-border px-6 py-4 flex items-center justify-between rounded-xl mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {topic} Learning Roadmap
              </h2>
              <p className="text-sm text-foreground/60 mt-1">
                Click on any node to view resources
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveRoadmap}
                disabled={isSaving}
                className="bg-card hover:bg-card/80 text-foreground font-semibold px-5 py-2 rounded-lg transition-all border border-border flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={resetAll}
                className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-5 py-2 rounded-lg transition-all"
              >
                New Topic
              </button>
            </div>
          </div>

          <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#666666" gap={16} size={1} />
              <Controls className="bg-card border border-border rounded-lg shadow-sm" />
              <MiniMap 
                nodeColor={(node) => {
                  const style = node.style as { background?: string };
                  return style?.background || '#3B82F6';
                }}
                className="bg-card border border-border rounded-lg"
                maskColor="rgba(0,0,0,0.05)"
              />
              <Panel position="top-center" className="bg-card border border-border rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-foreground">
                  💡 Click any node to view learning resources
                </p>
              </Panel>
            </ReactFlow>
          </div>

          {showResourcesPanel && selectedNode && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-border">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedNode.topic}
                    </h2>
                    <p className="text-sm text-foreground/60 mt-1">
                      {selectedNode.resources.length} resource{selectedNode.resources.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <button
                    onClick={() => setShowResourcesPanel(false)}
                    className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                  >
                    <X size={24} className="text-foreground/60" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedNode.resources.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-foreground/60">No resources available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedNode.resources.map((resource, idx) => (
                        <div
                          key={idx}
                          className="bg-background rounded-xl p-4 hover:shadow-md transition-shadow border border-border"
                        >
                          <div className="flex gap-4">
                            {resource.thumbnail && (
                              <div className="flex-shrink-0">
                                <Image 
                                  src={resource.thumbnail} 
                                  alt={resource.title}
                                  width={160}
                                  height={90}
                                  className="w-40 h-24 object-cover rounded-lg border border-border"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-foreground line-clamp-2">
                                  {resource.title}
                                </h3>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 inline-flex items-center gap-1 bg-foreground hover:bg-foreground/90 text-background px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                >
                                  <PlayCircle size={16} />
                                  Watch
                                </a>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-foreground/60">
                                <div className="flex items-center gap-1">
                                  <Youtube size={16} className="text-foreground/60" />
                                  <span className="font-medium">{resource.platform}</span>
                                </div>
                                
                                {resource.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{resource.duration}</span>
                                  </div>
                                )}
                              </div>
                              
                              {resource.instructor && (
                                <p className="text-sm text-foreground/50 mt-1">
                                  {resource.instructor}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Button - Bottom Right */}
      <button
        onClick={loadPastRoadmaps}
        disabled={loadingPastRoadmaps}
        className="fixed bottom-6 right-6 z-40 bg-foreground hover:bg-foreground/90 text-background p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-105 border-2 border-foreground"
      >
        {loadingPastRoadmaps ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <>
            <History size={24} />
            <span className="font-semibold pr-1">Past Roadmaps</span>
          </>
        )}
      </button>

      {/* Right Sidebar */}
      {showPastRoadmaps && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPastRoadmaps(false)}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card shadow-2xl z-50 flex flex-col border-l border-border animate-slide-in-right">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Past Roadmaps</h2>
                <p className="text-sm text-foreground/60 mt-1">
                  {pastRoadmaps.length} saved roadmap{pastRoadmaps.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowPastRoadmaps(false)}
                className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                <X size={24} className="text-foreground/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {pastRoadmaps.length === 0 ? (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-foreground/20 mb-4" />
                  <p className="text-foreground/60">No saved roadmaps yet</p>
                  <p className="text-sm text-foreground/40 mt-2">
                    Generate and save roadmaps to access them later
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastRoadmaps.map((roadmap) => (
                    <div
                      key={roadmap.id}
                      className="bg-background rounded-xl p-4 hover:shadow-md transition-all border border-border hover:border-foreground/20"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-foreground mb-1 line-clamp-2">
                            {roadmap.topic}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-foreground/60">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>
                                {new Date(roadmap.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Sparkles size={12} />
                              <span>{roadmap.node_count} topics</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadRoadmap(roadmap.id)}
                            className="flex-1 bg-foreground hover:bg-foreground/90 text-background px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          >
                            Load Roadmap
                          </button>
                          <button
                            onClick={() => deleteRoadmap(roadmap.id)}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                            title="Delete roadmap"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
