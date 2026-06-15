from shapely.geometry import LineString, Point
from shapely import distance
import math
import os
import requests
import mapbox_vector_tile
import sys
from pyproj import Transformer

# maximum number of tiles per route where traffic data is checked, used to limit api calls
MAX_TILES_PER_REQUEST = 30
MAX_ZOOM = 16
# how many meters between sample points
SCORE_RESOLUTION = 100

TT_API_KEY = os.getenv("TT_API_KEY")

cache = {}

def latlon_to_tile(lat, lon, z):
    """converts latitude, longitude, and zoom to the corresponding tile with that zoom"""
    xtile = int((lon + 180) / 360 * (2**z))
    ytile = int((1 - math.log(math.tan(math.radians(lat)) +
                 1 / math.cos(math.radians(lat))) / math.pi) * (2**z)/2)
    return xtile, ytile

def tilecoord_to_lonlat(local_x, local_y, tile_x, tile_y, zoom, extent):
    """converts tile to latitude, longitude"""
    world_x = tile_x + local_x / extent
    world_y = tile_y + (extent - local_y) / extent # tomtom flips y coordinate

    lon = world_x / (2**zoom) * 360.0 - 180.0

    n = math.pi - 2.0 * math.pi * world_y / (2**zoom)
    lat = math.degrees(math.atan(math.sinh(n)))

    return lon, lat

def get_tiles(route, zoom=12):
    """generates set of tiles at specified zoom level along route"""
    # line = LineString(route)

    tiles = {} #set()
    distinct_tiles = set()

    for i, p in enumerate(route):
        x, y = latlon_to_tile(p.y, p.x, zoom)
        tiles[i] = (zoom, x, y)
        distinct_tiles.add((zoom, x, y))

    return len(distinct_tiles), tiles

def fetch_tile(z, x, y):
    """Fetches traffic data for the given tile and caches it"""
    key = (z, x, y)
    if key in cache:
        return cache[key]

    url = f"https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf"

    r = requests.get(url, params={"key": TT_API_KEY})
    cache[key] = mapbox_vector_tile.decode(r.content)

    return cache[key]

def densify(route, step_meters=100):
    """converts route to evenly-spaced list of points that are step_meters apart"""
    line = LineString(route)

    # approximate conversion: 1 deg ≈ 111,000m
    num_steps = int(line.length * 111000 / step_meters)

    return [
        line.interpolate(i / max(num_steps, 1), normalized=True)
        for i in range(num_steps + 1)
    ]

def calculate_safety_score(route: dict) -> int:

    # regularly partition route into regular, same-length lines
    route_regular_partition = densify(route["coordinates"], SCORE_RESOLUTION)

    # get best resolution tiles while minimizing api calls
    tiles = [0] * (MAX_TILES_PER_REQUEST+1)
    num_tiles = MAX_TILES_PER_REQUEST+1
    zoom = MAX_ZOOM + 1
    while num_tiles > MAX_TILES_PER_REQUEST:
        zoom -= 1
        num_tiles, tiles = get_tiles(route_regular_partition, zoom)
    
    # fetch traffic data and compute score
    total_score = 0
    count = 0
    print(len(route_regular_partition))
    for i, p in enumerate(route_regular_partition):
        tile = tiles[i]
        tile_data = fetch_tile(*tile)

        # if no traffic data assume no traffic
        if "empty" in tile_data:
            continue

        features = tile_data["Traffic flow"]["features"]
        extent = tile_data["Traffic flow"]["extent"]
        min_dist = None
        traffic_level = None
        for feature in features:
            # traffic flow can be LineString or MultiLineString
            if feature["geometry"]["type"] == "MultiLineString":
                line_lists = feature["geometry"]["coordinates"]
            else:
                line_lists = [feature["geometry"]["coordinates"]]
            for linestring in line_lists:
                traffic_line = LineString([
                    tilecoord_to_lonlat(
                        point[0], point[1],
                        tile[1], tile[2],
                        zoom,
                        extent
                    )
                    for point in linestring
                ])
                
                cur_dist = p.distance(traffic_line)
                if cur_dist < 0.00005:
                    if min_dist is None or cur_dist < min_dist:
                        min_dist = cur_dist
                        traffic_level = feature["properties"]["traffic_level"]
        if traffic_level is not None:
            total_score += traffic_level
        count += 1
    
    avg_traffic = total_score/count
    safety_score = 100 * (1 - avg_traffic)
    return int(safety_score)


def describe_score(score: int) -> str:
    if score >= 85:
        return "Strong sidewalk coverage and comfortable walking conditions."
    if score >= 70:
        return "Generally walkable with a few areas to watch."
    return "Usable route, but review the safety notes before walking."

