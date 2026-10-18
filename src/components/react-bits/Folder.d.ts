import type { CSSProperties, ReactElement, ReactNode } from "react";
export type FolderItem =
  | string
  | number
  | ReactElement
  | {
      title?: string;
      description?: string;
      image?: string;
      alt?: string;
      content?: ReactNode;
    };
export interface FolderProps {
  items?: FolderItem[];
  children?: ReactNode;
  label?: string;
  /** App adaptation: use native Next.js link navigation instead of toggling. */
  href?: string;
  mode?: "flap" | "book";
  variant?: "solid" | "glass" | "matte";
  layout?: "spread" | "stack" | "row";
  color?: string;
  paperColor?: string;
  tabPosition?: "left" | "center" | "right";
  openOn?: "click" | "hover";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onItemClick?: (item: FolderItem, index: number) => void;
  onItemDrop?: (item: FolderItem, index: number, inside: boolean) => void;
  draggable?: boolean;
  zoomOnClick?: boolean;
  peek?: boolean;
  intro?: boolean;
  size?: number;
  frost?: number;
  tilt?: number;
  speed?: number;
  bounce?: number;
  closeOnOutsideClick?: boolean;
  theme?: "light" | "dark";
  className?: string;
  style?: CSSProperties;
}
export default function Folder(props: FolderProps): ReactElement;
