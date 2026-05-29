// Module declarations for packages without bundled types
declare module '@xyflow/react' {
  export type Node<T = Record<string, unknown>> = {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: T;
    [key: string]: unknown;
  };
  export type Edge<T = Record<string, unknown>> = {
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: T;
    animated?: boolean;
    style?: React.CSSProperties;
    label?: string;
    markerEnd?: unknown;
    [key: string]: unknown;
  };
  export type Connection = {
    source: string | null;
    target: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  };
  export const ReactFlow: React.ComponentType<any>;
  export const ReactFlowProvider: React.ComponentType<any>;
  export const Background: React.ComponentType<any>;
  export const Controls: React.ComponentType<any>;
  export const MiniMap: React.ComponentType<any>;
  export const Handle: React.ComponentType<any>;
  export const BaseEdge: React.ComponentType<any>;
  export const EdgeLabelRenderer: React.ComponentType<any>;
  export const Position: { Top: string; Right: string; Bottom: string; Left: string };
  export const BackgroundVariant: { Lines: string; Dots: string; Cross: string };
  export type FlowEdge = Edge;
  export type FlowNode = Node;
  export function useReactFlow<NodeType = Node, EdgeType = Edge>(): {
    setNodes: (updater: NodeType[] | ((prev: NodeType[]) => NodeType[])) => void;
    setEdges: (updater: EdgeType[] | ((prev: EdgeType[]) => EdgeType[])) => void;
    getNode: (id: string) => NodeType | undefined;
    getEdge: (id: string) => EdgeType | undefined;
    getNodes: () => NodeType[];
    getEdges: () => EdgeType[];
    fitView: (options?: any) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    project: (point: { x: number; y: number }) => { x: number; y: number };
    screenToFlowPosition: (point: { x: number; y: number }) => { x: number; y: number };
    [key: string]: any;
  };
  export function useNodesState<T = any>(init: T[]): [T[], (updater: T[] | ((prev: T[]) => T[])) => void, (changes: any) => void];
  export function useEdgesState<T = any>(init: T[]): [T[], (updater: T[] | ((prev: T[]) => T[])) => void, (changes: any) => void];
  export const addEdge: (edge: any, edges: any) => any;
  export const applyNodeChanges: (changes: any, nodes: any) => any;
  export const applyEdgeChanges: (changes: any, edges: any) => any;
  export const MarkerType: Record<string, string>;
  export const getBezierPath: (params: any) => [string, number, number];
}
