import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createComment,
  deleteComment,
  getComments,
  type CommunityComment,
} from "@/app/api/community";


function dateLabel(value: string) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}


export default function RouteDiscussion({ routeId }: { routeId: string }) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setComments(await getComments(routeId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load discussion");
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function submit(event: FormEvent, parentId: string | null = null) {
    event.preventDefault();
    const text = (parentId ? replyBody : body).trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createComment(routeId, text, parentId);
      if (parentId) {
        setReplyBody("");
        setReplyTo(null);
      } else {
        setBody("");
      }
      await loadComments();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(commentId: string) {
    setError("");
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete comment");
    }
  }

  function commentCard(comment: CommunityComment, isReply = false) {
    return (
      <article
        key={comment.id}
        className={`${isReply ? "ml-[36px] mt-[8px]" : "mt-[12px]"} rounded-[14px] border border-[var(--option-bg-hover)] bg-[var(--section-divide-border)] p-[14px]`}
      >
        <div className="flex items-start gap-[10px]">
          <div className="size-[32px] shrink-0 rounded-full bg-[var(--primary-bg-dark)] flex items-center justify-center text-[var(--initials-circle-text)] font-bold text-[12px]">
            {comment.author.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[8px]">
              <span className="font-semibold text-[12px] text-white">@{comment.author.username}</span>
              <span className="text-[10px] text-[var(--grey-muted)]">{dateLabel(comment.created_at)}</span>
            </div>
            <p className="mt-[5px] whitespace-pre-wrap break-words text-[13px] leading-[19px] text-[var(--text-body)]">{comment.body}</p>
            <div className="mt-[8px] flex gap-[12px]">
              {!isReply && (
                <button
                  type="button"
                  onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyBody(""); }}
                  className="text-[11px] font-semibold text-[var(--blue-light)] cursor-pointer"
                >
                  Reply
                </button>
              )}
              {comment.can_delete && (
                <button type="button" onClick={() => void remove(comment.id)} className="text-[11px] text-[var(--error-text-color)] cursor-pointer">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        {replyTo === comment.id && (
          <form onSubmit={(event) => void submit(event, comment.id)} className="ml-[42px] mt-[10px] flex gap-[8px]">
            <input
              aria-label={`Reply to ${comment.author.username}`}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              maxLength={500}
              placeholder="Write a reply…"
              className="min-w-0 flex-1 rounded-[10px] border border-[var(--select-border)] bg-[var(--shadow-color)] px-[12px] py-[8px] text-[12px] text-white outline-none focus:border-[var(--primary-border-dark-hover)]"
            />
            <button disabled={!replyBody.trim() || submitting} className="rounded-[10px] bg-[var(--primary)] px-[12px] text-[11px] font-semibold text-white disabled:opacity-40">
              Reply
            </button>
          </form>
        )}
        {comment.replies.map((reply) => commentCard(reply, true))}
      </article>
    );
  }

  return (
    <section aria-label="Route discussion">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[15px] text-white">Walking community discussion</p>
          <p className="text-[12px] text-[var(--text-note-subtitle)]">Share useful, respectful local context.</p>
        </div>
        {!loading && <span className="text-[11px] text-[var(--grey-muted)]">{comments.reduce((count, item) => count + 1 + item.replies.length, 0)} messages</span>}
      </div>

      <form onSubmit={(event) => void submit(event)} className="mt-[14px] flex gap-[10px]">
        <textarea
          aria-label="Add a comment"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="What should other walkers know?"
          className="min-w-0 flex-1 resize-none rounded-[12px] border border-[var(--select-border)] bg-[var(--shadow-color)] px-[13px] py-[10px] text-[13px] text-white outline-none focus:border-[var(--primary-border-dark-hover)]"
        />
        <button disabled={!body.trim() || submitting} className="self-end rounded-[11px] bg-[var(--primary)] px-[16px] py-[10px] text-[12px] font-semibold text-white disabled:opacity-40">
          Post
        </button>
      </form>

      {error && (
        <div role="alert" className="mt-[10px] flex items-center justify-between rounded-[10px] bg-[var(--error-bg-color)] px-[12px] py-[9px] text-[12px] text-[var(--error-text-color)]">
          <span>{error}</span>
          <button type="button" onClick={() => void loadComments()} className="font-semibold underline">Retry</button>
        </div>
      )}
      {loading && <p className="mt-[14px] text-[12px] text-[var(--text-note-subtitle)]">Loading discussion…</p>}
      {!loading && !error && comments.length === 0 && (
        <p className="mt-[14px] rounded-[12px] border border-dashed border-[var(--select-border)] px-[14px] py-[18px] text-center text-[12px] text-[var(--text-note-subtitle)]">Start the conversation about this route.</p>
      )}
      {!loading && comments.map((comment) => commentCard(comment))}
    </section>
  );
}
