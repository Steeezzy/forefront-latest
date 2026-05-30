"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, Mail, RefreshCw, Search, Send, Star, Store } from "lucide-react";
import { buildProxyUrl } from "@/lib/backend-url";

type ReviewRecord = Record<string, any>;

type RequestReviewForm = {
    email: string;
    name: string;
    orderId: string;
    productId: string;
    productTitle: string;
};

const EMPTY_FORM: RequestReviewForm = {
    email: "",
    name: "",
    orderId: "",
    productId: "",
    productTitle: "",
};

function ratingValue(review: ReviewRecord): number {
    return Number(review.rating || review.rating_value || review.score || 0);
}

function reviewBody(review: ReviewRecord): string {
    return String(review.body || review.content || review.description || "").trim();
}

function reviewerName(review: ReviewRecord): string {
    return String(
        review.reviewer?.name ||
        review.reviewer_name ||
        review.name ||
        review.author ||
        "Anonymous reviewer"
    );
}

function reviewerEmail(review: ReviewRecord): string {
    return String(review.reviewer?.email || review.reviewer_email || review.email || "");
}

function productTitle(review: ReviewRecord): string {
    return String(review.product_title || review.product?.title || review.product_name || "Product review");
}

function reviewDate(review: ReviewRecord): string {
    const raw = review.created_at || review.published_at || review.updated_at || review.date;
    if (!raw) {
        return "Recently";
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
        return "Recently";
    }

    return parsed.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<ReviewRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [productId, setProductId] = useState("");
    const [page, setPage] = useState(1);
    const [form, setForm] = useState<RequestReviewForm>(EMPTY_FORM);
    const [requesting, setRequesting] = useState(false);
    const [requestMessage, setRequestMessage] = useState<string | null>(null);

    const fetchReviews = async (nextPage = page) => {
        try {
            setError(null);
            if (loading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const params = new URLSearchParams();
            params.set("page", String(nextPage));
            if (productId.trim()) {
                params.set("productId", productId.trim());
            }
            if (query.trim()) {
                params.set("email", query.trim());
            }

            const response = await fetch(buildProxyUrl(`/api/integrations/judgeme/reviews?${params.toString()}`), {
                credentials: "include",
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Failed to load reviews");
            }

            setReviews(Array.isArray(data.reviews) ? data.reviews : []);
            setPage(nextPage);
        } catch (nextError: any) {
            setError(nextError.message || "Failed to load reviews");
            setReviews([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchReviews(1);
    }, []);

    const stats = useMemo(() => {
        const total = reviews.length;
        const average = total > 0
            ? reviews.reduce((sum, review) => sum + ratingValue(review), 0) / total
            : 0;
        const positive = reviews.filter((review) => ratingValue(review) >= 4).length;
        const needsAttention = reviews.filter((review) => ratingValue(review) > 0 && ratingValue(review) <= 2).length;

        return {
            total,
            average: average.toFixed(1),
            positive,
            needsAttention,
        };
    }, [reviews]);

    const submitReviewRequest = async () => {
        try {
            setRequesting(true);
            setRequestMessage(null);

            const response = await fetch(buildProxyUrl("/api/integrations/judgeme/request-review"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.error || data?.result?.error || "Failed to trigger review request");
            }

            setRequestMessage("Review request queued successfully.");
            setForm(EMPTY_FORM);
        } catch (nextError: any) {
            setRequestMessage(nextError.message || "Failed to trigger review request");
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#f4f4f5] p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Reputation</div>
                    <h1 className="mt-2 text-3xl font-semibold text-gray-900">Reviews</h1>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Monitor Judge.me review activity, filter by reviewer or product, and trigger manual review requests when you need a reputation push.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => void fetchReviews(page)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <Link
                        href="/panel/integrations"
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Manage Integrations
                        <ExternalLink size={15} />
                    </Link>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-4">
                {[
                    { label: "Visible reviews", value: stats.total, icon: Store },
                    { label: "Average rating", value: stats.average, icon: Star },
                    { label: "4★ and above", value: stats.positive, icon: Star },
                    { label: "Needs attention", value: stats.needsAttention, icon: AlertCircle },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <card.icon size={14} className="text-gray-700" />
                            {card.label}
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-gray-900">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
                <section className="rounded-3xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row">
                        <label className="relative flex-1">
                            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Filter by reviewer email"
                                className="w-full rounded-xl border border-gray-200 bg-[#fafafa] py-2.5 pl-9 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                            />
                        </label>
                        <input
                            value={productId}
                            onChange={(event) => setProductId(event.target.value)}
                            placeholder="Filter by product ID"
                            className="rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                        />
                        <button
                            onClick={() => void fetchReviews(1)}
                            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Apply filters
                        </button>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-10 text-center text-sm text-gray-400">
                            Loading reviews...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                            <div className="font-semibold">Reviews unavailable</div>
                            <p className="mt-2">{error}</p>
                            <p className="mt-3">
                                Connect Judge.me in <Link href="/panel/integrations" className="font-semibold underline">Integrations</Link> to populate this page.
                            </p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-10 text-center text-sm text-gray-500">
                            No reviews matched the current filters.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review, index) => (
                                <article key={review.id || `${reviewerEmail(review)}-${index}`} className="rounded-2xl border border-gray-200 bg-[#fcfcfd] p-5">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{productTitle(review)}</div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {reviewerName(review)}
                                                {reviewerEmail(review) ? ` · ${reviewerEmail(review)}` : ""}
                                                {` · ${reviewDate(review)}`}
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                            <Star size={13} fill="currentColor" />
                                            {ratingValue(review) || "N/A"}
                                        </div>
                                    </div>

                                    {review.title && (
                                        <h3 className="mt-4 text-sm font-semibold text-gray-900">{String(review.title)}</h3>
                                    )}

                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        {reviewBody(review) || "No review text was provided for this submission."}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="rounded-3xl border border-gray-200 bg-white p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Manual Send</div>
                    <h2 className="mt-2 text-xl font-semibold text-gray-900">Request a review</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Trigger a Judge.me review request for a specific order when your team resolves an issue offline or after a successful delivery.
                    </p>

                    <div className="mt-5 space-y-3">
                        {[
                            { key: "email", label: "Customer email", icon: Mail },
                            { key: "name", label: "Customer name" },
                            { key: "orderId", label: "Order ID" },
                            { key: "productId", label: "Product ID" },
                            { key: "productTitle", label: "Product title" },
                        ].map((field) => (
                            <label key={field.key} className="block">
                                <div className="mb-2 text-xs font-medium text-gray-500">{field.label}</div>
                                <div className="relative">
                                    {"icon" in field && field.icon ? (
                                        <field.icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    ) : null}
                                    <input
                                        value={form[field.key as keyof RequestReviewForm]}
                                        onChange={(event) =>
                                            setForm((current) => ({ ...current, [field.key]: event.target.value }))
                                        }
                                        className={`w-full rounded-xl border border-gray-200 bg-[#fafafa] py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-400 ${
                                            "icon" in field && field.icon ? "pl-9 pr-4" : "px-4"
                                        }`}
                                    />
                                </div>
                            </label>
                        ))}
                    </div>

                    {requestMessage && (
                        <div className="mt-4 rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-600">
                            {requestMessage}
                        </div>
                    )}

                    <button
                        onClick={() => void submitReviewRequest()}
                        disabled={requesting}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        <Send size={15} />
                        {requesting ? "Sending..." : "Send Review Request"}
                    </button>
                </aside>
            </div>
        </div>
    );
}
