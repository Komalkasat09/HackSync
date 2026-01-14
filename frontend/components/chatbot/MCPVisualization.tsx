"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { Info } from "lucide-react";

interface MCPVisualizationProps {
  graphData: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      description?: string;
      agent?: string;
      endpoint?: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: string;
    }>;
    tools: Array<{
      name: string;
      description: string;
      agent: string;
      endpoint: string;
    }>;
  };
}

const nodeWidth = 240;
const nodeHeight = 120;

const nodePalette: Record<
  string,
  { border: string; bg: string; accent: string; label: string }
> = {
  entry: {
    border: "border-emerald-400/60",
    bg: "from-emerald-500/15 to-emerald-500/5",
    accent: "text-emerald-200",
    label: "Entry",
  },
  classifier: {
    border: "border-sky-400/60",
    bg: "from-sky-500/15 to-sky-500/5",
    accent: "text-sky-200",
    label: "Classifier",
  },
  tool: {
    border: "border-blue-400/60",
    bg: "from-blue-500/15 to-blue-500/5",
    accent: "text-blue-200",
    label: "Tool",
  },
  agent: {
    border: "border-violet-400/60",
    bg: "from-violet-500/15 to-violet-500/5",
    accent: "text-violet-200",
    label: "Agent",
  },
  endpoint: {
    border: "border-rose-400/60",
    bg: "from-rose-500/15 to-rose-500/5",
    accent: "text-rose-200",
    label: "Endpoint",
  },
};

