import { useState, useMemo } from "react";
import { useNavigate } from "react-router";

import { imgRouteMap, loadingGif } from "@/app/assets";
import { cardBase } from "@/app/components/ui";

type LocationSuggestion = {
    label: string;
    address: string;
    lat: number | null;
    lon: number | null;
};

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
    const [startSuggestions, setStartSuggestions] = useState<LocationSuggestion[]>([]);
    const [destination, setDestination] = useState("");
    const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
    const [activeField, setActiveField] = useState<"start" | "destination" | null>(null);
    const [searching, setSearching] = useState(false);

    const [type, setType] = useState("walking");
    const [preferencesDescription, setPreferencesDescription] = useState("");

    const fetchSuggestions = async (
        query: string,
        setSuggestions: (s: LocationSuggestion[]) => void
        ) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const response = await fetch(
                `/api/routes/autocomplete?q=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                setSuggestions([]);
                return;
            }

            const results = await response.json();
            setSuggestions(results);
        } catch {
            setSuggestions([]);
        }
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
                preferences_description: preferencesDescription,
            }),
        });

        const data = await res.json();

        navigate("/results", {
            state: { routes: data },
        });
    };

    const selectStart = (suggestion: LocationSuggestion) => {
        setStart(suggestion.label);
        setStartSuggestions([]);
        setActiveField(null);
    };

    const selectDestination = (suggestion: LocationSuggestion) => {
        setDestination(suggestion.label);
        setDestinationSuggestions([]);
        setActiveField(null);
    };

    const SuggestionMenu = ({
        suggestions,
        onSelect,
    }: {
        suggestions: LocationSuggestion[];
        onSelect: (suggestion: LocationSuggestion) => void;
    }) => {
        if (!suggestions.length) return null;

        return (
            <div className="absolute z-20 mt-[6px] w-full overflow-hidden rounded-[12px] border border-[var(--select-border)] bg-[#151014] shadow-[0_18px_45px_var(--shadow-color)]">
                {suggestions.map((suggestion) => (
                    <button
                        key={`${suggestion.label}-${suggestion.lat}-${suggestion.lon}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onSelect(suggestion)}
                        className="block w-full cursor-pointer border-b border-[var(--card-background-secondary)] px-[14px] py-[11px] text-left last:border-b-0 hover:bg-[var(--card-background-secondary)]"
                    >
                        <span className="block text-[13px] font-semibold text-white">
                            {suggestion.label}
                        </span>
                        {suggestion.address && suggestion.address !== suggestion.label && (
                            <span className="mt-[2px] block text-[12px] text-[var(--text-body)]">
                                {suggestion.address}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <>
        <div className="relative shrink-0 w-full">
            <div aria-hidden className="absolute border-[var(--section-divide-border)] border-b border-solid inset-0 pointer-events-none" />
            <div className="pb-[17px] pt-[28px] px-[32px]">
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Generate</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">Find new safe routes to your destination.</p>
            </div>
        </div>

        <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
            <div className="grid grid-cols-2 gap-[20px]">
                {/* Search Form */}
                <form onSubmit={handleSubmit} className={`${cardBase} p-[24px]`}>
                    <div className="flex flex-col gap-[18px]">
                    <div className="relative">
                        <label className="block text-[13px] text-[var(--text-body)] mb-[6px]">
                        Start location
                        </label>
                        <input
                            type="text"
                            placeholder="UT Austin"
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[var(--section-divide-border)] border border-[var(--select-border)] text-white outline-none focus:border-[var(--primary-border-dark-hover)]"
                            value={start}
                            autoComplete="off"
                            onFocus={() => setActiveField("start")}
                            onBlur={() => setTimeout(() => setActiveField(null), 120)}
                            onChange={(e) => {
                                setStart(e.target.value);
                                setActiveField("start");
                                debouncedStartFetch(e.target.value);
                            }}
                        />
                        {activeField === "start" && (
                            <SuggestionMenu suggestions={startSuggestions} onSelect={selectStart} />
                        )}
                    </div>

                    <div className="relative">
                        <label className="block text-[13px] text-[var(--text-body)] mb-[6px]">
                        Destination
                        </label>
                        <input
                            type="text"
                            placeholder="Austin Central Library"
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[var(--section-divide-border)] border border-[var(--select-border)] text-white outline-none focus:border-[var(--primary-border-dark-hover)]"
                            value={destination}
                            autoComplete="off"
                            onFocus={() => setActiveField("destination")}
                            onBlur={() => setTimeout(() => setActiveField(null), 120)}
                            onChange={(e) => {
                                setDestination(e.target.value);
                                setActiveField("destination");
                                debouncedDestinationFetch(e.target.value);
                            }}
                        />
                        {activeField === "destination" && (
                            <SuggestionMenu suggestions={destinationSuggestions} onSelect={selectDestination} />
                        )}
                    </div>

                    <div>
                        <p className="text-[13px] text-[var(--text-body)] mb-[8px]">
                        Travel type
                        </p>

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full h-[50px] px-[16px] rounded-[14px] bg-[var(--section-divide-border)] border border-[var(--select-border)] text-white outline-none focus:border-[var(--primary-border-dark-hover)]"
                        >
                            <option value="walking">Walking</option>
                            <option value="biking">Biking</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[13px] text-[var(--text-body)] mb-[6px]">
                        Route preferences
                        </label>
                        <textarea
                            value={preferencesDescription}
                            onChange={(event) => setPreferencesDescription(event.target.value)}
                            maxLength={600}
                            placeholder="Example: I like quiet scenic walks near water and parks. I want to avoid crowded streets and feel safe walking at night."
                            className="w-full min-h-[112px] resize-none px-[16px] py-[13px] rounded-[14px] bg-[var(--section-divide-border)] border border-[var(--select-border)] text-white outline-none focus:border-[var(--primary-border-dark-hover)] placeholder:text-[var(--placeholder-text)]"
                        />
                    </div>

                    <button
                        className={`h-[52px] rounded-[16px] ${searching ? "bg-var(--section-divide-border) disabled cursor-default text-[var(--primary)]" : "bg-[var(--primary)] cursor-pointer text-white"} font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
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

                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--route-card-gradient-black)] via-transparent to-transparent" />

                    <div className="absolute bottom-[20px] left-[20px] right-[20px]">
                    <div className="bg-[var(--card-black)] border border-[var(--select-border)] rounded-[16px] p-[16px]">
                        <p className="text-[11px] uppercase tracking-[1px] text-[var(--primary)] mb-[4px]">
                        Did you know?
                        </p>

                        <p className="text-white font-semibold mb-[4px]">
                        Route generation uses live traffic data.
                        </p>

                        <p className="text-[13px] text-[var(--text-body)]">
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
