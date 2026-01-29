import json
from geopy.distance import great_circle

# --- Configuration ---
INPUT_FILE = 'ground_sites_final.json'
OUTPUT_FILE = 'ground_sites_circles_950km.geojson'
RADIUS_KM = 950
# Number of points to approximate the circle (more steps = smoother circle)
STEPS = 32 
# ---------------------

def get_circle_points(latitude, longitude, radius_km, steps):
    """
    Calculates the perimeter coordinates for a circle using geodesic distance.
    Returns a list of [longitude, latitude] coordinates.
    """
    center_point = (latitude, longitude)
    perimeter_coords = []
    
    # Calculate the step size in degrees (360 / STEPS)
    angle_step = 360 / steps

    for i in range(steps + 1):
        # Calculate the bearing for the current step
        bearing = i * angle_step
        
        # Use geopy.distance's formula to calculate the destination point 
        # (latitude, longitude) given the starting point, bearing, and distance.
        destination = great_circle(kilometers=radius_km).destination(center_point, bearing)
        
        # GeoJSON uses [longitude, latitude]
        perimeter_coords.append([destination.longitude, destination.latitude])
        
    return [perimeter_coords] # GeoJSON Polygon requires an array of rings

def generate_geojson():
    try:
        # 1. Read the input JSON file
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
        
        stations = data.get('ground_stations', [])
        
        # 2. Initialize the GeoJSON Feature Collection
        feature_collection = {
            "type": "FeatureCollection",
            "features": []
        }

        # 3. Process each ground station and create the Polygon feature
        for station in stations:
            lat = station.get('latitude')
            lon = station.get('longitude')
            name = station.get('name')
            
            if lat is not None and lon is not None:
                # Calculate the Polygon coordinates (the circle perimeter)
                polygon_coords = get_circle_points(lat, lon, RADIUS_KM, STEPS)

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": polygon_coords
                    },
                    "properties": {
                        "name": name,
                        "location": station.get('location'),
                        "type": station.get('type'),
                        "radius_km": RADIUS_KM
                    }
                }
                feature_collection['features'].append(feature)

        # 4. Write the final GeoJSON to an output file
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(feature_collection, f, indent=2)

        print(f"✅ Successfully generated GeoJSON with {len(feature_collection['features'])} circle polygons.")
        print(f"File saved as: {OUTPUT_FILE}")

    except FileNotFoundError:
        print(f"❌ Error: Input file '{INPUT_FILE}' not found.")
    except json.JSONDecodeError:
        print(f"❌ Error: Could not decode JSON from '{INPUT_FILE}'. Check file format.")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    generate_geojson()