export default function MCPVisualization({ graphData }: MCPVisualizationProps) {
  const layouted = useMemo(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "LR",
      ranksep: 180,
      nodesep: 80,
      marginx: 40,
      marginy: 40,
    });

    graphData.nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    graphData.edges.forEach((edge) => {
      dagreGraph.setEdge(edge.from, edge.to);
    });

    dagre.layout(dagreGraph);

    const nodes: Node[] = graphData.nodes.map((node) => {
      const position = dagreGraph.node(node.id);
      return {
        id: node.id,
        data: {
          label: node.label,
          description: node.description,
          agent: node.agent,
          endpoint: node.endpoint,
          type: node.type,
        },
        position: {
          x: position.x - nodeWidth / 2,
          y: position.y - nodeHeight / 2,
        },
        type: "mcpNode",
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    const edges: Edge[] = graphData.edges.map((edge, idx) => ({
      id: `edge-${idx}`,
      source: edge.from,
      target: edge.to,
      type: "step",
      label: edge.type.replace("_", " "),
      animated: true,
      className: "mcp-edge",
      style: {
        stroke: edge.type === "feeds" ? "#f59e0b" : "#38bdf8",
        strokeWidth: 2.2,
        strokeDasharray: "8 6",
      },
      labelStyle: { fill: "#e2e8f0", fontSize: 10 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 6,
      labelBgStyle: {
        fill: "rgba(15,23,42,0.9)",
        color: "#e2e8f0",
      },
    }));

    return { nodes, edges };
  }, [graphData.nodes, graphData.edges]);

  const nodeTypes = useMemo(
    () => ({
      mcpNode: MCPNode,
    }),
    []
  );

  const nodeCounts = useMemo(() => {
    return graphData.nodes.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});
  }, [graphData.nodes]);

  const summaryStats = useMemo(
    () => [
      {
        label: "Total Nodes",
        value: graphData.nodes.length,
        tone: "text-emerald-300",
      },
      {
        label: "Connections",
        value: graphData.edges.length,
        tone: "text-sky-300",
      },
      {
        label: "Registered Tools",
        value: graphData.tools?.length ?? 0,
        tone: "text-blue-300",
      },
    ],
    [graphData.edges.length, graphData.nodes.length, graphData.tools?.length]
  );

  return (
    <>
      <div className="h-full w-full flex flex-col gap-4">
      <div className="rounded-xl border border-border/80 bg-gradient-to-br from-slate-900/70 to-slate-950/80 p-4 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Routing Overview
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                MCP Orchestration Graph
              </h2>
              <p className="text-sm text-foreground/60 max-w-2xl">
                Requests land on the intake nodes, pass through the Gemini
                classifier, and fan out toward specialized tools and MCP
                endpoints. Animated orthogonal edges show the active data flow
                direction.
              </p>
            </div>
            <div className="flex gap-3">
              {summaryStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/70 px-4 py-2 text-right"
                >
                  <div className={`text-lg font-semibold ${stat.tone}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-foreground/60">
            {Object.entries(nodePalette).map(([type, palette]) => (
              <span
                key={type}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1"
              >
                <span
                  className={`h-2 w-2 rounded-full ${palette.accent.replace(
                    "text-",
                    "bg-"
                  )}`}
                />
                <span className="font-medium capitalize">
                  {palette.label || type}
                </span>
                <span className="text-foreground/40">
                  {nodeCounts[type] ?? 0} nodes
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr] h-full">
        <div className="rounded-2xl border border-border/60 bg-[var(--glass-bg,#050b1b)]/80 backdrop-blur-2xl shadow-xl overflow-hidden min-h-[320px]">
          <ReactFlow
            nodes={layouted.nodes}
            edges={layouted.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{
              type: "step",
              animated: true,
            }}
            minZoom={0.6}
            maxZoom={1.4}
          >
            <Background gap={32} color="rgba(148, 163, 184, 0.15)" />
            <MiniMap
              nodeColor={(node) => {
                switch (node.data.type) {
                  case "tool":
                    return "#38bdf8";
                  case "agent":
                    return "#a855f7";
                  case "classifier":
                    return "#06b6d4";
                  case "entry":
                    return "#34d399";
                  default:
                    return "#f87171";
                }
              }}
              pannable
              zoomable
              style={{ background: "rgba(2,6,23,0.8)" }}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="rounded-2xl border border-border/60 bg-[var(--glass-bg,#060b19)]/80 backdrop-blur-2xl shadow-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/90">
                Toolchain Snapshot
              </p>
              <p className="text-xs text-foreground/50">
                Real-time registry of MCP tools, their owning agents, and
                connected endpoints.
              </p>
            </div>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scroll">
            {(graphData.tools || []).map((tool) => (
              <div
                key={tool.name}
                className="rounded-xl border border-border/60 p-3 bg-foreground/5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    {tool.name}
                  </span>
                  <span className="text-xs text-foreground/50 uppercase tracking-wide">
                    {tool.agent}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">
                  {tool.description}
                </p>
                <p className="text-[11px] text-foreground/40 mt-2">
                  Endpoint: {tool.endpoint}
                </p>
              </div>
            ))}
            {(graphData.tools || []).length === 0 && (
              <p className="text-xs text-foreground/40">
                No tools registered through MCP yet.
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
      <style jsx global>{`
        @keyframes mcpEdgeDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -28;
          }
        }
        .react-flow__edge.mcp-edge path {
          animation: mcpEdgeDash 1.4s linear infinite;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 9999px;
        }
      `}</style>
    </>
  );
}

function MCPNode({ data }: { data: any }) {
  const palette = nodePalette[data.type] ?? {
    border: "border-slate-500/50",
    bg: "from-slate-500/20 to-slate-500/5",
    accent: "text-slate-200",
    label: data.type,
  };

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg backdrop-blur-xl min-w-[200px] bg-gradient-to-br ${palette.bg} ${palette.border}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{data.label}</p>
        <span
          className={`text-[10px] uppercase tracking-wide ${palette.accent}`}
        >
          {palette.label}
        </span>
      </div>
      {data.description && (
        <p className="text-xs text-slate-200/70 mt-1">{data.description}</p>
      )}
      {data.agent && (
        <p className="text-[10px] uppercase tracking-wide text-slate-300/70 mt-2">
          Agent: {data.agent}
        </p>
      )}
      {data.endpoint && (
        <p className="text-[10px] text-slate-400 mt-1 truncate">
          {data.endpoint}
        </p>
      )}
    </div>
  );
}

