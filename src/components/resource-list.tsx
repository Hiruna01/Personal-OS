"use client";
import { useState } from "react";
import { ExternalLink, FileText, ImageOff } from "lucide-react";
import { EntityDialog } from "./entity-dialog";
import type { Resource } from "@/types/domain";
function Thumbnail({ resource: r }: { resource: Resource }) {
  const [failed, setFailed] = useState(false);
  const src = r.thumbnail_asset_id
    ? `/api/assets/${r.thumbnail_asset_id}`
    : r.thumbnail_url;
  return (
    <span className="note-thumbnail">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <FileText size={27} strokeWidth={1.2} />
          <span>LECTURE NOTES</span>
        </>
      )}
    </span>
  );
}
export function ResourceList({
  resources,
  demo,
  notes = false,
}: {
  resources: Resource[];
  demo: boolean;
  notes?: boolean;
}) {
  return (
    <div className={notes ? "notes-grid" : "paper-list"}>
      {resources.map((r) => (
        <div key={r.id} className={notes ? "note-resource" : "paper-resource"}>
          {notes && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Thumbnail resource={r} />
            </a>
          )}
          <div className="resource-info">
            {!notes && (
              <span className="resource-icon">
                <FileText size={20} />
              </span>
            )}
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              <strong>{r.title}</strong>
              <span>
                {notes
                  ? new URL(r.url).hostname
                  : [
                      r.kind === "exam_paper" ? "Past paper" : "Solution",
                      r.paper_year,
                      r.exam_type,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </span>
            </a>
            <ExternalLink size={15} />
            <EntityDialog kind="resource" initial={r} compact demo={demo} />
          </div>
        </div>
      ))}
    </div>
  );
}
