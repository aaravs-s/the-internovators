import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";

import { imgRouteMap, homeSvg, loadingGif } from "@/app/assets";
import { cardBase, SafetyBadge } from "@/app/components/ui";

function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

export default function GeneratePage() {
    const navigate = useNavigate();

    const [start, setStart] = useState("");
    const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
    const [destination, setDestination] = useState("");
    const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
    const [searching, setSearching] = useState(false);

    const [type, setType] = useState("walking");

    const fetchSuggestions = async (
        query: string,
        setSuggestions: (s: string[]) => void
        ) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        const response = await fetch(
            `/api/routes/autocomplete?q=${encodeURIComponent(query)}`
        );

        const results = await response.json();

        setSuggestions(
            results.features.map(
                (item: any) => item.properties.label
            )
        );
    };

    const debouncedStartFetch = useMemo(
        () =>
            debounce((value: string) => {
            fetchSuggestions(value, setStartSuggestions);
            }, 300),
        []
    );

    const debouncedDestinationFetch = useMemo(
        () =>
            debounce((value: string) => {
            fetchSuggestions(value, setDestinationSuggestions);
            }, 300),
        []
    );

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        setSearching(true);

        const res = await fetch("/api/routes/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                start,
                destination,
                route_type: type,
            }),
        });

        const data = await res.json();

        navigate("/results", {
            state: { routes: data },
        });
    };


    return (
        <>
        <div className="relative shrink-0 w-full">
            <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
            <div className="pb-[17px] pt-[28px] px-[32px]">
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Generate</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Find new safe routes to your destination.</p>
            </div>
        </div>

        <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
            <div className="grid grid-cols-2 gap-[20px]">
                {/* Search Form */}
                <form onSubmit={handleSubmit} className={`${cardBase} p-[24px]`}>
                    <div className="flex flex-col gap-[18px]">
                    <div>
                        <label className="block text-[13px] text-[rgba(255,255,255,0.45)] mb-[6px]">
                        Start location
                        </label>
                        <input
                            type="text"
                            placeholder="UT Austin"
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white outline-none focus:border-[rgba(196,32,80,0.4)]"
                            value={start}
                            onChange={(e) => {
                                setStart(e.target.value);
                                debouncedStartFetch(e.target.value);
                            }}
                            list="start-suggestions"
                        />
                    </div>
                    <datalist id="start-suggestions">
                        {startSuggestions.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>

                    <div>
                        <label className="block text-[13px] text-[rgba(255,255,255,0.45)] mb-[6px]">
                        Destination
                        </label>
                        <input
                            type="text"
                            placeholder="Austin Central Library"
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white outline-none focus:border-[rgba(196,32,80,0.4)]"
                            value={destination}
                            onChange={(e) => {
                                setDestination(e.target.value);
                                debouncedDestinationFetch(e.target.value);
                            }}
                            list="destination-suggestions"
                        />
                    </div>
                    <datalist id="destination-suggestions">
                        {destinationSuggestions.map((s) => (
                            <option key={s} value={s} />
                        ))}
                    </datalist>

                    <div>
                        <p className="text-[13px] text-[rgba(255,255,255,0.45)] mb-[8px]">
                        Travel type
                        </p>

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white outline-none focus:border-[rgba(196,32,80,0.4)]"
                        >
                            <option value="walking">Walking</option>
                            <option value="biking">Biking</option>
                        </select>
                    </div>

                    <button
                        className={`h-[52px] rounded-[16px] ${searching ? "bg-rgba(255,255,255,0.05) disabled cursor-default text-[#c42050]" : "bg-[#c42050] cursor-pointer text-white"} font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                    >
                        {searching ? (
                            <>
                                <span>Searching</span>
                                <span className="w-5 h-5 flex items-center justify-center">
                                <img
                                    src={loadingGif}
                                    alt="Loading..."
                                    className="w-full h-full object-contain"
                                />
                                </span>
                            </>
                            ) : (
                            <>
                                <span>Compare Safe Routes</span>
                                <span className="w-5 h-5 flex items-center justify-center">
                                →
                                </span>
                            </>
                        )}
                    </button>
                    </div>
                </form>

                {/* Preview Panel */}
                <div className={`${cardBase} overflow-hidden relative`}>
                    <img
                    src={imgRouteMap}
                    alt="Route preview"
                    className="w-full h-[320px] object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.85)] via-transparent to-transparent" />

                    <div className="absolute bottom-[20px] left-[20px] right-[20px]">
                    <div className="bg-[rgba(10,6,8,0.8)] border border-[rgba(255,255,255,0.1)] rounded-[16px] p-[16px]">
                        <p className="text-[11px] uppercase tracking-[1px] text-[#c42050] mb-[4px]">
                        Did you know?
                        </p>

                        <p className="text-white font-semibold mb-[4px]">
                        Route generation uses live traffic data.
                        </p>

                        <p className="text-[13px] text-[rgba(255,255,255,0.45)]">
                            Route are calculated using current traffic levels, ensuring the optimal route every time.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
