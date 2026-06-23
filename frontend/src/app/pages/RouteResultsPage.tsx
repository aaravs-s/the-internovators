import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";

import { imgRouteMap, homeSvg } from "@/app/assets";
import { cardBase, SafetyBadge } from "@/app/components/ui";

export default function RouteResultsPage() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [saved, setSaved] = useState<Set<string>>(new Set());
    // const [routes, setRoutes] = useState<RouteSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const routes = state.routes;
    
    // console.log(routes)

    // var routes = [
    //     {
    //         "id": "route",
    //         "name": "Route Option",
    //         "start": "UT Tower, Austin, TX, USA",
    //         "destination": "Q2 Stadium, Austin, TX, USA",
    //         "distance_miles": 8.47,
    //         "estimated_minutes": 163,
    //         "safety_score": 93,
    //         "summary": "Strong sidewalk coverage and comfortable walking conditions.",
    //         "highlights": [
    //             "Trudy's",
    //             "Turnstile",
    //             "Bill Miller BBQ",
    //             "Nori",
    //             "PD Thai",
    //             "Salsa Limón",
    //             "Kerbey Lane Cafe",
    //             "Roppolo's Pizzeria",
    //             "Tumble22"
    //         ],
    //         "route_type": "walking",
    //         "map_style": "quiet",
    //         "filename": "map_85.png",
    //         "directions": [
    //             {
    //                 "distance": 19.9,
    //                 "duration": 14.3,
    //                 "type": 11,
    //                 "instruction": "Head east",
    //                 "name": "-",
    //                 "way_points": [
    //                     0,
    //                     1
    //                 ]
    //             },
    //             {
    //                 "distance": 82.7,
    //                 "duration": 59.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     1,
    //                     9
    //                 ]
    //             },
    //             {
    //                 "distance": 130.1,
    //                 "duration": 93.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Inner Campus Circle",
    //                 "name": "Inner Campus Circle",
    //                 "way_points": [
    //                     9,
    //                     17
    //                 ]
    //             },
    //             {
    //                 "distance": 90,
    //                 "duration": 64.8,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Whitis Avenue",
    //                 "name": "Whitis Avenue",
    //                 "way_points": [
    //                     17,
    //                     23
    //                 ]
    //             },
    //             {
    //                 "distance": 4,
    //                 "duration": 2.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     23,
    //                     24
    //                 ]
    //             },
    //             {
    //                 "distance": 8.6,
    //                 "duration": 6.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     24,
    //                     26
    //                 ]
    //             },
    //             {
    //                 "distance": 138,
    //                 "duration": 99.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     26,
    //                     33
    //                 ]
    //             },
    //             {
    //                 "distance": 51.9,
    //                 "duration": 37.3,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     33,
    //                     36
    //                 ]
    //             },
    //             {
    //                 "distance": 92.2,
    //                 "duration": 66.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     36,
    //                     37
    //                 ]
    //             },
    //             {
    //                 "distance": 33.5,
    //                 "duration": 24.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     37,
    //                     38
    //                 ]
    //             },
    //             {
    //                 "distance": 27.9,
    //                 "duration": 20.1,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     38,
    //                     43
    //                 ]
    //             },
    //             {
    //                 "distance": 3,
    //                 "duration": 2.1,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     43,
    //                     44
    //                 ]
    //             },
    //             {
    //                 "distance": 272.2,
    //                 "duration": 196,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     44,
    //                     52
    //                 ]
    //             },
    //             {
    //                 "distance": 8.6,
    //                 "duration": 6.2,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     52,
    //                     54
    //                 ]
    //             },
    //             {
    //                 "distance": 98.6,
    //                 "duration": 71,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     54,
    //                     56
    //                 ]
    //             },
    //             {
    //                 "distance": 247.9,
    //                 "duration": 178.5,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     56,
    //                     63
    //                 ]
    //             },
    //             {
    //                 "distance": 642.8,
    //                 "duration": 462.8,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     63,
    //                     90
    //                 ]
    //             },
    //             {
    //                 "distance": 20.2,
    //                 "duration": 14.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     90,
    //                     93
    //                 ]
    //             },
    //             {
    //                 "distance": 283,
    //                 "duration": 203.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     93,
    //                     105
    //                 ]
    //             },
    //             {
    //                 "distance": 351.4,
    //                 "duration": 253,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     105,
    //                     120
    //                 ]
    //             },
    //             {
    //                 "distance": 9,
    //                 "duration": 6.5,
    //                 "type": 1,
    //                 "instruction": "Turn right onto West Avenue",
    //                 "name": "West Avenue",
    //                 "way_points": [
    //                     120,
    //                     121
    //                 ]
    //             },
    //             {
    //                 "distance": 58.1,
    //                 "duration": 41.8,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     121,
    //                     124
    //                 ]
    //             },
    //             {
    //                 "distance": 197.1,
    //                 "duration": 141.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     124,
    //                     134
    //                 ]
    //             },
    //             {
    //                 "distance": 130.4,
    //                 "duration": 93.9,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     134,
    //                     141
    //                 ]
    //             },
    //             {
    //                 "distance": 38,
    //                 "duration": 27.3,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     141,
    //                     145
    //                 ]
    //             },
    //             {
    //                 "distance": 112.7,
    //                 "duration": 81.1,
    //                 "type": 0,
    //                 "instruction": "Turn left onto West 40th Street",
    //                 "name": "West 40th Street",
    //                 "way_points": [
    //                     145,
    //                     148
    //                 ]
    //             },
    //             {
    //                 "distance": 11.6,
    //                 "duration": 8.4,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Marathon Boulevard",
    //                 "name": "Marathon Boulevard",
    //                 "way_points": [
    //                     148,
    //                     149
    //                 ]
    //             },
    //             {
    //                 "distance": 7.6,
    //                 "duration": 5.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     149,
    //                     151
    //                 ]
    //             },
    //             {
    //                 "distance": 9.2,
    //                 "duration": 6.6,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     151,
    //                     153
    //                 ]
    //             },
    //             {
    //                 "distance": 305.9,
    //                 "duration": 220.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     153,
    //                     172
    //                 ]
    //             },
    //             {
    //                 "distance": 12.9,
    //                 "duration": 9.3,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     172,
    //                     174
    //                 ]
    //             },
    //             {
    //                 "distance": 1034.6,
    //                 "duration": 744.9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     174,
    //                     203
    //                 ]
    //             },
    //             {
    //                 "distance": 2.5,
    //                 "duration": 1.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     203,
    //                     204
    //                 ]
    //             },
    //             {
    //                 "distance": 639.2,
    //                 "duration": 460.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     204,
    //                     223
    //                 ]
    //             },
    //             {
    //                 "distance": 493.7,
    //                 "duration": 355.4,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     223,
    //                     243
    //                 ]
    //             },
    //             {
    //                 "distance": 20.6,
    //                 "duration": 14.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     243,
    //                     245
    //                 ]
    //             },
    //             {
    //                 "distance": 492.9,
    //                 "duration": 354.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     245,
    //                     263
    //                 ]
    //             },
    //             {
    //                 "distance": 24.5,
    //                 "duration": 17.6,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     263,
    //                     267
    //                 ]
    //             },
    //             {
    //                 "distance": 38.5,
    //                 "duration": 27.7,
    //                 "type": 3,
    //                 "instruction": "Turn sharp right",
    //                 "name": "-",
    //                 "way_points": [
    //                     267,
    //                     268
    //                 ]
    //             },
    //             {
    //                 "distance": 250,
    //                 "duration": 180,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     268,
    //                     275
    //                 ]
    //             },
    //             {
    //                 "distance": 50.9,
    //                 "duration": 36.7,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Romeria Drive",
    //                 "name": "Romeria Drive",
    //                 "way_points": [
    //                     275,
    //                     277
    //                 ]
    //             },
    //             {
    //                 "distance": 595,
    //                 "duration": 428.4,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     277,
    //                     303
    //                 ]
    //             },
    //             {
    //                 "distance": 2.9,
    //                 "duration": 2.1,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     303,
    //                     304
    //                 ]
    //             },
    //             {
    //                 "distance": 6.3,
    //                 "duration": 4.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     304,
    //                     306
    //                 ]
    //             },
    //             {
    //                 "distance": 36.3,
    //                 "duration": 26.2,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Burbank Street",
    //                 "name": "Burbank Street",
    //                 "way_points": [
    //                     306,
    //                     307
    //                 ]
    //             },
    //             {
    //                 "distance": 285,
    //                 "duration": 205.2,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Hardy Drive",
    //                 "name": "Hardy Drive",
    //                 "way_points": [
    //                     307,
    //                     311
    //                 ]
    //             },
    //             {
    //                 "distance": 8.8,
    //                 "duration": 6.3,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     311,
    //                     313
    //                 ]
    //             },
    //             {
    //                 "distance": 246.2,
    //                 "duration": 177.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     313,
    //                     324
    //                 ]
    //             },
    //             {
    //                 "distance": 5.4,
    //                 "duration": 3.9,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     324,
    //                     325
    //                 ]
    //             },
    //             {
    //                 "distance": 9.5,
    //                 "duration": 6.8,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     325,
    //                     327
    //                 ]
    //             },
    //             {
    //                 "distance": 163.1,
    //                 "duration": 117.5,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Burnet Lane",
    //                 "name": "Burnet Lane",
    //                 "way_points": [
    //                     327,
    //                     332
    //                 ]
    //             },
    //             {
    //                 "distance": 11.9,
    //                 "duration": 8.6,
    //                 "type": 12,
    //                 "instruction": "Keep left onto Burnet Lane",
    //                 "name": "Burnet Lane",
    //                 "way_points": [
    //                     332,
    //                     333
    //                 ]
    //             },
    //             {
    //                 "distance": 498,
    //                 "duration": 358.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     333,
    //                     358
    //                 ]
    //             },
    //             {
    //                 "distance": 232,
    //                 "duration": 167,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     358,
    //                     397
    //                 ]
    //             },
    //             {
    //                 "distance": 4.1,
    //                 "duration": 2.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     397,
    //                     398
    //                 ]
    //             },
    //             {
    //                 "distance": 2054.5,
    //                 "duration": 1479.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     398,
    //                     489
    //                 ]
    //             },
    //             {
    //                 "distance": 24.4,
    //                 "duration": 17.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     489,
    //                     491
    //                 ]
    //             },
    //             {
    //                 "distance": 335.5,
    //                 "duration": 241.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     491,
    //                     504
    //                 ]
    //             },
    //             {
    //                 "distance": 97.3,
    //                 "duration": 70.1,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     504,
    //                     509
    //                 ]
    //             },
    //             {
    //                 "distance": 46.4,
    //                 "duration": 33.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     509,
    //                     516
    //                 ]
    //             },
    //             {
    //                 "distance": 424.5,
    //                 "duration": 305.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     516,
    //                     534
    //                 ]
    //             },
    //             {
    //                 "distance": 8.6,
    //                 "duration": 6.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     534,
    //                     535
    //                 ]
    //             },
    //             {
    //                 "distance": 105.9,
    //                 "duration": 76.2,
    //                 "type": 1,
    //                 "instruction": "Turn right onto McNeil Road",
    //                 "name": "McNeil Road",
    //                 "way_points": [
    //                     535,
    //                     541
    //                 ]
    //             },
    //             {
    //                 "distance": 31.5,
    //                 "duration": 22.7,
    //                 "type": 13,
    //                 "instruction": "Keep right onto McNeil Road",
    //                 "name": "McNeil Road",
    //                 "way_points": [
    //                     541,
    //                     542
    //                 ]
    //             },
    //             {
    //                 "distance": 69.8,
    //                 "duration": 50.3,
    //                 "type": 6,
    //                 "instruction": "Continue straight onto Saunders Lane",
    //                 "name": "Saunders Lane",
    //                 "way_points": [
    //                     542,
    //                     547
    //                 ]
    //             },
    //             {
    //                 "distance": 242.5,
    //                 "duration": 174.6,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     547,
    //                     551
    //                 ]
    //             },
    //             {
    //                 "distance": 253.7,
    //                 "duration": 182.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     551,
    //                     561
    //                 ]
    //             },
    //             {
    //                 "distance": 171.3,
    //                 "duration": 123.3,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Burnet Road, FM 1325",
    //                 "name": "Burnet Road, FM 1325",
    //                 "way_points": [
    //                     561,
    //                     564
    //                 ]
    //             },
    //             {
    //                 "distance": 25.5,
    //                 "duration": 18.3,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     564,
    //                     566
    //                 ]
    //             },
    //             {
    //                 "distance": 21.6,
    //                 "duration": 15.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     566,
    //                     570
    //                 ]
    //             },
    //             {
    //                 "distance": 544.1,
    //                 "duration": 391.7,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     570,
    //                     606
    //                 ]
    //             },
    //             {
    //                 "distance": 3,
    //                 "duration": 2.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     606,
    //                     607
    //                 ]
    //             },
    //             {
    //                 "distance": 17.7,
    //                 "duration": 12.7,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     607,
    //                     611
    //                 ]
    //             },
    //             {
    //                 "distance": 4,
    //                 "duration": 2.9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     611,
    //                     612
    //                 ]
    //             },
    //             {
    //                 "distance": 183.4,
    //                 "duration": 132.1,
    //                 "type": 6,
    //                 "instruction": "Continue straight onto Red Line Trail",
    //                 "name": "Red Line Trail",
    //                 "way_points": [
    //                     612,
    //                     619
    //                 ]
    //             },
    //             {
    //                 "distance": 17.4,
    //                 "duration": 12.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     619,
    //                     623
    //                 ]
    //             },
    //             {
    //                 "distance": 31.5,
    //                 "duration": 22.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Red Line Trail",
    //                 "name": "Red Line Trail",
    //                 "way_points": [
    //                     623,
    //                     627
    //                 ]
    //             },
    //             {
    //                 "distance": 3.6,
    //                 "duration": 2.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     627,
    //                     628
    //                 ]
    //             },
    //             {
    //                 "distance": 100.4,
    //                 "duration": 72.3,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     628,
    //                     631
    //                 ]
    //             },
    //             {
    //                 "distance": 58.6,
    //                 "duration": 42.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     631,
    //                     638
    //                 ]
    //             },
    //             {
    //                 "distance": 48.5,
    //                 "duration": 34.9,
    //                 "type": 5,
    //                 "instruction": "Turn slight right onto Red Line Trail",
    //                 "name": "Red Line Trail",
    //                 "way_points": [
    //                     638,
    //                     639
    //                 ]
    //             },
    //             {
    //                 "distance": 58.3,
    //                 "duration": 41.9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     639,
    //                     646
    //                 ]
    //             },
    //             {
    //                 "distance": 0,
    //                 "duration": 0,
    //                 "type": 10,
    //                 "instruction": "Arrive at your destination, on the right",
    //                 "name": "-",
    //                 "way_points": [
    //                     646,
    //                     646
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         "id": "route",
    //         "name": "Route Option",
    //         "start": "UT Tower, Austin, TX, USA",
    //         "destination": "Q2 Stadium, Austin, TX, USA",
    //         "distance_miles": 8.31,
    //         "estimated_minutes": 160,
    //         "safety_score": 89,
    //         "summary": "Strong sidewalk coverage and comfortable walking conditions.",
    //         "highlights": [
    //             "Live Oak Park",
    //             "China Family",
    //             "Tex Mex Joe's",
    //             "Bamboo House Austin",
    //             "Vigilante Gastropub & Games"
    //         ],
    //         "route_type": "walking",
    //         "map_style": "direct",
    //         "filename": "map_86.png",
    //         "directions": [
    //             {
    //                 "distance": 19.9,
    //                 "duration": 14.3,
    //                 "type": 11,
    //                 "instruction": "Head east",
    //                 "name": "-",
    //                 "way_points": [
    //                     0,
    //                     1
    //                 ]
    //             },
    //             {
    //                 "distance": 18.8,
    //                 "duration": 13.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     1,
    //                     2
    //                 ]
    //             },
    //             {
    //                 "distance": 7.7,
    //                 "duration": 5.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     2,
    //                     3
    //                 ]
    //             },
    //             {
    //                 "distance": 111.8,
    //                 "duration": 80.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     3,
    //                     18
    //                 ]
    //             },
    //             {
    //                 "distance": 43,
    //                 "duration": 31,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     18,
    //                     20
    //                 ]
    //             },
    //             {
    //                 "distance": 52.7,
    //                 "duration": 38,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     20,
    //                     24
    //                 ]
    //             },
    //             {
    //                 "distance": 166.4,
    //                 "duration": 119.8,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Speedway",
    //                 "name": "Speedway",
    //                 "way_points": [
    //                     24,
    //                     34
    //                 ]
    //             },
    //             {
    //                 "distance": 145,
    //                 "duration": 104.4,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     34,
    //                     40
    //                 ]
    //             },
    //             {
    //                 "distance": 1.5,
    //                 "duration": 1.1,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     40,
    //                     41
    //                 ]
    //             },
    //             {
    //                 "distance": 377.6,
    //                 "duration": 271.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     41,
    //                     54
    //                 ]
    //             },
    //             {
    //                 "distance": 18.9,
    //                 "duration": 13.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     54,
    //                     58
    //                 ]
    //             },
    //             {
    //                 "distance": 22.5,
    //                 "duration": 16.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     58,
    //                     63
    //                 ]
    //             },
    //             {
    //                 "distance": 115.9,
    //                 "duration": 83.4,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     63,
    //                     70
    //                 ]
    //             },
    //             {
    //                 "distance": 57.3,
    //                 "duration": 41.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     70,
    //                     73
    //                 ]
    //             },
    //             {
    //                 "distance": 13.7,
    //                 "duration": 9.9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     73,
    //                     75
    //                 ]
    //             },
    //             {
    //                 "distance": 11.3,
    //                 "duration": 8.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     75,
    //                     77
    //                 ]
    //             },
    //             {
    //                 "distance": 539.2,
    //                 "duration": 388.2,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Grooms Street",
    //                 "name": "Grooms Street",
    //                 "way_points": [
    //                     77,
    //                     97
    //                 ]
    //             },
    //             {
    //                 "distance": 28.7,
    //                 "duration": 20.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     97,
    //                     99
    //                 ]
    //             },
    //             {
    //                 "distance": 7.3,
    //                 "duration": 5.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     99,
    //                     100
    //                 ]
    //             },
    //             {
    //                 "distance": 33.4,
    //                 "duration": 24.1,
    //                 "type": 0,
    //                 "instruction": "Turn left onto East 35th Street",
    //                 "name": "East 35th Street",
    //                 "way_points": [
    //                     100,
    //                     101
    //                 ]
    //             },
    //             {
    //                 "distance": 360.3,
    //                 "duration": 259.4,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Griffith Street",
    //                 "name": "Griffith Street",
    //                 "way_points": [
    //                     101,
    //                     118
    //                 ]
    //             },
    //             {
    //                 "distance": 1189.4,
    //                 "duration": 856.4,
    //                 "type": 6,
    //                 "instruction": "Continue straight onto Avenue F",
    //                 "name": "Avenue F",
    //                 "way_points": [
    //                     118,
    //                     140
    //                 ]
    //             },
    //             {
    //                 "distance": 30.6,
    //                 "duration": 22.1,
    //                 "type": 1,
    //                 "instruction": "Turn right onto East 47th Street",
    //                 "name": "East 47th Street",
    //                 "way_points": [
    //                     140,
    //                     141
    //                 ]
    //             },
    //             {
    //                 "distance": 572,
    //                 "duration": 411.9,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Avenue F",
    //                 "name": "Avenue F",
    //                 "way_points": [
    //                     141,
    //                     151
    //                 ]
    //             },
    //             {
    //                 "distance": 17.8,
    //                 "duration": 12.8,
    //                 "type": 0,
    //                 "instruction": "Turn left onto East 51st Street",
    //                 "name": "East 51st Street",
    //                 "way_points": [
    //                     151,
    //                     152
    //                 ]
    //             },
    //             {
    //                 "distance": 267,
    //                 "duration": 192.3,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Avenue F",
    //                 "name": "Avenue F",
    //                 "way_points": [
    //                     152,
    //                     155
    //                 ]
    //             },
    //             {
    //                 "distance": 5.2,
    //                 "duration": 3.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     155,
    //                     156
    //                 ]
    //             },
    //             {
    //                 "distance": 15.4,
    //                 "duration": 11.1,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     156,
    //                     159
    //                 ]
    //             },
    //             {
    //                 "distance": 424.5,
    //                 "duration": 305.6,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     159,
    //                     174
    //                 ]
    //             },
    //             {
    //                 "distance": 92.4,
    //                 "duration": 66.5,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     174,
    //                     178
    //                 ]
    //             },
    //             {
    //                 "distance": 2.6,
    //                 "duration": 1.8,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     178,
    //                     179
    //                 ]
    //             },
    //             {
    //                 "distance": 23.3,
    //                 "duration": 16.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     179,
    //                     184
    //                 ]
    //             },
    //             {
    //                 "distance": 97.4,
    //                 "duration": 70.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     184,
    //                     185
    //                 ]
    //             },
    //             {
    //                 "distance": 306.3,
    //                 "duration": 220.5,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Link Avenue",
    //                 "name": "Link Avenue",
    //                 "way_points": [
    //                     185,
    //                     191
    //                 ]
    //             },
    //             {
    //                 "distance": 219.2,
    //                 "duration": 157.8,
    //                 "type": 0,
    //                 "instruction": "Turn left onto West Skyview Road",
    //                 "name": "West Skyview Road",
    //                 "way_points": [
    //                     191,
    //                     199
    //                 ]
    //             },
    //             {
    //                 "distance": 300.7,
    //                 "duration": 216.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     199,
    //                     207
    //                 ]
    //             },
    //             {
    //                 "distance": 1.9,
    //                 "duration": 1.4,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     207,
    //                     208
    //                 ]
    //             },
    //             {
    //                 "distance": 643.8,
    //                 "duration": 463.5,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     208,
    //                     237
    //                 ]
    //             },
    //             {
    //                 "distance": 22.9,
    //                 "duration": 16.5,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Red Line Trail",
    //                 "name": "Red Line Trail",
    //                 "way_points": [
    //                     237,
    //                     241
    //                 ]
    //             },
    //             {
    //                 "distance": 20.8,
    //                 "duration": 15,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     241,
    //                     243
    //                 ]
    //             },
    //             {
    //                 "distance": 19.2,
    //                 "duration": 13.8,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     243,
    //                     245
    //                 ]
    //             },
    //             {
    //                 "distance": 399.2,
    //                 "duration": 287.4,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     245,
    //                     273
    //                 ]
    //             },
    //             {
    //                 "distance": 20.7,
    //                 "duration": 14.9,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     273,
    //                     275
    //                 ]
    //             },
    //             {
    //                 "distance": 53.7,
    //                 "duration": 38.7,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     275,
    //                     277
    //                 ]
    //             },
    //             {
    //                 "distance": 8.2,
    //                 "duration": 5.9,
    //                 "type": 6,
    //                 "instruction": "Continue straight",
    //                 "name": "-",
    //                 "way_points": [
    //                     277,
    //                     278
    //                 ]
    //             },
    //             {
    //                 "distance": 502.7,
    //                 "duration": 361.9,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     278,
    //                     314
    //                 ]
    //             },
    //             {
    //                 "distance": 26.6,
    //                 "duration": 19.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     314,
    //                     316
    //                 ]
    //             },
    //             {
    //                 "distance": 202.4,
    //                 "duration": 145.7,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     316,
    //                     322
    //                 ]
    //             },
    //             {
    //                 "distance": 3.4,
    //                 "duration": 2.4,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     322,
    //                     323
    //                 ]
    //             },
    //             {
    //                 "distance": 12.5,
    //                 "duration": 9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     323,
    //                     327
    //                 ]
    //             },
    //             {
    //                 "distance": 6.5,
    //                 "duration": 4.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     327,
    //                     328
    //                 ]
    //             },
    //             {
    //                 "distance": 135.3,
    //                 "duration": 97.4,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     328,
    //                     333
    //                 ]
    //             },
    //             {
    //                 "distance": 232.3,
    //                 "duration": 167.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     333,
    //                     346
    //                 ]
    //             },
    //             {
    //                 "distance": 58.4,
    //                 "duration": 42,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     346,
    //                     358
    //                 ]
    //             },
    //             {
    //                 "distance": 143.7,
    //                 "duration": 103.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     358,
    //                     371
    //                 ]
    //             },
    //             {
    //                 "distance": 836.8,
    //                 "duration": 602.5,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     371,
    //                     397
    //                 ]
    //             },
    //             {
    //                 "distance": 847.3,
    //                 "duration": 610,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     397,
    //                     439
    //                 ]
    //             },
    //             {
    //                 "distance": 2.3,
    //                 "duration": 1.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     439,
    //                     441
    //                 ]
    //             },
    //             {
    //                 "distance": 604,
    //                 "duration": 434.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     441,
    //                     464
    //                 ]
    //             },
    //             {
    //                 "distance": 434,
    //                 "duration": 312.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     464,
    //                     478
    //                 ]
    //             },
    //             {
    //                 "distance": 538.6,
    //                 "duration": 387.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     478,
    //                     501
    //                 ]
    //             },
    //             {
    //                 "distance": 31.7,
    //                 "duration": 22.8,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     501,
    //                     505
    //                 ]
    //             },
    //             {
    //                 "distance": 29.4,
    //                 "duration": 21.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     505,
    //                     509
    //                 ]
    //             },
    //             {
    //                 "distance": 331.1,
    //                 "duration": 238.4,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     509,
    //                     529
    //                 ]
    //             },
    //             {
    //                 "distance": 29.6,
    //                 "duration": 21.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     529,
    //                     530
    //                 ]
    //             },
    //             {
    //                 "distance": 426,
    //                 "duration": 306.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     530,
    //                     538
    //                 ]
    //             },
    //             {
    //                 "distance": 197.8,
    //                 "duration": 142.4,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     538,
    //                     550
    //                 ]
    //             },
    //             {
    //                 "distance": 10.6,
    //                 "duration": 7.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     550,
    //                     551
    //                 ]
    //             },
    //             {
    //                 "distance": 31.6,
    //                 "duration": 22.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Rutland Drive",
    //                 "name": "Rutland Drive",
    //                 "way_points": [
    //                     551,
    //                     552
    //                 ]
    //             },
    //             {
    //                 "distance": 343.8,
    //                 "duration": 247.5,
    //                 "type": 1,
    //                 "instruction": "Turn right onto McKalla Place",
    //                 "name": "McKalla Place",
    //                 "way_points": [
    //                     552,
    //                     559
    //                 ]
    //             },
    //             {
    //                 "distance": 7.9,
    //                 "duration": 5.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto West Road",
    //                 "name": "West Road",
    //                 "way_points": [
    //                     559,
    //                     560
    //                 ]
    //             },
    //             {
    //                 "distance": 245.2,
    //                 "duration": 176.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     560,
    //                     568
    //                 ]
    //             },
    //             {
    //                 "distance": 160,
    //                 "duration": 115.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     568,
    //                     577
    //                 ]
    //             },
    //             {
    //                 "distance": 3.7,
    //                 "duration": 2.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     577,
    //                     578
    //                 ]
    //             },
    //             {
    //                 "distance": 21.7,
    //                 "duration": 15.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     578,
    //                     584
    //                 ]
    //             },
    //             {
    //                 "distance": 0,
    //                 "duration": 0,
    //                 "type": 10,
    //                 "instruction": "Arrive at your destination, on the left",
    //                 "name": "-",
    //                 "way_points": [
    //                     584,
    //                     584
    //                 ]
    //             }
    //         ]
    //     },
    //     {
    //         "id": "quickest",
    //         "name": "Quickest",
    //         "start": "UT Tower, Austin, TX, USA",
    //         "destination": "Q2 Stadium, Austin, TX, USA",
    //         "distance_miles": 8.26,
    //         "estimated_minutes": 159,
    //         "safety_score": 88,
    //         "summary": "Strong sidewalk coverage and comfortable walking conditions.",
    //         "highlights": [
    //             "Nori",
    //             "PD Thai",
    //             "Salsa Limón",
    //             "Kerbey Lane Cafe",
    //             "Roppolo's Pizzeria",
    //             "Bikkle",
    //             "Sip Pho",
    //             "Live Oak Park"
    //         ],
    //         "route_type": "walking",
    //         "map_style": "balanced",
    //         "filename": "map_84.png",
    //         "directions": [
    //             {
    //                 "distance": 19.9,
    //                 "duration": 14.3,
    //                 "type": 11,
    //                 "instruction": "Head east",
    //                 "name": "-",
    //                 "way_points": [
    //                     0,
    //                     1
    //                 ]
    //             },
    //             {
    //                 "distance": 82.7,
    //                 "duration": 59.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     1,
    //                     9
    //                 ]
    //             },
    //             {
    //                 "distance": 130.1,
    //                 "duration": 93.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Inner Campus Circle",
    //                 "name": "Inner Campus Circle",
    //                 "way_points": [
    //                     9,
    //                     17
    //                 ]
    //             },
    //             {
    //                 "distance": 90,
    //                 "duration": 64.8,
    //                 "type": 1,
    //                 "instruction": "Turn right onto Whitis Avenue",
    //                 "name": "Whitis Avenue",
    //                 "way_points": [
    //                     17,
    //                     23
    //                 ]
    //             },
    //             {
    //                 "distance": 4,
    //                 "duration": 2.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     23,
    //                     24
    //                 ]
    //             },
    //             {
    //                 "distance": 8.6,
    //                 "duration": 6.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     24,
    //                     26
    //                 ]
    //             },
    //             {
    //                 "distance": 138,
    //                 "duration": 99.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     26,
    //                     33
    //                 ]
    //             },
    //             {
    //                 "distance": 51.9,
    //                 "duration": 37.3,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     33,
    //                     36
    //                 ]
    //             },
    //             {
    //                 "distance": 92.2,
    //                 "duration": 66.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     36,
    //                     37
    //                 ]
    //             },
    //             {
    //                 "distance": 33.5,
    //                 "duration": 24.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     37,
    //                     38
    //                 ]
    //             },
    //             {
    //                 "distance": 27.9,
    //                 "duration": 20.1,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     38,
    //                     43
    //                 ]
    //             },
    //             {
    //                 "distance": 3,
    //                 "duration": 2.1,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     43,
    //                     44
    //                 ]
    //             },
    //             {
    //                 "distance": 272.2,
    //                 "duration": 196,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     44,
    //                     52
    //                 ]
    //             },
    //             {
    //                 "distance": 8.6,
    //                 "duration": 6.2,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     52,
    //                     54
    //                 ]
    //             },
    //             {
    //                 "distance": 98.6,
    //                 "duration": 71,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     54,
    //                     56
    //                 ]
    //             },
    //             {
    //                 "distance": 247.9,
    //                 "duration": 178.5,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     56,
    //                     63
    //                 ]
    //             },
    //             {
    //                 "distance": 1355.5,
    //                 "duration": 975.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     63,
    //                     120
    //                 ]
    //             },
    //             {
    //                 "distance": 41.1,
    //                 "duration": 29.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     120,
    //                     121
    //                 ]
    //             },
    //             {
    //                 "distance": 182.6,
    //                 "duration": 131.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     121,
    //                     123
    //                 ]
    //             },
    //             {
    //                 "distance": 40.6,
    //                 "duration": 29.2,
    //                 "type": 0,
    //                 "instruction": "Turn left onto West 42nd Street",
    //                 "name": "West 42nd Street",
    //                 "way_points": [
    //                     123,
    //                     124
    //                 ]
    //             },
    //             {
    //                 "distance": 414.5,
    //                 "duration": 298.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     124,
    //                     133
    //                 ]
    //             },
    //             {
    //                 "distance": 23.8,
    //                 "duration": 17.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     133,
    //                     135
    //                 ]
    //             },
    //             {
    //                 "distance": 28.7,
    //                 "duration": 20.7,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     135,
    //                     138
    //                 ]
    //             },
    //             {
    //                 "distance": 137.7,
    //                 "duration": 99.2,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     138,
    //                     149
    //                 ]
    //             },
    //             {
    //                 "distance": 309.1,
    //                 "duration": 222.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     149,
    //                     159
    //                 ]
    //             },
    //             {
    //                 "distance": 21.5,
    //                 "duration": 15.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     159,
    //                     163
    //                 ]
    //             },
    //             {
    //                 "distance": 466.5,
    //                 "duration": 335.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     163,
    //                     172
    //                 ]
    //             },
    //             {
    //                 "distance": 20.6,
    //                 "duration": 14.8,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     172,
    //                     174
    //                 ]
    //             },
    //             {
    //                 "distance": 237.8,
    //                 "duration": 171.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     174,
    //                     184
    //                 ]
    //             },
    //             {
    //                 "distance": 328,
    //                 "duration": 236.2,
    //                 "type": 12,
    //                 "instruction": "Keep left",
    //                 "name": "-",
    //                 "way_points": [
    //                     184,
    //                     205
    //                 ]
    //             },
    //             {
    //                 "distance": 2,
    //                 "duration": 1.4,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     205,
    //                     206
    //                 ]
    //             },
    //             {
    //                 "distance": 327.8,
    //                 "duration": 236,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     206,
    //                     218
    //                 ]
    //             },
    //             {
    //                 "distance": 4.1,
    //                 "duration": 2.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     218,
    //                     219
    //                 ]
    //             },
    //             {
    //                 "distance": 24.8,
    //                 "duration": 17.9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     219,
    //                     226
    //                 ]
    //             },
    //             {
    //                 "distance": 534.4,
    //                 "duration": 384.7,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     226,
    //                     250
    //                 ]
    //             },
    //             {
    //                 "distance": 468.1,
    //                 "duration": 337,
    //                 "type": 6,
    //                 "instruction": "Continue straight",
    //                 "name": "-",
    //                 "way_points": [
    //                     250,
    //                     266
    //                 ]
    //             },
    //             {
    //                 "distance": 2.2,
    //                 "duration": 1.6,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     266,
    //                     267
    //                 ]
    //             },
    //             {
    //                 "distance": 12.4,
    //                 "duration": 9,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     267,
    //                     270
    //                 ]
    //             },
    //             {
    //                 "distance": 346,
    //                 "duration": 249.1,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     270,
    //                     277
    //                 ]
    //             },
    //             {
    //                 "distance": 96.7,
    //                 "duration": 69.6,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     277,
    //                     281
    //                 ]
    //             },
    //             {
    //                 "distance": 27,
    //                 "duration": 19.4,
    //                 "type": 13,
    //                 "instruction": "Keep right",
    //                 "name": "-",
    //                 "way_points": [
    //                     281,
    //                     283
    //                 ]
    //             },
    //             {
    //                 "distance": 8.2,
    //                 "duration": 5.9,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     283,
    //                     284
    //                 ]
    //             },
    //             {
    //                 "distance": 25.7,
    //                 "duration": 18.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     284,
    //                     285
    //                 ]
    //             },
    //             {
    //                 "distance": 4.5,
    //                 "duration": 3.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     285,
    //                     286
    //                 ]
    //             },
    //             {
    //                 "distance": 164.7,
    //                 "duration": 118.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     286,
    //                     289
    //                 ]
    //             },
    //             {
    //                 "distance": 3.8,
    //                 "duration": 2.8,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     289,
    //                     290
    //                 ]
    //             },
    //             {
    //                 "distance": 20.3,
    //                 "duration": 14.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     290,
    //                     294
    //                 ]
    //             },
    //             {
    //                 "distance": 6.3,
    //                 "duration": 4.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     294,
    //                     296
    //                 ]
    //             },
    //             {
    //                 "distance": 197.5,
    //                 "duration": 142.2,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     296,
    //                     301
    //                 ]
    //             },
    //             {
    //                 "distance": 12.8,
    //                 "duration": 9.2,
    //                 "type": 5,
    //                 "instruction": "Turn slight right",
    //                 "name": "-",
    //                 "way_points": [
    //                     301,
    //                     305
    //                 ]
    //             },
    //             {
    //                 "distance": 354.5,
    //                 "duration": 255.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     305,
    //                     320
    //                 ]
    //             },
    //             {
    //                 "distance": 3.4,
    //                 "duration": 2.4,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     320,
    //                     321
    //                 ]
    //             },
    //             {
    //                 "distance": 12.5,
    //                 "duration": 9,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     321,
    //                     325
    //                 ]
    //             },
    //             {
    //                 "distance": 6.5,
    //                 "duration": 4.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     325,
    //                     326
    //                 ]
    //             },
    //             {
    //                 "distance": 135.3,
    //                 "duration": 97.4,
    //                 "type": 4,
    //                 "instruction": "Turn slight left",
    //                 "name": "-",
    //                 "way_points": [
    //                     326,
    //                     331
    //                 ]
    //             },
    //             {
    //                 "distance": 232.3,
    //                 "duration": 167.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     331,
    //                     344
    //                 ]
    //             },
    //             {
    //                 "distance": 58.4,
    //                 "duration": 42,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     344,
    //                     356
    //                 ]
    //             },
    //             {
    //                 "distance": 143.7,
    //                 "duration": 103.4,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     356,
    //                     369
    //                 ]
    //             },
    //             {
    //                 "distance": 836.8,
    //                 "duration": 602.5,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     369,
    //                     395
    //                 ]
    //             },
    //             {
    //                 "distance": 847.3,
    //                 "duration": 610,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     395,
    //                     437
    //                 ]
    //             },
    //             {
    //                 "distance": 2.3,
    //                 "duration": 1.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     437,
    //                     439
    //                 ]
    //             },
    //             {
    //                 "distance": 604,
    //                 "duration": 434.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     439,
    //                     462
    //                 ]
    //             },
    //             {
    //                 "distance": 434,
    //                 "duration": 312.5,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     462,
    //                     476
    //                 ]
    //             },
    //             {
    //                 "distance": 538.6,
    //                 "duration": 387.8,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     476,
    //                     499
    //                 ]
    //             },
    //             {
    //                 "distance": 31.7,
    //                 "duration": 22.8,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     499,
    //                     503
    //                 ]
    //             },
    //             {
    //                 "distance": 29.4,
    //                 "duration": 21.2,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     503,
    //                     507
    //                 ]
    //             },
    //             {
    //                 "distance": 331.1,
    //                 "duration": 238.4,
    //                 "type": 2,
    //                 "instruction": "Turn sharp left",
    //                 "name": "-",
    //                 "way_points": [
    //                     507,
    //                     527
    //                 ]
    //             },
    //             {
    //                 "distance": 29.6,
    //                 "duration": 21.3,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     527,
    //                     528
    //                 ]
    //             },
    //             {
    //                 "distance": 426,
    //                 "duration": 306.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     528,
    //                     536
    //                 ]
    //             },
    //             {
    //                 "distance": 197.8,
    //                 "duration": 142.4,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     536,
    //                     548
    //                 ]
    //             },
    //             {
    //                 "distance": 10.6,
    //                 "duration": 7.6,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     548,
    //                     549
    //                 ]
    //             },
    //             {
    //                 "distance": 31.6,
    //                 "duration": 22.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto Rutland Drive",
    //                 "name": "Rutland Drive",
    //                 "way_points": [
    //                     549,
    //                     550
    //                 ]
    //             },
    //             {
    //                 "distance": 343.8,
    //                 "duration": 247.5,
    //                 "type": 1,
    //                 "instruction": "Turn right onto McKalla Place",
    //                 "name": "McKalla Place",
    //                 "way_points": [
    //                     550,
    //                     557
    //                 ]
    //             },
    //             {
    //                 "distance": 7.9,
    //                 "duration": 5.7,
    //                 "type": 0,
    //                 "instruction": "Turn left onto West Road",
    //                 "name": "West Road",
    //                 "way_points": [
    //                     557,
    //                     558
    //                 ]
    //             },
    //             {
    //                 "distance": 245.2,
    //                 "duration": 176.5,
    //                 "type": 1,
    //                 "instruction": "Turn right",
    //                 "name": "-",
    //                 "way_points": [
    //                     558,
    //                     566
    //                 ]
    //             },
    //             {
    //                 "distance": 160,
    //                 "duration": 115.2,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     566,
    //                     575
    //                 ]
    //             },
    //             {
    //                 "distance": 3.7,
    //                 "duration": 2.7,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     575,
    //                     576
    //                 ]
    //             },
    //             {
    //                 "distance": 21.7,
    //                 "duration": 15.6,
    //                 "type": 0,
    //                 "instruction": "Turn left",
    //                 "name": "-",
    //                 "way_points": [
    //                     576,
    //                     582
    //                 ]
    //             },
    //             {
    //                 "distance": 0,
    //                 "duration": 0,
    //                 "type": 10,
    //                 "instruction": "Arrive at your destination, on the left",
    //                 "name": "-",
    //                 "way_points": [
    //                     582,
    //                     582
    //                 ]
    //             }
    //         ]
    //     }
    // ]

    // routes = []

    console.log(routes)

    const toggle = (id: string) => {
        setSaved((previous) => {
        const next = new Set(previous);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
        });
    };

    return (
        <>
        <div className="relative shrink-0 w-full">
            <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
            <div className="pb-[17px] pt-[28px] px-[32px]">
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Results</p>
            {(routes.length > 0) && (
                <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">The best routes from {routes[0].start} to {routes[0].destination}. </p>
            )}
            </div>
        </div>

        <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
            <div className="grid grid-cols-2 gap-[20px]">

                {(routes.length > 0) ? (
                    routes.map((route) => (
                        <div key={route.id} className={`${cardBase} overflow-hidden`}>
                            <div className="h-[100px] w-full overflow-hidden relative">
                                <img alt={`Map preview for ${route.name}`} className="w-full h-full object-cover" src={`/maps/${route.filename ?? imgRouteMap}`} />
                                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.7)] to-transparent" />
                                <div className="absolute bottom-[10px] left-[14px]"><SafetyBadge score={route.safety_score} /></div>
                                <button onClick={() => toggle(route.id)} aria-label={saved.has(route.id) ? "Unsave route" : "Save route"}
                                className="absolute top-[10px] right-[10px] size-[30px] rounded-full bg-[rgba(10,6,8,0.6)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer hover:border-[rgba(196,32,80,0.4)] transition-colors">
                                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                                    <path d={homeSvg.p2f4e1d80} stroke={saved.has(route.id) ? "#c42050" : "rgba(255,255,255,0.5)"}
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.83333"
                                    fill={saved.has(route.id) ? "rgba(196,32,80,0.3)" : "none"} />
                                </svg>
                                </button>
                            </div>
                            <div className="p-[14px]">
                                <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white mb-[6px]">{route.name}</p>
                                <div className="flex items-center gap-[8px] mb-[10px]">
                                <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{route.distance_miles} mi</span>
                                <div className="size-[3px] rounded-full bg-[rgba(255,255,255,0.2)]" />
                                <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{route.estimated_minutes} min</span>
                                </div>
                                <div className="flex items-center justify-between gap-[12px]">
                                {/* <div className="flex gap-[4px] flex-wrap">
                                    {route.tags.map((tag) => (
                                    <span key={tag} className="text-[10px] px-[7px] py-[2px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]">{tag}</span>
                                    ))}
                                </div> */}
                                <button onClick={() => navigate(`/route/${route.id}`)} className="cursor-pointer shrink-0">
                                    <span className="font-semibold text-[12px] text-[#0a84ff]">View →</span>
                                </button>
                                </div>
                            </div>
                            </div>
                    ))
                ) : (
                    <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Error: No routes generated</p>
                )}

            </div>
        </div>
        </>
    );
}
