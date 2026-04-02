"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AI_PROVIDERS } from "@/shared/constants/providers";

function getProviderConfig(providerId) {
  return AI_PROVIDERS[providerId] || { name: providerId };
}

function getProviderImageUrl(providerId) {
  return `/providers/${providerId}.png`;
}

// Provider node - Black/White style
function ProviderNode({ data }) {
  const { label, imageUrl, textIcon, active } = data;
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border-2 
        transition-all duration-300 min-w-[160px]
        ${active 
          ? "bg-foreground border-foreground text-background shadow-lg shadow-foreground/20" 
          : "bg-card border-border text-foreground hover:border-foreground/50"
        }
      `}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-transparent !border-0 !w-0 !h-0" />

      {/* Provider icon */}
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center shrink-0
        ${active ? "bg-background/20" : "bg-accent"}
      `}>
        {!imgError ? (
          <img 
            src={imageUrl} 
            alt={label} 
            className={`w-6 h-6 rounded object-contain ${active ? "invert" : ""}`} 
            onError={() => setImgError(true)} 
          />
        ) : (
          <span className={`text-sm font-bold ${active ? "text-background" : "text-foreground"}`}>
            {textIcon}
          </span>
        )}
      </div>

      {/* Provider name */}
      <span className="text-sm font-bold tracking-wide truncate">
        {label}
      </span>

      {/* Active indicator */}
      {active && (
        <span className="relative flex h-2.5 w-2.5 shrink-0 ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-background" />
        </span>
      )}
    </div>
  );
}

ProviderNode.propTypes = {
  data: PropTypes.object.isRequired,
};

// Center 9Router node - White on Black
function RouterNode({ data }) {
  return (
    <div className="flex items-center justify-center px-6 py-4 rounded-2xl border-2 border-foreground bg-foreground text-background shadow-2xl shadow-foreground/30 min-w-[140px]">
      <Handle type="source" position={Position.Top} id="top" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-transparent !border-0 !w-0 !h-0" />

      <img src="/favicon.svg" alt="9Router" className="w-7 h-7 mr-3 invert" />
      <span className="text-base font-black tracking-widest uppercase">9Router</span>
      {data.activeCount > 0 && (
        <span className="ml-3 px-2.5 py-1 rounded-lg bg-background text-foreground text-xs font-black">
          {data.activeCount}
        </span>
      )}
    </div>
  );
}

RouterNode.propTypes = {
  data: PropTypes.object.isRequired,
};

const nodeTypes = { provider: ProviderNode, router: RouterNode };

// Layout nodes in ellipse
function buildLayout(providers, activeSet, lastSet, errorSet) {
  const nodeW = 170;
  const nodeH = 36;
  const routerW = 140;
  const routerH = 48;
  const nodeGap = 28;

  const count = providers.length;

  const minRx = ((nodeW + nodeGap) * count) / (2 * Math.PI);
  const rx = Math.max(340, minRx);
  const ry = Math.max(220, rx * 0.55);
  
  if (count === 0) {
    return {
      nodes: [{ 
        id: "router", 
        type: "router", 
        position: { x: 0, y: 0 }, 
        data: { activeCount: 0 }, 
        draggable: false 
      }],
      edges: [],
    };
  }

  const nodes = [];
  const edges = [];

  nodes.push({
    id: "router",
    type: "router",
    position: { x: -routerW / 2, y: -routerH / 2 },
    data: { activeCount: activeSet.size },
    draggable: false,
  });

  const edgeStyle = (active, last, error) => {
    if (error) return { stroke: "#ff4444", strokeWidth: 2, opacity: 1 };
    if (active) return { stroke: "#ffffff", strokeWidth: 2.5, opacity: 1 };
    if (last) return { stroke: "#ffffff", strokeWidth: 2, opacity: 0.6 };
    return { stroke: "#333333", strokeWidth: 1.5, opacity: 0.5 };
  };

  providers.forEach((p, i) => {
    const config = getProviderConfig(p.provider);
    const active = activeSet.has(p.provider?.toLowerCase());
    const last = !active && lastSet.has(p.provider?.toLowerCase());
    const error = !active && errorSet.has(p.provider?.toLowerCase());
    const nodeId = `provider-${p.provider}`;
    const data = {
      label: (config.name !== p.provider ? config.name : null) || p.name || p.provider,
      imageUrl: getProviderImageUrl(p.provider),
      textIcon: config.textIcon || (p.provider || "?").slice(0, 2).toUpperCase(),
      active,
    };

    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    const cx = rx * Math.cos(angle);
    const cy = ry * Math.sin(angle);

    let sourceHandle, targetHandle;
    if (Math.abs(angle + Math.PI / 2) < Math.PI / 4 || Math.abs(angle - 3 * Math.PI / 2) < Math.PI / 4) {
      sourceHandle = "top"; targetHandle = "bottom";
    } else if (Math.abs(angle - Math.PI / 2) < Math.PI / 4) {
      sourceHandle = "bottom"; targetHandle = "top";
    } else if (cx > 0) {
      sourceHandle = "right"; targetHandle = "left";
    } else {
      sourceHandle = "left"; targetHandle = "right";
    }

    nodes.push({
      id: nodeId,
      type: "provider",
      position: { x: cx - nodeW / 2, y: cy - nodeH / 2 },
      data,
      draggable: false,
    });

    edges.push({
      id: `e-${nodeId}`,
      source: "router",
      sourceHandle,
      target: nodeId,
      targetHandle,
      animated: active,
      style: edgeStyle(active, last, error),
    });
  });

  return { nodes, edges };
}

export default function ProviderTopology({ providers = [], activeRequests = [], lastProvider = "", errorProvider = "" }) {
  const activeKey = useMemo(
    () => activeRequests.map((r) => r.provider?.toLowerCase()).filter(Boolean).sort().join(","),
    [activeRequests]
  );
  const lastKey = lastProvider?.toLowerCase() || "";
  const errorKey = errorProvider?.toLowerCase() || "";
  const providersKey = useMemo(
    () => providers.map((p) => p.provider).filter(Boolean).sort().join(","),
    [providers]
  );

  const { nodes, edges } = useMemo(() => {
    const activeSet = new Set(activeKey.split(",").filter(Boolean));
    const lastSet = new Set(lastKey ? [lastKey] : []);
    const errorSet = new Set(errorKey ? [errorKey] : []);
    return buildLayout(providers, activeSet, lastSet, errorSet);
  }, [providersKey, activeKey, lastKey, errorKey]);

  return (
    <div className="w-full h-[500px] bg-card rounded-2xl border-2 border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.2 }}
        minZoom={0.3}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#333333" 
          gap={20} 
          size={1}
          variant="dots"
        />
        <Controls 
          className="!bg-card !border-border !text-foreground !shadow-lg"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

ProviderTopology.propTypes = {
  providers: PropTypes.array,
  activeRequests: PropTypes.array,
  lastProvider: PropTypes.string,
  errorProvider: PropTypes.string,
};
